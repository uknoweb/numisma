"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { validateReferralCode, REFERRAL_REWARDS } from "@/lib/referrals";

export function useReferrals() {
  const user = useAppStore((state) => state.user);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Aplica código de referido al registro
   */
  const applyReferralCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    const validation = validateReferralCode(code);
    if (!validation.valid || !validation.userId) {
      return { success: false, message: 'Código de referido inválido' };
    }

    if (validation.userId === user.id) {
      return { success: false, message: 'No puedes usar tu propio código' };
    }

    setIsProcessing(true);

    try {
      // TODO: Llamar a API para aplicar referido
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          referrerId: validation.userId,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Error al aplicar código' };
      }

      // Actualizar balance del usuario
      // TODO: Actualizar store con nuevo balance

      return { 
        success: true, 
        message: `¡Genial! Recibiste ${REFERRAL_REWARDS.forReferred.numa} NUMA y ${REFERRAL_REWARDS.forReferred.xp} XP` 
      };

    } catch (error) {
      console.error('Error applying referral code:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Obtiene lista de referidos del usuario
   */
  const getReferrals = async (): Promise<{
    count: number;
    referrals: Array<{
      userId: number;
      walletAddress: string;
      createdAt: Date;
      rewardClaimed: boolean;
    }>;
  }> => {
    if (!user) {
      return { count: 0, referrals: [] };
    }

    try {
      // TODO: Llamar a API para obtener referidos
      const response = await fetch(`/api/referrals/list?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      return data;

    } catch (error) {
      console.error('Error fetching referrals:', error);
      return { count: 0, referrals: [] };
    }
  };

  return {
    applyReferralCode,
    getReferrals,
    isProcessing,
  };
}
