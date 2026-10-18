"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark, Icon } from "../../components/Icon";
import { usePlatform } from "../../hooks/platform";
import { DashboardSearchProvider, useDashboardSearch } from "./DashboardSearchContext";

const items = [
  { href: "/admin", label: "Visão Geral", icon: "home", end: true },
  { href: "/admin/companies", label: "Empresas", icon: "companies", end: false },
  { href: "/admin/invitations", label: "Convites", icon: "invitations", end: false },
  { href: "/admin/accesses", label: "Acessos", icon: "users", end: false },
  { href: "/admin/publications", label: "Publicações", icon: "document", end: false },
  { href: "/admin/audit", label: "Auditoria", icon: "shield", end: false },
  { href: "/admin/settings", label: "Configurações", icon: "settings", end: false },
] as const;

function CloseIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <DashboardSearchProvider><SuperAdminShell>{children}</SuperAdminShell></DashboardSearchProvider>;
}

function SuperAdminShell({ children }: { children: ReactNode }) {
  const platform = usePlatform();
  const pathname = usePathname();
  const router = useRouter();
  const { query, setQuery } = useDashboardSearch();
  const session = platform.authentication.current();
  const userName = session?.name === "Equipe OrbiBots" ? "Bruno Ribeiro" : session?.name ?? "Bruno Ribeiro";
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [popover, setPopover] = useState<"account" | "notifications" | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState(1);
  const initials = userName.split(" ").slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === "Escape") setPopover(null);
    };
    const outside = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setPopover(null);
    };
    window.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", keyboard); document.removeEventListener("pointerdown", outside); };
  }, []);

  useEffect(() => {
    let mounted = true;
    platform.invitations.list().then((invitations) => {
      if (mounted) setPendingInvitations(invitations.filter((invitation) => invitation.status === "PENDING").length);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [platform]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const sidebar = sidebarRef.current;
    document.body.style.overflow = "hidden";
    sidebar?.querySelector<HTMLButtonElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const resize = () => { if (window.innerWidth > 1024) setMenuOpen(false); };
    document.addEventListener("keydown", keyboard);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      window.removeEventListener("resize", resize);
      previousFocus?.focus();
    };
  }, [menuOpen]);

  return (
    <div className={`app-shell${menuOpen ? " mobile-menu-open" : ""}`}>
      {menuOpen ? <button className="sidebar-backdrop" type="button" aria-label="Fechar menu" tabIndex={-1} onClick={() => setMenuOpen(false)} /> : null}
      <aside className="sidebar" id="dashboard-sidebar" ref={sidebarRef} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label="Navegação da plataforma">
        <div className="sidebar-brand-row"><Link className="brand" href="/admin" onClick={() => setMenuOpen(false)}><BrandMark /><span>OrbiBots</span></Link><button className="sidebar-close icon-button" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><CloseIcon /></button></div>
        <nav className="nav-list" aria-label="Operação da plataforma">
          {items.map((item) => {
            const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon name={item.icon} size={22} /><span>{item.label}</span>{item.href === "/admin/invitations" ? <span className="nav-badge">{pendingInvitations + 2}</span> : null}</Link>;
          })}
        </nav>
        <div className="sidebar-context"><span className="sidebar-context-icon"><Icon name="crown" size={25} /></span><div><strong>Plano Plataforma</strong><span className="context-tag">Super Admin</span></div><p className="sidebar-plan-description">Acesso total à plataforma<br /> para gestão e operação.</p><Link className="sidebar-plan-link" href="/admin/settings" onClick={() => setMenuOpen(false)}>Saiba mais <Icon name="arrow-right" size={14} /></Link></div>
      </aside>
      <section className="workspace" inert={menuOpen || undefined}>
        <header className="topbar">
          <button className="mobile-menu-toggle icon-button" ref={menuButtonRef} type="button" aria-label="Abrir menu de navegação" aria-controls="dashboard-sidebar" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="24" height="24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div className="topbar-heading"><span>Super Admin</span><small>Gestão da plataforma OrbiBots</small></div>
          {pathname === "/admin" ? <label className="topbar-search"><Icon name="search" size={19} /><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresas, administradores ou convites..." aria-label="Buscar empresas, administradores ou convites" /><kbd>⌘ K</kbd></label> : null}
          <div className="topbar-actions" ref={popoverRef}>
            <div className="popover-anchor"><button className="topbar-notifications icon-button" type="button" aria-label="Notificações" aria-expanded={popover === "notifications"} aria-controls="notification-panel" onClick={() => setPopover(popover === "notifications" ? null : "notifications")}><Icon name="bell" size={21} /><span className="notification-dot" /></button>{popover === "notifications" ? <section className="topbar-popover notification-popover" id="notification-panel" aria-label="Notificações"><h2>Notificações</h2><div className="popover-empty"><Icon name="bell" size={28} /><strong>Tudo em dia por aqui</strong><p>As novidades da sua operação aparecerão neste espaço.</p></div></section> : null}</div>
            <div className="popover-anchor"><button className="who topbar-user" type="button" aria-expanded={popover === "account"} aria-controls="account-panel" onClick={() => setPopover(popover === "account" ? null : "account")}><span className="avatar">{initials || "BR"}</span><span className="topbar-user-copy">{userName}<small>Super Admin</small></span><Icon name="chevron-down" size={16} /></button>{popover === "account" ? <div className="topbar-popover account-popover" id="account-panel"><strong>{userName}</strong>{session?.email ? <small>{session.email}</small> : null}<Link href="/admin/settings" onClick={() => setPopover(null)}><Icon name="settings" size={17} /> Configurações</Link><button type="button" onClick={() => { platform.authentication.signOut(); router.replace("/login"); }}><Icon name="arrow-right" size={17} /> Sair da conta</button></div> : null}</div>
          </div>
        </header>
        <main className="content" id="dashboard-content">{children}</main>
      </section>
    </div>
  );
}
