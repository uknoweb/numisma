import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear números con separadores de miles
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Formatear moneda según localización
export function formatCurrency(
  amount: number,
  currency: string = "MXN"
): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Calcular tiempo restante en formato legible
export function formatTimeRemaining(endDate: Date | null): string {
  if (!endDate) return "∞";
  
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return "Expirado";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

// Acortar dirección de wallet
export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Calcular PnL (Profit and Loss) con comisiones
export function calculatePnL(
  entryPrice: number,
  currentPrice: number,
  amount: number,
  leverage: number,
  isLong: boolean,
  marketPair?: string
): { pnl: number; pnlPercentage: number; fees: number } {
  const priceChange = isLong
    ? currentPrice - entryPrice
    : entryPrice - currentPrice;
  const pnlPercentage = (priceChange / entryPrice) * 100 * leverage;
  const pnl = (amount * pnlPercentage) / 100;

  // Comisiones según el par: 0.1% WLD/USDT, 1% NUMA/WLD
  const feeRate = marketPair === "WLD/USDT" ? 0.001 : 0.01;
  const fees = amount * feeRate;

  return { pnl, pnlPercentage, fees };
}

// Calcular comisión de apertura según el par
export function calculateOpeningFee(
  amount: number,
  marketPair: string
): number {
  const feeRate = marketPair === "WLD/USDT" ? 0.001 : 0.01; // 0.1% WLD, 1% NUMA
  return amount * feeRate;
}

// Conversión NUMA ↔ WLD
export const NUMA_TO_WLD_RATE = 0.001;
export const SWAP_FEE_PERCENTAGE = 3;

export function convertNumaToWld(numaAmount: number): number {
  return numaAmount * NUMA_TO_WLD_RATE;
}

export function convertWldToNuma(wldAmount: number): number {
  return wldAmount / NUMA_TO_WLD_RATE;
}

export function calculateSwapWithFee(
  numaAmount: number
): { wldReceived: number; fee: number } {
  const wldGross = convertNumaToWld(numaAmount);
  const fee = (wldGross * SWAP_FEE_PERCENTAGE) / 100;
  const wldReceived = wldGross - fee;
  return { wldReceived, fee };
}
