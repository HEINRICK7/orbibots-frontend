import type { CompanyAccess, Session, SessionStore } from "./session";

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
  global_role: "ADMIN" | null;
  company_accesses: CompanyAccessResponse[];
};

type CompanyAccessResponse = {
  company_id: string;
  company_name: string;
  role: "COMPANY_ADMIN" | "AGENT_EDITOR";
  scope: "COMPANY" | "ASSIGNED_AGENTS" | null;
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

  const session = authenticatedSession(user, token, now);
  sessions.write(session);
  return session;
}

export async function restoreAccount(
  sessions: SessionStore,
  apiUrl: string,
  now = Date.now(),
): Promise<Session | null> {
  const session = currentSession(sessions, now);
  if (!session) {
    return session;
  }
  // A role saved by the browser is only a cache. Without a bearer token the
  // backend cannot validate it, so this session must never open a protected area.
  if (!session.accessToken) {
    sessions.clear();
    return null;
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
      // Keep the token so the user can retry, but fail closed until the backend
      // confirms the account and its current permissions.
      return null;
    }
    const user = readUser(await response.json());
    if (!user) {
      sessions.clear();
      return null;
    }
    const next = restoreAuthenticatedSession(session, user);
    if (!next) {
      sessions.clear();
      return null;
    }
    sessions.write(next);
    return next;
  } catch {
    // A network/API failure is not proof of authorization.
    return null;
  }
}

export function currentSession(sessions: SessionStore, now = Date.now()): Session | null {
  const session = sessions.read();
  if (!session) {
    return null;
  }
  if (session.expiresAt !== undefined && session.expiresAt <= now) {
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
    companyAccesses: user.company_accesses.map(toCompanyAccess),
  };
}

function authenticatedSession(
  user: UserResponse,
  token: LoginResponse,
  issuedAt: number,
): Session {
  if (user.global_role === "ADMIN") {
    return superAdminSession(user, token, issuedAt);
  }

  const companyAdminAccesses = user.company_accesses.filter(
    (access) => access.role === "COMPANY_ADMIN",
  );
  if (companyAdminAccesses.length !== 1) {
    if (companyAdminAccesses.length > 1) {
      throw new AuthenticationFailed(
        "Esta conta tem acesso a mais de uma empresa. A seleção de empresa ainda não está disponível.",
      );
    }
    throw new AuthenticationFailed("Esta conta não tem acesso a uma área administrativa.");
  }

  const access = companyAdminAccesses[0];
  return {
    kind: "company-admin",
    userId: user.id,
    name: user.name,
    email: user.email,
    companyId: access.company_id,
    companyName: access.company_name,
    role: "COMPANY_ADMIN",
    accessToken: token.access_token,
    tokenType: token.token_type,
    expiresIn: token.expires_in,
    expiresAt: issuedAt + token.expires_in * 1000,
  };
}

function restoreAuthenticatedSession(
  session: Session,
  user: UserResponse,
): Session | null {
  if (session.kind === "super-admin") {
    if (user.global_role !== "ADMIN") return null;
    return {
      ...session,
      userId: user.id,
      name: user.name,
      email: user.email,
      companyAccesses: user.company_accesses.map(toCompanyAccess),
    };
  }

  const matchingAccess = user.company_accesses.find(
    (access) =>
      access.company_id === session.companyId && access.role === "COMPANY_ADMIN",
  );
  if (!matchingAccess || user.global_role === "ADMIN") return null;
  return {
    ...session,
    userId: user.id,
    name: user.name,
    email: user.email,
    companyName: matchingAccess.company_name,
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
  if (user.global_role !== null && user.global_role !== "ADMIN") {
    return null;
  }
  if (!Array.isArray(user.company_accesses)) {
    return null;
  }
  const companyAccesses = user.company_accesses.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const access = value as Partial<CompanyAccessResponse>;
    if (
      typeof access.company_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(access.company_id) ||
      typeof access.company_name !== "string" ||
      (access.role !== "COMPANY_ADMIN" && access.role !== "AGENT_EDITOR") ||
      (access.scope !== null && access.scope !== "COMPANY" && access.scope !== "ASSIGNED_AGENTS")
    ) {
      return [];
    }
    return [{
      company_id: access.company_id,
      company_name: access.company_name,
      role: access.role,
      scope: access.scope,
    }];
  });
  if (companyAccesses.length !== user.company_accesses.length) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    global_role: user.global_role,
    company_accesses: companyAccesses,
  };
}

function toCompanyAccess(access: CompanyAccessResponse): CompanyAccess {
  return {
    companyId: access.company_id,
    companyName: access.company_name,
    role: access.role,
    scope: access.scope,
  };
}

export function signOut(sessions: SessionStore): void {
  sessions.clear();
}
