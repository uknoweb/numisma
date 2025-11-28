"use client";

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        balanceNuma: 1000,
        balanceWld: 10,
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800]">
      <Card className="w-full max-w-md border-[--color-gold]/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[--color-gold] to-[--color-gold-dark] flex items-center justify-center">
            <Shield className="w-10 h-10 text-[--color-black]" />
          </div>
          <CardTitle className="text-3xl">Numisma</CardTitle>
          <CardDescription className="text-base">
            Plataforma educativa de trading con token NUMA
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[--color-gold]">
              Verificación Exclusiva
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              El acceso a Áurea es exclusivo para usuarios verificados con{" "}
              <span className="text-[--color-gold] font-semibold">World ID</span>{" "}
              a través de MiniKit. Esto garantiza que todos los participantes
              son personas únicas verificadas por el Orb.
            </p>
          </div>

          <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[--color-success]" />
              <span className="text-gray-300">Seguridad garantizada</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[--color-success]" />
              <span className="text-gray-300">Smart Contracts blindados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[--color-success]" />
              <span className="text-gray-300">World Chain</span>
            </div>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full h-12 text-base font-semibold"
            size="lg"
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
          </Button>

          <p className="text-xs text-center text-gray-500">
            Al continuar, aceptas los términos y condiciones de Numisma y la
            verificación mediante World ID.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
