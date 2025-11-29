import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  Position,
  Pioneer,
  Loan,
  MembershipTier,
  STAKING_REWARDS,
  LEVERAGE_CONFIG,
} from "./types";

interface AppState {
  // Usuario
  user: User | null;
  setUser: (user: User | null) => void;
  updateBalance: (numa: number, wld: number) => void;
  // Membresía
  updateMembership: (tier: MembershipTier, duration: number) => void;
  
  // Verificación World ID
  isWorldIdVerified: boolean;
  setWorldIdVerified: (verified: boolean) => void;
  
  // Posiciones de trading
  positions: Position[];
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string) => void;
  
  // Pioneros
  pioneers: Pioneer[];
  setPioneers: (pioneers: Pioneer[]) => void;
  currentUserPioneer: Pioneer | null;
  setCurrentUserPioneer: (pioneer: Pioneer | null) => void;
  
  // Préstamos
  loans: Loan[];
  addLoan: (loan: Loan) => void;
  repayLoan: (loanId: string) => void;
  
  // UI State
  currentView: "verify" | "dashboard" | "trading" | "staking" | "creditos";
  setCurrentView: (
    view: "verify" | "dashboard" | "trading" | "staking" | "creditos"
  ) => void;
  
  // Último reclamo de recompensa
  lastClaim: Date | null;
  setLastClaim: (date: Date) => void;
  canClaim: () => boolean;
  
  // Precio actual del mercado (simulado)
  marketPrice: number;
  setMarketPrice: (price: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isWorldIdVerified: false,
      positions: [],
      pioneers: [],
      currentUserPioneer: null,
      loans: [],
      currentView: "verify",
      lastClaim: null,
      marketPrice: 50000, // Precio inicial BTC simulado
      
      // Acciones de usuario
      setUser: (user) => set({ user }),
      
      updateBalance: (numa: number, wld: number) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, balanceNuma: numa, balanceWld: wld }
            : null,
        })),
      
      updateMembership: (tier: MembershipTier, duration: number) =>
        set((state) => {
          if (!state.user) return state;
          
          const now = new Date();
          const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
          
          const dailyRewards = tier === "plus" ? 200 : tier === "vip" ? 500 : 50;
          const maxLeverage = tier === "plus" ? 30 : tier === "vip" ? 500 : 10;
          
          return {
            user: {
              ...state.user,
              membership: {
                tier,
                expiresAt,
                dailyRewards,
                maxLeverage,
              },
            },
          };
        }),
      
      setWorldIdVerified: (verified) =>
        set({ isWorldIdVerified: verified, currentView: verified ? "dashboard" : "verify" }),
      
      // Acciones de posiciones
      addPosition: (position) =>
        set((state) => {
          if (!state.user) return state;
          
          const collateral = position.amount / position.leverage;
          const feeRate = position.symbol === "WLD/USDT" ? 0.001 : 0.01;
          const openingFee = position.amount * feeRate;
          
          let newBalanceNuma = state.user.balanceNuma;
          let newBalanceWld = state.user.balanceWld;
          
          if (position.symbol === "NUMA/WLD") {
            // NUMA/WLD: Opera con NUMA, descontar NUMA + comisión en NUMA
            newBalanceNuma = state.user.balanceNuma - position.amount - openingFee;
          } else {
            // WLD/USDT: Opera con WLD, descontar colateral + comisión en WLD
            const totalDeduction = collateral + openingFee;
            newBalanceWld = state.user.balanceWld - totalDeduction;
          }
          
          return {
            positions: [...state.positions, position],
            user: { ...state.user, balanceNuma: newBalanceNuma, balanceWld: newBalanceWld },
          };
        }),
      
      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      
      closePosition: (id) =>
        set((state) => {
          const position = state.positions.find((p) => p.id === id);
          if (!position || !state.user) return state;
          
          const feeRate = position.symbol === "WLD/USDT" ? 0.001 : 0.01;
          const closingFee = position.amount * feeRate;
          const collateral = position.amount / position.leverage;
          
          let newBalanceNuma = state.user.balanceNuma;
          let newBalanceWld = state.user.balanceWld;
          
          if (position.symbol === "NUMA/WLD") {
            // NUMA/WLD: Devolver NUMA - comisión de cierre, PnL se suma en WLD
            newBalanceNuma = state.user.balanceNuma + position.amount - closingFee;
            // El PnL en NUMA/WLD se calcula en WLD (precio NUMA en WLD)
            newBalanceWld = state.user.balanceWld + position.pnl;
          } else {
            // WLD/USDT: Devolver colateral + PnL - comisión, todo en WLD
            const finalBalance = collateral + position.pnl - closingFee;
            newBalanceWld = state.user.balanceWld + finalBalance;
          }
          
          return {
            positions: state.positions.map((p) =>
              p.id === id
                ? { ...p, status: "closed" as const, closedAt: new Date() }
                : p
            ),
            user: { ...state.user, balanceNuma: newBalanceNuma, balanceWld: newBalanceWld },
          };
        }),
      
      // Acciones de pioneros
      setPioneers: (pioneers) => set({ pioneers }),
      setCurrentUserPioneer: (pioneer) => set({ currentUserPioneer: pioneer }),
      
      // Acciones de préstamos
      addLoan: (loan) => set((state) => ({ loans: [...state.loans, loan] })),
      
      repayLoan: (loanId) =>
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === loanId ? { ...l, status: "repaid" as const } : l
          ),
        })),
      
      // Navegación
      setCurrentView: (view) => set({ currentView: view }),
      
      // Reclamo de recompensas
      setLastClaim: (date) => set({ lastClaim: date }),
      
      canClaim: () => {
        const state = get();
        if (!state.lastClaim) return true;
        
        const now = new Date();
        const lastClaim = new Date(state.lastClaim);
        const hoursSinceLastClaim =
          (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        
        return hoursSinceLastClaim >= 24;
      },
      
      // Precio de mercado
      setMarketPrice: (price) => set({ marketPrice: price }),
    }),
    {
      name: "numisma-storage",
      partialize: (state) => ({
        user: state.user,
        isWorldIdVerified: state.isWorldIdVerified,
        positions: state.positions,
        lastClaim: state.lastClaim,
      }),
    }
  )
);

// Helper para obtener recompensa diaria actual del usuario
export function getCurrentDailyReward(
  tier: MembershipTier,
  membershipStartDate: Date
): number {
  const now = new Date();
  const monthsSinceMembership =
    (now.getTime() - membershipStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  const isAfterThreeMonths = monthsSinceMembership >= 3;
  
  const rewards = STAKING_REWARDS[tier];
  return isAfterThreeMonths ? rewards.afterThreeMonths : rewards.initial;
}

// Helper para obtener apalancamiento máximo
export function getMaxLeverage(tier: MembershipTier): number {
  return LEVERAGE_CONFIG[tier].max;
}
