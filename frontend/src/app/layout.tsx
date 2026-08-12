import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "inejomaTable — Iniciar sesión",
  description: "Clon self-hosted de Airtable",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
