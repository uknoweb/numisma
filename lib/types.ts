// Tipos de membresía
export type MembershipTier = "free" | "plus" | "vip";

// Línea de crédito VIP según duración
export interface CreditLine {
  duration: "3months" | "6months" | "1year";
  amount: number; // WLD disponible
  isActive: boolean;
}

// Información de membresía
export interface Membership {
  tier: MembershipTier;
  startedAt: Date | null; // Fecha de inicio de membresía
  expiresAt: Date | null; // Fecha de expiración
  monthsPaid: number; // Meses pagados acumulados
  consecutiveMonths: number; // Meses consecutivos activos
  dailyRewards: number;
  maxLeverage: number;
  
  // Sistema de crédito VIP
  creditLine: CreditLine | null; // Línea de crédito desbloqueada
  activeLoan: {
    amount: number; // Monto prestado
    takenAt: Date;
    dueDate: Date; // 1 año para pagar
    collateralFrozen: number; // Fondos congelados como garantía
  } | null;
  
  // Advertencias y penalizaciones
  hasDefaulted: boolean; // Si incumplió un pago
  walletFrozen: boolean; // Si su wallet está congelada
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

// Pionero (Top 100) - Sistema DIFERENTE a crédito VIP
export interface Pioneer {
  userId: string;
  walletAddress: string;
  capitalLocked: number; // WLD bloqueado
  rank: number; // Posición en el Top 100
  earningsAccumulated: number; // 5% de ganancias acumuladas
  nextPaymentDate: Date;
  lockedUntil: Date; // 1 año desde la entrada
  hasActiveLoan: boolean;
  
  // Crédito de Pioneros (50% del capital bloqueado) - DIFERENTE de VIP
  pioneerCreditLine: {
    maxAmount: number; // 50% del capital bloqueado
    used: number; // Cuánto ha usado
    available: number; // Cuánto tiene disponible
  };
}

// Préstamo (VIP y Pioneros tienen sistemas DIFERENTES)
export interface Loan {
  id: string;
  userId: string;
  type: "vip" | "pioneer"; // Tipo de préstamo
  amount: number;
  takenAt: Date;
  dueDate: Date; // 1 año para pagar
  repaidAt: Date | null;
  status: "active" | "repaid" | "defaulted" | "seized"; // seized = fondos confiscados
  collateralFrozen: number; // Fondos congelados como garantía
}

// Transacción
export interface Transaction {
  id: string;
  userId: string;
  type: "swap" | "membership" | "staking_claim" | "pioneer_lock" | "pioneer_withdraw" | "pioneer_add" | "trading_open" | "trading_close";
  description: string;
  amount: number;
  token: "NUMA" | "WLD";
  balanceAfter: {
    numa: number;
    wld: number;
  };
  timestamp: Date;
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
  plus: {
    monthly: 10, // 10 NUMA por mes (pago mensual)
    duration: 1, // Duración de 1 mes
  },
  vip: {
    quarterly: 90, // 90 NUMA por 3 meses (30 NUMA/mes)
    duration: 3, // Mínimo 3 meses
    monthlyAfter6: 30, // Después de 6 meses puede pagar mensual
  },
};

// Líneas de crédito VIP según meses consecutivos
export const VIP_CREDIT_LINES = {
  "3months": {
    minMonths: 3, // Mínimo 3 meses consecutivos
    creditAmount: 30, // 30 WLD disponibles
    label: "3 meses consecutivos",
  },
  "6months": {
    minMonths: 6, // Mínimo 6 meses consecutivos
    creditAmount: 50, // 50 WLD disponibles
    label: "6 meses consecutivos",
  },
  "1year": {
    minMonths: 12, // Mínimo 1 año consecutivo
    creditAmount: 70, // 70 WLD disponibles
    label: "1 año consecutivo",
  },
};

export const VIP_LOAN_CONFIG = {
  repaymentPeriod: 365, // 1 año para pagar
  penaltyForDefault: "wallet_freeze", // Congelar wallet
  seizeAfterDays: 365, // Confiscar fondos después de 1 año sin pago
  collateralRequired: 1.5, // 150% de colateral
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
