import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Numisma - Plataforma Educativa de Trading",
  description: "Aprende trading de futuros con el token NUMA. Verificación World ID, apalancamiento hasta x500, y sistema de Pioneros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
