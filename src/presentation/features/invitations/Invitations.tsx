import Link from "next/link";
import { Icon } from "../../components/Icon";

export function Invitations() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="crumbs">Operação</p>
          <h1>Convites</h1>
          <p className="lede">Os convites reais ficam disponíveis quando a API estiver conectada a este projeto.</p>
        </div>
      </header>
      <section className="dashboard-empty backend-unavailable" role="status">
        <span className="empty-icon"><Icon name="invitations" size={22} /></span>
        <strong>Consulta de convites indisponível</strong>
        <p>A lista real não está disponível. Não é possível consultar, enviar ou reenviar convites aqui.</p>
        <Link className="btn" href="/admin">Voltar ao painel</Link>
      </section>
    </>
  );
}
