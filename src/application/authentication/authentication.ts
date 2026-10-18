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

export async function signInWithApi(
  sessions: SessionStore,
  apiUrl: string,
  email: string,
  password: string,
): Promise<Session> {
  const origin = apiUrl.replace(/\/$/, "");
  if (!origin) {
    throw new AuthenticationFailed("A API não está configurada.");
  }

  const loginResponse = await fetch(`${origin}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (loginResponse.status === 401) {
    throw new AuthenticationFailed("E-mail ou senha inválidos.");
  }
  if (!loginResponse.ok) {
    throw new AuthenticationFailed("Não foi possível entrar.");
  }

  const token = (await loginResponse.json()) as LoginResponse;
  const profileResponse = await fetch(`${origin}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) {
    throw new AuthenticationFailed("Não foi possível carregar a conta.");
  }
  const user = (await profileResponse.json()) as UserResponse;
  const session: Session = {
    kind: "super-admin",
    userId: user.id,
    name: user.name,
    email: user.email,
    accessToken: token.access_token,
  };
  sessions.write(session);
  return session;
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

export function currentSession(sessions: SessionStore): Session | null {
  return sessions.read();
}

export function signOut(sessions: SessionStore): void {
  sessions.clear();
}
