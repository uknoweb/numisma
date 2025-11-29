import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { User as DbUser } from "@/lib/db/schema";

/**
 * Hook para sincronizar el estado local (Zustand) con la base de datos
 * Maneja autenticación, sincronización de datos y persistencia
 */
export function useDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  /**
   * Autenticar y sincronizar usuario con la base de datos
   */
  const loginUser = async (walletAddress: string, worldIdHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          worldIdHash,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al autenticar usuario");
      }

      const data = await response.json();
      setDbUser(data.user);

      // Sincronizar con el store local
      setUser({
        id: data.user.id,
        walletAddress: data.user.walletAddress,
        balanceNuma: data.user.balanceNuma,
        balanceWld: data.user.balanceWld,
        membership: {
          tier: data.user.membershipTier,
          startedAt: data.user.membershipStartedAt
            ? new Date(data.user.membershipStartedAt)
            : new Date(),
          expiresAt: data.user.membershipExpiresAt
            ? new Date(data.user.membershipExpiresAt)
            : null,
          monthsPaid: data.user.membershipMonthsPaid,
          consecutiveMonths: data.user.membershipConsecutiveMonths,
          dailyRewards:
            data.user.membershipTier === "vip"
              ? 500
              : data.user.membershipTier === "plus"
              ? 200
              : 50,
          maxLeverage:
            data.user.membershipTier === "vip"
              ? 500
              : data.user.membershipTier === "plus"
              ? 30
              : 10,
          creditLine: null, // Se calcula según meses consecutivos
          activeLoan: null,
          hasDefaulted: false,
          walletFrozen: false,
        },
      });

      return {
        user: data.user,
        isNewUser: data.isNewUser,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sincronizar balances del usuario con la base de datos
   */
  const syncBalances = async (numa: number, wld: number) => {
    if (!user?.walletAddress) return;

    try {
      const response = await fetch(`/api/user/${user.walletAddress}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          balanceNuma: numa,
          balanceWld: wld,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al sincronizar balances");
      }

      const data = await response.json();
      setDbUser(data.user);
    } catch (err) {
      console.error("Error syncing balances:", err);
      setError(
        err instanceof Error ? err.message : "Error al sincronizar balances"
      );
    }
  };

  /**
   * Sincronizar membresía del usuario con la base de datos
   */
  const syncMembership = async (
    tier: "free" | "plus" | "vip",
    expiresAt: Date | null
  ) => {
    if (!user?.walletAddress) return;

    try {
      const response = await fetch(`/api/user/${user.walletAddress}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipTier: tier,
          membershipExpiresAt: expiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al sincronizar membresía");
      }

      const data = await response.json();
      setDbUser(data.user);
    } catch (err) {
      console.error("Error syncing membership:", err);
      setError(
        err instanceof Error ? err.message : "Error al sincronizar membresía"
      );
    }
  };

  /**
   * Obtener posiciones del usuario desde la base de datos
   */
  const fetchPositions = async (userId: string, status?: "open" | "closed") => {
    try {
      const url = status
        ? `/api/positions/${userId}?status=${status}`
        : `/api/positions/${userId}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener posiciones");
      }

      const data = await response.json();
      return data.positions;
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(
        err instanceof Error ? err.message : "Error al obtener posiciones"
      );
      return [];
    }
  };

  /**
   * Crear nueva posición en la base de datos
   */
  const createPosition = async (
    userId: string,
    position: {
      symbol: "NUMA/WLD" | "WLD/USDT";
      side: "long" | "short";
      amount: number;
      leverage: number;
      entryPrice: number;
      liquidationPrice: number;
      currentPrice: number;
    }
  ) => {
    try {
      const response = await fetch(`/api/positions/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(position),
      });

      if (!response.ok) {
        throw new Error("Error al crear posición");
      }

      const data = await response.json();
      return data.position;
    } catch (err) {
      console.error("Error creating position:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear posición"
      );
      throw err;
    }
  };

  /**
   * Registrar transacción en la base de datos
   */
  const createTransaction = async (
    userId: string,
    transaction: {
      type: string;
      description: string;
      amount: number;
      token: "NUMA" | "WLD";
      balanceAfterNuma: number;
      balanceAfterWld: number;
      metadata?: any;
    }
  ) => {
    try {
      const response = await fetch(`/api/transactions/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error("Error al crear transacción");
      }

      const data = await response.json();
      return data.transaction;
    } catch (err) {
      console.error("Error creating transaction:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear transacción"
      );
      throw err;
    }
  };

  return {
    isLoading,
    error,
    dbUser,
    loginUser,
    syncBalances,
    syncMembership,
    fetchPositions,
    createPosition,
    createTransaction,
  };
}
