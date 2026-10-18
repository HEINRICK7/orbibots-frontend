"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Session } from "../../application/authentication/session";
import { BrandMark } from "../components/Icon";
import { usePlatform } from "./platform";

export function SessionGate({ kind, children }: { kind: Session["kind"]; children: ReactNode }) {
  const platform = usePlatform();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const session = ready ? platform.authentication.current() : null;

  if (!ready) {
    return null;
  }

  if (session?.kind !== kind) {
    return (
      <main className="login-experience session-gate-screen">
        <div className="login-aurora" aria-hidden="true" />
        <div className="login-stardust" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <section className="login-card card session-gate-unavailable" role="status">
          <div className="login-card-brand"><BrandMark /><span>OrbiBots</span></div>
          <h1>Painel indisponível</h1>
          <p className="lede">Este projeto não tem um provedor de autenticação conectado. Nenhuma sessão local será aceita.</p>
          <Link className="btn" href="/login">Voltar ao login</Link>
        </section>
      </main>
    );
  }

  return children;
}
