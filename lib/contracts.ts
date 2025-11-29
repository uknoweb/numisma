import PoolABI from './PoolABI.json'

// Dirección del contrato deployado
export const POOL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS as `0x${string}`

// ABI del contrato
export const POOL_ABI = PoolABI as const

// Configuración del contrato para Wagmi
export const poolContract = {
  address: POOL_CONTRACT_ADDRESS,
  abi: POOL_ABI,
} as const

// Enums del contrato (matching Solidity)
export enum TradingPair {
  WLD_USDT = 0,
  NUMA_WLD = 1,
}

export enum PositionType {
  LONG = 0,
  SHORT = 1,
}

// Constantes del contrato
export const TRADING_FEE = 20 // 0.2% en basis points
export const FUNDING_RATE = 1 // 0.01% en basis points
export const FUNDING_INTERVAL = 8 * 60 * 60 // 8 horas en segundos
export const LIQUIDATION_THRESHOLD = 90 // 90%
export const NUMA_WLD_RATE = 10 // 10 NUMA = 1 WLD

// Helper para convertir precio a formato del contrato (6 decimales)
export function priceToContractFormat(price: number): bigint {
  return BigInt(Math.floor(price * 1_000_000))
}

// Helper para convertir precio del contrato a número
export function priceFromContractFormat(price: bigint): number {
  return Number(price) / 1_000_000
}
