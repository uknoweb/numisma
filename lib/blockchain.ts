/**
 * Blockchain Integration Layer
 * Conecta frontend con Smart Contracts en World Chain
 */

import { createPublicClient, createWalletClient, http, custom, parseEther, formatEther } from 'viem';
import { worldchain, worldchainSepolia } from 'viem/chains';

// Configuración de la chain
const isDevelopment = process.env.NODE_ENV === 'development';
export const currentChain = isDevelopment ? worldchainSepolia : worldchain;

// Cliente público (lectura)
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(`https://worldchain-${isDevelopment ? 'sepolia' : 'mainnet'}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
});

// Wallet client (escritura) - se inicializa con window.ethereum
export const getWalletClient = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  return createWalletClient({
    chain: currentChain,
    transport: custom(window.ethereum),
  });
};

// ABIs (se actualizarán después del deploy)
export const NUMA_TOKEN_ABI = [
  // ERC20 básico
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimDailyReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tier", "type": "uint8"}],
    "name": "upgradeMembership",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "numaAmount", "type": "uint256"}],
    "name": "swapNumaToWld",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
] as const;

export const TRADING_POOL_ABI = [
  {
    "inputs": [
      {"name": "isLong", "type": "bool"},
      {"name": "amount", "type": "uint256"},
      {"name": "leverage", "type": "uint256"},
      {"name": "entryPrice", "type": "uint256"}
    ],
    "name": "openPosition",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "positionId", "type": "uint256"},
      {"name": "currentPrice", "type": "uint256"}
    ],
    "name": "closePosition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "positionId", "type": "uint256"},
      {"name": "currentPrice", "type": "uint256"}
    ],
    "name": "calculatePnL",
    "outputs": [{"type": "int256"}],
    "stateMutability": "view",
    "type": "function"
  },
] as const;

export const PIONEER_VAULT_ABI = [
  {
    "inputs": [],
    "name": "joinPioneers",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawEarnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPioneerList",
    "outputs": [{"type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "pioneers",
    "outputs": [
      {"name": "wallet", "type": "address"},
      {"name": "capitalLocked", "type": "uint256"},
      {"name": "lockedUntil", "type": "uint256"},
      {"name": "earningsAccumulated", "type": "uint256"},
      {"name": "lastPaymentTimestamp", "type": "uint256"},
      {"name": "hasActiveLoan", "type": "bool"},
      {"name": "rank", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
] as const;

// Direcciones de contratos (actualizar después del deploy)
export const CONTRACTS = {
  numaToken: (process.env.NEXT_PUBLIC_NUMA_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  tradingPool: (process.env.NEXT_PUBLIC_TRADING_POOL_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  pioneerVault: (process.env.NEXT_PUBLIC_PIONEER_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

// ========== Funciones de lectura (no requieren gas) ==========

/**
 * Obtener balance de NUMA de una dirección
 */
export async function getNumaBalance(address: `0x${string}`): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.numaToken,
      abi: NUMA_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    
    return formatEther(balance);
  } catch (error) {
    console.error('Error getting NUMA balance:', error);
    return '0';
  }
}

/**
 * Obtener lista de pioneros
 */
export async function getPioneerList(): Promise<string[]> {
  try {
    const pioneers = await publicClient.readContract({
      address: CONTRACTS.pioneerVault,
      abi: PIONEER_VAULT_ABI,
      functionName: 'getPioneerList',
    });
    
    return pioneers;
  } catch (error) {
    console.error('Error getting pioneer list:', error);
    return [];
  }
}

/**
 * Calcular PnL de una posición
 */
export async function calculatePositionPnL(
  positionId: bigint,
  currentPrice: number
): Promise<string> {
  try {
    const pnl = await publicClient.readContract({
      address: CONTRACTS.tradingPool,
      abi: TRADING_POOL_ABI,
      functionName: 'calculatePnL',
      args: [positionId, BigInt(Math.floor(currentPrice * 100))],
    });
    
    return formatEther(pnl);
  } catch (error) {
    console.error('Error calculating PnL:', error);
    return '0';
  }
}

// ========== Funciones de escritura (requieren gas y firma) ==========

/**
 * Reclamar recompensa diaria
 */
export async function claimDailyReward(walletAddress: `0x${string}`) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.numaToken,
    abi: NUMA_TOKEN_ABI,
    functionName: 'claimDailyReward',
    account: walletAddress,
  });
  
  const hash = await walletClient.writeContract(request);
  
  // Esperar confirmación
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Abrir posición de trading
 */
export async function openTradingPosition(
  walletAddress: `0x${string}`,
  isLong: boolean,
  amount: number,
  leverage: number,
  entryPrice: number
) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.tradingPool,
    abi: TRADING_POOL_ABI,
    functionName: 'openPosition',
    args: [
      isLong,
      parseEther(amount.toString()),
      BigInt(leverage),
      BigInt(Math.floor(entryPrice * 100))
    ],
    account: walletAddress,
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Cerrar posición de trading
 */
export async function closeTradingPosition(
  walletAddress: `0x${string}`,
  positionId: bigint,
  currentPrice: number
) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.tradingPool,
    abi: TRADING_POOL_ABI,
    functionName: 'closePosition',
    args: [positionId, BigInt(Math.floor(currentPrice * 100))],
    account: walletAddress,
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Mejorar membresía
 */
export async function upgradeMembership(
  walletAddress: `0x${string}`,
  tier: 'plus' | 'vip'
) {
  const walletClient = getWalletClient();
  const tierValue = tier === 'plus' ? 1 : 2;
  const price = tier === 'plus' ? '5' : '15'; // WLD
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.numaToken,
    abi: NUMA_TOKEN_ABI,
    functionName: 'upgradeMembership',
    args: [tierValue],
    account: walletAddress,
    value: parseEther(price),
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Swap NUMA → WLD
 */
export async function swapNumaForWld(
  walletAddress: `0x${string}`,
  numaAmount: number
) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.numaToken,
    abi: NUMA_TOKEN_ABI,
    functionName: 'swapNumaToWld',
    args: [parseEther(numaAmount.toString())],
    account: walletAddress,
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Unirse como Pioneer
 */
export async function joinPioneers(
  walletAddress: `0x${string}`,
  capitalAmount: number
) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.pioneerVault,
    abi: PIONEER_VAULT_ABI,
    functionName: 'joinPioneers',
    account: walletAddress,
    value: parseEther(capitalAmount.toString()),
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

/**
 * Retirar ganancias de Pioneer
 */
export async function withdrawPioneerEarnings(walletAddress: `0x${string}`) {
  const walletClient = getWalletClient();
  
  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.pioneerVault,
    abi: PIONEER_VAULT_ABI,
    functionName: 'withdrawEarnings',
    account: walletAddress,
  });
  
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return receipt;
}

// ========== Helpers ==========

/**
 * Obtener signer address del wallet conectado
 */
export async function getConnectedAddress(): Promise<`0x${string}` | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];
    
    return accounts[0] as `0x${string}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
}

/**
 * Verificar si está en la red correcta
 */
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
  const expectedChainId = `0x${currentChain.id.toString(16)}`;
  
  return chainId === expectedChainId;
}

/**
 * Cambiar a World Chain
 */
export async function switchToWorldChain(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${currentChain.id.toString(16)}` }],
    });
  } catch (switchError: any) {
    // Si la chain no está agregada, agregarla
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${currentChain.id.toString(16)}`,
          chainName: currentChain.name,
          nativeCurrency: currentChain.nativeCurrency,
          rpcUrls: [currentChain.rpcUrls.default.http[0]],
          blockExplorerUrls: currentChain.blockExplorers ? [currentChain.blockExplorers.default.url] : [],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

// Type augmentation para window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
