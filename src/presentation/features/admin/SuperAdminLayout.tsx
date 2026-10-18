"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark, Icon } from "../../components/Icon";
import { usePlatform } from "../../hooks/platform";

function CloseIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const platform = usePlatform();
  const pathname = usePathname();
  const router = useRouter();
  const session = platform.authentication.current();
  const userName = session?.kind === "super-admin" ? session.name : "Super Admin";
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const initials = userName.split(" ").slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
  const active = pathname === "/admin";

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    const outside = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    window.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

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
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      <aside className="sidebar" id="dashboard-sidebar" ref={sidebarRef} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label="Navegação do administrador global">
        <div className="sidebar-brand-row"><Link className="brand" href="/admin" onClick={() => setMenuOpen(false)}><BrandMark /><span>OrbiBots</span></Link><button className="sidebar-close icon-button" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><CloseIcon /></button></div>
        <nav className="nav-list" aria-label="Administração da plataforma">
          <Link href="/admin" className={`nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon name="home" size={22} /><span>Visão geral</span></Link>
        </nav>
        <div className="sidebar-context"><span className="sidebar-context-icon"><Icon name="crown" size={25} /></span><div><strong>{userName}</strong><span className="context-tag">Super Admin</span></div></div>
      </aside>
      <section className="workspace" inert={menuOpen || undefined}>
        <header className="topbar">
          <button className="mobile-menu-toggle icon-button" ref={menuButtonRef} type="button" aria-label="Abrir menu de navegação" aria-controls="dashboard-sidebar" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="24" height="24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div className="topbar-heading"><span>Super Admin</span><small>Administrador global</small></div>
          <div className="topbar-actions" ref={popoverRef}>
            <div className="popover-anchor"><button className="who topbar-user" type="button" aria-expanded={accountOpen} aria-controls="account-panel" onClick={() => setAccountOpen(!accountOpen)}><span className="avatar">{initials || "OB"}</span><span className="topbar-user-copy">{userName}<small>Super Admin</small></span><Icon name="chevron-down" size={16} /></button>{accountOpen ? <div className="topbar-popover account-popover" id="account-panel"><strong>{userName}</strong>{session?.email ? <small>{session.email}</small> : null}<button type="button" onClick={() => { platform.authentication.signOut(); router.replace("/login"); }}><Icon name="arrow-right" size={17} /> Sair da conta</button></div> : null}</div>
          </div>
        </header>
        <main className="content" id="dashboard-content">{children}</main>
      </section>
    </div>
  );
}
