import { assertPerson, type CompanyRole } from "../access/access";
import { DomainError } from "../shared/domain-error";

export const invitationStatuses = ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"] as const;

export type InvitationStatus = (typeof invitationStatuses)[number];

export type Invitation = {
  id: string;
  companyId: string;
  email: string;
  adminName: string;
  role: CompanyRole;
  tokenHash: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
};

const dayMs = 24 * 60 * 60 * 1000;

export function issueInvitation(input: {
  id: string;
  companyId: string;
  adminName: string;
  email: string;
  role: CompanyRole;
  tokenHash: string;
  createdAt: string;
  validForDays?: number;
}): Invitation {
  const person = assertPerson(input.adminName, input.email);
  const created = new Date(input.createdAt);
  if (Number.isNaN(created.getTime())) {
    throw new DomainError("INVITATION_CLOCK_INVALID", "A data do convite é inválida.");
  }
  const days = input.validForDays ?? 7;
  return {
    id: input.id,
    companyId: input.companyId,
    email: person.email,
    adminName: person.name,
    role: input.role,
    tokenHash: input.tokenHash,
    status: "PENDING",
    createdAt: input.createdAt,
    expiresAt: new Date(created.getTime() + days * dayMs).toISOString(),
  };
}

export function invitationStateAt(invitation: Invitation, nowIso: string): Invitation {
  if (invitation.status !== "PENDING") {
    return invitation;
  }
  if (new Date(nowIso).getTime() > new Date(invitation.expiresAt).getTime()) {
    return { ...invitation, status: "EXPIRED" };
  }
  return invitation;
}

export function acceptInvitation(invitation: Invitation, nowIso: string): Invitation {
  const current = invitationStateAt(invitation, nowIso);
  if (current.status === "EXPIRED") {
    throw new DomainError("INVITATION_EXPIRED", "Este convite expirou e não pode ser reutilizado.");
  }
  if (current.status === "ACCEPTED") {
    throw new DomainError("INVITATION_ACCEPTED", "Este convite já foi aceito.");
  }
  if (current.status === "REVOKED") {
    throw new DomainError("INVITATION_REVOKED", "Este convite foi revogado.");
  }
  return { ...current, status: "ACCEPTED" };
}

export function revokeInvitation(invitation: Invitation, nowIso: string): Invitation {
  const current = invitationStateAt(invitation, nowIso);
  if (current.status !== "PENDING") {
    throw new DomainError(
      "INVITATION_NOT_PENDING",
      "Somente um convite pendente pode ser revogado.",
    );
  }
  return { ...current, status: "REVOKED" };
}
