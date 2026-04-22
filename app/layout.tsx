import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arranca — Crea tu empresa en Venezuela",
  description: "La forma más sencilla de constituir y operar una empresa en Venezuela. Guía paso a paso, documentos legales, y todo lo que necesitas para emprender.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
