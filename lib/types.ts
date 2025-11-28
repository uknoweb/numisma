// Tipos de membresía
export type MembershipTier = "free" | "plus" | "vip";

// Información de membresía
export interface Membership {
  tier: MembershipTier;
  expiresAt: Date | null;
  dailyRewards: number;
  maxLeverage: number;
}

// Usuario de la aplicación
export interface User {
  id: string;
  walletAddress: string;
  isVerified: boolean;
  worldId: string | null;
  balanceNuma: number;
  balanceWld: number;
  membership: Membership;
  locale: string; // Para conversión de moneda local
  createdAt: Date;
}

// Posición de trading
export interface Position {
  id: string;
  userId: string;
  symbol: string; // ej: "BTC/USDT"
  type: "long" | "short";
  entryPrice: number;
  currentPrice: number;
  amount: number; // NUMA o WLD apostado
  leverage: number;
  pnl: number;
  pnlPercentage: number;
  openedAt: Date;
  closedAt: Date | null;
  status: "open" | "closed";
}

// Pionero (Top 100)
export interface Pioneer {
  userId: string;
  walletAddress: string;
  capitalLocked: number; // WLD bloqueado
  rank: number; // Posición en el Top 100
  earningsAccumulated: number; // 5% de ganancias acumuladas
  nextPaymentDate: Date;
  lockedUntil: Date; // 1 año desde la entrada
  hasActiveLoan: boolean;
}

// Préstamo para Pioneros
export interface Loan {
  id: string;
  pioneerId: string;
  collateral: number; // WLD bloqueado como colateral
  amountBorrowed: number; // 90% del colateral
  fee: number; // 5% del colateral
  totalRepayment: number; // amountBorrowed + fee
  issuedAt: Date;
  dueDate: Date;
  status: "active" | "repaid" | "defaulted";
}

// Configuración de recompensas de staking
export interface StakingRewards {
  free: { initial: number; afterThreeMonths: number };
  plus: { initial: number; afterThreeMonths: number };
  vip: { initial: number; afterThreeMonths: number };
}

// Configuración de apalancamiento
export interface LeverageConfig {
  free: { min: number; max: number };
  plus: { min: number; max: number };
  vip: { min: number; max: number };
}

// Constantes del sistema
export const STAKING_REWARDS: StakingRewards = {
  free: { initial: 50, afterThreeMonths: 10 },
  plus: { initial: 200, afterThreeMonths: 100 },
  vip: { initial: 500, afterThreeMonths: 250 },
};

export const LEVERAGE_CONFIG: LeverageConfig = {
  free: { min: 2, max: 10 },
  plus: { min: 2, max: 30 },
  vip: { min: 2, max: 500 },
};

export const MEMBERSHIP_PRICES = {
  plus: 5, // WLD por mes
  vip: 15, // WLD por 6 meses
};

export const PIONEER_CONFIG = {
  maxPioneers: 100,
  lockPeriod: 365, // días (1 año)
  earningsShare: 5, // 5% de ganancias totales
  paymentInterval: 15, // días
  earlyWithdrawalPenalty: 20, // 20% de penalización
  loanMaxPercentage: 90, // 90% del colateral
  loanFeePercentage: 5, // 5% tarifa fija
  marginProtection: 10, // 10% margen de protección
};
