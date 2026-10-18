import { DomainError } from "../../domain/shared/domain-error";
import type { Membership, User } from "../../domain/access/access";
import {
  createPendingCompany,
  suspendCompany,
  type Company,
} from "../../domain/company/company";
import { issueInvitation, invitationStateAt, type Invitation } from "../../domain/invitation/invitation";
import type { AppDeps } from "../ports";

export type RegisterCompanyInput = {
  companyName: string;
  adminName: string;
  email: string;
  phone?: string | null;
};

export type RegisterCompanyResult = {
  company: Company;
  invitation: Invitation;
  inviteToken: string;
};

export async function registerCompany(
  deps: AppDeps,
  input: RegisterCompanyInput,
): Promise<RegisterCompanyResult> {
  const now = deps.clock.nowIso();
  const company = createPendingCompany({
    id: deps.ids.next("company"),
    name: input.companyName,
    phone: input.phone ?? null,
    createdAt: now,
  });
  const token = deps.tokens.issue();
  const invitation = issueInvitation({
    id: deps.ids.next("invitation"),
    companyId: company.id,
    adminName: input.adminName,
    email: input.email,
    role: "COMPANY_ADMIN",
    tokenHash: token.hash,
    createdAt: now,
  });
  await deps.companies.save(company);
  await deps.invitations.save(invitation);
  return { company, invitation, inviteToken: token.raw };
}

export async function listCompanies(deps: AppDeps): Promise<Company[]> {
  const companies = await deps.companies.list();
  return [...companies].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type CompanyDetails = {
  company: Company;
  members: Array<{ user: User; membership: Membership }>;
  invitations: Invitation[];
};

export async function getCompany(deps: AppDeps, companyId: string): Promise<CompanyDetails> {
  const company = await deps.companies.findById(companyId);
  if (!company) {
    throw new DomainError("COMPANY_NOT_FOUND", "Empresa não encontrada.");
  }
  const memberships = await deps.access.listMembershipsByCompany(companyId);
  const members: CompanyDetails["members"] = [];
  for (const membership of memberships) {
    const user = await deps.access.findUserById(membership.userId);
    if (user) {
      members.push({ user, membership });
    }
  }
  const now = deps.clock.nowIso();
  const invitations = (await deps.invitations.list())
    .filter((invitation) => invitation.companyId === companyId)
    .map((invitation) => invitationStateAt(invitation, now));
  return { company, members, invitations };
}

export async function suspendCompanyAccess(deps: AppDeps, companyId: string): Promise<Company> {
  const company = await deps.companies.findById(companyId);
  if (!company) {
    throw new DomainError("COMPANY_NOT_FOUND", "Empresa não encontrada.");
  }
  const suspended = suspendCompany(company);
  await deps.companies.save(suspended);
  return suspended;
}
