import type { Session, SessionStore } from "../../application/authentication/session";

const sessionKey = "orbibots.session";

export class BrowserSessionStore implements SessionStore {
  read(): Session | null {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }

  write(session: Session): void {
    if (typeof window === "undefined") {
      return;
    }
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }
    sessionStorage.removeItem(sessionKey);
  }
}
export class MemorySessionStore implements SessionStore {
  private session: Session | null = null;

  read(): Session | null {
    return this.session;
  }

  write(session: Session): void {
    this.session = session;
  }

  clear(): void {
    this.session = null;
  }
}
