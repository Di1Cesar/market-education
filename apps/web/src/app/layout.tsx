import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercadinho da Turma",
  description: "Minimercado pedagógico para aprender dinheiro, troco e organização.",
};

export const viewport: Viewport = {
  themeColor: "#F5F2EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
