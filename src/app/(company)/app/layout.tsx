import type { ReactNode } from "react";
import { CompanyShell } from "@/presentation/features/company/CompanyShell";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return <CompanyShell>{children}</CompanyShell>;
}
