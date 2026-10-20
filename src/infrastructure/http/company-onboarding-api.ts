import type { RegisterCompanyInput } from "../../application/companies/companies";
import type {
  CompanyInvitationSummary,
  CompanyOnboardingSummary,
  InvitationAcceptance,
  InvitationValidation,
  ProvisionCompanyResponse,
  ResendInvitationResponse,
  RevokeInvitationResponse,
} from "../../application/company-onboarding";
import type { CompanyRole } from "../../domain/access/access";
import type { CompanyStatus } from "../../domain/company/company";
import type { InvitationStatus } from "../../domain/invitation/invitation";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CompanyOnboardingErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "ACCESS_DENIED"
  | "INVALID_REQUEST"
  | "INVITATION_UNAVAILABLE"
  | "INVITATION_EXPIRED"
  | "INVITATION_REVOKED"
  | "INVITATION_ALREADY_ACCEPTED"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "API_NOT_CONFIGURED"
  | "INVALID_RESPONSE";

export class CompanyOnboardingApiError extends Error {
  constructor(
    readonly code: CompanyOnboardingErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CompanyOnboardingApiError";
  }
}

const messages: Record<CompanyOnboardingErrorCode, string> = {
  AUTHENTICATION_REQUIRED: "Entre novamente para continuar.",
  ACCESS_DENIED: "Sua conta não tem permissão para esta ação.",
  INVALID_REQUEST: "Confira os dados informados.",
  INVITATION_UNAVAILABLE: "Este convite é inválido ou não está mais disponível.",
  INVITATION_EXPIRED: "O prazo deste convite terminou. Peça um novo envio ao administrador.",
  INVITATION_REVOKED: "Este convite foi revogado. Peça um novo convite ao administrador.",
  INVITATION_ALREADY_ACCEPTED: "Este convite já foi aceito.",
  CONFLICT: "Já existe um cadastro ou convite associado a esses dados.",
  RATE_LIMITED: "Aguarde um pouco antes de solicitar outro envio.",
  NETWORK_ERROR: "Não foi possível conectar à API. Tente novamente.",
  API_NOT_CONFIGURED: "A API não está configurada.",
  INVALID_RESPONSE: "A API retornou uma resposta inesperada.",
};

const companyStatuses = new Set<CompanyStatus>([
  "PENDING_ACTIVATION",
  "ACTIVE",
  "SUSPENDED",
]);
const invitationStatuses = new Set<InvitationStatus>([
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);
const companyRoles = new Set<CompanyRole>(["COMPANY_ADMIN", "AGENT_EDITOR"]);
const deliveryStatuses = new Set(["PENDING", "PROCESSING", "SENT", "FAILED"] as const);

export class CompanyOnboardingApi {
  private readonly origin: string;

  constructor(
    apiUrl: string,
    private readonly fetcher: Fetcher = fetch,
  ) {
    this.origin = apiUrl.trim().replace(/\/+$/, "");
  }

  async listCompanies(accessToken: string): Promise<CompanyOnboardingSummary[]> {
    const value = await this.request("/company-onboarding/companies", {
      accessToken,
    });
    if (!Array.isArray(value)) return this.invalidResponse();
    return value.map(toCompanySummary);
  }

  async provisionCompany(
    accessToken: string,
    input: RegisterCompanyInput,
  ): Promise<ProvisionCompanyResponse> {
    const value = await this.request("/company-onboarding/companies", {
      accessToken,
      method: "POST",
      body: {
        company_name: input.companyName,
        admin_name: input.adminName,
        email: input.email,
        phone: input.phone?.trim() || null,
      },
    });
    const response = record(value);
    const delivery = text(response?.email_delivery_status);
    const status = text(response?.invitation_status);
    if (
      !response ||
      !text(response.company_id) ||
      !text(response.invitation_id) ||
      !isInvitationStatus(status) ||
      !isDeliveryStatus(delivery) ||
      !text(response.expires_at)
    ) {
      return this.invalidResponse();
    }
    return {
      companyId: text(response.company_id),
      invitationId: text(response.invitation_id),
      invitationStatus: status,
      emailDeliveryStatus: delivery,
      expiresAt: text(response.expires_at),
    };
  }

  async validateInvitation(token: string): Promise<InvitationValidation> {
    const value = await this.request("/company-onboarding/public/invitations/validate", {
      method: "POST",
      body: { token },
    });
    const response = record(value);
    const role = text(response?.role);
    const status = text(response?.status);
    if (
      !response ||
      !text(response.company_id) ||
      !text(response.company_name) ||
      !text(response.invited_name) ||
      !text(response.email_masked) ||
      !isCompanyRole(role) ||
      !text(response.expires_at) ||
      !isInvitationStatus(status)
    ) {
      return this.invalidResponse();
    }
    return {
      companyId: text(response.company_id),
      companyName: text(response.company_name),
      invitedName: text(response.invited_name),
      emailMasked: text(response.email_masked),
      role,
      expiresAt: text(response.expires_at),
      status,
    };
  }

  async acceptInvitation(token: string): Promise<InvitationAcceptance> {
    const value = await this.request("/company-onboarding/public/invitations/accept", {
      method: "POST",
      body: { token },
    });
    const response = record(value);
    const expiresIn = response?.expires_in;
    if (
      response?.accepted !== true ||
      !text(response.company_id) ||
      !text(response.company_name) ||
      !text(response.access_token) ||
      !text(response.token_type) ||
      typeof expiresIn !== "number" ||
      !Number.isInteger(expiresIn) ||
      expiresIn < 1
    ) {
      return this.invalidResponse();
    }
    return {
      accepted: true,
      companyId: text(response.company_id),
      companyName: text(response.company_name),
      accessToken: text(response.access_token),
      tokenType: text(response.token_type),
      expiresIn,
    };
  }

  async resendInvitation(accessToken: string, invitationId: string): Promise<ResendInvitationResponse> {
    const value = await this.request(
      `/company-onboarding/invitations/${encodeURIComponent(invitationId)}/resend`,
      { accessToken, method: "POST" },
    );
    const response = record(value);
    const delivery = text(response?.email_delivery_status);
    if (
      !response ||
      !text(response.invitation_id) ||
      !isDeliveryStatus(delivery) ||
      !text(response.expires_at)
    ) {
      return this.invalidResponse();
    }
    return {
      invitationId: text(response.invitation_id),
      emailDeliveryStatus: delivery,
      expiresAt: text(response.expires_at),
    };
  }

  async revokeInvitation(accessToken: string, invitationId: string): Promise<RevokeInvitationResponse> {
    const value = await this.request(
      `/company-onboarding/invitations/${encodeURIComponent(invitationId)}/revoke`,
      { accessToken, method: "POST" },
    );
    const response = record(value);
    if (!response || text(response.status) !== "REVOKED" || !text(response.invitation_id)) {
      return this.invalidResponse();
    }
    return { invitationId: text(response.invitation_id), status: "REVOKED" };
  }

  private async request(
    path: string,
    options: { accessToken?: string; method?: "GET" | "POST"; body?: unknown },
  ): Promise<unknown> {
    if (!this.origin) {
      throw new CompanyOnboardingApiError("API_NOT_CONFIGURED", 0, messages.API_NOT_CONFIGURED);
    }
    if (options.accessToken !== undefined && !options.accessToken.trim()) {
      throw new CompanyOnboardingApiError(
        "AUTHENTICATION_REQUIRED",
        401,
        messages.AUTHENTICATION_REQUIRED,
      );
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    let response: Response;
    try {
      response = await this.fetcher(`${this.origin}${path}`, {
        method: options.method ?? "GET",
        headers,
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
    } catch {
      throw new CompanyOnboardingApiError("NETWORK_ERROR", 0, messages.NETWORK_ERROR);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const error = record(payload);
      const code = knownErrorCode(text(error?.code));
      throw new CompanyOnboardingApiError(code, response.status, messages[code]);
    }
    return payload;
  }

  private invalidResponse(): never {
    throw new CompanyOnboardingApiError("INVALID_RESPONSE", 502, messages.INVALID_RESPONSE);
  }
}

function toCompanySummary(value: unknown): CompanyOnboardingSummary {
  const company = record(value);
  const status = text(company?.status);
  const invitations = company?.invitations;
  if (
    !company ||
    !text(company.id) ||
    !text(company.name) ||
    !isCompanyStatus(status) ||
    !text(company.created_at) ||
    !(company.activated_at === null || typeof company.activated_at === "string") ||
    !Array.isArray(invitations)
  ) {
    throw new CompanyOnboardingApiError("INVALID_RESPONSE", 502, messages.INVALID_RESPONSE);
  }
  return {
    id: text(company.id),
    name: text(company.name),
    status,
    createdAt: text(company.created_at),
    activatedAt: company.activated_at,
    invitations: invitations.map(toInvitationSummary),
  };
}

function toInvitationSummary(value: unknown): CompanyInvitationSummary {
  const invitation = record(value);
  const role = text(invitation?.intended_role);
  const status = text(invitation?.status);
  if (
    !invitation ||
    !text(invitation.id) ||
    !text(invitation.company_id) ||
    !text(invitation.company_name) ||
    !text(invitation.invited_name) ||
    !text(invitation.email) ||
    !isCompanyRole(role) ||
    !isInvitationStatus(status) ||
    !text(invitation.expires_at) ||
    !text(invitation.created_at) ||
    !isNullableDeliveryStatus(invitation.email_delivery_status)
  ) {
    throw new CompanyOnboardingApiError("INVALID_RESPONSE", 502, messages.INVALID_RESPONSE);
  }
  return {
    id: text(invitation.id),
    companyId: text(invitation.company_id),
    companyName: text(invitation.company_name),
    invitedName: text(invitation.invited_name),
    email: text(invitation.email),
    intendedRole: role,
    status,
    expiresAt: text(invitation.expires_at),
    createdAt: text(invitation.created_at),
    emailDeliveryStatus: invitation.email_delivery_status as CompanyInvitationSummary["emailDeliveryStatus"],
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isCompanyStatus(value: string): value is CompanyStatus {
  return companyStatuses.has(value as CompanyStatus);
}

function isInvitationStatus(value: string): value is InvitationStatus {
  return invitationStatuses.has(value as InvitationStatus);
}

function isCompanyRole(value: string): value is CompanyRole {
  return companyRoles.has(value as CompanyRole);
}

function isDeliveryStatus(value: string): value is ProvisionCompanyResponse["emailDeliveryStatus"] {
  return deliveryStatuses.has(value as ProvisionCompanyResponse["emailDeliveryStatus"]);
}

function isNullableDeliveryStatus(value: unknown): value is CompanyInvitationSummary["emailDeliveryStatus"] {
  return value === null || (typeof value === "string" && deliveryStatuses.has(value as Exclude<CompanyInvitationSummary["emailDeliveryStatus"], null>));
}

function knownErrorCode(value: string): CompanyOnboardingErrorCode {
  const supported: CompanyOnboardingErrorCode[] = [
    "AUTHENTICATION_REQUIRED",
    "ACCESS_DENIED",
    "INVALID_REQUEST",
    "INVITATION_UNAVAILABLE",
    "INVITATION_EXPIRED",
    "INVITATION_REVOKED",
    "INVITATION_ALREADY_ACCEPTED",
    "CONFLICT",
    "RATE_LIMITED",
  ];
  return supported.includes(value as CompanyOnboardingErrorCode)
    ? value as CompanyOnboardingErrorCode
    : "INVALID_RESPONSE";
}
