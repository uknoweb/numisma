"use client";

import { useAppStore } from "@/lib/store";
import WorldIdVerification from "@/components/WorldIdVerification";
import Dashboard from "@/components/Dashboard";
import Plataforma from "@/components/Plataforma";
import Staking from "@/components/Staking";

export default function Home() {
  const currentView = useAppStore((state) => state.currentView);
  const isWorldIdVerified = useAppStore((state) => state.isWorldIdVerified);

  // Si no está verificado, mostrar pantalla de verificación
  if (!isWorldIdVerified || currentView === "verify") {
    return <WorldIdVerification />;
  }

  // Renderizar vista según el estado
  switch (currentView) {
    case "dashboard":
      return <Dashboard />;
    case "plataforma":
      return <Plataforma />;
    case "staking":
      return <Staking />;
    case "creditos":
      return (
        <div className="min-h-screen bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800] flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-[--color-gold]">
              Módulo de Créditos
            </h1>
            <p className="text-gray-400">
              Próximamente: Sistema de préstamos para Pioneros
            </p>
          </div>
        </div>
      );
    default:
      return <Dashboard />;
  }
}
