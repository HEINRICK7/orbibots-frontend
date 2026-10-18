import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  void children;
  redirect("/login");
}
