"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BrandMark, Icon } from "../../components/Icon";
import { usePlatform } from "../../hooks/platform";
import { loginDestination } from "./login-destination";
import loginArtwork from "../../../../dist/assets/login.png";

type AccessDialog = "password" | "magic" | null;

export function Login() {
  const platform = usePlatform();
  const router = useRouter();
  const sceneRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [dialog, setDialog] = useState<AccessDialog>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      scene.style.setProperty("--scene-x", `${x}px`);
      scene.style.setProperty("--scene-y", `${y}px`);
      frame = 0;
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches || document.hidden) return;
      const bounds = scene.getBoundingClientRect();
      x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 16;
      y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const reset = () => { x = 0; y = 0; if (!frame) frame = requestAnimationFrame(paint); };
    const visibility = () => { scene.dataset.motionPaused = String(document.hidden); };
    scene.addEventListener("pointermove", move, { passive: true });
    scene.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", reset);
    };
  }, []);

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && !element?.open) element?.showModal();
    else if (!dialog && element?.open) element.close();
  }, [dialog]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setError(null);
    setPending(true);
    try {
      const session = await platform.authentication.signIn(email, password);
      setDialog(null);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      router.push(loginDestination(session, returnTo));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-experience" ref={sceneRef}>
      <div className="login-aurora" aria-hidden="true" />
      <div className="login-stardust" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="login-composition">
        <div className="login-orbit login-orbit-top" aria-hidden="true" />
        <div className="login-orbit login-orbit-bottom" aria-hidden="true" />
        <div className="login-beam" aria-hidden="true" />
        <section className="login-story" aria-label="Sobre o OrbiBots">
          <div className="brand login-brand"><BrandMark /><span>OrbiBots</span></div>
          <div className="login-story-copy">
            <h2>A plataforma para criar<br className="desktop-break" /> e gerenciar especialistas <span>digitais.</span></h2>
            <p className="lede">Automatize atendimentos, processos e operações com IA, com total controle, segurança e visibilidade para a sua empresa.</p>
          </div>
          <ul className="login-benefits">
            <li><span className="benefit-icon"><Icon name="shield" /></span><span><strong>Acesso seguro</strong><small>Seus dados protegidos com<br /> padrões de segurança avançados.</small></span></li>
            <li><span className="benefit-icon"><Icon name="users" /></span><span><strong>Convites controlados</strong><small>Acesso via convite para sua empresa,<br /> com gestão centralizada de usuários.</small></span></li>
            <li><span className="benefit-icon"><Icon name="document" /></span><span><strong>Auditoria de ações</strong><small>Todas as atividades registradas<br /> com transparência e rastreabilidade.</small></span></li>
          </ul>
        </section>
        <section className="login-panel" aria-labelledby="login-heading">
          <div className="login-card">
            <div className="login-card-brand"><BrandMark /><span>OrbiBots</span></div>
            <div className="login-heading-block"><h1 id="login-heading">Entrar no OrbiBots</h1><p className="lede">Acesse sua conta para continuar.</p></div>
            <form className="login-form" onSubmit={submit}>
              <label htmlFor="login-email"><span>E-mail</span><span className="login-field"><Icon name="invitations" /><input id="login-email" name="email" type="email" autoComplete="username" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} minLength={3} maxLength={320} required /></span></label>
              <label htmlFor="login-password"><span>Senha</span><span className="login-field"><Icon name="lock" /><input id="login-password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" minLength={1} maxLength={1024} required /><button className="password-visibility" type="button" aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(!passwordVisible)}><Icon name={passwordVisible ? "eye-off" : "eye"} /></button></span></label>
              <div className="login-options"><label className="remember-option"><input type="checkbox" name="remember" defaultChecked /><span>Lembrar de mim</span></label><button className="text-link" type="button" onClick={() => setDialog("password")}>Esqueci minha senha?</button></div>
              {error ? <p className="login-error" role="alert">{error}</p> : null}
              <button className="btn primary login-submit" type="submit" disabled={pending}><span>{pending ? "Entrando..." : "Entrar"}</span><Icon name="arrow-right" /></button>
              <button className="login-magic" type="button" onClick={() => setDialog("magic")}><Icon name="invitations" /><span>Entrar com link mágico</span><Icon name="arrow-right" /></button>
            </form>
            <div className="login-separator"><span>ou</span></div>
            <div className="login-notice"><Icon name="info" /><p>Convites de acesso são enviados por e-mail.<small>Abra o link recebido para ativar seu acesso à empresa.</small></p></div>
          </div>
        </section>
        <aside className="login-preview" aria-hidden="true">
          <Image src={loginArtwork} alt="" priority unoptimized draggable={false} />
        </aside>
        <footer className="login-footer"><span>© 2026 OrbiBots. Todos os direitos reservados.</span><div><span>Termos de uso</span><span>Privacidade</span></div></footer>
      </div>
      <dialog className="access-dialog" ref={dialogRef} onClose={() => setDialog(null)} aria-labelledby="access-dialog-heading" onClick={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <div className="access-dialog-content">
          <button className="dialog-close icon-button" type="button" aria-label="Fechar" onClick={() => setDialog(null)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          <span className="dialog-emblem"><Icon name={dialog === "password" ? "lock" : "invitations"} size={25} /></span>
          <h2 id="access-dialog-heading">{dialog === "password" ? "Recuperar sua senha" : "Entrar com link mágico"}</h2>
          <p>{dialog === "password" ? "Informe o e-mail associado à sua conta para recuperar seu acesso." : "Use o e-mail da sua conta para acessar com um link seguro."}</p>
          <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); setError("Esta opção ainda não está disponível. Entre com e-mail e senha."); setDialog(null); }}><label htmlFor="recovery-email">E-mail<input id="recovery-email" type="email" name="email" autoComplete="email" defaultValue={email} placeholder="seu@email.com" required /></label><button className="btn primary" type="submit">{dialog === "password" ? "Recuperar acesso" : "Enviar link de acesso"}<Icon name="arrow-right" /></button></form>
          <button className="text-link dialog-back" type="button" onClick={() => setDialog(null)}>Voltar para o login</button>
        </div>
      </dialog>
    </main>
  );
}
