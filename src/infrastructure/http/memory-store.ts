import { createUser, grantMembership, type Membership, type User } from "../../domain/access/access";
import type { Company } from "../../domain/company/company";
import { issueInvitation } from "../../domain/invitation/invitation";
import type { Invitation } from "../../domain/invitation/invitation";
import { exampleAdmin, exampleCompanyId, exampleUserId } from "../../application/examples";
import type { AccessRepository, CompanyRepository, InvitationRepository } from "../../application/ports";

export class MemoryStore {
  private readonly companies = new Map<string, Company>();
  private readonly invitations = new Map<string, Invitation>();
  private readonly users = new Map<string, User>();
  private readonly memberships = new Map<string, Membership>();

  constructor() {
    const company: Company = {
      id: exampleCompanyId,
      name: exampleAdmin.companyName,
      phone: null,
      status: "ACTIVE",
      createdAt: "2024-12-01T14:32:00.000Z",
      activatedAt: "2024-12-01T15:00:00.000Z",
    };
    const user = createUser({
      id: exampleUserId,
      name: exampleAdmin.name,
      email: exampleAdmin.email,
    });
    const membership = grantMembership({
      id: "membership-ana-silva",
      companyId: company.id,
      userId: user.id,
      role: "COMPANY_ADMIN",
      existingActive: null,
    });
    this.companies.set(company.id, company);
    this.users.set(user.id, user);
    this.memberships.set(membership.id, membership);

    const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const dashboardExamples = [
      { id: "company-doces-sonhos", name: "Doces & Sonhos", adminName: "Mariana Alves", email: "mariana@docesesonhos.com.br", status: "ACTIVE", hours: 2 },
      { id: "company-clini", name: "Clini", adminName: "Rafael Ferreira", email: "rafael@clini.com.br", status: "PENDING_ACTIVATION", hours: 24 },
      { id: "company-tino", name: "Tino", adminName: "Lucas Costa", email: "lucas@tino.com.br", status: "ACTIVE", hours: 3 },
      { id: "company-jornada-nutri", name: "Jornada Nutri", adminName: "Camila Prado", email: "camila@jornadanutri.com.br", status: "SUSPENDED", hours: 48 },
      { id: "company-estudio-aurora", name: "Estúdio Aurora", adminName: "Beatriz Farias", email: "beatriz@estudioaurora.com.br", status: "ACTIVE", hours: 5 },
    ] as const;

    dashboardExamples.forEach((seed) => {
      const createdAt = hoursAgo(seed.hours);
      const active = seed.status === "ACTIVE";
      const companyItem: Company = {
        id: seed.id,
        name: seed.name,
        phone: null,
        status: seed.status,
        createdAt,
        activatedAt: active || seed.status === "SUSPENDED" ? createdAt : null,
      };
      this.companies.set(companyItem.id, companyItem);

      const invitation = issueInvitation({
        id: `invitation-${seed.id}`,
        companyId: companyItem.id,
        adminName: seed.adminName,
        email: seed.email,
        role: "COMPANY_ADMIN",
        tokenHash: `demo-${seed.id}`,
        createdAt,
      });
      this.invitations.set(invitation.id, {
        ...invitation,
        status: seed.status === "PENDING_ACTIVATION" ? "PENDING" : "ACCEPTED",
      });

      if (active) {
        const companyUser = createUser({
          id: `user-${seed.id}`,
          name: seed.adminName,
          email: seed.email,
        });
        const companyMembership = grantMembership({
          id: `membership-${seed.id}`,
          companyId: companyItem.id,
          userId: companyUser.id,
          role: "COMPANY_ADMIN",
          existingActive: null,
        });
        this.users.set(companyUser.id, companyUser);
        this.memberships.set(companyMembership.id, companyMembership);
      }
    });
  }

  companiesView(): CompanyRepository {
    return {
      save: async (company) => {
        this.companies.set(company.id, company);
      },
      findById: async (id) => this.companies.get(id) ?? null,
      list: async () => [...this.companies.values()],
    };
  }

  invitationsView(): InvitationRepository {
    return {
      save: async (invitation) => {
        this.invitations.set(invitation.id, invitation);
      },
      findById: async (id) => this.invitations.get(id) ?? null,
      findByTokenHash: async (tokenHash) =>
        [...this.invitations.values()].find((invitation) => invitation.tokenHash === tokenHash) ??
        null,
      list: async () => [...this.invitations.values()],
    };
  }

  accessView(): AccessRepository {
    return {
      saveUser: async (user) => {
        this.users.set(user.id, user);
      },
      findUserByEmail: async (email) =>
        [...this.users.values()].find((user) => user.email === email.trim().toLowerCase()) ?? null,
      findUserById: async (id) => this.users.get(id) ?? null,
      saveMembership: async (membership) => {
        this.memberships.set(membership.id, membership);
      },
      findActiveMembership: async (userId, companyId) =>
        [...this.memberships.values()].find(
          (membership) =>
            membership.userId === userId &&
            membership.companyId === companyId &&
            membership.status === "ACTIVE",
        ) ?? null,
      listMembershipsByCompany: async (companyId) =>
        [...this.memberships.values()].filter((membership) => membership.companyId === companyId),
    };
  }
}
