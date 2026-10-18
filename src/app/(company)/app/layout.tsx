import { Suspense, type ReactNode } from "react";
import { CompanyShell } from "@/presentation/features/company/CompanyShell";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CompanyShell>{children}</CompanyShell>
    </Suspense>
  );
}
