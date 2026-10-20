// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CompanyInvitationSummary } from "../../../application/company-onboarding";
import { makePlatform } from "../../../test-support/platform";
import { PlatformProvider } from "../../hooks/platform";
import { InvitationActions } from "./InvitationActions";

const invitation: CompanyInvitationSummary = {
  id: "invitation-1",
  companyId: "company-1",
  companyName: "Acme Saúde",
  invitedName: "Ana Admin",
  email: "ana@example.com",
  intendedRole: "COMPANY_ADMIN",
  status: "PENDING",
  expiresAt: "2030-01-02T00:00:00Z",
  createdAt: "2030-01-01T00:00:00Z",
  emailDeliveryStatus: "PENDING",
};

describe("InvitationActions", () => {
  it("asks confirmation and resends the existing invitation", async () => {
    const user = userEvent.setup();
    const resend = vi.fn().mockResolvedValue({
      invitationId: "invitation-1",
      emailDeliveryStatus: "SENT",
      expiresAt: "2030-01-03T00:00:00Z",
    });
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<PlatformProvider platform={makePlatform({ invitations: { resend } })}>
      <InvitationActions invitation={invitation} onChanged={onChanged} />
    </PlatformProvider>);

    await user.click(screen.getByRole("button", { name: "Reenviar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("ana@example.com");
    expect(screen.getByRole("dialog")).toHaveTextContent("O link não será exibido nesta tela.");
    await user.click(screen.getByRole("button", { name: "Confirmar reenvio" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Novo convite enviado por e-mail.");
    expect(resend).toHaveBeenCalledWith("invitation-1");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("does not revoke when confirmation is canceled and revokes the same invitation when confirmed", async () => {
    const user = userEvent.setup();
    const revoke = vi.fn().mockResolvedValue({ invitationId: "invitation-1", status: "REVOKED" as const });
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<PlatformProvider platform={makePlatform({ invitations: { revoke } })}>
      <InvitationActions invitation={invitation} onChanged={onChanged} />
    </PlatformProvider>);

    await user.click(screen.getByRole("button", { name: "Revogar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(revoke).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Revogar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar revogação" }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("invitation-1"));
    expect(await screen.findByRole("status")).toHaveTextContent("Convite revogado. A empresa permanece cadastrada.");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("hides resend and revoke for an accepted invitation", () => {
    render(<PlatformProvider platform={makePlatform()}>
      <InvitationActions invitation={{ ...invitation, status: "ACCEPTED" }} onChanged={async () => undefined} />
    </PlatformProvider>);

    expect(screen.queryByRole("button", { name: "Reenviar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revogar" })).not.toBeInTheDocument();
  });

  it("allows resending an expired invitation without creating another invitation", async () => {
    const user = userEvent.setup();
    const resend = vi.fn().mockResolvedValue({
      invitationId: "invitation-1",
      emailDeliveryStatus: "PENDING",
      expiresAt: "2030-01-03T00:00:00Z",
    });
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<PlatformProvider platform={makePlatform({ invitations: { resend } })}>
      <InvitationActions invitation={{ ...invitation, status: "EXPIRED" }} onChanged={onChanged} />
    </PlatformProvider>);

    await user.click(screen.getByRole("button", { name: "Reenviar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar reenvio" }));

    expect(await screen.findByRole("status")).toHaveTextContent("O convite foi recriado e aguarda o envio do e-mail.");
    expect(resend).toHaveBeenCalledTimes(1);
    expect(resend).toHaveBeenCalledWith("invitation-1");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});
