"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "../../../application/authentication/session";
import type { InvitationValidation } from "../../../application/company-onboarding";
import { BrandMark } from "../../components/Icon";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";
import { CompanyOnboardingApiError } from "../../../infrastructure/http/company-onboarding-api";

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; invitation: InvitationValidation }
  | { kind: "accepted"; invitation: InvitationValidation }
  | { kind: "error"; code: string };

export function AcceptInvitation({ token }: { token: string }) {
  const platform = usePlatform();
  const router = useRouter();
  const [page, setPage] = useState<PageState>({ kind: "loading" });
  const [session, setSession] = useState<Session | null>(null);
  const [switchConfirmed, setSwitchConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      let restored: Session | null = null;
      try {
        restored = await platform.authentication.restore();
      } catch {
        restored = null;
      }
      if (!mounted) return;
      setSession(restored);
      try {
        const invitation = await platform.invitations.preview(token);
        if (!mounted) return;
        if (invitation.status === "ACCEPTED") {
          if (isAcceptedSession(restored, invitation)) {
            removeInvitationTokenFromAddress();
            router.replace("/app");
          } else {
            setPage({ kind: "accepted", invitation });
          }
          return;
        }
        setPage({ kind: "ready", invitation });
      } catch (caught) {
        if (mounted) setPage({ kind: "error", code: errorCode(caught) });
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [platform, router, token]);

  async function accept() {
    if (page.kind !== "ready" || (needsSessionSwitch(session, page.invitation) && !switchConfirmed)) return;
    setPending(true);
    try {
      await platform.invitations.accept(token);
      removeInvitationTokenFromAddress();
      router.replace("/app");
    } catch (caught) {
      const code = errorCode(caught);
      if (code === "INVITATION_ALREADY_ACCEPTED" && isAcceptedSession(session, page.invitation)) {
        removeInvitationTokenFromAddress();
        router.replace("/app");
        return;
      }
      setPage({ kind: "error", code });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card card" aria-live="polite">
        <div className="brand"><BrandMark />OrbiBots</div>
        {page.kind === "loading" ? (
          <p className="lede" role="status">Verificando o convite.</p>
        ) : null}
        {page.kind === "ready" ? (
          <>
            <p className="crumbs">Convite de acesso</p>
            <h1>Ative seu acesso</h1>
            <p className="lede">Você foi convidado para administrar a empresa abaixo.</p>
            <dl className="invitation-preview">
              <div><dt>Empresa</dt><dd>{page.invitation.companyName}</dd></div>
              <div><dt>Convidado</dt><dd>{page.invitation.invitedName}</dd></div>
              <div><dt>E-mail</dt><dd>{page.invitation.emailMasked}</dd></div>
              <div><dt>Papel</dt><dd>{statusLabel[page.invitation.role]}</dd></div>
              <div><dt>Validade</dt><dd>{formatDate(page.invitation.expiresAt)}</dd></div>
            </dl>
            {session && needsSessionSwitch(session, page.invitation) ? (
              <div className="login-notice" role="status">
                <p>
                  Você está conectado como {session.email} ({session.kind === "super-admin" ? "SUPER_ADMIN" : "COMPANY_ADMIN"}).
                  Aceitar trocará a sessão atual.
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={switchConfirmed}
                    onChange={(event) => setSwitchConfirmed(event.target.checked)}
                  />
                  Confirmo que quero trocar de conta.
                </label>
              </div>
            ) : null}
            <button
              className="btn primary"
              type="button"
              disabled={pending || (needsSessionSwitch(session, page.invitation) && !switchConfirmed)}
              onClick={() => void accept()}
            >
              {pending
                ? "Ativando acesso..."
                : needsSessionSwitch(session, page.invitation)
                  ? "Aceitar e trocar sessão"
                  : "Confirmar acesso"}
            </button>
          </>
        ) : null}
        {page.kind === "accepted" ? (
          <>
            <h1>Convite já aceito</h1>
            <p className="lede">
              O convite para {page.invitation.companyName} já foi usado. Entre com a conta que ativou este acesso.
            </p>
            <Link className="btn" href="/login">Ir para o login</Link>
          </>
        ) : null}
        {page.kind === "error" ? (
          <InvitationError code={page.code} session={session} />
        ) : null}
      </section>
    </main>
  );
}

function InvitationError({ code, session }: { code: string; session: Session | null }) {
  const status = errorPresentation(code);
  return (
    <>
      <h1>{status.title}</h1>
      <p className="lede">{session ? `Você está conectado como ${session.email}. ` : null}{status.message}</p>
      {status.action === "login" ? <Link className="btn" href="/login">Ir para o login</Link> : null}
    </>
  );
}

function errorPresentation(code: string): { title: string; message: string; action: "login" | "admin" | "none" } {
  if (code === "INVITATION_EXPIRED") {
    return {
      title: "Convite expirado",
      message: "O prazo de 24 horas terminou. Peça ao administrador do OrbiBots um novo envio.",
      action: "none",
    };
  }
  if (code === "INVITATION_REVOKED") {
    return {
      title: "Convite revogado",
      message: "Este link não pode mais ser usado. Peça ao administrador do OrbiBots um novo convite.",
      action: "none",
    };
  }
  if (code === "INVITATION_ALREADY_ACCEPTED") {
    return {
      title: "Convite já aceito",
      message: "Entre com a conta que ativou o convite.",
      action: "login",
    };
  }
  if (code === "INVITATION_UNAVAILABLE") {
    return {
      title: "Link inválido",
      message: "Este link não corresponde a um convite disponível.",
      action: "login",
    };
  }
  if (code === "NETWORK_ERROR") {
    return {
      title: "Não foi possível verificar",
      message: "Verifique sua conexão e abra novamente o link recebido.",
      action: "none",
    };
  }
  return {
    title: "Convite indisponível",
    message: "Não foi possível validar o convite agora. Tente novamente mais tarde.",
    action: code === "AUTHENTICATION_REQUIRED" ? "login" : "none",
  };
}

function errorCode(error: unknown): string {
  return error instanceof CompanyOnboardingApiError ? error.code : "UNKNOWN";
}

function isAcceptedSession(session: Session | null, invitation: InvitationValidation): boolean {
  if (!session || session.kind !== "company-admin") return false;
  return session.companyId === invitation.companyId && maskEmail(session.email) === invitation.emailMasked;
}

function needsSessionSwitch(session: Session | null, invitation: InvitationValidation): boolean {
  return session !== null && !isAcceptedSession(session, invitation);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return local && domain ? `${local[0]}***@${domain}` : "";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function removeInvitationTokenFromAddress(): void {
  window.history.replaceState(window.history.state, "", "/invite");
}
