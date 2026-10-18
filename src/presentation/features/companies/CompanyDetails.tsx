"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CompanyDetails as Details } from "../../../application/companies/companies";
import { ErrorNote, errorText } from "../../components/Feedback";
import { StatusPill } from "../../components/StatusPill";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";

function when(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function CompanyDetails() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId ?? "";
  const platform = usePlatform();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function load() {
    setDetails(await platform.companies.get(companyId));
  }

  useEffect(() => {
    void load().catch((caught) => setError(errorText(caught)));
  }, [platform, companyId]);

  if (!details) {
    return <ErrorNote message={error ?? "Carregando a empresa."} />;
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="crumbs">
            <Link href="/admin/companies">Empresas</Link> / {details.company.name}
          </p>
          <h1>{details.company.name}</h1>
          <p className="lede">
            <StatusPill value={details.company.status} /> Criada em {when(details.company.createdAt)}. Ativada em{" "}
            {when(details.company.activatedAt)}.
          </p>
        </div>
        <button
          className="btn"
          type="button"
          disabled={details.company.status !== "ACTIVE"}
          onClick={() => {
            void platform.companies
              .suspend(details.company.id)
              .then(load)
              .catch((caught) => setError(errorText(caught)));
          }}
        >
          Suspender acesso
        </button>
      </header>
      <ErrorNote message={error} />
      {link ? (
        <p className="notice">
          Novo link de convite: <Link href={link}>{link}</Link>
        </p>
      ) : null}
      <div className="split">
        <section className="card">
          <h2>Pessoas com acesso</h2>
          {details.members.length === 0 ? (
            <p className="lede">Ninguém ativou o acesso ainda. A empresa continua sem especialista.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                </tr>
              </thead>
              <tbody>
                {details.members.map(({ user, membership }) => (
                  <tr key={membership.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{statusLabel[membership.role]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card">
          <h2>Convites</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Administrador</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {details.invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>
                    {invitation.adminName}
                    <small className="hint">{invitation.email}</small>
                  </td>
                  <td>
                    <StatusPill value={invitation.status} />
                  </td>
                  <td className="row-actions">
                    {invitation.status === "PENDING" || invitation.status === "EXPIRED" || invitation.status === "REVOKED" ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          void platform.invitations
                            .resend(invitation.id)
                            .then((result) => {
                              setLink(`/invite/${result.inviteToken}`);
                              return load();
                            })
                            .catch((caught) => setError(errorText(caught)));
                        }}
                      >
                        Reenviar
                      </button>
                    ) : null}
                    {invitation.status === "PENDING" ? (
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          void platform.invitations
                            .revoke(invitation.id)
                            .then(load)
                            .catch((caught) => setError(errorText(caught)));
                        }}
                      >
                        Revogar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
