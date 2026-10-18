"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "../../application/authentication/session";
import type {
  CompanyDetails,
  RegisterCompanyInput,
  RegisterCompanyResult,
} from "../../application/companies/companies";
import type { Company } from "../../domain/company/company";
import type { AcceptedAccess, InvitationPreview, ResentInvitation } from "../../application/invitations/invitations";
import type { Invitation } from "../../domain/invitation/invitation";

export type Platform = {
  status: "not-configured" | "ready";
  companies: {
    register: (input: RegisterCompanyInput) => Promise<RegisterCompanyResult>;
    list: () => Promise<Company[]>;
    get: (companyId: string) => Promise<CompanyDetails>;
    suspend: (companyId: string) => Promise<Company>;
  };
  invitations: {
    list: () => Promise<Invitation[]>;
    preview: (token: string) => Promise<InvitationPreview>;
    accept: (token: string) => Promise<AcceptedAccess>;
    resend: (invitationId: string) => Promise<ResentInvitation>;
    revoke: (invitationId: string) => Promise<Invitation>;
  };
  authentication: {
    signIn: (email: string, password: string) => Promise<Session>;
    openExampleCompany: () => Session;
    enterCompany: (input: {
      userId: string;
      name: string;
      email: string;
      companyId: string;
      companyName: string;
    }) => Session;
    current: () => Session | null;
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
