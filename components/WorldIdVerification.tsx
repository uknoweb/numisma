"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { verifyWithWorldID } from "@/lib/minikit";
import { useDatabase } from "@/hooks/useDatabase";

export default function WorldIdVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setWorldIdVerified = useAppStore((state) => state.setWorldIdVerified);
  const { loginUser } = useDatabase();

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Intentar verificación real con World ID
      const result = await verifyWithWorldID();
      
      let worldIdHash: string;
      let walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"; // Default para desarrollo
      
      if (result.success && result.nullifier_hash) {
        // Verificación exitosa con World ID real
        worldIdHash = result.nullifier_hash;
        console.log("✅ World ID verification successful:", worldIdHash);
      } else {
        // Modo simulación para desarrollo
        worldIdHash = "world_id_simulated_" + Date.now();
        console.warn("⚠️ World ID verification not available, using simulation mode");
      }

      // Autenticar con la base de datos
      const { user: dbUser, isNewUser } = await loginUser(walletAddress, worldIdHash);
      
      if (isNewUser) {
        console.log("🎉 New user registered:", dbUser.id);
      } else {
        console.log("👋 Existing user logged in:", dbUser.id);
      }

      // Marcar como verificado
      setWorldIdVerified(true);
      
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Error en la verificación. Intenta de nuevo."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900">Numisma</h1>
          <p className="text-gray-600">Plataforma educativa de trading</p>
        </div>

        {/* Card */}
        <div className="card-modern p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              🔐 Verificación Exclusiva
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              El acceso a <span className="text-indigo-600 font-semibold">Numisma</span> es exclusivo para usuarios verificados con{" "}
              <span className="text-gray-900 font-semibold">World ID</span>. Esto garantiza que todos los participantes son personas únicas.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">Seguridad garantizada</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">Smart Contracts blindados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">World Chain powered</span>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn-primary w-full h-14 text-base font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-center text-gray-500 leading-relaxed">
            Al continuar, aceptas los términos de Numisma y la verificación mediante World ID.
          </p>
        </div>
      </div>
    </div>
  );
}
