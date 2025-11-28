/**
 * Custom hook para interacciones blockchain
 * Maneja estados de loading, errores y confirmaciones
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import * as blockchain from '@/lib/blockchain';

export function useBlockchain() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const user = useAppStore((state) => state.user);
  const updateBalance = useAppStore((state) => state.updateBalance);

  // Reclamar recompensa diaria
  const claimReward = useCallback(async () => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.claimDailyReward(user.walletAddress as `0x${string}`);
      setTxHash(receipt.transactionHash);
      
      // Actualizar balance local
      const newBalance = await blockchain.getNumaBalance(user.walletAddress as `0x${string}`);
      updateBalance(parseFloat(newBalance), user.balanceWld);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  // Abrir posición de trading
  const openPosition = useCallback(async (
    isLong: boolean,
    amount: number,
    leverage: number,
    entryPrice: number
  ) => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.openTradingPosition(
        user.walletAddress as `0x${string}`,
        isLong,
        amount,
        leverage,
        entryPrice
      );
      
      setTxHash(receipt.transactionHash);
      
      // Actualizar balance local
      const newBalance = await blockchain.getNumaBalance(user.walletAddress as `0x${string}`);
      updateBalance(parseFloat(newBalance), user.balanceWld);
      
      return receipt;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  // Cerrar posición
  const closePosition = useCallback(async (
    positionId: bigint,
    currentPrice: number
  ) => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.closeTradingPosition(
        user.walletAddress as `0x${string}`,
        positionId,
        currentPrice
      );
      
      setTxHash(receipt.transactionHash);
      
      // Actualizar balance local
      const newBalance = await blockchain.getNumaBalance(user.walletAddress as `0x${string}`);
      updateBalance(parseFloat(newBalance), user.balanceWld);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  // Mejorar membresía
  const upgradeMembership = useCallback(async (tier: 'plus' | 'vip') => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.upgradeMembership(
        user.walletAddress as `0x${string}`,
        tier
      );
      
      setTxHash(receipt.transactionHash);
      
      // Actualizar balances
      const newNuma = await blockchain.getNumaBalance(user.walletAddress as `0x${string}`);
      const price = tier === 'plus' ? 5 : 15;
      updateBalance(parseFloat(newNuma), user.balanceWld - price);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  // Swap NUMA → WLD
  const swapTokens = useCallback(async (numaAmount: number) => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.swapNumaForWld(
        user.walletAddress as `0x${string}`,
        numaAmount
      );
      
      setTxHash(receipt.transactionHash);
      
      // Actualizar balances (calculando el swap con fee)
      const wldReceived = (numaAmount * 0.001) * 0.97; // 3% fee
      updateBalance(user.balanceNuma - numaAmount, user.balanceWld + wldReceived);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  // Unirse como Pioneer
  const joinAsPioneer = useCallback(async (capitalAmount: number) => {
    if (!user?.walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const receipt = await blockchain.joinPioneers(
        user.walletAddress as `0x${string}`,
        capitalAmount
      );
      
      setTxHash(receipt.transactionHash);
      
      // Actualizar balance WLD
      updateBalance(user.balanceNuma, user.balanceWld - capitalAmount);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateBalance]);

  return {
    // Estados
    isLoading,
    error,
    txHash,
    
    // Acciones
    claimReward,
    openPosition,
    closePosition,
    upgradeMembership,
    swapTokens,
    joinAsPioneer,
    
    // Helpers
    clearError: () => setError(null),
  };
}
