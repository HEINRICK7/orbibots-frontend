import type { Membership, User } from "../../domain/access/access";
import type { Company } from "../../domain/company/company";
import type { Invitation } from "../../domain/invitation/invitation";
import type { AccessRepository, CompanyRepository, InvitationRepository } from "../../application/ports";

const storageKey = "orbibots.clients";

type Snapshot = {
  companies: Company[];
  invitations: Invitation[];
  users: User[];
  memberships: Membership[];
};

function browserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function readSnapshot(): Snapshot {
  const raw = browserStorage()?.getItem(storageKey);
  if (!raw) {
    return { companies: [], invitations: [], users: [], memberships: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
    };
  } catch {
    return { companies: [], invitations: [], users: [], memberships: [] };
  }
}

export class MemoryStore {
  private readonly companies = new Map<string, Company>();
  private readonly invitations = new Map<string, Invitation>();
  private readonly users = new Map<string, User>();
  private readonly memberships = new Map<string, Membership>();

  constructor() {
    const snapshot = readSnapshot();
    snapshot.companies.forEach((company) => this.companies.set(company.id, company));
    snapshot.invitations.forEach((invitation) => this.invitations.set(invitation.id, invitation));
    snapshot.users.forEach((user) => this.users.set(user.id, user));
    snapshot.memberships.forEach((membership) => this.memberships.set(membership.id, membership));
  }

  private persist(): void {
    const box = browserStorage();
    if (!box) {
      return;
    }
    const snapshot: Snapshot = {
      companies: [...this.companies.values()],
      invitations: [...this.invitations.values()],
      users: [...this.users.values()],
      memberships: [...this.memberships.values()],
    };
    box.setItem(storageKey, JSON.stringify(snapshot));
  }

  companiesView(): CompanyRepository {
    return {
      save: async (company) => {
        this.companies.set(company.id, company);
        this.persist();
      },
      findById: async (id) => this.companies.get(id) ?? null,
      list: async () => [...this.companies.values()],
    };
  }

  invitationsView(): InvitationRepository {
    return {
      save: async (invitation) => {
        this.invitations.set(invitation.id, invitation);
        this.persist();
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
        this.persist();
      },
      findUserByEmail: async (email) =>
        [...this.users.values()].find((user) => user.email === email.trim().toLowerCase()) ?? null,
      findUserById: async (id) => this.users.get(id) ?? null,
      saveMembership: async (membership) => {
        this.memberships.set(membership.id, membership);
        this.persist();
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
