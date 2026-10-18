"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlatform } from "../../hooks/platform";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

const items = [
  ["inicio", "Início"],
  ["especialistas", "Especialistas"],
  ["conhecimento", "Conhecimento"],
  ["ferramentas", "Ferramentas"],
  ["equipe", "Equipe"],
  ["canais", "Canais"],
  ["metricas", "Métricas"],
  ["configuracoes", "Configurações"],
] as const;

export function CompanyLayout({ children }: { children: ReactNode }) {
  const platform = usePlatform();
  const router = useRouter();
  const section = useSearchParams().get("secao");
  const session = platform.authentication.current();
  const companyName = session?.kind === "company-admin" ? session.companyName : "Empresa";
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">o</span>
          OrbiBots
        </div>
        <nav className="nav-list" aria-label="Espaço da empresa">
          {items.map(([slug, label]) => {
            const href = slug === "especialistas" ? "/app" : `/app?secao=${slug}`;
            const active = slug === "especialistas" ? !section : section === slug;
            return (
              <Link key={slug} href={href} className={`nav-link${active ? " active" : ""}`}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <span className="avatar">{initials}</span>
          <span>
            {companyName}
            <small>Espaço da empresa</small>
          </span>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span className="company-switch">{companyName}</span>
          <div className="top-actions">
            <button
              className="who"
              type="button"
              onClick={() => {
                platform.authentication.signOut();
                router.replace("/login");
              }}
            >
              <span className="avatar">{initialsOf(session?.name ?? companyName)}</span>
              <span>
                {session?.name}
                <small>Administradora</small>
              </span>
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </section>
    </div>
  );
}
