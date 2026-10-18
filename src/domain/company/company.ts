import { DomainError } from "../shared/domain-error";

export const companyStatuses = ["PENDING_ACTIVATION", "ACTIVE", "SUSPENDED"] as const;

export type CompanyStatus = (typeof companyStatuses)[number];

export type Company = {
  id: string;
  name: string;
  phone: string | null;
  status: CompanyStatus;
  createdAt: string;
  activatedAt: string | null;
};

export type NewCompanyInput = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
};

const phonePattern = /^[0-9+()\-\s]{8,20}$/;

export function createPendingCompany(input: NewCompanyInput): Company {
  const name = input.name.trim();
  if (!name) {
    throw new DomainError("COMPANY_NAME_REQUIRED", "Informe o nome da empresa.");
  }
  const phone = input.phone?.trim() ? input.phone.trim() : null;
  if (phone && !phonePattern.test(phone)) {
    throw new DomainError("COMPANY_PHONE_INVALID", "O telefone informado não é válido.");
  }
  return {
    id: input.id,
    name,
    phone,
    status: "PENDING_ACTIVATION",
    createdAt: input.createdAt,
    activatedAt: null,
  };
}

export function activateCompany(company: Company, activatedAt: string): Company {
  if (company.status === "SUSPENDED") {
    throw new DomainError(
      "COMPANY_SUSPENDED",
      "Uma empresa suspensa não é ativada pelo aceite de convite.",
    );
  }
  if (company.status === "ACTIVE") {
    return company;
  }
  return { ...company, status: "ACTIVE", activatedAt };
}

export function suspendCompany(company: Company): Company {
  if (company.status !== "ACTIVE") {
    throw new DomainError(
      "COMPANY_NOT_ACTIVE",
      "Somente uma empresa ativa pode ser suspensa.",
    );
  }
  return { ...company, status: "SUSPENDED" };
}
