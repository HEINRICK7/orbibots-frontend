"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { CompanyInvitationSummary } from "../../../application/company-onboarding";
import { ErrorNote, errorText } from "../../components/Feedback";
import { StatusPill } from "../../components/StatusPill";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";
import { InvitationActions } from "./InvitationActions";

export function Invitations() {
  const platform = usePlatform();
  const [invitations, setInvitations] = useState<CompanyInvitationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInvitations(await platform.invitations.list());
    } catch (caught) {
      setError(errorText(caught));
      throw caught;
    }
  }, [platform]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  return (
    <div className="clients-page">
      <header className="page-head">
        <div>
          <p className="crumbs">Operação</p>
          <h1>Convites</h1>
          <p className="lede">Consulte os convites enviados e gerencie o acesso dos administradores.</p>
        </div>
      </header>
      <ErrorNote message={error} />
      <section className="card" aria-labelledby="invitations-heading">
        <h2 id="invitations-heading">Todos os convites</h2>
        {invitations === null ? <p className="lede" role="status">Carregando convites.</p> : null}
        {invitations?.length === 0 ? <p className="lede" role="status">Nenhum convite cadastrado.</p> : null}
        {invitations && invitations.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Administrador</th>
                  <th>Papel</th>
                  <th>Convite</th>
                  <th>E-mail</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td><Link href={`/admin/companies/${invitation.companyId}`}>{invitation.companyName}</Link></td>
                    <td>{invitation.invitedName}</td>
                    <td>{statusLabel[invitation.intendedRole]}</td>
                    <td><StatusPill value={invitation.status} /></td>
                    <td>
                      {deliveryLabel(invitation.emailDeliveryStatus)}
                      <small className="hint">Expira em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}</small>
                    </td>
                    <td><InvitationActions invitation={invitation} onChanged={load} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function deliveryLabel(status: string | null | undefined): string {
  if (status === "SENT") return "E-mail enviado";
  if (status === "FAILED") return "Falha recuperável";
  if (status === "PROCESSING") return "Enviando e-mail";
  if (status === "PENDING") return "Aguardando envio";
  return "Sem registro de envio";
}
