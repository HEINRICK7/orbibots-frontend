import { Suspense } from "react";
import { CompanyHome } from "@/presentation/features/company/CompanyHome";

export default function CompanyPage() {
  return (
    <Suspense fallback={null}>
      <CompanyHome />
    </Suspense>
  );
}
