"use client";

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function WorldIdVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const setWorldIdVerified = useAppStore((state) => state.setWorldIdVerified);
  const setUser = useAppStore((state) => state.setUser);

  const handleVerify = async () => {
    setIsVerifying(true);

    // Simulación de verificación (aquí irá la integración real con MiniKit)
    setTimeout(() => {
      const mockUser = {
        id: "user_" + Date.now(),
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        isVerified: true,
        worldId: "world_id_" + Date.now(),
        balanceNuma: 10000,
        balanceWld: 100000,
        membership: {
          tier: "free" as const,
          expiresAt: null,
          dailyRewards: 50,
          maxLeverage: 10,
        },
        locale: "es-MX",
        createdAt: new Date(),
      };

      setUser(mockUser);
      setWorldIdVerified(true);
      setIsVerifying(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD700] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
            <Shield className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-5xl font-bold text-gold-gradient">Numisma</h1>
          <p className="text-gray-400">Plataforma educativa de trading</p>
        </div>

        {/* Card */}
        <div className="card-premium p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#FFD700]">
              🔐 Verificación Exclusiva
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              El acceso a <span className="text-[#FFD700] font-semibold">Numisma</span> es exclusivo para usuarios verificados con{" "}
              <span className="text-white font-semibold">World ID</span>. Esto garantiza que todos los participantes son personas únicas.
            </p>
          </div>

          <div className="bg-[#151515] rounded-xl p-4 space-y-3 border border-[#FFD700]/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-sm text-gray-200">Seguridad garantizada</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-sm text-gray-200">Smart Contracts blindados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-sm text-gray-200">World Chain powered</span>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn-gold w-full h-14 text-base font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verificar con World ID
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 leading-relaxed">
            Al continuar, aceptas los términos de Numisma y la verificación mediante World ID.
          </p>
        </div>
      </div>
    </div>
  );
}
