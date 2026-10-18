import { afterEach, describe, expect, it } from "vitest";
import { registerCompany } from "../../application/companies/companies";
import { MemoryStore } from "./memory-store";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("cadastro de clientes no navegador", () => {
  it("guarda o cliente e recupera na próxima abertura", async () => {
    const box = storage();
    (globalThis as { window?: { localStorage: Storage } }).window = { localStorage: box };
    const first = new MemoryStore();
    let sequence = 0;
    await registerCompany(
      {
        companies: first.companiesView(),
        invitations: first.invitationsView(),
        access: first.accessView(),
        ids: { next: (prefix) => `${prefix}-${++sequence}` },
        clock: { nowIso: () => "2026-10-18T12:00:00.000Z" },
        tokens: {
          issue: () => ({ raw: "token-1", hash: "hash-1" }),
          hash: (raw) => `hash-${raw}`,
        },
      },
      {
        companyName: " Oficina Norte ",
        adminName: "Lia Nunes",
        email: "Lia@Oficina.test",
        phone: "",
      },
    );

    const second = new MemoryStore();
    const companies = await second.companiesView().list();
    const invitations = await second.invitationsView().list();

    expect(companies).toHaveLength(1);
    expect(companies[0]?.name).toBe("Oficina Norte");
    expect(companies[0]?.status).toBe("PENDING_ACTIVATION");
    expect(invitations[0]?.email).toBe("lia@oficina.test");
    expect(invitations[0]?.adminName).toBe("Lia Nunes");
  });
});
