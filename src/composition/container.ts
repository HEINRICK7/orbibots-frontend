import {
  currentSession,
  signInCompanyAdmin,
  signInWithApi,
  signOut,
} from "../application/authentication/authentication";
import { getCompany, listCompanies, registerCompany, suspendCompanyAccess } from "../application/companies/companies";
import {
  acceptCompanyInvitation,
  listInvitations,
  previewInvitation,
  resendCompanyInvitation,
  revokeCompanyInvitation,
} from "../application/invitations/invitations";
import type { AppDeps } from "../application/ports";
import { BrowserSessionStore, createSystemTools } from "../infrastructure/auth/local-auth";
import { exampleAdmin, exampleCompanyId, exampleUserId } from "../application/examples";
import { MemoryStore } from "../infrastructure/http/memory-store";
import type { Platform } from "../presentation/hooks/platform";

export function createPlatform(apiUrl: string): Platform {
  const store = new MemoryStore();
  const sessions = new BrowserSessionStore();
  const tools = createSystemTools();
  const deps: AppDeps = {
    companies: store.companiesView(),
    invitations: store.invitationsView(),
    access: store.accessView(),
    ...tools,
  };

  return {
    status: apiUrl ? "ready" : "not-configured",
    companies: {
      register: (input) => registerCompany(deps, input),
      list: () => listCompanies(deps),
      get: (companyId) => getCompany(deps, companyId),
      suspend: (companyId) => suspendCompanyAccess(deps, companyId),
    },
    invitations: {
      list: () => listInvitations(deps),
      preview: (token) => previewInvitation(deps, token),
      accept: (token) => acceptCompanyInvitation(deps, token),
      resend: (invitationId) => resendCompanyInvitation(deps, invitationId),
      revoke: (invitationId) => revokeCompanyInvitation(deps, invitationId),
    },
    authentication: {
      signIn: (email, password) => signInWithApi(sessions, apiUrl, email, password),
      openExampleCompany: () =>
        signInCompanyAdmin(sessions, {
          userId: exampleUserId,
          name: exampleAdmin.name,
          email: exampleAdmin.email,
          companyId: exampleCompanyId,
          companyName: exampleAdmin.companyName,
        }),
      enterCompany: (input) => signInCompanyAdmin(sessions, input),
      current: () => currentSession(sessions),
      signOut: () => signOut(sessions),
    },
  };
}
