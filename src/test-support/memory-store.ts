import type { Membership, User } from "../domain/access/access";
import type { Company } from "../domain/company/company";
import type { Invitation } from "../domain/invitation/invitation";
import type { AccessRepository, CompanyRepository, InvitationRepository } from "../application/ports";

export class MemoryStore {
  private readonly companies = new Map<string, Company>();
  private readonly invitations = new Map<string, Invitation>();
  private readonly users = new Map<string, User>();
  private readonly memberships = new Map<string, Membership>();

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
