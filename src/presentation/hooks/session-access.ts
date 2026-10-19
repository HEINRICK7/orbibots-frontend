import type { Session } from "../../application/authentication/session";

export function canEnterArea(session: Session | null, area: Session["kind"]): boolean {
  if (!session) return false;
  if (session.kind === area) return true;

  return (
    area === "company-admin" &&
    session.kind === "super-admin" &&
    Array.isArray(session.companyAccesses) &&
    session.companyAccesses.filter((access) => access.role === "COMPANY_ADMIN").length === 1
  );
}
