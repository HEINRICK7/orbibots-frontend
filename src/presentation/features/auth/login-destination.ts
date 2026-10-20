import type { Session } from "../../../application/authentication/session";

export function loginDestination(session: Session, requestedPath?: string | null): string {
  const defaultPath = session.kind === "super-admin" ? "/admin" : "/app";
  const localPath = safeLocalPath(requestedPath);
  if (!localPath) return defaultPath;

  const route = localPath.split(/[?#]/, 1)[0];
  const permittedRoot = session.kind === "super-admin" ? "/admin" : "/app";
  return route === permittedRoot || route.startsWith(`${permittedRoot}/`)
    ? localPath
    : defaultPath;
}

function safeLocalPath(value?: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  const parsed = new URL(value, "https://orbibots.invalid");
  if (parsed.origin !== "https://orbibots.invalid") return null;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
