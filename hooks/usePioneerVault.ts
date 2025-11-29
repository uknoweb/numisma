import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import pioneerVaultABI from '@/lib/pioneer-vault-abi.json';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_PIONEER_VAULT_ADDRESS as `0x${string}`;

// ========== LECTURA ==========

/**
 * Hook para obtener información completa de un pioneer
 */
export function usePioneerInfo(address?: `0x${string}`) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'getPioneerInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Cada 10s
    },
  });
}

/**
 * Hook para obtener ranking de un pioneer
 */
export function usePioneerRanking(address?: `0x${string}`) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'getRanking',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook para obtener top N pioneers
 */
export function useTopPioneers(count: number = 10) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'getTopPioneers',
    args: [BigInt(count)],
    query: {
      refetchInterval: 30000, // Cada 30s
    },
  });
}

/**
 * Hook para obtener estadísticas generales del vault
 */
export function useVaultStats() {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'getStats',
    query: {
      refetchInterval: 15000, // Cada 15s
    },
  });
}

/**
 * Hook para obtener constantes del vault
 */
export function useVaultConstants() {
  const maxPioneers = useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'MAX_PIONEERS',
  });

  const lockPeriod = useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'LOCK_PERIOD',
  });

  const penalty = useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'EARLY_WITHDRAWAL_PENALTY',
  });

  const profitShare = useReadContract({
    address: VAULT_ADDRESS,
    abi: pioneerVaultABI,
    functionName: 'PROFIT_SHARE',
  });

  return {
    maxPioneers: maxPioneers.data,
    lockPeriod: lockPeriod.data,
    penalty: penalty.data,
    profitShare: profitShare.data,
    isLoading: maxPioneers.isLoading || lockPeriod.isLoading || penalty.isLoading || profitShare.isLoading,
  };
}

// ========== ESCRITURA ==========

/**
 * Hook para depositar capital en el vault
 */
export function useDepositCapital() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (amount: bigint) => {
    writeContract({
      address: VAULT_ADDRESS,
      abi: pioneerVaultABI,
      functionName: 'depositCapital',
      args: [amount],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook para retirar capital del vault
 */
export function useWithdrawCapital() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = (amount: bigint) => {
    writeContract({
      address: VAULT_ADDRESS,
      abi: pioneerVaultABI,
      functionName: 'withdrawCapital',
      args: [amount],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook para reclamar profits acumulados
 */
export function useClaimProfits() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = () => {
    writeContract({
      address: VAULT_ADDRESS,
      abi: pioneerVaultABI,
      functionName: 'claimProfits',
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ========== HELPERS ==========

/**
 * Helper para formatear información del pioneer
 */
export function formatPioneerInfo(data: any) {
  if (!data) return null;

  const [
    capitalDeposited,
    depositTimestamp,
    profitsAccumulated,
    profitsClaimed,
    ranking,
    isActive,
    canWithdrawWithoutPenalty,
    claimableProfits,
  ] = data;

  return {
    capitalDeposited: capitalDeposited as bigint,
    depositTimestamp: Number(depositTimestamp),
    profitsAccumulated: profitsAccumulated as bigint,
    profitsClaimed: profitsClaimed as bigint,
    ranking: Number(ranking),
    isActive: isActive as boolean,
    canWithdrawWithoutPenalty: canWithdrawWithoutPenalty as boolean,
    claimableProfits: claimableProfits as bigint,
    depositDate: new Date(Number(depositTimestamp) * 1000),
    unlockDate: new Date((Number(depositTimestamp) + 365 * 24 * 60 * 60) * 1000),
  };
}

/**
 * Helper para formatear estadísticas del vault
 */
export function formatVaultStats(data: any) {
  if (!data) return null;

  const [activePioneers, totalLocked, totalDistributed, minCapital] = data;

  return {
    activePioneers: Number(activePioneers),
    totalLocked: totalLocked as bigint,
    totalDistributed: totalDistributed as bigint,
    minCapital: minCapital as bigint,
  };
}

/**
 * Helper para formatear top pioneers
 */
export function formatTopPioneers(data: any) {
  if (!data) return [];

  const [addresses, capitals, rankings] = data;

  return addresses.map((address: string, index: number) => ({
    address: address as `0x${string}`,
    capital: capitals[index] as bigint,
    ranking: Number(rankings[index]),
  }));
}
