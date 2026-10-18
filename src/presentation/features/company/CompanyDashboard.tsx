import { Icon } from "../../components/Icon";

export function CompanyDashboard() {
  return (
    <section className="dashboard-empty backend-unavailable" role="status">
      <span className="empty-icon"><Icon name="document" size={22} /></span>
      <strong>Especialistas indisponíveis</strong>
      <p>A API de especialistas não está conectada neste projeto. Nenhum conteúdo fictício foi carregado ou salvo.</p>
      <button className="btn primary" type="button" disabled>
        Criar especialista
      </button>
    </section>
  );
}
