'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { poolContract, TradingPair, PositionType, priceToContractFormat } from '@/lib/contracts'
import { parseEther } from 'viem'

/**
 * Hook para abrir una posición en el contrato
 */
export function useOpenPosition() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const openPosition = (
    pair: 'WLD/USDT' | 'NUMA/WLD',
    type: 'long' | 'short',
    leverage: number,
    collateralAmount: string // En ETH (WLD)
  ) => {
    const tradingPair = pair === 'WLD/USDT' ? TradingPair.WLD_USDT : TradingPair.NUMA_WLD
    const positionType = type === 'long' ? PositionType.LONG : PositionType.SHORT

    writeContract({
      ...poolContract,
      functionName: 'openPosition',
      args: [tradingPair, positionType, BigInt(leverage)],
      value: parseEther(collateralAmount),
    })
  }

  return {
    openPosition,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook para cerrar una posición
 */
export function useClosePosition() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const closePosition = (positionId: bigint) => {
    writeContract({
      ...poolContract,
      functionName: 'closePosition',
      args: [positionId],
    })
  }

  return {
    closePosition,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook para obtener el PnL actual de una posición
 */
export function useGetCurrentPnL(trader: `0x${string}` | undefined, positionId: bigint) {
  const { data: pnl, isError, isLoading, refetch } = useReadContract({
    ...poolContract,
    functionName: 'getCurrentPnL',
    args: trader && positionId !== undefined ? [trader, positionId] : undefined,
    query: {
      enabled: !!trader && positionId !== undefined,
      refetchInterval: 1000, // Actualizar cada segundo
    },
  })

  return {
    pnl: pnl as bigint | undefined,
    isError,
    isLoading,
    refetch,
  }
}

/**
 * Hook para obtener información de una posición
 */
export function useGetPosition(trader: `0x${string}` | undefined, positionId: bigint) {
  const { data: position, isError, isLoading } = useReadContract({
    ...poolContract,
    functionName: 'getPosition',
    args: trader && positionId !== undefined ? [trader, positionId] : undefined,
    query: {
      enabled: !!trader && positionId !== undefined,
    },
  })

  return {
    position,
    isError,
    isLoading,
  }
}

/**
 * Hook para obtener el número de posiciones de un trader
 */
export function useGetPositionCount(trader: `0x${string}` | undefined) {
  const { data: count, isError, isLoading } = useReadContract({
    ...poolContract,
    functionName: 'getPositionCount',
    args: trader ? [trader] : undefined,
    query: {
      enabled: !!trader,
    },
  })

  return {
    count: count as bigint | undefined,
    isError,
    isLoading,
  }
}

/**
 * Hook para obtener el precio actual de WLD/USDT del contrato
 */
export function useGetWLDPrice() {
  const { data: price, isError, isLoading } = useReadContract({
    ...poolContract,
    functionName: 'getWLDPrice',
    query: {
      refetchInterval: 5000, // Actualizar cada 5 segundos (coincide con el cron)
    },
  })

  return {
    price: price as bigint | undefined,
    isError,
    isLoading,
  }
}

/**
 * Hook para obtener el balance del pool
 */
export function useGetPoolBalance() {
  const { data: balance, isError, isLoading, refetch } = useReadContract({
    ...poolContract,
    functionName: 'getPoolBalance',
  })

  return {
    balance: balance as bigint | undefined,
    isError,
    isLoading,
    refetch,
  }
}
