import type { Clock, IdGenerator, TokenIssuer } from "../../application/ports";
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

export function createSystemTools(): { ids: IdGenerator; clock: Clock; tokens: TokenIssuer } {
  return {
    ids: {
      next(prefix: string) {
        return `${prefix}-${crypto.randomUUID()}`;
      },
    },
    clock: {
      nowIso: () => new Date().toISOString(),
    },
    tokens: {
      issue() {
        const raw = crypto.randomUUID().replaceAll("-", "");
        return { raw, hash: hashToken(raw) };
      },
      hash: hashToken,
    },
  };
}

function hashToken(raw: string): string {
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}
