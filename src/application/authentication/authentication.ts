import { platformOperator, type Session, type SessionStore } from "./session";

export function signInSuperAdmin(sessions: SessionStore, email: string): Session {
  const normalized = email.trim().toLowerCase() || platformOperator.email;
  const session: Session = {
    kind: "super-admin",
    name: platformOperator.name,
    email: normalized,
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
  return (
    sessions.read() ?? {
      kind: "super-admin",
      name: platformOperator.name,
      email: platformOperator.email,
    }
  );
}

export function signOut(sessions: SessionStore): void {
  sessions.clear();
}
