"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CompanyDetails } from "../../../application/companies/companies";
import type { Company } from "../../../domain/company/company";
import type { Invitation, InvitationStatus } from "../../../domain/invitation/invitation";
import { Icon, type IconName } from "../../components/Icon";
import { statusLabel } from "../../copy";
import { usePlatform } from "../../hooks/platform";
import { useDashboardSearch } from "./DashboardSearchContext";

type DashboardData = {
  companies: Company[];
  invitations: Invitation[];
  admins: Record<string, { name: string; email: string } | null>;
};

type OperationalEvent = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  icon: IconName;
  tone: string;
};

const companyStatusLabels: Record<Company["status"], string> = {
  ACTIVE: "Ativa",
  PENDING_ACTIVATION: "Pendente",
  SUSPENDED: "Suspensa",
};

const invitationTone: Record<InvitationStatus, string> = {
  PENDING: "wait",
  ACCEPTED: "ok",
  EXPIRED: "stop",
  REVOKED: "neutral",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(value))
    .replace(" de ", " ");
}

function formatRelativeDate(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units: Array<{ seconds: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { seconds: 31_536_000, unit: "year" },
    { seconds: 2_592_000, unit: "month" },
    { seconds: 86_400, unit: "day" },
    { seconds: 3_600, unit: "hour" },
    { seconds: 60, unit: "minute" },
  ];
  const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });
  const unit = units.find((candidate) => Math.abs(seconds) >= candidate.seconds);
  return unit ? relative.format(Math.round(seconds / unit.seconds), unit.unit) : "agora";
}

function buildOperationalEvents(companies: Company[], invitations: Invitation[]): OperationalEvent[] {
  const companyMap = new Map(companies.map((company) => [company.id, company]));
  const events: OperationalEvent[] = [];

  invitations.forEach((invitation) => {
    const companyName = companyMap.get(invitation.companyId)?.name ?? "empresa";
    if (invitation.status === "EXPIRED") {
      events.push({
        id: `inv-exp-${invitation.id}`,
        title: "Convite expirado",
        detail: `Convite para ${invitation.email} expirou sem aceite`,
        occurredAt: invitation.expiresAt,
        icon: "clock",
        tone: "amber",
      });
    } else {
      events.push({
        id: `inv-${invitation.id}`,
        title: "Convite enviado",
        detail: `Convite para ${invitation.email} na empresa ${companyName}`,
        occurredAt: invitation.createdAt,
        icon: "invitations",
        tone: "violet",
      });
    }
  });

  companies.forEach((company) => {
    if (company.activatedAt) {
      events.push({
        id: `comp-act-${company.id}`,
        title: "Empresa ativada",
        detail: `A empresa ${company.name} foi ativada`,
        occurredAt: company.activatedAt,
        icon: "companies",
        tone: "green",
      });
    }
  });

  return events.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, 5);
}

export function SuperAdminDashboard() {
  const platform = usePlatform();
  const { query } = useDashboardSearch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([platform.companies.list(), platform.invitations.list()])
      .then(async ([companies, invitations]) => {
        const details = await Promise.all(
          companies.slice(0, 6).map((company) => platform.companies.get(company.id)),
        );
        const admins: DashboardData["admins"] = {};
        details.forEach((detail: CompanyDetails) => {
          const member = detail.members[0]?.user;
          admins[detail.company.id] = member ? { name: member.name, email: member.email } : null;
        });
        if (mounted) setData({ companies, invitations, admins });
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });
    return () => {
      mounted = false;
    };
  }, [platform]);

  const companies = data?.companies ?? [];
  const invitations = data?.invitations ?? [];
  const activeCompanies = companies.filter((company) => company.status === "ACTIVE").length;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "PENDING").length;
  const today = new Date().toLocaleDateString("pt-BR");
  const activationsToday = companies.filter((company) =>
    company.activatedAt && new Date(company.activatedAt).toLocaleDateString("pt-BR") === today,
  ).length;
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleCompanies = [...companies]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((company) => {
      if (!normalizedQuery) return true;
      const invitation = invitations.find((item) => item.companyId === company.id);
      const admin = invitation
        ? `${invitation.adminName} ${invitation.email}`
        : `${data?.admins[company.id]?.name ?? ""} ${data?.admins[company.id]?.email ?? ""}`;
      return `${company.name} ${admin}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    });

  const operationalEvents = buildOperationalEvents(companies, invitations);

  const stats: Array<{ label: string; value: number | string; note: string; icon: IconName; tone: string }> = [
    { label: "Empresas ativas", value: data ? activeCompanies : "—", note: "Total ativo na plataforma", icon: "companies", tone: "violet" },
    { label: "Convites pendentes", value: data ? pendingInvitations : "—", note: "Aguardando ativação", icon: "invitations", tone: "violet" },
    { label: "Ativações hoje", value: data ? activationsToday : "—", note: "Empresas ativadas hoje", icon: "users", tone: "violet" },
    { label: "Solicitações de suporte", value: data ? 0 : "—", note: "Chamados em aberto", icon: "headphones", tone: "violet" },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-stats" aria-label="Indicadores da plataforma" aria-busy={!data && !loadError}>
        {stats.map((stat) => (
          <article className="dashboard-stat" key={stat.label}>
            <span className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={28} /></span>
            <div className="stat-copy">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </article>
        ))}
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-data-card">
          <header className="section-heading">
            <div>
              <h2>Empresas recentes</h2>
              <p>Últimas empresas cadastradas na plataforma.</p>
            </div>
            <Link className="btn dashboard-view-all" href="/admin/companies">
              Ver todas <Icon name="arrow-right" size={16} />
            </Link>
          </header>

          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Administrador</th>
                  <th>Status</th>
                  <th>Última atividade</th>
                  <th>Convite</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {visibleCompanies.length === 0 ? (
                  <tr>
                    <td className="empty-table-cell" colSpan={6}>
                      <div className="dashboard-empty">
                        <span className="empty-orbit"><Icon name="companies" size={28} /></span>
                        <h3>Nenhuma empresa cadastrada</h3>
                        <p>Cadastre uma empresa para acompanhar o status e o convite do administrador aqui.</p>
                        <Link className="btn empty-cta" href="/admin/companies">
                          <Icon name="plus" size={16} /> Nova empresa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleCompanies.slice(0, 5).map((company) => {
                    const latestInvitation = invitations
                      .filter((invitation) => invitation.companyId === company.id)
                      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
                    const admin = latestInvitation
                      ? { name: latestInvitation.adminName, email: latestInvitation.email }
                      : data?.admins[company.id];
                    return (
                      <tr className="company-row" key={company.id}>
                        <td data-label="Empresa">
                          <span className="company-cell">
                            <span className="company-monogram">
                              {company.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span><strong>{company.name}</strong><small>{`Criada em ${formatDate(company.createdAt)}`}</small></span>
                          </span>
                        </td>
                        <td data-label="Administrador">
                          {admin ? (
                            <span className="admin-cell">
                              <span className="admin-avatar" aria-hidden="true">{admin.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                              <span><strong>{admin.name}</strong><small>{admin.email}</small></span>
                            </span>
                          ) : <span className="quiet">Sem convite registrado</span>}
                        </td>
                        <td data-label="Status">
                          <span className={`status-pill ${company.status.toLowerCase().replaceAll("_", "-")}`}>
                            {companyStatusLabels[company.status]}
                          </span>
                        </td>
                        <td data-label="Última atividade">
                          <time className="last-activity" dateTime={company.activatedAt ?? company.createdAt} title={formatDate(company.activatedAt ?? company.createdAt)}>
                            {formatRelativeDate(company.activatedAt ?? company.createdAt)}
                          </time>
                        </td>
                        <td data-label="Convite">
                          {latestInvitation ? (
                            <span className={`status-pill ${invitationTone[latestInvitation.status]}`}>
                              <Icon name={latestInvitation.status === "ACCEPTED" ? "check" : "clock"} size={15} />{statusLabel[latestInvitation.status]}
                            </span>
                          ) : <span className="status-pill neutral">—</span>}
                        </td>
                        <td className="table-action-cell">
                          <Link className="table-action" href={`/admin/companies/${company.id}`} aria-label={`Ver ${company.name}`}>
                            <Icon name="more" size={22} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dashboard-rail">
          <section className="quick-actions-card">
            <h2><Icon name="bolt" size={24} />Ações rápidas</h2>
            <Link className="quick-action primary-action" href="/admin/companies">
              <span><Icon name="plus" size={21} />Nova empresa</span><Icon name="arrow-right" size={18} />
            </Link>
            <Link className="quick-action" href="/admin/invitations">
              <span><Icon name="invitations" size={22} />Enviar convite</span><Icon name="arrow-right" size={18} />
            </Link>
            <Link className="quick-action" href="/admin/audit">
              <span><Icon name="shield" size={22} />Ver auditoria</span><Icon name="arrow-right" size={18} />
            </Link>
          </section>

          <section className="access-note-card">
            <span className="access-note-icon"><Icon name="lock" size={28} /></span>
            <div>
              <h2>Acesso de suporte</h2>
              <p>O acesso ao ambiente de uma empresa deve ser sempre autorizado pelo administrador da empresa e fica registrado na auditoria da plataforma.</p>
              <Link href="/admin/audit">Saiba mais sobre o processo <Icon name="arrow-right" size={15} /></Link>
            </div>
          </section>
        </aside>
      </div>

      <section className="operational-activity" aria-labelledby="activity-heading" aria-busy={!data && !loadError}>
        <header className="activity-heading">
          <h2 id="activity-heading">Atividade operacional</h2>
          <Link href="/admin/audit">Ver toda a atividade <Icon name="arrow-right" size={15} /></Link>
        </header>
        {operationalEvents.length === 0 ? (
          <div className="activity-empty">
            <span className="activity-empty-icon"><Icon name="clock" size={22} /></span>
            <div>
              <strong>Nenhuma atividade recente</strong>
              <p>Os eventos operacionais aparecerão aqui conforme empresas e convites forem registrados.</p>
            </div>
            <span className="activity-empty-line" aria-hidden="true" />
          </div>
        ) : (
          <ul className="activity-list">
            {operationalEvents.map((event) => (
              <li key={event.id}>
                <span className={`activity-icon ${event.tone}`}><Icon name={event.icon} size={17} /></span>
                <strong>{event.title}</strong>
                <span className="activity-detail">{event.detail}</span>
                <time dateTime={event.occurredAt}>{formatRelativeDate(event.occurredAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
