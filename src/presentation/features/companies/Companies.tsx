"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CompanyOnboardingSummary } from "../../../application/company-onboarding";
import { ErrorNote, errorText } from "../../components/Feedback";
import { StatusPill } from "../../components/StatusPill";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";

function latestInvitation(company: CompanyOnboardingSummary) {
  return [...company.invitations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function Companies() {
  const platform = usePlatform();
  const [companies, setCompanies] = useState<CompanyOnboardingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const result = await platform.companies.list();
    setCompanies(result);
  }

  useEffect(() => {
    let mounted = true;
    platform.companies.list()
      .then((result) => {
        if (mounted) setCompanies(result);
      })
      .catch((caught) => {
        if (mounted) setError(errorText(caught));
      });
    return () => {
      mounted = false;
    };
  }, [platform]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      companyName: String(data.get("companyName") ?? "").trim(),
      adminName: String(data.get("adminName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim() || null,
    };
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const created = await platform.companies.register(input);
      form.reset();
      setNotice(deliveryNotice(created.emailDeliveryStatus));
      try {
        await load();
      } catch (caught) {
        setError(`Empresa cadastrada, mas a lista não atualizou. ${errorText(caught)}`);
      }
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="clients-page">
      <header className="page-head">
        <div>
          <p className="crumbs">Super Admin</p>
          <h1>Empresas</h1>
          <p className="lede">Cadastre a empresa e acompanhe o primeiro convite de acesso.</p>
        </div>
      </header>
      <div className="split">
        <section className="card" aria-labelledby="companies-heading">
          <h2 id="companies-heading">Empresas cadastradas</h2>
          {companies === null ? <p className="lede" role="status">Carregando empresas.</p> : null}
          {companies?.length === 0 ? <p className="lede" role="status">Nenhuma empresa cadastrada.</p> : null}
          {companies && companies.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estado da empresa</th>
                    <th>Primeiro administrador</th>
                    <th>Empresa</th>
                    <th>Convite</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    const invitation = latestInvitation(company);
                    return (
                      <tr key={company.id}>
                        <td><Link href={`/admin/companies/${company.id}`}>{company.name}</Link></td>
                        <td>
                          {invitation?.invitedName ?? "—"}
                          {invitation ? <small className="hint">{invitation.email}</small> : null}
                        </td>
                        <td><StatusPill value={company.status} /></td>
                        <td>
                          {invitation ? (
                            <>
                              <StatusPill value={invitation.status} />
                              <small className="hint">{deliveryLabel(invitation.emailDeliveryStatus)}</small>
                            </>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        <section className="card" aria-labelledby="new-company-heading">
          <h2 id="new-company-heading">Cadastrar empresa</h2>
          <form className="form" onSubmit={(event) => void submit(event)}>
            <label>
              <span>Nome da empresa</span>
              <input name="companyName" autoComplete="organization" required maxLength={255} />
            </label>
            <label>
              <span>Nome do primeiro administrador</span>
              <input name="adminName" autoComplete="name" required maxLength={255} />
            </label>
            <label>
              <span>E-mail do administrador</span>
              <input name="email" type="email" autoComplete="email" required maxLength={320} />
            </label>
            <label>
              <span>Telefone (opcional)</span>
              <input name="phone" type="tel" autoComplete="tel" maxLength={32} />
            </label>
            <ErrorNote message={error} />
            {notice ? <p className="notice" role="status">{notice}</p> : null}
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? "Cadastrando..." : "Cadastrar empresa"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function deliveryNotice(status: string): string {
  if (status === "SENT") return "Empresa cadastrada. O convite foi enviado ao e-mail informado.";
  if (status === "FAILED") return "Empresa cadastrada, mas o e-mail falhou. Tente reenviar o convite.";
  return "Empresa cadastrada. O envio do convite está aguardando processamento.";
}

function deliveryLabel(status: string | null | undefined): string {
  if (status === "SENT") return "E-mail enviado";
  if (status === "FAILED") return "Falha no envio";
  if (status === "PROCESSING") return "Enviando e-mail";
  if (status === "PENDING") return "Aguardando envio";
  return statusLabel.PENDING;
}
