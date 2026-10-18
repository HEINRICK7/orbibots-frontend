import type { Session, SessionStore } from "./session";

export class AuthenticationFailed extends Error {}

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
};

const emailMinLength = 3;
const emailMaxLength = 320;
const passwordMinLength = 1;
const passwordMaxLength = 1024;

export function validateLoginInput(email: string, password: string): { email: string; password: string } {
  const normalizedEmail = email.trim();
  if (normalizedEmail.length < emailMinLength || normalizedEmail.length > emailMaxLength) {
    throw new AuthenticationFailed("E-mail ou senha inválidos.");
  }
  if (password.length < passwordMinLength || password.length > passwordMaxLength) {
    throw new AuthenticationFailed("E-mail ou senha inválidos.");
  }
  return { email: normalizedEmail, password };
}

export async function signInWithApi(
  sessions: SessionStore,
  apiUrl: string,
  email: string,
  password: string,
  now = Date.now(),
): Promise<Session> {
  const credentials = validateLoginInput(email, password);
  const origin = apiOrigin(apiUrl);
  if (!origin) {
    throw new AuthenticationFailed("A API não está configurada.");
  }

  const loginResponse = await fetch(`${origin}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(credentials),
  });
  if (loginResponse.status === 401 || loginResponse.status === 422) {
    throw new AuthenticationFailed("E-mail ou senha inválidos.");
  }
  if (!loginResponse.ok) {
    throw new AuthenticationFailed("Não foi possível entrar.");
  }

  const token = readLogin(await loginResponse.json());
  if (!token) {
    throw new AuthenticationFailed("Não foi possível entrar.");
  }

  const user = await readAccount(origin, token.access_token);
  if (!user) {
    throw new AuthenticationFailed("Não foi possível carregar a conta.");
  }

  const session = superAdminSession(user, token, now);
  sessions.write(session);
  return session;
}

export async function restoreAccount(
  sessions: SessionStore,
  apiUrl: string,
  now = Date.now(),
): Promise<Session | null> {
  const session = currentSession(sessions, now);
  if (!session || session.kind !== "super-admin") {
    return session;
  }

  const origin = apiOrigin(apiUrl);
  if (!origin) {
    sessions.clear();
    return null;
  }

  try {
    const response = await fetch(`${origin}/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (response.status === 401) {
      sessions.clear();
      return null;
    }
    if (!response.ok) {
      return session;
    }
    const user = readUser(await response.json());
    if (!user) {
      sessions.clear();
      return null;
    }
    const next: Session = {
      ...session,
      userId: user.id,
      name: user.name,
      email: user.email,
    };
    sessions.write(next);
    return next;
  } catch {
    return session;
  }
}

export function signInCompanyAdmin(
  sessions: SessionStore,
  input: {
    userId: string;
    name: string;
    email: string;
    companyId: string;
    companyName: string;
  },
): Session {
  const session: Session = {
    kind: "company-admin",
    role: "COMPANY_ADMIN",
    userId: input.userId,
    name: input.name,
    email: input.email,
    companyId: input.companyId,
    companyName: input.companyName,
  };
  sessions.write(session);
  return session;
}

export function currentSession(sessions: SessionStore, now = Date.now()): Session | null {
  const session = sessions.read();
  if (!session) {
    return null;
  }
  if (session.kind === "super-admin" && session.expiresAt <= now) {
    sessions.clear();
    return null;
  }
  return session;
}

function apiOrigin(apiUrl: string): string {
  return apiUrl.trim().replace(/\/$/, "");
}

function superAdminSession(user: UserResponse, token: LoginResponse, issuedAt: number): Session {
  return {
    kind: "super-admin",
    userId: user.id,
    name: user.name,
    email: user.email,
    accessToken: token.access_token,
    tokenType: token.token_type,
    expiresIn: token.expires_in,
    expiresAt: issuedAt + token.expires_in * 1000,
  };
}

async function readAccount(origin: string, accessToken: string): Promise<UserResponse | null> {
  const profileResponse = await fetch(`${origin}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    return null;
  }
  return readUser(await profileResponse.json());
}

function readLogin(value: unknown): LoginResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const token = value as Partial<LoginResponse>;
  if (typeof token.access_token !== "string" || token.access_token.length === 0) {
    return null;
  }
  if (typeof token.token_type !== "string" || token.token_type.length === 0) {
    return null;
  }
  if (typeof token.expires_in !== "number" || !Number.isInteger(token.expires_in) || token.expires_in < 1) {
    return null;
  }
  return {
    access_token: token.access_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
  };
}

function readUser(value: unknown): UserResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const user = value as Partial<UserResponse>;
  if (typeof user.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
    return null;
  }
  if (typeof user.name !== "string" || user.name.length === 0) {
    return null;
  }
  if (typeof user.email !== "string" || user.email.length < emailMinLength || user.email.length > emailMaxLength) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
}

export function signOut(sessions: SessionStore): void {
  sessions.clear();
}
