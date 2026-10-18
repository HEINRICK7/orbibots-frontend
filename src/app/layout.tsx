import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/presentation/styles/orbibots.css";
import "@/presentation/styles/reference.css";
import "@/presentation/styles/login-motion.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "OrbiBots",
  description: "Cadastro de empresas e painel do especialista.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const apiUrl = process.env["API_URL"] ?? "";
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers apiUrl={apiUrl}>{children}</Providers>
      </body>
    </html>
  );
}
