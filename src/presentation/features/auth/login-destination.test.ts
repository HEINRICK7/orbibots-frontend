import { describe, expect, it } from "vitest";
import type { Session } from "../../../application/authentication/session";
import { loginDestination } from "./login-destination";

const companyAdmin: Session = {
  kind: "company-admin",
  userId: "company-user",
  name: "Administradora",
  email: "admin@empresa.com",
  companyId: "de8b5b5b-672f-4b2c-9d63-96aef2302711",
  companyName: "Empresa Um",
  role: "COMPANY_ADMIN",
};

const globalAdmin: Session = {
  kind: "super-admin",
  userId: "global-user",
  name: "Admin Global",
  email: "global@orbibots.com.br",
  accessToken: "signed-token",
  tokenType: "bearer",
  expiresIn: 300,
  expiresAt: 1_700_000_300_000,
  companyAccesses: [],
};

describe("destino após autenticação", () => {
  it("encaminha o administrador global para o painel global", () => {
    expect(loginDestination(globalAdmin)).toBe("/admin");
  });

  it("encaminha o administrador de empresa para a área da empresa", () => {
    expect(loginDestination(companyAdmin)).toBe("/app");
  });

  it("retoma uma rota administrativa permitida", () => {
    expect(loginDestination(globalAdmin, "/admin/companies?status=pending")).toBe(
      "/admin/companies?status=pending",
    );
  });

  it("não deixa o administrador da empresa entrar na área global", () => {
    expect(loginDestination(companyAdmin, "/admin/companies")).toBe("/app");
  });

  it("ignora destinos externos ou que não pertencem à área do papel", () => {
    expect(loginDestination(globalAdmin, "https://evil.invalid/admin")).toBe("/admin");
    expect(loginDestination(globalAdmin, "/app")).toBe("/admin");
  });
});
