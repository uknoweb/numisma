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
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%)'
      }}
    >
      {/* Efectos de fondo futuristas */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Contenido centrado */}
      <div className="flex flex-col items-center space-y-16 relative z-10">
        {/* Logo y Título */}
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          {/* Logo */}
          <div className="w-28 h-28 relative">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)'
              }}
            />
            <img 
              src="/numisma.png" 
              alt="Numisma Logo" 
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          
          {/* Título futurista */}
          <h1 
            className="text-4xl font-bold tracking-[0.25em]"
            style={{
              color: '#E0E7FF',
              textShadow: `
                0 0 20px rgba(99, 102, 241, 0.8),
                0 0 40px rgba(99, 102, 241, 0.4),
                0 0 60px rgba(99, 102, 241, 0.2)
              `
            }}
          >
            NUMISMA
          </h1>
          
          {/* Línea decorativa */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/50" />
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
          </div>
        </div>
        
        {/* Botón */}
        <div className="w-full max-w-sm space-y-3 px-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="group relative w-full py-4 px-6 text-base font-semibold flex items-center justify-center gap-2.5 rounded-full overflow-hidden transition-all duration-300 disabled:opacity-50 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.5), 0 0 48px rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}
          >
            {/* Efecto de brillo al hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Borde interno brillante */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)'
              }}
            />
            
            <div className="relative z-10 flex items-center gap-2.5 text-white">
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="tracking-wide">Verificando...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span className="tracking-wide">Verificar con World ID</span>
                </>
              )}
            </div>
          </button>

          {error && (
            <div 
              className="rounded-2xl p-3 text-center backdrop-blur-sm border"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
