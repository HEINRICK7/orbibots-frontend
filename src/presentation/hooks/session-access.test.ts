import { describe, expect, it } from "vitest";
import type { CompanyAccess, Session } from "../../application/authentication/session";
import { canEnterArea } from "./session-access";

const companyAccess: CompanyAccess = {
  companyId: "de8b5b5b-672f-4b2c-9d63-96aef2302711",
  companyName: "Empresa Um",
  role: "COMPANY_ADMIN",
  scope: "COMPANY",
};

function companyAdmin(): Session {
  return {
    kind: "company-admin",
    userId: "user-1",
    name: "Administradora",
    email: "admin@empresa.com",
    companyId: companyAccess.companyId,
    companyName: companyAccess.companyName,
    role: "COMPANY_ADMIN",
  };
}

function globalAdmin(companyAccesses: CompanyAccess[] = []): Session {
  return {
    kind: "super-admin",
    userId: "user-2",
    name: "Admin Global",
    email: "global@orbibots.com.br",
    accessToken: "token",
    tokenType: "bearer",
    expiresIn: 300,
    expiresAt: 1_700_000_300_000,
    companyAccesses,
  };
}

describe("acesso às áreas da aplicação", () => {
  it("limita o administrador de empresa à área da empresa", () => {
    expect(canEnterArea(companyAdmin(), "company-admin")).toBe(true);
    expect(canEnterArea(companyAdmin(), "super-admin")).toBe(false);
  });

  it("permite ao administrador global entrar na área global", () => {
    expect(canEnterArea(globalAdmin(), "super-admin")).toBe(true);
    expect(canEnterArea(globalAdmin(), "company-admin")).toBe(false);
  });

  it("mantém o administrador global fora da área da empresa mesmo que tenha vínculo", () => {
    expect(canEnterArea(globalAdmin([companyAccess]), "company-admin")).toBe(false);
  });

  it("não escolhe uma empresa implicitamente quando há múltiplos vínculos", () => {
    const secondAccess = {
      ...companyAccess,
      companyId: "c1b45913-192f-4426-aec1-77f9be1190fc",
      companyName: "Empresa Dois",
    };

    expect(canEnterArea(globalAdmin([companyAccess, secondAccess]), "company-admin")).toBe(false);
  });

  it("nega áreas quando não há sessão", () => {
    expect(canEnterArea(null, "super-admin")).toBe(false);
    expect(canEnterArea(null, "company-admin")).toBe(false);
  });
});
