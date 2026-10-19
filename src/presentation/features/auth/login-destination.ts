import type { Session } from "../../../application/authentication/session";

export function loginDestination(session: Session): "/admin" | "/app" {
  return session.kind === "super-admin" ? "/admin" : "/app";
}
