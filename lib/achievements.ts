/**
 * Achievements System
 * Sistema de logros y achievements para gamificación
 */

export type AchievementCategory = 'trading' | 'pioneer' | 'social' | 'membership' | 'milestone';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  numaReward?: number;
  requirement: {
    type: string;
    value: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Trading Achievements
  {
    id: 'first_trade',
    name: 'Primer Trade',
    description: 'Abre tu primera posición',
    category: 'trading',
    icon: '🎯',
    xpReward: 50,
    numaReward: 50,
    requirement: { type: 'positions_opened', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'trader_novice',
    name: 'Trader Novato',
    description: 'Abre 10 posiciones',
    category: 'trading',
    icon: '📈',
    xpReward: 200,
    numaReward: 100,
    requirement: { type: 'positions_opened', value: 10 },
    tier: 'bronze',
  },
  {
    id: 'trader_intermediate',
    name: 'Trader Intermedio',
    description: 'Abre 50 posiciones',
    category: 'trading',
    icon: '📊',
    xpReward: 500,
    numaReward: 300,
    requirement: { type: 'positions_opened', value: 50 },
    tier: 'silver',
  },
  {
    id: 'trader_expert',
    name: 'Trader Experto',
    description: 'Abre 100 posiciones',
    category: 'trading',
    icon: '💎',
    xpReward: 1000,
    numaReward: 500,
    requirement: { type: 'positions_opened', value: 100 },
    tier: 'gold',
  },
  {
    id: 'first_profit',
    name: 'Primera Ganancia',
    description: 'Cierra una posición en profit',
    category: 'trading',
    icon: '💰',
    xpReward: 100,
    numaReward: 100,
    requirement: { type: 'profitable_trades', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'profit_streak_5',
    name: 'Racha de Ganancias',
    description: '5 trades ganadores consecutivos',
    category: 'trading',
    icon: '🔥',
    xpReward: 300,
    numaReward: 200,
    requirement: { type: 'win_streak', value: 5 },
    tier: 'silver',
  },
  {
    id: 'profit_streak_10',
    name: 'Racha de Oro',
    description: '10 trades ganadores consecutivos',
    category: 'trading',
    icon: '⭐',
    xpReward: 1000,
    numaReward: 500,
    requirement: { type: 'win_streak', value: 10 },
    tier: 'gold',
  },
  {
    id: 'high_leverage_master',
    name: 'Maestro del Leverage',
    description: 'Gana con 10x leverage o más',
    category: 'trading',
    icon: '⚡',
    xpReward: 500,
    numaReward: 300,
    requirement: { type: 'high_leverage_wins', value: 10 },
    tier: 'gold',
  },

  // Pioneer Achievements
  {
    id: 'become_pioneer',
    name: 'Bienvenido Pioneer',
    description: 'Conviértete en Pioneer',
    category: 'pioneer',
    icon: '🏆',
    xpReward: 500,
    numaReward: 500,
    requirement: { type: 'is_pioneer', value: 1 },
    tier: 'gold',
  },
  {
    id: 'top_100',
    name: 'Top 100',
    description: 'Entra al Top 100 de Pioneers',
    category: 'pioneer',
    icon: '🥉',
    xpReward: 1000,
    numaReward: 1000,
    requirement: { type: 'pioneer_rank', value: 100 },
    tier: 'gold',
  },
  {
    id: 'top_50',
    name: 'Top 50',
    description: 'Entra al Top 50 de Pioneers',
    category: 'pioneer',
    icon: '🥈',
    xpReward: 2000,
    numaReward: 2000,
    requirement: { type: 'pioneer_rank', value: 50 },
    tier: 'platinum',
  },
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Entra al Top 10 de Pioneers',
    category: 'pioneer',
    icon: '🥇',
    xpReward: 5000,
    numaReward: 5000,
    requirement: { type: 'pioneer_rank', value: 10 },
    tier: 'diamond',
  },

  // Social Achievements
  {
    id: 'first_referral',
    name: 'Primer Referido',
    description: 'Invita a tu primer amigo',
    category: 'social',
    icon: '👥',
    xpReward: 200,
    numaReward: 200,
    requirement: { type: 'referrals_count', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    description: 'Invita a 5 amigos',
    category: 'social',
    icon: '🦋',
    xpReward: 500,
    numaReward: 500,
    requirement: { type: 'referrals_count', value: 5 },
    tier: 'silver',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Invita a 20 amigos',
    category: 'social',
    icon: '🌟',
    xpReward: 2000,
    numaReward: 2000,
    requirement: { type: 'referrals_count', value: 20 },
    tier: 'gold',
  },

  // Membership Achievements
  {
    id: 'first_membership',
    name: 'Miembro Plus',
    description: 'Compra tu primera membresía Plus',
    category: 'membership',
    icon: '💳',
    xpReward: 300,
    numaReward: 300,
    requirement: { type: 'membership_tier', value: 1 }, // plus = 1
    tier: 'silver',
  },
  {
    id: 'vip_member',
    name: 'Miembro VIP',
    description: 'Alcanza membresía VIP',
    category: 'membership',
    icon: '👑',
    xpReward: 1000,
    numaReward: 1000,
    requirement: { type: 'membership_tier', value: 2 }, // vip = 2
    tier: 'gold',
  },
  {
    id: 'loyal_member',
    name: 'Miembro Leal',
    description: 'Mantén membresía por 6 meses consecutivos',
    category: 'membership',
    icon: '💎',
    xpReward: 2000,
    numaReward: 2000,
    requirement: { type: 'consecutive_months', value: 6 },
    tier: 'platinum',
  },

  // Milestone Achievements
  {
    id: 'onboarding_complete',
    name: 'Bienvenida Completa',
    description: 'Completa el tutorial',
    category: 'milestone',
    icon: '✅',
    xpReward: 100,
    numaReward: 100,
    requirement: { type: 'onboarding_completed', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'daily_streak_7',
    name: 'Racha Semanal',
    description: '7 días consecutivos usando la app',
    category: 'milestone',
    icon: '📅',
    xpReward: 500,
    numaReward: 300,
    requirement: { type: 'daily_streak', value: 7 },
    tier: 'silver',
  },
  {
    id: 'daily_streak_30',
    name: 'Racha Mensual',
    description: '30 días consecutivos usando la app',
    category: 'milestone',
    icon: '🗓️',
    xpReward: 2000,
    numaReward: 1000,
    requirement: { type: 'daily_streak', value: 30 },
    tier: 'gold',
  },
  {
    id: 'daily_streak_100',
    name: 'Centenario',
    description: '100 días consecutivos usando la app',
    category: 'milestone',
    icon: '💯',
    xpReward: 10000,
    numaReward: 5000,
    requirement: { type: 'daily_streak', value: 100 },
    tier: 'diamond',
  },
];

/**
 * Sistema de niveles y XP
 */
export const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Novato' },
  { level: 2, xpRequired: 100, title: 'Aprendiz' },
  { level: 3, xpRequired: 300, title: 'Practicante' },
  { level: 4, xpRequired: 600, title: 'Comerciante' },
  { level: 5, xpRequired: 1000, title: 'Trader' },
  { level: 6, xpRequired: 1500, title: 'Trader Avanzado' },
  { level: 7, xpRequired: 2200, title: 'Experto' },
  { level: 8, xpRequired: 3000, title: 'Maestro' },
  { level: 9, xpRequired: 4000, title: 'Gran Maestro' },
  { level: 10, xpRequired: 5500, title: 'Leyenda' },
  { level: 11, xpRequired: 7500, title: 'Titán' },
  { level: 12, xpRequired: 10000, title: 'Semidiós' },
  { level: 13, xpRequired: 13000, title: 'Dios del Trading' },
  { level: 14, xpRequired: 17000, title: 'Inmortal' },
  { level: 15, xpRequired: 22000, title: 'Trascendente' },
  { level: 16, xpRequired: 28000, title: 'Mítico' },
  { level: 17, xpRequired: 35000, title: 'Legendario' },
  { level: 18, xpRequired: 43000, title: 'Épico' },
  { level: 19, xpRequired: 52000, title: 'Supremo' },
  { level: 20, xpRequired: 65000, title: 'Absoluto' },
];

/**
 * Calcula el nivel basado en XP
 */
export function calculateLevel(xp: number): { level: number; title: string; xpForNext: number; progress: number } {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i]; // Si es max level, usar el mismo
      break;
    }
  }

  const xpInCurrentLevel = xp - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = nextLevel === currentLevel ? 100 : (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpForNext: nextLevel.xpRequired - xp,
    progress: Math.min(progress, 100),
  };
}

/**
 * Verifica si un achievement se desbloqueó
 */
export function checkAchievement(achievement: Achievement, userStats: Record<string, number>): boolean {
  const { requirement } = achievement;
  const userValue = userStats[requirement.type] || 0;

  switch (requirement.type) {
    case 'pioneer_rank':
      // Rank menor = mejor (top 10 es mejor que top 100)
      return userValue > 0 && userValue <= requirement.value;
    default:
      return userValue >= requirement.value;
  }
}

/**
 * Obtiene achievements desbloqueados
 */
export function getUnlockedAchievements(userStats: Record<string, number>): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => checkAchievement(achievement, userStats));
}

/**
 * Obtiene próximos achievements a desbloquear
 */
export function getNextAchievements(userStats: Record<string, number>, limit: number = 3): Achievement[] {
  const locked = ACHIEVEMENTS.filter(achievement => !checkAchievement(achievement, userStats));
  
  // Ordenar por qué tan cerca está de desbloquear
  return locked
    .map(achievement => {
      const userValue = userStats[achievement.requirement.type] || 0;
      const progress = (userValue / achievement.requirement.value) * 100;
      return { achievement, progress };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
    .map(item => item.achievement);
}

/**
 * Calcula el progreso de un achievement
 */
export function getAchievementProgress(achievement: Achievement, userStats: Record<string, number>): number {
  const userValue = userStats[achievement.requirement.type] || 0;
  const progress = (userValue / achievement.requirement.value) * 100;
  return Math.min(progress, 100);
}
