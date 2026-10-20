// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CompanyOnboardingSummary } from "../../../application/company-onboarding";
import { CompanyOnboardingApiError } from "../../../infrastructure/http/company-onboarding-api";
import type { Platform } from "../../hooks/platform";
import { makePlatform } from "../../../test-support/platform";
import { Companies } from "./Companies";
import { PlatformProvider } from "../../hooks/platform";

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
    emailDeliveryStatus: "SENT",
  }],
};

function renderCompanies(platform = makePlatform()) {
  return render(<PlatformProvider platform={platform}><Companies /></PlatformProvider>);
}

describe("Companies", () => {
  it("shows loading and empty states from the API", async () => {
    let resolveList!: (companies: CompanyOnboardingSummary[]) => void;
    const list = vi.fn(() => new Promise<CompanyOnboardingSummary[]>((resolve) => { resolveList = resolve; }));
    renderCompanies(makePlatform({ companies: { list } }));

    expect(screen.getByRole("status")).toHaveTextContent("Carregando empresas");
    resolveList([]);
    expect(await screen.findByText("Nenhuma empresa cadastrada.")).toBeInTheDocument();
  });

  it("registers without an optional phone, clears on success, and reloads canonical statuses", async () => {
    const user = userEvent.setup();
    const list = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([company]);
    const register = vi.fn().mockResolvedValue({
      companyId: company.id,
      invitationId: "invitation-1",
      invitationStatus: "PENDING",
      emailDeliveryStatus: "SENT",
      expiresAt: "2030-01-02T00:00:00Z",
    });
    renderCompanies(makePlatform({ companies: { list, register } }));

    await user.type(screen.getByLabelText("Nome da empresa"), "Acme Saúde");
    await user.type(screen.getByLabelText("Nome do primeiro administrador"), "Ana Admin");
    await user.type(screen.getByLabelText("E-mail do administrador"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));

    expect(await screen.findByText("Empresa cadastrada. O convite foi enviado ao e-mail informado.")).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      companyName: "Acme Saúde",
      adminName: "Ana Admin",
      email: "ana@example.com",
      phone: null,
    });
    expect(await screen.findByRole("link", { name: "Acme Saúde" })).toBeInTheDocument();
    expect(screen.getByText("Aguardando ativação")).toBeInTheDocument();
    expect(screen.getByText("E-mail enviado")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome da empresa")).toHaveValue("");
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("keeps entered fields when the API refuses registration", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue(new CompanyOnboardingApiError(
      "CONFLICT",
      409,
      "Já existe um cadastro ou convite associado a esses dados.",
    ));
    renderCompanies(makePlatform({ companies: { list: async () => [], register } }));

    await user.type(screen.getByLabelText("Nome da empresa"), "Acme Saúde");
    await user.type(screen.getByLabelText("Nome do primeiro administrador"), "Ana Admin");
    await user.type(screen.getByLabelText("E-mail do administrador"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um cadastro ou convite associado a esses dados.");
    expect(screen.getByLabelText("Nome da empresa")).toHaveValue("Acme Saúde");
    expect(screen.getByLabelText("Nome do primeiro administrador")).toHaveValue("Ana Admin");
    expect(screen.getByLabelText("E-mail do administrador")).toHaveValue("ana@example.com");
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("uses browser email validation and blocks duplicate clicks while submitting", async () => {
    const user = userEvent.setup();
    let resolveRegister!: (result: { companyId: string; invitationId: string; invitationStatus: "PENDING"; emailDeliveryStatus: "PENDING"; expiresAt: string }) => void;
    const register = vi.fn<Platform["companies"]["register"]>(() => new Promise((resolve) => { resolveRegister = resolve; }));
    renderCompanies(makePlatform({ companies: { list: async () => [], register } }));

    await user.type(screen.getByLabelText("Nome da empresa"), "Acme Saúde");
    await user.type(screen.getByLabelText("Nome do primeiro administrador"), "Ana Admin");
    const email = screen.getByLabelText("E-mail do administrador");
    await user.type(email, "invalido");
    expect(email).toBeInvalid();
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));
    expect(register).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Cadastrar empresa" }));
    const pendingButton = screen.getByRole("button", { name: "Cadastrando..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(register).toHaveBeenCalledTimes(1);
    resolveRegister({
      companyId: "company-1",
      invitationId: "invitation-1",
      invitationStatus: "PENDING",
      emailDeliveryStatus: "PENDING",
      expiresAt: "2030-01-02T00:00:00Z",
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Cadastrar empresa" })).toBeEnabled());
  });
});
