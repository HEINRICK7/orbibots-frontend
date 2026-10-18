import { DomainError } from "../shared/domain-error";

export const companyRoles = ["COMPANY_ADMIN", "AGENT_EDITOR"] as const;

export type CompanyRole = (typeof companyRoles)[number];

export type UserStatus = "ACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
};

export type MembershipStatus = "ACTIVE";

export type Membership = {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  status: MembershipStatus;
  scopes: string[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertPerson(name: string, email: string): { name: string; email: string } {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  if (!trimmedName) {
    throw new DomainError("ADMIN_NAME_REQUIRED", "Informe o nome do primeiro administrador.");
  }
  if (!emailPattern.test(normalizedEmail)) {
    throw new DomainError("ADMIN_EMAIL_INVALID", "Informe um e-mail válido para o convite.");
  }
  return { name: trimmedName, email: normalizedEmail };
}

export function createUser(input: { id: string; name: string; email: string }): User {
  const person = assertPerson(input.name, input.email);
  return { id: input.id, name: person.name, email: person.email, status: "ACTIVE" };
}

export function grantMembership(input: {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  existingActive: Membership | null;
}): Membership {
  if (
    input.existingActive &&
    input.existingActive.companyId === input.companyId &&
    input.existingActive.userId === input.userId &&
    input.existingActive.status === "ACTIVE"
  ) {
    throw new DomainError(
      "MEMBERSHIP_ALREADY_ACTIVE",
      "Esta pessoa já possui um acesso ativo nesta empresa.",
    );
  }
  return {
    id: input.id,
    companyId: input.companyId,
    userId: input.userId,
    role: input.role,
    status: "ACTIVE",
    scopes: [`company:${input.companyId}`],
  };
}
