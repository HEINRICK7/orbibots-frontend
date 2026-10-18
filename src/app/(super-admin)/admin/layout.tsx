"use client";

import type { ReactNode } from "react";
import { SuperAdminLayout } from "@/presentation/features/admin/SuperAdminLayout";
import { SessionGate } from "@/presentation/hooks/session-gate";
import { usePlatform } from "@/presentation/hooks/platform";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const platform = usePlatform();
  const dashboard = <SuperAdminLayout>{children}</SuperAdminLayout>;

  // An unconfigured project exposes only its empty interface, without creating a session.
  // A connected platform continues to require an authenticated administrator.
  if (platform.status === "not-configured") return dashboard;

  return (
    <SessionGate kind="super-admin">
      {dashboard}
    </SessionGate>
  );
}
