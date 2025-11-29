import { useState } from "react";
import { requestPayment } from "@/lib/minikit";
import { useAppStore } from "@/lib/store";

/**
 * Precios de membresías en WLD
 */
const MEMBERSHIP_PRICES = {
  plus: {
    1: "5",   // 1 mes: 5 WLD
    3: "12",  // 3 meses: 12 WLD (20% descuento)
    6: "20",  // 6 meses: 20 WLD (33% descuento)
    12: "30", // 12 meses: 30 WLD (50% descuento)
  },
  vip: {
    1: "15",  // 1 mes: 15 WLD
    3: "36",  // 3 meses: 36 WLD (20% descuento)
    6: "60",  // 6 meses: 60 WLD (33% descuento)
    12: "90", // 12 meses: 90 WLD (50% descuento)
  },
} as const;

/**
 * Dirección que recibe los pagos de membresías
 * En producción, esta debería ser una wallet multisig del protocolo
 */
const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER as `0x${string}` || 
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as `0x${string}`;

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  /**
   * Comprar membresía con MiniKit Pay
   */
  const purchaseMembership = async (
    tier: "plus" | "vip",
    duration: 1 | 3 | 6 | 12
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> => {
    if (!user?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    setIsProcessing(true);
    setError(null);

    try {
      const price = MEMBERSHIP_PRICES[tier][duration];
      const reference = `membership_${tier}_${duration}m_${Date.now()}`;

      // Solicitar pago con MiniKit
      const paymentResult = await requestPayment({
        to: PAYMENT_RECEIVER,
        value: price,
        description: `Membresía ${tier.toUpperCase()} - ${duration} ${duration === 1 ? "mes" : "meses"}`,
        reference,
      });

      if (!paymentResult.success) {
        setError(paymentResult.error || "Pago cancelado");
        return {
          success: false,
          error: paymentResult.error,
        };
      }

      // Verificar el pago en el backend y actualizar membresía
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          transactionId: paymentResult.transactionId,
          amount: price,
          tier,
          duration,
          reference,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.error || "Error al verificar el pago");
        return {
          success: false,
          error: verifyData.error,
        };
      }

      // Actualizar el store local con la nueva membresía
      useAppStore.getState().updateMembership(tier, duration);

      return {
        success: true,
        transactionId: paymentResult.transactionId,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Obtener precio de una membresía
   */
  const getPrice = (tier: "plus" | "vip", duration: 1 | 3 | 6 | 12): string => {
    return MEMBERSHIP_PRICES[tier][duration];
  };

  /**
   * Calcular descuento por compra a largo plazo
   */
  const getDiscount = (duration: 1 | 3 | 6 | 12): number => {
    switch (duration) {
      case 1:
        return 0;
      case 3:
        return 20;
      case 6:
        return 33;
      case 12:
        return 50;
      default:
        return 0;
    }
  };

  return {
    purchaseMembership,
    getPrice,
    getDiscount,
    isProcessing,
    error,
  };
}
