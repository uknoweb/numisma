"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import MembershipABI from '@/lib/membership-abi.json'

export const MEMBERSHIP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MEMBERSHIP_ADDRESS as `0x${string}`

// Membership tiers enum (matching contract)
export enum MembershipTier {
  FREE = 0,
  PLUS = 1,
  VIP = 2,
}

// Tier info
export const TIER_INFO = {
  [MembershipTier.FREE]: {
    name: 'Free',
    leverage: 5,
    price: 0,
    color: 'gray',
  },
  [MembershipTier.PLUS]: {
    name: 'Plus',
    leverage: 50,
    price: 5,
    color: 'blue',
  },
  [MembershipTier.VIP]: {
    name: 'VIP',
    leverage: 500,
    price: 15,
    color: 'purple',
  },
}

/**
 * Hook para obtener el nivel de membresía de un usuario
 */
export function useMembershipLevel(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'getMembershipLevel',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch cada 10s
    },
  })

  return {
    tier: data as MembershipTier | undefined,
    tierInfo: data !== undefined ? TIER_INFO[data as MembershipTier] : undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook para obtener el leverage máximo permitido
 */
export function useMaxLeverage(address?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'getMaxLeverage',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })

  return {
    maxLeverage: data ? Number(data) : 5, // Default FREE tier
    isLoading,
  }
}

/**
 * Hook para obtener información completa de membresía
 */
export function useMembershipInfo(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'getMembershipInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })

  if (!data) {
    return {
      tier: MembershipTier.FREE,
      tierInfo: TIER_INFO[MembershipTier.FREE],
      purchasedAt: 0n,
      maxLeverage: 5,
      isActive: false,
      isLoading,
      refetch,
    }
  }

  const [tier, purchasedAt, maxLeverage, isActive] = data as [number, bigint, bigint, boolean]

  return {
    tier: tier as MembershipTier,
    tierInfo: TIER_INFO[tier as MembershipTier],
    purchasedAt,
    maxLeverage: Number(maxLeverage),
    isActive,
    isLoading,
    refetch,
  }
}

/**
 * Hook para comprar membresía
 */
export function useBuyMembership() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const buyMembership = (tier: MembershipTier) => {
    if (tier === MembershipTier.FREE) {
      throw new Error("Cannot buy FREE tier")
    }

    writeContract({
      address: MEMBERSHIP_CONTRACT_ADDRESS,
      abi: MembershipABI,
      functionName: 'buyMembership',
      args: [tier],
    })
  }

  return {
    buyMembership,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * Hook para obtener precio de un tier
 */
export function useTierPrice(tier: MembershipTier) {
  const { data, isLoading } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'getTierPrice',
    args: [tier],
    query: {
      enabled: true,
    },
  })

  return {
    price: data ? Number(data) / 10**18 : TIER_INFO[tier].price,
    priceRaw: data,
    isLoading,
  }
}

/**
 * Hook para verificar si tiene membresía activa
 */
export function useHasMembership(address?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'hasMembership',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })

  return {
    hasMembership: data as boolean | undefined,
    isLoading,
  }
}

/**
 * Hook para obtener estadísticas generales
 */
export function useMembershipStats() {
  const { data, isLoading } = useReadContract({
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    abi: MembershipABI,
    functionName: 'getStats',
    query: {
      refetchInterval: 30000, // Refetch cada 30s
    },
  })

  if (!data) {
    return {
      totalMembers: 0,
      totalPlusMembers: 0,
      totalVIPMembers: 0,
      isLoading,
    }
  }

  const [total, plus, vip] = data as [bigint, bigint, bigint]

  return {
    totalMembers: Number(total),
    totalPlusMembers: Number(plus),
    totalVIPMembers: Number(vip),
    isLoading,
  }
}
