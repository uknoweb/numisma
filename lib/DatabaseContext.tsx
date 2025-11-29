"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { useDatabase } from "@/hooks/useDatabase";

interface DatabaseContextType {
  isLoading: boolean;
  error: string | null;
  syncBalances: (numa: number, wld: number) => Promise<void>;
  syncPosition: (position: any) => Promise<void>;
  syncTransaction: (transaction: any) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

/**
 * Provider que sincroniza automáticamente el estado de Zustand con la base de datos
 * Envuelve la aplicación y escucha cambios en balances, posiciones y transacciones
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const transactions = useAppStore((state) => state.transactions);
  
  const {
    isLoading,
    error,
    syncBalances,
    createPosition,
    createTransaction,
  } = useDatabase();

  /**
   * Sincronizar balances cuando cambien
   */
  useEffect(() => {
    if (!user) return;

    const syncUserBalances = async () => {
      await syncBalances(user.balanceNuma, user.balanceWld);
    };

    // Debounce para evitar demasiadas llamadas
    const timer = setTimeout(syncUserBalances, 1000);
    return () => clearTimeout(timer);
  }, [user?.balanceNuma, user?.balanceWld]);

  /**
   * Wrapper para sincronizar nueva posición
   */
  const syncPosition = async (position: any) => {
    if (!user?.id) return;

    try {
      await createPosition(user.id, {
        symbol: position.symbol,
        side: position.side,
        amount: position.amount,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        liquidationPrice: position.liquidationPrice,
        currentPrice: position.currentPrice,
      });
    } catch (err) {
      console.error("Error syncing position:", err);
    }
  };

  /**
   * Wrapper para sincronizar nueva transacción
   */
  const syncTransaction = async (transaction: any) => {
    if (!user?.id) return;

    try {
      await createTransaction(user.id, {
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        token: transaction.token,
        balanceAfterNuma: user.balanceNuma,
        balanceAfterWld: user.balanceWld,
        metadata: transaction.metadata,
      });
    } catch (err) {
      console.error("Error syncing transaction:", err);
    }
  };

  const value: DatabaseContextType = {
    isLoading,
    error,
    syncBalances,
    syncPosition,
    syncTransaction,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de base de datos
 */
export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabaseContext must be used within a DatabaseProvider");
  }
  return context;
}
