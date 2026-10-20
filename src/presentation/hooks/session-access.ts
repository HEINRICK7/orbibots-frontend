import type { Session } from "../../application/authentication/session";

export function canEnterArea(session: Session | null, area: Session["kind"]): boolean {
  if (!session) return false;
  return session.kind === area;
}
