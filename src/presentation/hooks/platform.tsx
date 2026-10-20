"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "../../application/authentication/session";
import type {
  RegisterCompanyInput,
} from "../../application/companies/companies";
import type {
  CompanyInvitationSummary,
  CompanyOnboardingSummary,
  InvitationValidation,
  ProvisionCompanyResponse,
  ResendInvitationResponse,
  RevokeInvitationResponse,
} from "../../application/company-onboarding";

export type Platform = {
  status: "not-configured" | "ready";
  companies: {
    register: (input: RegisterCompanyInput) => Promise<ProvisionCompanyResponse>;
    list: () => Promise<CompanyOnboardingSummary[]>;
    get: (companyId: string) => Promise<CompanyOnboardingSummary>;
  };
  invitations: {
    list: () => Promise<CompanyInvitationSummary[]>;
    preview: (token: string) => Promise<InvitationValidation>;
    accept: (token: string) => Promise<Session>;
    resend: (invitationId: string) => Promise<ResendInvitationResponse>;
    revoke: (invitationId: string) => Promise<RevokeInvitationResponse>;
  };
  authentication: {
    signIn: (email: string, password: string) => Promise<Session>;
    current: () => Session | null;
    restore: () => Promise<Session | null>;
    signOut: () => void;
  };
};

const PlatformContext = createContext<Platform | null>(null);

export function PlatformProvider({
  platform,
  children,
}: {
  platform: Platform;
  children: ReactNode;
}) {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error("A plataforma não foi iniciada.");
  }
  return platform;
}
