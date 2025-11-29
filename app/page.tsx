"use client";

import { useAppStore } from "@/lib/store";
import WorldIdVerification from "@/components/WorldIdVerification";
import Dashboard from "@/components/Dashboard";
import Staking from "@/components/Staking";
import Trading from "@/components/Trading";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Lock, Trophy, ArrowLeft } from "lucide-react";

export default function Home() {
  const currentView = useAppStore((state) => state.currentView);
  const isWorldIdVerified = useAppStore((state) => state.isWorldIdVerified);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  // Si no está verificado, mostrar pantalla de verificación
  if (!isWorldIdVerified || currentView === "verify") {
    return <WorldIdVerification />;
  }

  // Renderizar vista según el estado
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "trading":
        return (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="card-modern p-8 max-w-md w-full text-center space-y-4">
                  <div className="text-6xl">📊</div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Error en Trading
                  </h2>
                  <p className="text-sm text-gray-600">
                    No se pudo cargar el módulo de trading. Por favor, intenta nuevamente.
                  </p>
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className="btn-primary w-full"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            }
          >
            <Trading />
          </ErrorBoundary>
        );
      case "staking":
        return <Staking />;
      case "creditos":
        // Verificar si tiene acceso a créditos
        const isPioneerTop100 = currentUserPioneer && currentUserPioneer.rank <= 100;
        
        if (!isPioneerTop100) {
          return (
            <div className="min-h-screen bg-black pb-20 p-6">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="flex items-center gap-2 text-gray-500 mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
                
                <div className="card-premium p-8 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-gray-600" />
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      🔒 Créditos Bloqueados
                    </h1>
                    <p className="text-gray-400">
                      Acceso exclusivo para Pioneros Top 100
                    </p>
                  </div>
                  
                  <div className="bg-[#0a0a0a] rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-[#FFD700] flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Requisitos para Acceder
                    </h3>
                    
                    <div className="space-y-3 text-left text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#FFD700] text-xs">1</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Únete a Pioneros</div>
                          <div className="text-gray-500">Bloquea capital en WLD por 1 año</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#FFD700] text-xs">2</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Alcanza el Top 100</div>
                          <div className="text-gray-500">
                            {currentUserPioneer 
                              ? `Tu ranking actual: #${currentUserPioneer.rank} - Necesitas más capital`
                              : 'Debes estar entre los 100 con mayor capital bloqueado'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#FFD700] text-xs">3</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Desbloquea Créditos</div>
                          <div className="text-gray-500">Préstamos hasta el 50% de tu capital</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setCurrentView("staking")}
                    className="btn-gold w-full h-12 text-sm font-semibold"
                  >
                    Ver Sistema de Pioneros
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        // Si es top 100, mostrar módulo de créditos (por implementar)
        return (
          <div className="min-h-screen bg-black pb-20 p-6">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="flex items-center gap-2 text-gray-500 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              
              <div className="card-premium p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-[#FFD700]" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-[#FFD700] mb-2">
                    🏆 Pionero Elite #{currentUserPioneer.rank}
                  </h1>
                  <p className="text-gray-400">
                    Sistema de Créditos Garantizados
                  </p>
                </div>
                
                <div className="bg-[#0a0a0a] rounded-xl p-6">
                  <p className="text-sm text-white">
                    📋 Módulo de Créditos en desarrollo
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Próximamente: Préstamos hasta el 50% de tu capital bloqueado
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return renderView();
}
