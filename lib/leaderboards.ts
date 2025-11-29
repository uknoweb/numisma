/**
 * Leaderboard System
 * Sistema de rankings y tablas de posiciones
 */

export type LeaderboardType = 
  | 'pnl_all_time' 
  | 'pnl_weekly' 
  | 'pnl_monthly'
  | 'pioneers'
  | 'referrals'
  | 'achievements';

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  walletAddress: string;
  username?: string;
  value: number;
  membershipTier: 'free' | 'plus' | 'vip';
  change?: number; // Cambio desde último ranking
}

export interface LeaderboardData {
  type: LeaderboardType;
  title: string;
  description: string;
  icon: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  lastUpdated: Date;
}

/**
 * Configuración de leaderboards
 */
export const LEADERBOARD_CONFIG: Record<LeaderboardType, {
  title: string;
  description: string;
  icon: string;
  valueLabel: string;
  formatValue: (value: number) => string;
}> = {
  pnl_all_time: {
    title: 'Top Traders (All Time)',
    description: 'Mejores traders por ganancias totales',
    icon: '💎',
    valueLabel: 'P&L Total',
    formatValue: (value) => `${value > 0 ? '+' : ''}${value.toLocaleString()} NUMA`,
  },
  pnl_weekly: {
    title: 'Top Traders (Semanal)',
    description: 'Mejores traders de esta semana',
    icon: '🔥',
    valueLabel: 'P&L Semanal',
    formatValue: (value) => `${value > 0 ? '+' : ''}${value.toLocaleString()} NUMA`,
  },
  pnl_monthly: {
    title: 'Top Traders (Mensual)',
    description: 'Mejores traders del mes',
    icon: '⭐',
    valueLabel: 'P&L Mensual',
    formatValue: (value) => `${value > 0 ? '+' : ''}${value.toLocaleString()} NUMA`,
  },
  pioneers: {
    title: 'Top Pioneers',
    description: 'Pioneros con mayor staking',
    icon: '🏆',
    valueLabel: 'NUMA Staked',
    formatValue: (value) => `${value.toLocaleString()} NUMA`,
  },
  referrals: {
    title: 'Top Referrers',
    description: 'Usuarios con más referidos',
    icon: '🌟',
    valueLabel: 'Referidos',
    formatValue: (value) => `${value} amigos`,
  },
  achievements: {
    title: 'Top Achievers',
    description: 'Usuarios con más logros',
    icon: '🏅',
    valueLabel: 'Achievements',
    formatValue: (value) => `${value} desbloqueados`,
  },
};

/**
 * Obtiene el color del badge según el ranking
 */
export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'from-yellow-400 to-yellow-600'; // Oro
  if (rank === 2) return 'from-gray-300 to-gray-500'; // Plata
  if (rank === 3) return 'from-amber-600 to-amber-800'; // Bronce
  if (rank <= 10) return 'from-purple-400 to-purple-600'; // Top 10
  if (rank <= 50) return 'from-blue-400 to-blue-600'; // Top 50
  return 'from-gray-600 to-gray-800'; // Resto
}

/**
 * Obtiene el ícono según el ranking
 */
export function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '🔷';
  if (rank <= 50) return '🔹';
  return '▪️';
}

/**
 * Formatea el cambio de ranking
 */
export function formatRankChange(change?: number): { text: string; color: string; icon: string } {
  if (!change || change === 0) {
    return { text: '-', color: 'text-gray-400', icon: '━' };
  }
  
  if (change > 0) {
    return { 
      text: `+${change}`, 
      color: 'text-green-400', 
      icon: '↑' 
    };
  }
  
  return { 
    text: `${change}`, 
    color: 'text-red-400', 
    icon: '↓' 
  };
}

/**
 * Calcula percentile del usuario
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  return ((totalUsers - rank) / totalUsers) * 100;
}

/**
 * Mock data para desarrollo (eliminar cuando tengamos DB real)
 */
export function getMockLeaderboardData(type: LeaderboardType, userWallet?: string): LeaderboardData {
  const config = LEADERBOARD_CONFIG[type];
  
  // Generar datos mock
  const entries: LeaderboardEntry[] = Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    userId: 1000 + i,
    walletAddress: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    value: Math.floor(Math.random() * 100000) + (100 - i) * 1000,
    membershipTier: i < 10 ? 'vip' : i < 30 ? 'plus' : 'free',
    change: Math.floor(Math.random() * 20) - 10,
  }));

  // Ordenar por valor
  entries.sort((a, b) => b.value - a.value);
  
  // Re-asignar ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Encontrar rank del usuario
  const userRank = userWallet 
    ? entries.findIndex(e => e.walletAddress.includes(userWallet.slice(2, 6))) + 1 || undefined
    : undefined;

  return {
    type,
    title: config.title,
    description: config.description,
    icon: config.icon,
    entries,
    userRank,
    lastUpdated: new Date(),
  };
}
