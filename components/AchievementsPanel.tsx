"use client";

import { useGamification } from "@/hooks/useGamification";
import { Trophy, Star, Lock, TrendingUp } from "lucide-react";
import { Achievement, ACHIEVEMENTS } from "@/lib/achievements";

export default function AchievementsPanel() {
  const {
    unlockedAchievements,
    nextAchievements,
    levelInfo,
    totalAchievements,
    unlockedCount,
    completionRate,
    getProgress,
    isUnlocked,
  } = useGamification();

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'from-amber-700 to-amber-900';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      case 'diamond': return 'from-cyan-400 to-cyan-600';
    }
  };

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'trading': return 'bg-blue-500/20 text-blue-400';
      case 'pioneer': return 'bg-purple-500/20 text-purple-400';
      case 'social': return 'bg-green-500/20 text-green-400';
      case 'membership': return 'bg-yellow-500/20 text-yellow-400';
      case 'milestone': return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Level Progress */}
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">
                Nivel {levelInfo.level}
              </h2>
            </div>
            <p className="text-purple-300">{levelInfo.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Siguiente nivel</p>
            <p className="text-lg font-bold text-white">{levelInfo.xpForNext} XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-black/40 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${levelInfo.progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">
          {levelInfo.progress.toFixed(1)}% completado
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{unlockedCount}</p>
          <p className="text-xs text-gray-400">Desbloqueados</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalAchievements - unlockedCount}</p>
          <p className="text-xs text-gray-400">Bloqueados</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{completionRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Completado</p>
        </div>
      </div>

      {/* Próximos Achievements */}
      {nextAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Próximos a Desbloquear
          </h3>
          <div className="space-y-3">
            {nextAchievements.map((achievement) => {
              const progress = getProgress(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl filter grayscale opacity-50`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="font-bold text-white">{achievement.name}</h4>
                          <p className="text-sm text-gray-400">{achievement.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-400">
                            +{achievement.xpReward} XP
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progreso</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="mt-2 flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getTierColor(achievement.tier)} text-white`}>
                          {achievement.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements Desbloqueados */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Achievements Desbloqueados ({unlockedCount})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {unlockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-br ${getTierColor(achievement.tier)} rounded-xl p-4 border border-white/20`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h4 className="font-bold text-white text-sm mb-1">{achievement.name}</h4>
              <p className="text-xs text-white/80 mb-2">{achievement.description}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-300" />
                <span className="text-xs font-bold text-yellow-300">
                  +{achievement.xpReward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Todos los Achievements (Bloqueados) */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-400" />
          Todos los Achievements
        </h3>
        <div className="space-y-2">
          {ACHIEVEMENTS.filter(a => !isUnlocked(a.id)).map((achievement) => (
            <div
              key={achievement.id}
              className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3 opacity-60"
            >
              <div className="text-2xl filter grayscale">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">{achievement.name}</h4>
                <p className="text-xs text-gray-400">{achievement.description}</p>
              </div>
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
