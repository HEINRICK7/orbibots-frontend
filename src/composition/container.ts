import {
  currentSession,
  establishCompanyAdminSession,
  restoreAccount,
  signInWithApi,
  signOut,
} from "../application/authentication/authentication";
import { BrowserSessionStore } from "../infrastructure/auth/local-auth";
import {
  CompanyOnboardingApi,
  CompanyOnboardingApiError,
} from "../infrastructure/http/company-onboarding-api";
import type { Platform } from "../presentation/hooks/platform";

export function createPlatform(apiUrl: string): Platform {
  const sessions = new BrowserSessionStore();
  const api = new CompanyOnboardingApi(apiUrl);
  const adminToken = () => {
    const session = currentSession(sessions);
    if (session?.kind !== "super-admin") {
      throw new CompanyOnboardingApiError(
        "ACCESS_DENIED",
        403,
        "Sua conta não tem permissão para esta ação.",
      );
    }
    return session.accessToken;
  };

  return {
    status: apiUrl.trim() ? "ready" : "not-configured",
    companies: {
      register: (input) => api.provisionCompany(adminToken(), input),
      list: () => api.listCompanies(adminToken()),
      get: async (companyId) => {
        const company = (await api.listCompanies(adminToken())).find(
          (item) => item.id === companyId,
        );
        if (!company) throw new Error("Empresa não encontrada.");
        return company;
      },
    },
    invitations: {
      list: async () =>
        (await api.listCompanies(adminToken())).flatMap((company) => company.invitations),
      preview: (token) => api.validateInvitation(token),
      accept: async (token) => {
        const accepted = await api.acceptInvitation(token);
        return establishCompanyAdminSession(
          sessions,
          apiUrl,
          {
            access_token: accepted.accessToken,
            token_type: accepted.tokenType,
            expires_in: accepted.expiresIn,
          },
          accepted.companyId,
        );
      },
      resend: (invitationId) => api.resendInvitation(adminToken(), invitationId),
      revoke: (invitationId) => api.revokeInvitation(adminToken(), invitationId),
    },
    authentication: {
      signIn: (email, password) => signInWithApi(sessions, apiUrl, email, password),
      current: () => currentSession(sessions),
      restore: () => restoreAccount(sessions, apiUrl),
      signOut: () => signOut(sessions),
    },
  };
}
