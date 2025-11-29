"use client";

import { useGamification } from "@/hooks/useGamification";
import { Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Componente compacto para mostrar XP y nivel en la UI
 */
export default function LevelBadge() {
  const { levelInfo } = useGamification();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(levelInfo.level);

  useEffect(() => {
    if (levelInfo.level > previousLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPreviousLevel(levelInfo.level);
  }, [levelInfo.level]);

  return (
    <>
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full px-4 py-2 flex items-center gap-2 border border-purple-500/30">
        <Star className="w-4 h-4 text-yellow-400" />
        <div>
          <p className="text-xs text-gray-400">Nivel {levelInfo.level}</p>
          <div className="flex items-center gap-1">
            <div className="h-1 w-16 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <span className="text-xs text-white/60">{levelInfo.progress.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center animate-bounce shadow-2xl">
            <TrendingUp className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">¡Nivel {levelInfo.level}!</h2>
            <p className="text-xl text-white/80">{levelInfo.title}</p>
          </div>
        </div>
      )}
    </>
  );
}
