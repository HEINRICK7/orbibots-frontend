"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "../../application/authentication/session";
import { loginDestination } from "../features/auth/login-destination";
import { usePlatform } from "./platform";
import { canEnterArea } from "./session-access";

export function SessionGate({ kind, children }: { kind: Session["kind"]; children: ReactNode }) {
  const platform = usePlatform();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    platform.authentication.restore().then((session) => {
      if (!mounted) return;
      const permitted = canEnterArea(session, kind);
      setAllowed(permitted);
      if (!session) {
        const returnTo = `${pathname}${window.location.search}`;
        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      } else if (!permitted) {
        router.replace(loginDestination(session));
      }
    }).catch(() => {
      if (!mounted) return;
      setAllowed(false);
      const returnTo = `${pathname}${window.location.search}`;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    });
    return () => {
      mounted = false;
    };
  }, [kind, pathname, platform, router]);

  return allowed ? children : null;
}
