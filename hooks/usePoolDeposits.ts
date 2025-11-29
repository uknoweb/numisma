"use client"

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { POOL_CONTRACT_ADDRESS, POOL_ABI } from '@/lib/contracts'
import { parseEther, formatEther } from 'viem'

/**
 * Hook para depositar NUMA en el pool
 */
export function useDepositNUMA() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: POOL_CONTRACT_ADDRESS,
      abi: POOL_ABI,
      functionName: 'depositNUMA',
      args: [amountWei],
    })
  }

  return {
    deposit,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para depositar WLD en el pool
 */
export function useDepositWLD() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: POOL_CONTRACT_ADDRESS,
      abi: POOL_ABI,
      functionName: 'depositWLD',
      args: [amountWei],
    })
  }

  return {
    deposit,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para retirar NUMA del pool
 */
export function useWithdrawNUMA() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdraw = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: POOL_CONTRACT_ADDRESS,
      abi: POOL_ABI,
      functionName: 'withdrawNUMA',
      args: [amountWei],
    })
  }

  return {
    withdraw,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para retirar WLD del pool
 */
export function useWithdrawWLD() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdraw = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: POOL_CONTRACT_ADDRESS,
      abi: POOL_ABI,
      functionName: 'withdrawWLD',
      args: [amountWei],
    })
  }

  return {
    withdraw,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para obtener balance de trader en el pool (NUMA)
 */
export function useTraderBalanceNUMA(address?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_ABI,
    functionName: 'traderBalanceNUMA',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  })

  return {
    balance: data ? formatEther(data) : '0',
    balanceRaw: data,
    isLoading,
  }
}

/**
 * Hook para obtener balance de trader en el pool (WLD)
 */
export function useTraderBalanceWLD(address?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_ABI,
    functionName: 'traderBalanceWLD',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  })

  return {
    balance: data ? formatEther(data) : '0',
    balanceRaw: data,
    isLoading,
  }
}

/**
 * Hook para obtener liquidez total del pool
 */
export function usePoolLiquidity() {
  const { data: numaData, isLoading: numaLoading } = useReadContract({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_ABI,
    functionName: 'poolBalanceNUMA',
    query: {
      refetchInterval: 10000,
    },
  })

  const { data: wldData, isLoading: wldLoading } = useReadContract({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_ABI,
    functionName: 'poolBalanceWLD',
    query: {
      refetchInterval: 10000,
    },
  })

  return {
    numaLiquidity: numaData ? formatEther(numaData) : '0',
    wldLiquidity: wldData ? formatEther(wldData) : '0',
    isLoading: numaLoading || wldLoading,
  }
}
