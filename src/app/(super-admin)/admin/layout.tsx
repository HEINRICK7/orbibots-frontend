"use client";

import type { ReactNode } from "react";
import { SuperAdminLayout } from "@/presentation/features/admin/SuperAdminLayout";
import { SessionGate } from "@/presentation/hooks/session-gate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate kind="super-admin">
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </SessionGate>
  );
}
