"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Company } from "../../../domain/company/company";
import type { Invitation } from "../../../domain/invitation/invitation";
import { ErrorNote, errorText } from "../../components/Feedback";
import { StatusPill } from "../../components/StatusPill";
import { usePlatform } from "../../hooks/platform";

type ClientRow = {
  company: Company;
  invitation: Invitation | null;
};

export function Companies() {
  const platform = usePlatform();
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const [companies, invitations] = await Promise.all([
      platform.companies.list(),
      platform.invitations.list(),
    ]);
    setRows(
      companies.map((company) => ({
        company,
        invitation:
          invitations
            .filter((item) => item.companyId === company.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
      })),
    );
  }

  useEffect(() => {
    void load().catch((caught) => setError(errorText(caught)));
  }, [platform]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const companyName = String(data.get("companyName") ?? "");
    const adminName = String(data.get("adminName") ?? "");
    const email = String(data.get("email") ?? "");
    const phone = String(data.get("phone") ?? "");
    setPending(true);
    setError(null);
    try {
      const invitations = await platform.invitations.list();
      const normalized = email.trim().toLowerCase();
      const taken = invitations.some(
        (invitation) => invitation.email === normalized && invitation.status !== "REVOKED",
      );
      if (taken) {
        setError("Já existe um cliente com este e-mail.");
        return;
      }
      await platform.companies.register({ companyName, adminName, email, phone });
      form.reset();
      await load();
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
          <h1>Clientes</h1>
          <p className="lede">Cadastre a empresa e o responsável. O cliente fica aguardando ativação.</p>
        </div>
      </header>
      <div className="split">
        <section className="card">
          <h2>Cadastrados</h2>
          {rows === null ? <p className="lede">Carregando clientes.</p> : null}
          {rows?.length === 0 ? <p className="lede">Nenhum cliente cadastrado.</p> : null}
          {rows && rows.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Responsável</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ company, invitation }) => (
                    <tr key={company.id}>
                      <td>
                        <Link href={`/admin/companies/${company.id}`}>{company.name}</Link>
                        {company.phone ? <small className="hint">{company.phone}</small> : null}
                      </td>
                      <td>
                        {invitation?.adminName ?? "—"}
                        {invitation ? <small className="hint">{invitation.email}</small> : null}
                      </td>
                      <td>
                        <StatusPill value={company.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        <section className="card">
          <h2>Novo cliente</h2>
          <form className="form" onSubmit={(event) => void submit(event)}>
            <label>
              <span>Empresa</span>
              <input name="companyName" autoComplete="organization" required maxLength={255} />
            </label>
            <label>
              <span>Responsável</span>
              <input name="adminName" autoComplete="name" required maxLength={255} />
            </label>
            <label>
              <span>E-mail</span>
              <input name="email" type="email" autoComplete="email" required maxLength={320} />
            </label>
            <label>
              <span>Telefone</span>
              <input name="phone" type="tel" autoComplete="tel" maxLength={20} />
            </label>
            <ErrorNote message={error} />
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? "Cadastrando..." : "Cadastrar cliente"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
