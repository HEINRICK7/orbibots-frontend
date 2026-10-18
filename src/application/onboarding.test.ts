import { describe, expect, it } from "vitest";
import { getCompany, registerCompany, suspendCompanyAccess } from "./companies/companies";
import { acceptCompanyInvitation, previewInvitation, resendCompanyInvitation } from "./invitations/invitations";
import type { AppDeps, TokenIssuer } from "./ports";
import { MemoryStore } from "../test-support/memory-store";

function deps(now = "2026-10-18T12:00:00.000Z"): AppDeps & { tokens: TokenIssuer & { raws: string[] } } {
  const store = new MemoryStore();
  let sequence = 0;
  let tokenCount = 0;
  const tokens = {
    raws: [] as string[],
    issue() {
      tokenCount += 1;
      const raw = `token-${tokenCount}`;
      this.raws.push(raw);
      return { raw, hash: `hash-${raw}` };
    },
    hash(raw: string) {
      return `hash-${raw}`;
    },
  };
  return {
    companies: store.companiesView(),
    invitations: store.invitationsView(),
    access: store.accessView(),
    ids: { next: (prefix) => `${prefix}-${++sequence}` },
    clock: { nowIso: () => now },
    tokens,
  };
}

describe("cadastro e convite", () => {
  it("cria a empresa pendente e um convite de administrador sem senha", async () => {
    const gateway = deps();
    const result = await registerCompany(gateway, {
      companyName: "  Doces & Sonhos  ",
      adminName: "Marina Costa",
      email: "Marina@Doces.test",
      phone: "",
    });

    expect(result.company.status).toBe("PENDING_ACTIVATION");
    expect(result.company.name).toBe("Doces & Sonhos");
    expect(result.company.phone).toBeNull();
    expect(result.invitation.role).toBe("COMPANY_ADMIN");
    expect(result.invitation.email).toBe("marina@doces.test");
    expect(result.inviteToken).toBe("token-1");
    expect("password" in result.company).toBe(false);
  });

  it("ativa a empresa uma vez e recusa o mesmo convite depois", async () => {
    const gateway = deps();
    const created = await registerCompany(gateway, {
      companyName: "Clínica Norte",
      adminName: "Paulo Lima",
      email: "paulo@clinica.test",
    });
    const access = await acceptCompanyInvitation(gateway, created.inviteToken);
    const details = await getCompany(gateway, access.companyId);

    expect(details.company.status).toBe("ACTIVE");
    expect(details.members).toHaveLength(1);
    expect(details.members[0]?.membership.role).toBe("COMPANY_ADMIN");
    await expect(acceptCompanyInvitation(gateway, created.inviteToken)).rejects.toThrow(
      "Este convite já foi aceito.",
    );
  });

  it("reenvia sem recriar a empresa e invalida o link anterior", async () => {
    const gateway = deps();
    const created = await registerCompany(gateway, {
      companyName: "Tino",
      adminName: "Lia Nunes",
      email: "lia@tino.test",
    });
    const resent = await resendCompanyInvitation(gateway, created.invitation.id);
    const oldPreview = await previewInvitation(gateway, created.inviteToken);

    expect(resent.invitation.companyId).toBe(created.company.id);
    expect(resent.invitation.id).not.toBe(created.invitation.id);
    expect(oldPreview.invitation.status).toBe("REVOKED");
    await expect(acceptCompanyInvitation(gateway, created.inviteToken)).rejects.toThrow(/revogado/i);
  });

  it("suspende somente empresa ativa", async () => {
    const gateway = deps();
    const created = await registerCompany(gateway, {
      companyName: "Oficina",
      adminName: "Caio Dias",
      email: "caio@oficina.test",
    });
    await expect(suspendCompanyAccess(gateway, created.company.id)).rejects.toThrow(/ativa/i);
  });
});
