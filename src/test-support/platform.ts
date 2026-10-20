import type { Platform } from "../presentation/hooks/platform";

type PlatformOverrides = Omit<Partial<Platform>, "companies" | "invitations" | "authentication"> & {
  companies?: Partial<Platform["companies"]>;
  invitations?: Partial<Platform["invitations"]>;
  authentication?: Partial<Platform["authentication"]>;
};

export function makePlatform(overrides: PlatformOverrides = {}): Platform {
  const defaults: Platform = {
    status: "ready",
    companies: {
      register: async () => ({
        companyId: "company-1",
        invitationId: "invitation-1",
        invitationStatus: "PENDING",
        emailDeliveryStatus: "PENDING",
        expiresAt: "2030-01-02T00:00:00Z",
      }),
      list: async () => [],
      get: async () => {
        throw new Error("Empresa não encontrada.");
      },
    },
    invitations: {
      list: async () => [],
      preview: async () => {
        throw new Error("Convite não configurado no teste.");
      },
      accept: async () => {
        throw new Error("Convite não configurado no teste.");
      },
      resend: async () => ({
        invitationId: "invitation-1",
        emailDeliveryStatus: "PENDING",
        expiresAt: "2030-01-02T00:00:00Z",
      }),
      revoke: async () => ({ invitationId: "invitation-1", status: "REVOKED" }),
    },
    authentication: {
      signIn: async () => {
        throw new Error("Login não configurado no teste.");
      },
      current: () => null,
      restore: async () => null,
      signOut: () => undefined,
    },
  };

  return {
    ...defaults,
    ...overrides,
    companies: { ...defaults.companies, ...overrides.companies },
    invitations: { ...defaults.invitations, ...overrides.invitations },
    authentication: { ...defaults.authentication, ...overrides.authentication },
  };
}
