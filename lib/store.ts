import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  Position,
  Pioneer,
  Loan,
  Transaction,
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
  
  // Transacciones
  transactions: Transaction[];
  addTransaction: (type: Transaction["type"], description: string, amount: number, token: "NUMA" | "WLD") => void;
  
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
      transactions: [],
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
      
      addTransaction: (type, description, amount, token) =>
        set((state) => {
          if (!state.user) return state;
          
          const newTransaction: Transaction = {
            id: `tx_${Date.now()}`,
            userId: state.user.id,
            type,
            description,
            amount,
            token,
            balanceAfter: {
              numa: state.user.balanceNuma,
              wld: state.user.balanceWld,
            },
            timestamp: new Date(),
          };
          
          return {
            transactions: [newTransaction, ...state.transactions],
          };
        }),
      
      updateMembership: (tier: MembershipTier, duration: number) =>
        set((state) => {
          if (!state.user) return state;
          
          const now = new Date();
          const currentMembership = state.user.membership;
          
          // Calcular nueva fecha de expiración
          const expiresAt = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000); // duration en meses
          
          // Incrementar contador de meses
          const newMonthsPaid = currentMembership.monthsPaid + duration;
          const newConsecutiveMonths = currentMembership.tier === tier 
            ? currentMembership.consecutiveMonths + duration 
            : duration; // Reset si cambió de tier
          
          const dailyRewards = tier === "plus" ? 200 : tier === "vip" ? 500 : 50;
          const maxLeverage = tier === "plus" ? 30 : tier === "vip" ? 500 : 10;
          
          // Determinar línea de crédito VIP disponible
          let creditLine = null;
          if (tier === "vip") {
            if (newConsecutiveMonths >= 12) {
              creditLine = { duration: "1year" as const, amount: 70, isActive: true };
            } else if (newConsecutiveMonths >= 6) {
              creditLine = { duration: "6months" as const, amount: 50, isActive: true };
            } else if (newConsecutiveMonths >= 3) {
              creditLine = { duration: "3months" as const, amount: 30, isActive: true };
            }
          }
          
          return {
            user: {
              ...state.user,
              membership: {
                ...currentMembership,
                tier,
                startedAt: currentMembership.startedAt || now,
                expiresAt,
                monthsPaid: newMonthsPaid,
                consecutiveMonths: newConsecutiveMonths,
                dailyRewards,
                maxLeverage,
                creditLine,
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
        transactions: state.transactions,
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
