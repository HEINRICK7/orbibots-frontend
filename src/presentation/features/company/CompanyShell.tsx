"use client";

import type { ReactNode } from "react";
import { SessionGate } from "../../hooks/session-gate";
import { CompanyLayout } from "./CompanyLayout";

export function CompanyShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate kind="company-admin">
      <CompanyLayout>{children}</CompanyLayout>
    </SessionGate>
  );
}
