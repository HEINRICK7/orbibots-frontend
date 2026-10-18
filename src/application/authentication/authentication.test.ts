import { afterEach, describe, expect, it, vi } from "vitest";
import { MemorySessionStore } from "../../infrastructure/auth/local-auth";
import {
  AuthenticationFailed,
  currentSession,
  restoreAccount,
  signInWithApi,
  validateLoginInput,
} from "./authentication";

const apiUrl = "https://staging-api.orbibots.otimizanegocio.com";
const userId = "6f1c0c3e-3b1a-4f0e-9c2a-1b6d8a4e5f70";
const issuedAt = 1_700_000_000_000;

function loginBody(overrides: Record<string, unknown> = {}) {
  return {
    access_token: "signed-token",
    token_type: "bearer",
    expires_in: 300,
    ...overrides,
  };
}

function userBody(overrides: Record<string, unknown> = {}) {
  return {
    id: userId,
    name: "Administrador",
    email: "admin@orbibots.com.br",
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("contrato de login do administrador global", () => {
  it("aceita os limites do LoginRequest e remove espaços do e-mail", () => {
    expect(validateLoginInput("  abc  ", "x")).toEqual({ email: "abc", password: "x" });
    expect(validateLoginInput("a".repeat(320), "p".repeat(1024))).toEqual({
      email: "a".repeat(320),
      password: "p".repeat(1024),
    });
  });

  it.each([
    ["ab", "senha"],
    [` ${"a".repeat(321)} `, "senha"],
    ["admin@orbibots.com.br", ""],
    ["admin@orbibots.com.br", "p".repeat(1025)],
  ])("recusa e-mail ou senha fora do contrato (%j)", (email, password) => {
    expect(() => validateLoginInput(email, password)).toThrow(AuthenticationFailed);
  });

  it("grava a sessão de super admin com o bearer e a validade do token", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
          email: "admin@orbibots.com.br",
          password: "senha-do-admin",
        });
        return jsonResponse(200, loginBody());
      }
      expect(url.endsWith("/auth/me")).toBe(true);
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer signed-token");
      return jsonResponse(200, userBody());
    });
    vi.stubGlobal("fetch", fetchMock);
    const sessions = new MemorySessionStore();

    const session = await signInWithApi(
      sessions,
      `${apiUrl}/`,
      "  admin@orbibots.com.br  ",
      "senha-do-admin",
      issuedAt,
    );

    expect(session).toEqual({
      kind: "super-admin",
      userId,
      name: "Administrador",
      email: "admin@orbibots.com.br",
      accessToken: "signed-token",
      tokenType: "bearer",
      expiresIn: 300,
      expiresAt: issuedAt + 300_000,
    });
    expect(session.kind).not.toBe("company-admin");
    expect(sessions.read()).toEqual(session);
  });

  it.each([401, 422])("trata HTTP %s como credencial inválida e não grava sessão", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { detail: "invalid" })));
    const sessions = new MemorySessionStore();

    await expect(signInWithApi(sessions, apiUrl, "admin@orbibots.com.br", "errada")).rejects.toThrow(
      "E-mail ou senha inválidos.",
    );
    expect(sessions.read()).toBeNull();
  });

  it("não chama a API quando o formulário já foge do contrato", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sessions = new MemorySessionStore();

    await expect(signInWithApi(sessions, apiUrl, "ab", "senha")).rejects.toThrow(AuthenticationFailed);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa login sem API, corpo inválido ou usuário que não é o contrato", async () => {
    const sessions = new MemorySessionStore();
    await expect(signInWithApi(sessions, "  ", "admin@orbibots.com.br", "senha")).rejects.toThrow(
      "A API não está configurada.",
    );

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, { access_token: "x" })));
    await expect(signInWithApi(sessions, apiUrl, "admin@orbibots.com.br", "senha")).rejects.toThrow(
      "Não foi possível entrar.",
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/auth/login")) return jsonResponse(200, loginBody());
        return jsonResponse(200, userBody({ id: "nao-e-uuid" }));
      }),
    );
    await expect(signInWithApi(sessions, apiUrl, "admin@orbibots.com.br", "senha")).rejects.toThrow(
      "Não foi possível carregar a conta.",
    );
    expect(sessions.read()).toBeNull();
  });

  it("expira a sessão local e renova o perfil no GET /auth/me", async () => {
    const sessions = new MemorySessionStore();
    sessions.write({
      kind: "super-admin",
      userId,
      name: "Antigo",
      email: "admin@orbibots.com.br",
      accessToken: "signed-token",
      tokenType: "bearer",
      expiresIn: 300,
      expiresAt: issuedAt + 300_000,
    });

    expect(currentSession(sessions, issuedAt + 300_000)).toBeNull();
    expect(sessions.read()).toBeNull();

    sessions.write({
      kind: "super-admin",
      userId,
      name: "Antigo",
      email: "admin@orbibots.com.br",
      accessToken: "signed-token",
      tokenType: "bearer",
      expiresIn: 300,
      expiresAt: issuedAt + 300_000,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, userBody({ name: "Administrador" }))),
    );

    const restored = await restoreAccount(sessions, apiUrl, issuedAt);
    expect(restored?.kind).toBe("super-admin");
    expect(restored && restored.kind === "super-admin" ? restored.name : "").toBe("Administrador");
  });

  it("encerra a sessão quando o bearer deixa de ser aceito", async () => {
    const sessions = new MemorySessionStore();
    sessions.write({
      kind: "super-admin",
      userId,
      name: "Administrador",
      email: "admin@orbibots.com.br",
      accessToken: "signed-token",
      tokenType: "bearer",
      expiresIn: 300,
      expiresAt: issuedAt + 300_000,
    });
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, { detail: "Invalid authentication credentials." })));

    await expect(restoreAccount(sessions, apiUrl, issuedAt)).resolves.toBeNull();
    expect(sessions.read()).toBeNull();
  });

  it("não promove uma sessão de cliente a administrador global", async () => {
    const sessions = new MemorySessionStore();
    const client = {
      kind: "company-admin" as const,
      userId: "user-1",
      name: "Cliente",
      email: "cliente@empresa.com",
      companyId: "company-1",
      companyName: "Empresa",
      role: "COMPANY_ADMIN" as const,
    };
    sessions.write(client);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(restoreAccount(sessions, apiUrl, issuedAt)).resolves.toEqual(client);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(currentSession(sessions, issuedAt)?.kind).toBe("company-admin");
  });
});
