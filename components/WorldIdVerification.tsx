"use client";

/**
 * WorldID Verification Component
 * Diseño: Fondo negro, logo central, título neón dorado
 */

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

  // TEMPORAL: Botón de debug para limpiar cache
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('numisma-storage');
      window.location.reload();
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Obtener wallet address real de MiniKit
      const { MiniKit } = await import('@worldcoin/minikit-js');
      
      // Intentar obtener wallet de MiniKit (puede estar disponible o no según la versión)
      let walletAddress = MiniKit.walletAddress;
      
      // Si no está disponible, intentar obtenerlo del contexto de World App
      if (!walletAddress && typeof window !== 'undefined') {
        // @ts-ignore - Acceder a la API nativa de World App si está disponible
        walletAddress = window.worldApp?.walletAddress;
      }
      
      // Si aún no tenemos wallet, usar una temporal para desarrollo
      if (!walletAddress) {
        console.warn("⚠️ No se pudo obtener wallet address de MiniKit, generando temporal");
        walletAddress = `0x${Date.now().toString(16).padStart(40, '0')}`;
      }
      
      console.log("🔐 Wallet Address:", walletAddress);
      
      // Intentar verificación real con World ID
      const result = await verifyWithWorldID();
      
      let worldIdHash: string;
      
      if (result.success && result.nullifier_hash) {
        // Verificación exitosa con World ID real
        worldIdHash = result.nullifier_hash;
        console.log("✅ World ID verification successful:", worldIdHash);
      } else {
        // Modo simulación para desarrollo
        worldIdHash = "world_id_simulated_" + Date.now();
        console.warn("⚠️ World ID verification not available, using simulation mode");
      }

      // Autenticar con la base de datos (usa balances reales de blockchain)
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
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-black">
      <div className="flex-1" />
      
      {/* Logo y Título Central */}
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="w-32 h-32 relative">
          <img 
            src="/numisma.png" 
            alt="Numisma Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Título con efecto neón dorado */}
        <h1 
          className="text-6xl font-bold tracking-wider"
          style={{
            color: '#FFD700',
            textShadow: `
              0 0 10px rgba(255, 215, 0, 0.8),
              0 0 20px rgba(255, 215, 0, 0.6),
              0 0 30px rgba(255, 215, 0, 0.4),
              0 0 40px rgba(255, 215, 0, 0.2)
            `
          }}
        >
          NUMISMA
        </h1>
      </div>
      
      <div className="flex-1" />
      
      {/* Botón en la parte inferior */}
      <div className="w-full max-w-md space-y-4 pb-8">
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

        {/* TEMPORAL: Botón de debug para limpiar cache */}
        <button
          onClick={clearCache}
          className="w-full h-10 text-xs bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors font-medium"
        >
          🗑️ Limpiar Cache (Debug)
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
