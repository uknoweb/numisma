"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { NUMA_TOKEN_ADDRESS, WLD_TOKEN_ADDRESS } from '@/lib/contracts'
import { parseEther, formatEther } from 'viem'

// ERC-20 ABI minimal
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const

/**
 * Hook para obtener balance de NUMA
 */
export function useNUMABalance(address?: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: NUMA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch cada 5s
    },
  })

  return {
    balance: data ? formatEther(data) : '0',
    balanceRaw: data,
    isLoading,
    error,
  }
}

/**
 * Hook para obtener balance de WLD
 */
export function useWLDBalance(address?: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: WLD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
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
    error,
  }
}

/**
 * Hook para aprobar NUMA al pool
 */
export function useApproveNUMA(poolAddress: `0x${string}`) {
  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: NUMA_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddress, amountWei],
    })
  }

  return {
    approve,
    isPending: isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para aprobar WLD al pool
 */
export function useApproveWLD(poolAddress: `0x${string}`) {
  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = (amount: string) => {
    const amountWei = parseEther(amount)
    writeContract({
      address: WLD_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddress, amountWei],
    })
  }

  return {
    approve,
    isPending: isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para verificar allowance de NUMA
 */
export function useNUMAAllowance(
  ownerAddress?: `0x${string}`,
  spenderAddress?: `0x${string}`
) {
  const { data, isLoading } = useReadContract({
    address: NUMA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress,
      refetchInterval: 5000,
    },
  })

  return {
    allowance: data ? formatEther(data) : '0',
    allowanceRaw: data,
    isLoading,
  }
}

/**
 * Hook para verificar allowance de WLD
 */
export function useWLDAllowance(
  ownerAddress?: `0x${string}`,
  spenderAddress?: `0x${string}`
) {
  const { data, isLoading } = useReadContract({
    address: WLD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress,
      refetchInterval: 5000,
    },
  })

  return {
    allowance: data ? formatEther(data) : '0',
    allowanceRaw: data,
    isLoading,
  }
}
