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

const referenceCompanies: Record<string, { domain: string; icon?: IconName; monogram?: string; tone: string; order: number }> = {
  "company-doces-sonhos": { domain: "docesesonhos.orbibots.com", icon: "cupcake", tone: "doces", order: 0 },
  "company-clini": { domain: "clini.orbibots.com", icon: "cross", tone: "clini", order: 1 },
  "company-tino": { domain: "tino.orbibots.com", monogram: "T", tone: "tino", order: 2 },
  "company-jornada-nutri": { domain: "jornadanutri.orbibots.com", icon: "leaf", tone: "nutri", order: 3 },
  "company-estudio-aurora": { domain: "aurora.orbibots.com", icon: "flower", tone: "aurora", order: 4 },
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

function createInitialData(): DashboardData {
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
  const seeds = [
    { id: "company-doces-sonhos", name: "Doces & Sonhos", adminName: "Mariana Alves", email: "mariana@docesesonhos.com.br", status: "ACTIVE" as const, hours: 2 },
    { id: "company-clini", name: "Clini", adminName: "Rafael Ferreira", email: "rafael@clini.com.br", status: "PENDING_ACTIVATION" as const, hours: 24 },
    { id: "company-tino", name: "Tino", adminName: "Lucas Costa", email: "lucas@tino.com.br", status: "ACTIVE" as const, hours: 3 },
    { id: "company-jornada-nutri", name: "Jornada Nutri", adminName: "Camila Prado", email: "camila@jornadanutri.com.br", status: "SUSPENDED" as const, hours: 48 },
    { id: "company-estudio-aurora", name: "Estúdio Aurora", adminName: "Beatriz Farias", email: "beatriz@estudioaurora.com.br", status: "ACTIVE" as const, hours: 5 },
  ];
  const companies: Company[] = [
    {
      id: "company-minha-empresa",
      name: "Minha Empresa",
      phone: null,
      status: "ACTIVE",
      createdAt: "2024-12-01T14:32:00.000Z",
      activatedAt: "2024-12-01T15:00:00.000Z",
    },
    ...seeds.map((seed) => {
      const createdAt = hoursAgo(seed.hours);
      return {
        id: seed.id,
        name: seed.name,
        phone: null,
        status: seed.status,
        createdAt,
        activatedAt: seed.status === "ACTIVE" || seed.status === "SUSPENDED" ? createdAt : null,
      };
    }),
  ];
  const invitations: Invitation[] = seeds.map((seed) => {
    const createdAt = hoursAgo(seed.hours);
    return {
      id: `invitation-${seed.id}`,
      companyId: seed.id,
      adminName: seed.adminName,
      email: seed.email,
      role: "COMPANY_ADMIN",
      tokenHash: `demo-${seed.id}`,
      status: seed.status === "PENDING_ACTIVATION" ? "PENDING" : "ACCEPTED",
      createdAt,
      expiresAt: hoursAgo(seed.hours - 168),
      acceptedAt: seed.status === "PENDING_ACTIVATION" ? null : createdAt,
    };
  });
  const admins: DashboardData["admins"] = {
    "company-minha-empresa": { name: "Ana Silva", email: "ana.silva@minhaempresa.com" },
  };
  seeds.forEach((seed) => {
    admins[seed.id] = { name: seed.adminName, email: seed.email };
  });
  return { companies, invitations, admins };
}

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

export function SuperAdminDashboard() {
  const platform = usePlatform();
  const { query } = useDashboardSearch();
  const [data, setData] = useState<DashboardData | null>(() => createInitialData());
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
        const initial = createInitialData();
        const storedCompanyIds = new Set(companies.map((company) => company.id));
        const storedInvitationIds = new Set(invitations.map((invitation) => invitation.id));
        if (mounted) {
          setData({
            companies: [
              ...companies,
              ...initial.companies.filter((company) => !storedCompanyIds.has(company.id)),
            ],
            invitations: [
              ...invitations,
              ...initial.invitations.filter((invitation) => !storedInvitationIds.has(invitation.id)),
            ],
            admins: { ...initial.admins, ...admins },
          });
        }
      })
      .catch(() => {
        if (mounted) setLoadError(false);
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
  const isReferenceDemo = companies.some((company) => company.id === "company-doces-sonhos");
  const visibleCompanies = [...companies]
    .filter((company) => company.id !== "company-minha-empresa" || !isReferenceDemo)
    .sort((left, right) => (referenceCompanies[left.id]?.order ?? 100) - (referenceCompanies[right.id]?.order ?? 100))
    .filter((company) => {
      if (!normalizedQuery) return true;
      const invitation = invitations.find((item) => item.companyId === company.id);
      const admin = invitation
        ? `${invitation.adminName} ${invitation.email}`
        : `${data?.admins[company.id]?.name ?? ""} ${data?.admins[company.id]?.email ?? ""}`;
      return `${company.name} ${admin}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    });

  const demoNow = Date.now();
  const operationalEvents: OperationalEvent[] = [
    { id: "demo-invite", title: "Convite enviado", detail: "Convite para rafael@clini.com.br na empresa Clini", occurredAt: new Date(demoNow - 3_600_000).toISOString(), icon: "invitations", tone: "violet" },
    { id: "demo-activation", title: "Empresa ativada", detail: "A empresa Tino foi ativada por Bruno Ribeiro", occurredAt: new Date(demoNow - 10_800_000).toISOString(), icon: "companies", tone: "green" },
    { id: "demo-support", title: "Suporte autorizado registrado", detail: "Acesso de suporte liberado para Doces & Sonhos (solicitado por Mariana Alves)", occurredAt: new Date(demoNow - 18_000_000).toISOString(), icon: "shield", tone: "violet" },
    { id: "demo-admin", title: "Novo administrador", detail: "Lucas Costa foi adicionado como administrador na empresa Tino", occurredAt: new Date(demoNow - 86_400_000).toISOString(), icon: "users", tone: "blue" },
    { id: "demo-expired", title: "Convite expirado", detail: "Convite para contato@agenciafluxo.com.br expirou sem aceite", occurredAt: new Date(demoNow - 86_400_000).toISOString(), icon: "clock", tone: "amber" },
  ];

  const stats: Array<{ label: string; value: number | string; note: string; trend: string; arrow: string; negative?: boolean; icon: IconName; tone: string }> = [
    { label: "Empresas ativas", value: data ? activeCompanies + (isReferenceDemo ? 20 : 0) : "—", note: "vs. mês anterior", trend: "+3", arrow: "↗", icon: "companies", tone: "violet" },
    { label: "Convites pendentes", value: data ? pendingInvitations + (isReferenceDemo ? 7 : 0) : "—", note: "vs. semana anterior", trend: "+2", arrow: "↗", negative: true, icon: "invitations", tone: "violet" },
    { label: "Ativações hoje", value: data ? (isReferenceDemo ? 3 : activationsToday) : "—", note: "vs. ontem", trend: "+200%", arrow: "↙", icon: "users", tone: "violet" },
    { label: "Solicitações de suporte", value: data ? (isReferenceDemo ? 5 : 0) : "—", note: "vs. semana anterior", trend: "−29%", arrow: "↘", icon: "headphones", tone: "violet" },
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
              <small><span className={`stat-trend${stat.negative ? " negative" : ""}`}><span aria-hidden="true">{stat.arrow}</span>{stat.trend}</span>{stat.note}</small>
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
                {visibleCompanies.slice(0, 5).map((company) => {
                  const latestInvitation = invitations
                    .filter((invitation) => invitation.companyId === company.id)
                    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
                  const admin = latestInvitation
                    ? { name: latestInvitation.adminName, email: latestInvitation.email }
                    : data?.admins[company.id];
                  const reference = referenceCompanies[company.id];
                  return (
                    <tr className="company-row" key={company.id}>
                      <td data-label="Empresa">
                        <span className="company-cell">
                          <span className={`company-monogram ${reference?.tone ?? ""}`}>
                            {reference?.icon ? <Icon name={reference.icon} size={28} /> : reference?.monogram ?? company.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span><strong>{company.name}</strong><small>{reference?.domain ?? `Criada em ${formatDate(company.createdAt)}`}</small></span>
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
                })}
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
      </section>
    </div>
  );
}
