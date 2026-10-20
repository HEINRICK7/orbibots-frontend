// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CompanyOnboardingSummary } from "../../../application/company-onboarding";
import { CompanyOnboardingApiError } from "../../../infrastructure/http/company-onboarding-api";
import { makePlatform } from "../../../test-support/platform";
import { PlatformProvider } from "../../hooks/platform";
import { DashboardSearchProvider } from "./DashboardSearchContext";
import { SuperAdminDashboard } from "./SuperAdminDashboard";

const company: CompanyOnboardingSummary = {
  id: "company-1",
  name: "Acme Saúde",
  status: "PENDING_ACTIVATION",
  createdAt: "2030-01-01T00:00:00Z",
  activatedAt: null,
  invitations: [{
    id: "invitation-1",
    companyId: "company-1",
    companyName: "Acme Saúde",
    invitedName: "Ana Admin",
    email: "ana@example.com",
    intendedRole: "COMPANY_ADMIN",
    status: "PENDING",
    expiresAt: "2030-01-02T00:00:00Z",
    createdAt: "2030-01-01T00:00:00Z",
    emailDeliveryStatus: "FAILED",
  }],
};

describe("SuperAdminDashboard", () => {
  it("shows invitation email delivery state alongside invitation status", async () => {
    render(
      <PlatformProvider platform={makePlatform({ companies: { list: async () => [company] } })}>
        <DashboardSearchProvider><SuperAdminDashboard /></DashboardSearchProvider>
      </PlatformProvider>,
    );

    expect(await screen.findByText("Falha no envio")).toBeInTheDocument();
    expect(screen.getByText("Aguardando ativação")).toBeInTheDocument();
    expect(screen.queryByText(/token|invite-token/i)).not.toBeInTheDocument();
  });

  it("shows a retry action when the dashboard cannot load companies", async () => {
    const user = userEvent.setup();
    const list = vi.fn()
      .mockRejectedValueOnce(new CompanyOnboardingApiError("NETWORK_ERROR", 0, "Não foi possível conectar à API. Tente novamente."))
      .mockResolvedValueOnce([company]);
    render(
      <PlatformProvider platform={makePlatform({ companies: { list } })}>
        <DashboardSearchProvider><SuperAdminDashboard /></DashboardSearchProvider>
      </PlatformProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API. Tente novamente.");
    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível carregar a lista");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Acme Saúde")).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
