import { notFound } from "next/navigation";
import { AdminSection, type AdminSectionName } from "@/presentation/features/admin/AdminSection";

const sections = ["accesses", "publications", "audit", "settings"] as const;
export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AdminSectionName)) notFound();
  return <AdminSection section={section as AdminSectionName} />;
}
