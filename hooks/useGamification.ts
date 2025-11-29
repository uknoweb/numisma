import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Achievement, 
  ACHIEVEMENTS, 
  calculateLevel, 
  checkAchievement,
  getUnlockedAchievements,
  getNextAchievements,
  getAchievementProgress
} from '@/lib/achievements';
import analytics from '@/lib/analytics';
import notifications from '@/lib/notifications';

/**
 * Hook para manejar gamificación (XP, levels, achievements)
 */
export function useGamification() {
  const user = useAppStore((state) => state.user);
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [nextAchievements, setNextAchievements] = useState<Achievement[]>([]);
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    title: 'Novato',
    xpForNext: 100,
    progress: 0,
  });

  // Cargar stats del usuario
  useEffect(() => {
    if (user) {
      // TODO: Obtener stats reales de la base de datos
      // Por ahora usamos valores por defecto
      const stats = {
        positions_opened: 0,
        positions_closed: 0,
        profitable_trades: 0,
        win_streak: 0,
        high_leverage_wins: 0,
        is_pioneer: 0,
        pioneer_rank: 0,
        referrals_count: 0,
        membership_tier: user.membershipTier === 'free' ? 0 : user.membershipTier === 'plus' ? 1 : 2,
        consecutive_months: user.consecutiveMonths || 0,
        onboarding_completed: 1, // Asumimos que si está logueado, completó onboarding
        daily_streak: 1,
      };

      setUserStats(stats);
      
      // Calcular nivel
      const xp = 0; // TODO: Obtener XP real del usuario
      setLevelInfo(calculateLevel(xp));
      
      // Obtener achievements
      setUnlockedAchievements(getUnlockedAchievements(stats));
      setNextAchievements(getNextAchievements(stats, 3));
    }
  }, [user]);

  /**
   * Incrementa una estadística y verifica achievements
   */
  const incrementStat = async (statName: string, value: number = 1) => {
    const newStats = {
      ...userStats,
      [statName]: (userStats[statName] || 0) + value,
    };
    
    setUserStats(newStats);

    // Verificar si se desbloqueó algún achievement
    const newlyUnlocked = ACHIEVEMENTS.filter(achievement => {
      const wasLocked = !checkAchievement(achievement, userStats);
      const isNowUnlocked = checkAchievement(achievement, newStats);
      return wasLocked && isNowUnlocked;
    });

    // Notificar achievements desbloqueados
    for (const achievement of newlyUnlocked) {
      await unlockAchievement(achievement);
    }

    // Actualizar listas
    setUnlockedAchievements(getUnlockedAchievements(newStats));
    setNextAchievements(getNextAchievements(newStats, 3));
  };

  /**
   * Desbloquea un achievement
   */
  const unlockAchievement = async (achievement: Achievement) => {
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);

    // Dar recompensas
    if (user) {
      const newXp = (levelInfo.level * 100) + achievement.xpReward; // Aproximación
      const newLevel = calculateLevel(newXp);
      
      setLevelInfo(newLevel);

      // Si sube de nivel
      if (newLevel.level > levelInfo.level) {
        console.log(`⬆️ Level up! Now level ${newLevel.level}: ${newLevel.title}`);
        
        // Notificar level up
        await notifications.showLocalNotification({
          title: `⬆️ ¡Nivel ${newLevel.level}!`,
          body: `Ahora eres ${newLevel.title}`,
          icon: '⭐',
        });

        // Track analytics
        analytics.track('level_up', {
          newLevel: newLevel.level,
          newTitle: newLevel.title,
          xp: newXp,
        });
      }

      // Notificar achievement
      await notifications.notifyAchievementUnlocked(achievement.name);

      // Track analytics
      analytics.track('achievement_unlocked', {
        achievementId: achievement.id,
        achievementName: achievement.name,
        category: achievement.category,
        tier: achievement.tier,
        xpReward: achievement.xpReward,
        numaReward: achievement.numaReward,
      });

      // TODO: Guardar en base de datos
      // await saveAchievementToDatabase(user.id, achievement.id);
      
      // TODO: Dar recompensas NUMA
      // if (achievement.numaReward) {
      //   await rewardNuma(user.id, achievement.numaReward);
      // }
    }

    return achievement;
  };

  /**
   * Obtiene el progreso de un achievement específico
   */
  const getProgress = (achievementId: string): number => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return 0;
    return getAchievementProgress(achievement, userStats);
  };

  /**
   * Verifica si un achievement está desbloqueado
   */
  const isUnlocked = (achievementId: string): boolean => {
    return unlockedAchievements.some(a => a.id === achievementId);
  };

  /**
   * Helpers para trackear acciones específicas
   */

  const trackPositionOpened = async (type: 'long' | 'short', leverage: number) => {
    await incrementStat('positions_opened');
    
    if (leverage >= 10) {
      await incrementStat('high_leverage_wins'); // Se incrementará si gana
    }
  };

  const trackPositionClosed = async (pnl: number) => {
    await incrementStat('positions_closed');
    
    if (pnl > 0) {
      await incrementStat('profitable_trades');
      await incrementStat('win_streak');
    } else {
      setUserStats({ ...userStats, win_streak: 0 }); // Reset streak
    }
  };

  const trackBecomePioneer = async () => {
    await incrementStat('is_pioneer', 1);
  };

  const trackPioneerRank = async (rank: number) => {
    setUserStats({ ...userStats, pioneer_rank: rank });
  };

  const trackReferral = async () => {
    await incrementStat('referrals_count');
  };

  const trackMembershipUpgrade = async (tier: 'plus' | 'vip') => {
    const tierValue = tier === 'plus' ? 1 : 2;
    setUserStats({ ...userStats, membership_tier: tierValue });
  };

  const trackDailyLogin = async () => {
    // TODO: Implementar lógica de daily streak
    // Verificar si es consecutivo o resetear
    await incrementStat('daily_streak');
  };

  return {
    // State
    userStats,
    unlockedAchievements,
    nextAchievements,
    levelInfo,
    totalAchievements: ACHIEVEMENTS.length,
    unlockedCount: unlockedAchievements.length,

    // Actions
    incrementStat,
    unlockAchievement,
    getProgress,
    isUnlocked,

    // Tracking helpers
    trackPositionOpened,
    trackPositionClosed,
    trackBecomePioneer,
    trackPioneerRank,
    trackReferral,
    trackMembershipUpgrade,
    trackDailyLogin,

    // Computed
    completionRate: (unlockedAchievements.length / ACHIEVEMENTS.length) * 100,
  };
}
