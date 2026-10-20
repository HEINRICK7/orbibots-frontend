// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanyOnboardingSummary } from "../../../application/company-onboarding";
import { makePlatform } from "../../../test-support/platform";
import { PlatformProvider } from "../../hooks/platform";
import { CompanyDetails } from "./CompanyDetails";

const { route } = vi.hoisted(() => ({ route: { companyId: "company-1" } }));
vi.mock("next/navigation", () => ({ useParams: () => route }));

const company: CompanyOnboardingSummary = {
  id: "company-1",
  name: "Acme Saúde",
  status: "PENDING_ACTIVATION",
  createdAt: "2030-01-01T00:00:00Z",
  activatedAt: null,
  invitations: [],
};

const otherCompany: CompanyOnboardingSummary = {
  ...company,
  id: "company-2",
  name: "Globex",
};

describe("CompanyDetails", () => {
  beforeEach(() => { route.companyId = "company-1"; });

  it("clears the previous company while loading another and explains the invite link", async () => {
    let resolveOther!: (value: CompanyOnboardingSummary) => void;
    const get = vi.fn((id: string) => id === "company-1"
      ? Promise.resolve(company)
      : new Promise<CompanyOnboardingSummary>((resolve) => { resolveOther = resolve; }));
    const platform = makePlatform({ companies: { get } });
    const view = render(<PlatformProvider platform={platform}><CompanyDetails /></PlatformProvider>);

    expect(await screen.findByRole("heading", { name: "Acme Saúde" })).toBeInTheDocument();
    expect(screen.getByText(/link é de uso único e enviado somente ao e-mail/)).toBeInTheDocument();

    route.companyId = "company-2";
    view.rerender(<PlatformProvider platform={platform}><CompanyDetails /></PlatformProvider>);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando a empresa");
    expect(screen.queryByRole("heading", { name: "Acme Saúde" })).not.toBeInTheDocument();
    resolveOther(otherCompany);
    expect(await screen.findByRole("heading", { name: "Globex" })).toBeInTheDocument();
    expect(get).toHaveBeenNthCalledWith(2, "company-2");
  });
});
