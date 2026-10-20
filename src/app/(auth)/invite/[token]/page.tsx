import { AcceptInvitation } from "@/presentation/features/invitations/AcceptInvitation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInvitation token={token} />;
}
