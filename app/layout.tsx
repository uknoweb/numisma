import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MiniKitProvider } from "@/components/MiniKitProvider";
import { WagmiConfigProvider } from "@/components/WagmiConfigProvider";

export const metadata: Metadata = {
  title: "Numisma - Plataforma Educativa de Trading",
  description: "Aprende trading de futuros con el token NUMA. Verificación World ID, apalancamiento hasta x500, y sistema de Pioneros.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased overflow-x-hidden">
        <WagmiConfigProvider>
          <MiniKitProvider>
            <div className="min-h-screen w-full max-w-full">
              {children}
            </div>
          </MiniKitProvider>
        </WagmiConfigProvider>
      </body>
    </html>
  );
}
