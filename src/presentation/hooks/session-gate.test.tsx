// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "../../application/authentication/session";
import { makePlatform } from "../../test-support/platform";
import { PlatformProvider } from "./platform";
import { SessionGate } from "./session-gate";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/companies",
  useRouter: () => ({ replace }),
}));

const superAdmin: Session = {
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
const companyAdmin: Session = {
  kind: "company-admin",
  userId: "user-1",
  name: "Ana Admin",
  email: "ana@example.com",
  companyId: "company-1",
  companyName: "Acme Saúde",
  role: "COMPANY_ADMIN",
};

describe("SessionGate", () => {
  beforeEach(() => replace.mockReset());

  it("redirects a missing session to login with the requested route and hides protected content", async () => {
    render(<PlatformProvider platform={makePlatform({ authentication: { restore: async () => null } })}>
      <SessionGate kind="super-admin"><p>Conteúdo privado</p></SessionGate>
    </PlatformProvider>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?returnTo=%2Fadmin%2Fcompanies"));
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });

  it("keeps the admin area hidden and routes a company admin to its own app", async () => {
    render(<PlatformProvider platform={makePlatform({ authentication: { restore: async () => companyAdmin } })}>
      <SessionGate kind="super-admin"><p>Conteúdo privado</p></SessionGate>
    </PlatformProvider>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });

  it("shows protected content only after a matching role is restored", async () => {
    render(<PlatformProvider platform={makePlatform({ authentication: { restore: async () => superAdmin } })}>
      <SessionGate kind="super-admin"><p>Conteúdo privado</p></SessionGate>
    </PlatformProvider>);

    expect(await screen.findByText("Conteúdo privado")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps the company area hidden from a super admin and routes to the admin home", async () => {
    render(<PlatformProvider platform={makePlatform({ authentication: { restore: async () => superAdmin } })}>
      <SessionGate kind="company-admin"><p>Área da empresa</p></SessionGate>
    </PlatformProvider>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
    expect(screen.queryByText("Área da empresa")).not.toBeInTheDocument();
  });

  it("shows the company area only to the company admin session", async () => {
    render(<PlatformProvider platform={makePlatform({ authentication: { restore: async () => companyAdmin } })}>
      <SessionGate kind="company-admin"><p>Área da empresa</p></SessionGate>
    </PlatformProvider>);

    expect(await screen.findByText("Área da empresa")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
