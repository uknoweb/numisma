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
    <div 
      className="min-h-screen flex flex-col items-center justify-between p-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 20%, rgba(255, 215, 0, 0.15) 0%, rgba(75, 75, 75, 1) 40%, rgba(50, 50, 50, 1) 100%)'
      }}
    >
      {/* Logo y Título en la parte superior */}
      <div className="flex flex-col items-center space-y-8 mt-16 animate-fade-in">
        {/* Logo más grande */}
        <div className="w-48 h-48 relative">
          <img 
            src="/numisma.png" 
            alt="Numisma Logo" 
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* Título con efecto neón dorado */}
        <h1 
          className="text-7xl font-bold tracking-wider"
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
      
      {/* Botón en la parte inferior con color contrastante */}
      <div className="w-full max-w-md space-y-4 pb-12">
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full h-16 text-lg font-bold flex items-center justify-center gap-3 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#1a1a1a',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)'
          }}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Shield className="w-6 h-6" />
              Verificar con World ID
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
