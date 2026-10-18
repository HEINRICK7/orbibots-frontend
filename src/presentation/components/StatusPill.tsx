import { statusLabel } from "../copy";

const tone: Record<string, string> = {
  ACTIVE: "ok",
  ACCEPTED: "ok",
  PENDING: "wait",
  PENDING_ACTIVATION: "wait",
  SUSPENDED: "stop",
  EXPIRED: "stop",
  REVOKED: "stop",
};

export function StatusPill({ value }: { value: string }) {
  return <span className={`pill ${tone[value] ?? "neutral"}`}>{statusLabel[value] ?? value}</span>;
}
