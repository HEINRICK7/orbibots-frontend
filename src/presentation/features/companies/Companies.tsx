import Link from "next/link";
import { Icon } from "../../components/Icon";

export function Companies() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="crumbs">Operação</p>
          <h1>Empresas</h1>
          <p className="lede">Os cadastros aparecem aqui quando este projeto estiver conectado à API.</p>
        </div>
      </header>
      <section className="dashboard-empty backend-unavailable" role="status">
        <span className="empty-icon"><Icon name="companies" size={22} /></span>
        <strong>Lista de empresas indisponível</strong>
        <p>A API de produção não está conectada. Nenhum cadastro fictício será exibido ou salvo.</p>
        <Link className="btn" href="/admin">Voltar ao painel</Link>
      </section>
    </>
  );
}
