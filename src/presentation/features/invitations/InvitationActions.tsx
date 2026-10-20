"use client";

import { useState } from "react";
import type { CompanyInvitationSummary } from "../../../application/company-onboarding";
import { ErrorNote, errorText } from "../../components/Feedback";
import { usePlatform } from "../../hooks/platform";

type Action = "resend" | "revoke";

export function InvitationActions({
  invitation,
  onChanged,
}: {
  invitation: CompanyInvitationSummary;
  onChanged: () => Promise<void>;
}) {
  const platform = usePlatform();
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actionable = invitation.status === "PENDING" || invitation.status === "EXPIRED";

  async function confirm() {
    if (!confirming) return;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      if (confirming === "resend") {
        const result = await platform.invitations.resend(invitation.id);
        setNotice(deliveryNotice(result.emailDeliveryStatus));
      } else {
        await platform.invitations.revoke(invitation.id);
        setNotice("Convite revogado. A empresa permanece cadastrada.");
      }
      setConfirming(null);
      try {
        await onChanged();
      } catch (caught) {
        setError(`A ação foi concluída, mas os dados não atualizaram. ${errorText(caught)}`);
      }
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="invitation-actions">
      {actionable ? (
        <>
          <button className="btn" type="button" disabled={pending} onClick={() => setConfirming("resend")}>
            Reenviar
          </button>
          <button className="btn ghost" type="button" disabled={pending} onClick={() => setConfirming("revoke")}>
            Revogar
          </button>
        </>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      <ErrorNote message={error} />
      {confirming ? (
        <div className="access-dialog" role="dialog" aria-modal="true" aria-labelledby={`confirm-${invitation.id}`}>
          <div className="access-dialog-content">
            <h2 id={`confirm-${invitation.id}`}>
              {confirming === "resend" ? "Reenviar convite?" : "Revogar convite?"}
            </h2>
            {confirming === "resend" ? (
              <p>Um novo link será enviado para {invitation.email}. O link não será exibido nesta tela.</p>
            ) : (
              <p>O link enviado para {invitation.email}, da empresa {invitation.companyName}, deixará de funcionar.</p>
            )}
            <div className="row-actions">
              <button className="btn ghost" type="button" disabled={pending} onClick={() => setConfirming(null)}>
                Cancelar
              </button>
              <button className="btn primary" type="button" disabled={pending} onClick={() => void confirm()}>
                {pending ? "Processando..." : confirming === "resend" ? "Confirmar reenvio" : "Confirmar revogação"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function deliveryNotice(status: string): string {
  if (status === "SENT") return "Novo convite enviado por e-mail.";
  if (status === "FAILED") return "O convite foi recriado, mas o e-mail falhou. Tente novamente mais tarde.";
  return "O convite foi recriado e aguarda o envio do e-mail.";
}
