import { describe, expect, it, vi } from "vitest";
import { CompanyOnboardingApi } from "./company-onboarding-api";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CompanyOnboardingApi", () => {
  it("reads canonical company and invitation statuses with the admin bearer token", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse([
      {
        id: "company-1",
        name: "Acme",
        status: "PENDING_ACTIVATION",
        created_at: "2026-10-19T12:00:00Z",
        activated_at: null,
        invitations: [{
          id: "invitation-1",
          company_id: "company-1",
          company_name: "Acme",
          invited_name: "Ana Silva",
          email: "ana@example.com",
          intended_role: "COMPANY_ADMIN",
          status: "PENDING",
          expires_at: "2026-10-20T12:00:00Z",
          created_at: "2026-10-19T12:00:00Z",
          email_delivery_status: "PENDING",
        }],
      },
    ]));
    const api = new CompanyOnboardingApi("https://api.example/", fetcher);

    const result = await api.listCompanies("admin-jwt");

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example/company-onboarding/companies",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer admin-jwt" }),
      }),
    );
    expect(result[0]?.invitations[0]).toMatchObject({
      companyId: "company-1",
      intendedRole: "COMPANY_ADMIN",
      status: "PENDING",
    });
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("provisions a company from the API response without exposing an invitation token", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({
      company_id: "company-2",
      invitation_id: "invitation-2",
      invitation_status: "PENDING",
      email_delivery_status: "SENT",
      expires_at: "2026-10-20T12:00:00Z",
    }, 201));
    const api = new CompanyOnboardingApi("https://api.example", fetcher);

    const result = await api.provisionCompany("admin-jwt", {
      companyName: " Acme ",
      adminName: " Ana Silva ",
      email: " ANA@example.com ",
      phone: "",
    });

    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      company_name: " Acme ",
      admin_name: " Ana Silva ",
      email: " ANA@example.com ",
      phone: null,
    });
    expect(result).toMatchObject({
      companyId: "company-2",
      invitationId: "invitation-2",
      invitationStatus: "PENDING",
      emailDeliveryStatus: "SENT",
    });
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("sends the invitation secret only in the validation body, never the request URL", async () => {
    const secret = "one-time-code-from-path";
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({
      company_id: "company-1",
      company_name: "Acme",
      invited_name: "Ana Silva",
      email_masked: "a***@example.com",
      role: "COMPANY_ADMIN",
      expires_at: "2026-10-20T12:00:00Z",
      status: "PENDING",
    }));
    const api = new CompanyOnboardingApi("https://api.example", fetcher);

    await api.validateInvitation(secret);

    expect(fetcher.mock.calls[0]?.[0]).not.toContain(secret);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ token: secret });
  });

  it("preserves safe API error codes for invitation state screens", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({
      code: "INVITATION_EXPIRED",
      detail: "The invitation has expired.",
    }, 410));
    const api = new CompanyOnboardingApi("https://api.example", fetcher);

    await expect(api.validateInvitation("expired-code")).rejects.toMatchObject({
      code: "INVITATION_EXPIRED",
      status: 410,
    });
  });
});
