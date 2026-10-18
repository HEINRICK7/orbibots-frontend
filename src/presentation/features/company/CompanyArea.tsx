"use client";

import { product } from "../../copy";

const areas: Record<string, { title: string; text: string }> = {
  inicio: {
    title: "Início",
    text: "O espaço da empresa reúne especialistas, conhecimento e publicação. O primeiro passo é criar um especialista.",
  },
  conhecimento: {
    title: "Conhecimento",
    text: "Documentos e URLs entram no especialista. Ainda não há uma base separada neste espaço.",
  },
  ferramentas: {
    title: "Ferramentas",
    text: "Nenhuma integração está habilitada. Uma ferramenta só aparece como conectada quando existir de fato.",
  },
  equipe: {
    title: "Equipe",
    text: "O administrador pode convidar colaboradores depois. O editor organiza e testa; não publica.",
  },
  canais: {
    title: "Canais",
    text: "O canal de conversa com o cliente final ainda não foi escolhido. O convite inicial é por link.",
  },
  metricas: {
    title: "Métricas",
    text: "Uso, qualidade e satisfação serão medidos depois dos primeiros testes com clientes.",
  },
  configuracoes: {
    title: "Configurações",
    text: "O espaço mostra somente os dados desta empresa. Planos e cobrança ficam fora desta entrega.",
  },
};

export function CompanyArea({ area }: { area: string }) {
  const content = areas[area] ?? areas.inicio;
  return (
    <>
      <p className="crumbs">{product.name}</p>
      <h1>{content.title}</h1>
      <p className="lede">{content.text}</p>
    </>
  );
}
