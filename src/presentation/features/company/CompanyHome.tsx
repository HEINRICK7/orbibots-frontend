"use client";

import { useSearchParams } from "next/navigation";
import { CompanyArea } from "./CompanyArea";
import { CompanyDashboard } from "./CompanyDashboard";

export function CompanyHome() {
  const section = useSearchParams().get("secao");
  if (section && section !== "especialistas") {
    return <CompanyArea area={section} />;
  }
  return <CompanyDashboard />;
}
