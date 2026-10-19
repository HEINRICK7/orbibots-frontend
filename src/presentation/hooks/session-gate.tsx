"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Session } from "../../application/authentication/session";
import { BrandMark } from "../components/Icon";
import { usePlatform } from "./platform";
import { canEnterArea } from "./session-access";

export function SessionGate({ kind, children }: { kind: Session["kind"]; children: ReactNode }) {
  const platform = usePlatform();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    platform.authentication.restore().then((session) => {
      if (mounted) setAllowed(canEnterArea(session, kind));
    });
    return () => {
      mounted = false;
    };
  }, [platform, kind]);

  if (allowed === null) {
    return null;
  }

  if (!allowed) {
    return (
      <main className="login-experience session-gate-screen">
        <div className="login-aurora" aria-hidden="true" />
        <div className="login-stardust" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <section className="login-card card session-gate-unavailable" role="status">
          <div className="login-card-brand"><BrandMark /><span>OrbiBots</span></div>
          <h1>Painel indisponível</h1>
          <p className="lede">
            O servidor não confirmou sua permissão para acessar esta área. Entre novamente ou tente mais tarde.
          </p>
          <Link className="btn" href="/login">Voltar ao login</Link>
        </section>
      </main>
    );
  }

  return children;
}
