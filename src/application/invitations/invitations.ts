import { createUser, grantMembership } from "../../domain/access/access";
import { activateCompany } from "../../domain/company/company";
import {
  acceptInvitation,
  invitationStateAt,
  issueInvitation,
  revokeInvitation,
  type Invitation,
} from "../../domain/invitation/invitation";
import { DomainError } from "../../domain/shared/domain-error";
import type { AppDeps } from "../ports";

export type InvitationPreview = {
  invitation: Invitation;
  companyName: string;
};

export async function listInvitations(deps: AppDeps): Promise<Invitation[]> {
  const now = deps.clock.nowIso();
  const invitations = await deps.invitations.list();
  return invitations
    .map((invitation) => invitationStateAt(invitation, now))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function previewInvitation(deps: AppDeps, rawToken: string): Promise<InvitationPreview> {
  const invitation = await requireByRawToken(deps, rawToken);
  const company = await deps.companies.findById(invitation.companyId);
  if (!company) {
    throw new DomainError("COMPANY_NOT_FOUND", "A empresa deste convite não existe.");
  }
  return { invitation, companyName: company.name };
}

export type AcceptedAccess = {
  invitation: Invitation;
  companyName: string;
  userName: string;
  email: string;
  userId: string;
  companyId: string;
};

export async function acceptCompanyInvitation(
  deps: AppDeps,
  rawToken: string,
): Promise<AcceptedAccess> {
  const current = await requireByRawToken(deps, rawToken);
  const accepted = acceptInvitation(current, deps.clock.nowIso());
  const company = await deps.companies.findById(accepted.companyId);
  if (!company) {
    throw new DomainError("COMPANY_NOT_FOUND", "A empresa deste convite não existe.");
  }

  const existingUser = await deps.access.findUserByEmail(accepted.email);
  const user =
    existingUser ??
    createUser({
      id: deps.ids.next("user"),
      name: accepted.adminName,
      email: accepted.email,
    });
  const existingMembership = await deps.access.findActiveMembership(user.id, company.id);
  const membership = grantMembership({
    id: deps.ids.next("membership"),
    companyId: company.id,
    userId: user.id,
    role: accepted.role,
    existingActive: existingMembership,
  });
  const activeCompany = activateCompany(company, deps.clock.nowIso());

  if (!existingUser) {
    await deps.access.saveUser(user);
  }
  await deps.access.saveMembership(membership);
  await deps.companies.save(activeCompany);
  await deps.invitations.save(accepted);

  return {
    invitation: accepted,
    companyName: activeCompany.name,
    userName: user.name,
    email: user.email,
    userId: user.id,
    companyId: activeCompany.id,
  };
}

export async function revokeCompanyInvitation(deps: AppDeps, invitationId: string): Promise<Invitation> {
  const invitation = await deps.invitations.findById(invitationId);
  if (!invitation) {
    throw new DomainError("INVITATION_NOT_FOUND", "Convite não encontrado.");
  }
  const revoked = revokeInvitation(invitation, deps.clock.nowIso());
  await deps.invitations.save(revoked);
  return revoked;
}

export type ResentInvitation = {
  invitation: Invitation;
  inviteToken: string;
};

export async function resendCompanyInvitation(
  deps: AppDeps,
  invitationId: string,
): Promise<ResentInvitation> {
  const current = await deps.invitations.findById(invitationId);
  if (!current) {
    throw new DomainError("INVITATION_NOT_FOUND", "Convite não encontrado.");
  }
  const now = deps.clock.nowIso();
  const visible = invitationStateAt(current, now);
  if (visible.status === "ACCEPTED") {
    throw new DomainError("INVITATION_ACCEPTED", "Um convite aceito não pode ser reenviado.");
  }
  if (visible.status === "PENDING") {
    await deps.invitations.save(revokeInvitation(visible, now));
  } else if (visible.status !== current.status) {
    await deps.invitations.save(visible);
  }
  const token = deps.tokens.issue();
  const next = issueInvitation({
    id: deps.ids.next("invitation"),
    companyId: current.companyId,
    adminName: current.adminName,
    email: current.email,
    role: current.role,
    tokenHash: token.hash,
    createdAt: now,
  });
  await deps.invitations.save(next);
  return { invitation: next, inviteToken: token.raw };
}

async function requireByRawToken(deps: AppDeps, rawToken: string): Promise<Invitation> {
  const raw = rawToken.trim();
  if (!raw) {
    throw new DomainError("INVITATION_NOT_FOUND", "Convite não encontrado.");
  }
  const invitation = await deps.invitations.findByTokenHash(deps.tokens.hash(raw));
  if (!invitation) {
    throw new DomainError("INVITATION_NOT_FOUND", "Convite não encontrado.");
  }
  const current = invitationStateAt(invitation, deps.clock.nowIso());
  if (current.status !== invitation.status) {
    await deps.invitations.save(current);
  }
  return current;
}

