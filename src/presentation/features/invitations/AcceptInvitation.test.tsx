// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "../../../application/authentication/session";
import type { InvitationValidation } from "../../../application/company-onboarding";
import { CompanyOnboardingApiError } from "../../../infrastructure/http/company-onboarding-api";
import { makePlatform } from "../../../test-support/platform";
import { PlatformProvider } from "../../hooks/platform";
import { AcceptInvitation } from "./AcceptInvitation";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const token = "invite-token-do-not-display";
const invitation: InvitationValidation = {
  companyId: "company-1",
  companyName: "Acme Saúde",
  invitedName: "Ana Admin",
  emailMasked: "a***@example.com",
  role: "COMPANY_ADMIN",
  expiresAt: "2030-01-02T00:00:00Z",
  status: "PENDING",
};
const acceptedSession: Session = {
  kind: "company-admin",
  userId: "user-1",
  name: "Ana Admin",
  email: "ana@example.com",
  companyId: "company-1",
  companyName: "Acme Saúde",
  role: "COMPANY_ADMIN",
};
const superAdminSession: Session = {
  kind: "super-admin",
  userId: "admin-1",
  name: "Admin",
  email: "root@example.com",
  accessToken: "bearer",
  tokenType: "Bearer",
  expiresIn: 3600,
  expiresAt: Date.now() + 3600000,
  companyAccesses: [],
};

function renderInvitation(platform = makePlatform()) {
  return render(<PlatformProvider platform={platform}><AcceptInvitation token={token} /></PlatformProvider>);
}

describe("AcceptInvitation", () => {
  beforeEach(() => {
    replace.mockReset();
    window.history.replaceState({}, "", "/invite/invite-token-do-not-display");
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("shows the masked valid invitation and accepts once without displaying or storing the token", async () => {
    const user = userEvent.setup();
    let finishAccept!: (session: Session) => void;
    const accept = vi.fn(() => new Promise<Session>((resolve) => { finishAccept = resolve; }));
    const preview = vi.fn().mockResolvedValue(invitation);
    renderInvitation(makePlatform({
      invitations: { preview, accept },
      authentication: { restore: async () => null },
    }));

    expect(await screen.findByText("Acme Saúde")).toBeInTheDocument();
    expect(screen.getByText("a***@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin da Empresa")).toBeInTheDocument();
    expect(screen.queryByText(token)).not.toBeInTheDocument();
    expect(preview).toHaveBeenCalledWith(token);
    await user.click(screen.getByRole("button", { name: "Confirmar acesso" }));
    const pendingButton = screen.getByRole("button", { name: "Ativando acesso..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(accept).toHaveBeenCalledTimes(1);
    expect(accept).toHaveBeenCalledWith(token);
    finishAccept(acceptedSession);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(window.location.pathname).toBe("/invite");
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it.each([
    ["INVITATION_UNAVAILABLE", "Link inválido"],
    ["INVITATION_EXPIRED", "Convite expirado"],
    ["INVITATION_REVOKED", "Convite revogado"],
  ] as const)("presents the safe %s state", async (code, title) => {
    const status = code === "INVITATION_EXPIRED" ? 410 : code === "INVITATION_REVOKED" ? 409 : 404;
    const preview = vi.fn().mockRejectedValue(new CompanyOnboardingApiError(code, status, "safe"));
    renderInvitation(makePlatform({ invitations: { preview } }));

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByText(token)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar acesso" })).not.toBeInTheDocument();
  });

  it("routes an already accepted invitation to its matching company session", async () => {
    const preview = vi.fn().mockResolvedValue({ ...invitation, status: "ACCEPTED" });
    renderInvitation(makePlatform({
      invitations: { preview },
      authentication: { restore: async () => acceptedSession },
    }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(window.location.pathname).toBe("/invite");
  });

  it("requires explicit confirmation before replacing another role's session", async () => {
    const user = userEvent.setup();
    const accept = vi.fn().mockResolvedValue(acceptedSession);
    renderInvitation(makePlatform({
      invitations: { preview: async () => invitation, accept },
      authentication: { restore: async () => superAdminSession },
    }));

    expect(await screen.findByText(/Aceitar trocará a sessão atual/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Aceitar e trocar sessão" });
    expect(button).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Confirmo que quero trocar de conta." }));
    expect(button).toBeEnabled();
    await user.click(button);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(accept).toHaveBeenCalledTimes(1);
  });

  it("does not ask for confirmation when the current company session matches the invitation", async () => {
    const user = userEvent.setup();
    const accept = vi.fn().mockResolvedValue(acceptedSession);
    renderInvitation(makePlatform({
      invitations: { preview: async () => invitation, accept },
      authentication: { restore: async () => acceptedSession },
    }));

    const button = await screen.findByRole("button", { name: "Confirmar acesso" });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(button).toBeEnabled();
    await user.click(button);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(accept).toHaveBeenCalledTimes(1);
  });

  it("sends an already accepted invitation to login when the current session does not match", async () => {
    renderInvitation(makePlatform({
      invitations: { preview: async () => ({ ...invitation, status: "ACCEPTED" }) },
      authentication: { restore: async () => superAdminSession },
    }));

    expect(await screen.findByRole("heading", { name: "Convite já aceito" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute("href", "/login");
    expect(replace).not.toHaveBeenCalled();
  });
});
