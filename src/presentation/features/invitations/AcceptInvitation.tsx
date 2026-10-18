import Link from "next/link";
import { BrandMark } from "../../components/Icon";

export function AcceptInvitation() {
  return (
    <main className="login-screen">
      <section className="login-card card backend-unavailable" role="status">
        <div className="brand"><BrandMark />OrbiBots</div>
        <h1>Convites indisponíveis</h1>
        <p className="lede">Este projeto não está conectado ao serviço que valida convites. Nenhum convite será aceito localmente.</p>
        <Link className="btn" href="/login">Voltar ao login</Link>
      </section>
    </main>
  );
}
