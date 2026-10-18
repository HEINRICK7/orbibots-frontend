import Link from "next/link";

export type AdminSectionName = "accesses" | "publications" | "audit" | "settings";

const content: Record<AdminSectionName, { title: string; description: string; data: string }> = {
  accesses: {
    title: "Acessos",
    description: "Administradores e acesso às empresas da plataforma.",
    data: "A consulta de acessos não está conectada a uma API neste projeto.",
  },
  publications: {
    title: "Publicações",
    description: "Acompanhe as publicações dos especialistas digitais.",
    data: "A consulta de publicações não está conectada a uma API neste projeto.",
  },
  audit: {
    title: "Auditoria",
    description: "Histórico de empresas e convites da plataforma.",
    data: "A consulta de auditoria não está conectada a uma API neste projeto.",
  },
  settings: {
    title: "Configurações",
    description: "Perfil do operador e informações da plataforma.",
    data: "As configurações do operador não estão conectadas a um serviço neste projeto.",
  },
};

export function AdminSection({ section }: { section: AdminSectionName }) {
  const { title, description, data } = content[section];

  return (
    <div className="admin-section">
      <div className="page-head">
        <div><h1>{title}</h1><p className="lede">{description}</p></div>
        <Link className="btn" href="/admin">Voltar ao painel</Link>
      </div>
      <section className="dashboard-empty backend-unavailable" role="status">
        <strong>Dados indisponíveis</strong>
        <p>{data}</p>
      </section>
    </div>
  );
}
