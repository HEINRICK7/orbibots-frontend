"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CompanyOnboardingSummary } from "../../../application/company-onboarding";
import { ErrorNote, errorText } from "../../components/Feedback";
import { StatusPill } from "../../components/StatusPill";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";
import { InvitationActions } from "../invitations/InvitationActions";

function when(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function CompanyDetails() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId ?? "";
  const platform = usePlatform();
  const [company, setCompany] = useState<CompanyOnboardingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setCompany(null);
    setError(null);
    try {
      const result = await platform.companies.get(companyId);
      if (requestId.current === currentRequest) setCompany(result);
    } catch (caught) {
      if (requestId.current === currentRequest) setError(errorText(caught));
      throw caught;
    }
  }, [companyId, platform]);

  useEffect(() => {
    void load().catch(() => undefined);
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  if (!company) {
    return (
      <div className="clients-page">
        {error
          ? <ErrorNote message={error} />
          : <p className="lede" role="status">Carregando a empresa.</p>}
      </div>
    );
  }

  return (
    <div className="clients-page">
      <header className="page-head">
        <div>
          <p className="crumbs"><Link href="/admin/companies">Empresas</Link> / {company.name}</p>
          <h1>{company.name}</h1>
          <p className="lede">
            <StatusPill value={company.status} /> Criada em {when(company.createdAt)}.
            {company.activatedAt ? ` Ativada em ${when(company.activatedAt)}.` : " Aguardando aceite do primeiro administrador."}
          </p>
        </div>
      </header>
      <ErrorNote message={error} />
      <section className="card" aria-labelledby="company-invitations-heading">
        <h2 id="company-invitations-heading">Convites desta empresa</h2>
        <p className="lede">O link é de uso único e enviado somente ao e-mail do administrador. Ignore o convite se não o reconhece.</p>
        {company.invitations.length === 0 ? (
          <p className="lede">Nenhum convite cadastrado.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Administrador convidado</th>
                  <th>Papel</th>
                  <th>Convite</th>
                  <th>Envio do e-mail</th>
                  <th>Expira em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {company.invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>{invitation.invitedName}<small className="hint">{invitation.email}</small></td>
                    <td>{statusLabel[invitation.intendedRole]}</td>
                    <td><StatusPill value={invitation.status} /></td>
                    <td>{deliveryLabel(invitation.emailDeliveryStatus)}</td>
                    <td>{when(invitation.expiresAt)}</td>
                    <td>
                      <InvitationActions invitation={invitation} onChanged={load} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function deliveryLabel(status: string | null | undefined): string {
  if (status === "SENT") return "Enviado";
  if (status === "FAILED") return "Falha recuperável";
  if (status === "PROCESSING") return "Enviando";
  if (status === "PENDING") return "Aguardando envio";
  return "Sem registro de envio";
}
