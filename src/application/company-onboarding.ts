import type { CompanyRole } from "../domain/access/access";
import type { CompanyStatus } from "../domain/company/company";
import type { InvitationStatus } from "../domain/invitation/invitation";

export type CompanyInvitationSummary = {
  id: string;
  companyId: string;
  companyName: string;
  invitedName: string;
  email: string;
  intendedRole: CompanyRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  emailDeliveryStatus: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | null;
};

export type CompanyOnboardingSummary = {
  id: string;
  name: string;
  status: CompanyStatus;
  createdAt: string;
  activatedAt: string | null;
  invitations: CompanyInvitationSummary[];
};

export type ProvisionCompanyResponse = {
  companyId: string;
  invitationId: string;
  invitationStatus: InvitationStatus;
  emailDeliveryStatus: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  expiresAt: string;
};

export type InvitationValidation = {
  companyId: string;
  companyName: string;
  invitedName: string;
  emailMasked: string;
  role: CompanyRole;
  expiresAt: string;
  status: InvitationStatus;
};

export type InvitationAcceptance = {
  accepted: true;
  companyId: string;
  companyName: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type ResendInvitationResponse = {
  invitationId: string;
  emailDeliveryStatus: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  expiresAt: string;
};

export type RevokeInvitationResponse = {
  invitationId: string;
  status: "REVOKED";
};
