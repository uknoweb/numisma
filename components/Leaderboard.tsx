"use client";

import { useState } from "react";
import { 
  LeaderboardType, 
  LeaderboardEntry,
  LEADERBOARD_CONFIG,
  getRankBadgeColor,
  getRankIcon,
  formatRankChange,
  calculatePercentile,
  getMockLeaderboardData
} from "@/lib/leaderboards";
import { useAppStore } from "@/lib/store";
import { Trophy, TrendingUp, Crown, Medal } from "lucide-react";

export default function Leaderboard() {
  const user = useAppStore((state) => state.user);
  const [selectedType, setSelectedType] = useState<LeaderboardType>('pnl_all_time');
  
  // TODO: Reemplazar con datos reales de la API
  const leaderboard = getMockLeaderboardData(selectedType, user?.wallet_address);
  const config = LEADERBOARD_CONFIG[selectedType];

  // Top 3 + usuario + contexto
  const topThree = leaderboard.entries.slice(0, 3);
  const restOfTop10 = leaderboard.entries.slice(3, 10);
  const userEntry = leaderboard.userRank 
    ? leaderboard.entries[leaderboard.userRank - 1]
    : null;

  return (
    <div className="space-y-6 pb-24">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(LEADERBOARD_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as LeaderboardType)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span className="mr-2">{cfg.icon}</span>
            {cfg.title.split(' ')[1] || cfg.title}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-2xl p-6 border border-yellow-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">{config.title}</h1>
        </div>
        <p className="text-sm text-gray-400">{config.description}</p>
        <p className="text-xs text-gray-500 mt-2">
          Actualizado: {leaderboard.lastUpdated.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {/* User Position (si no está en top 10) */}
      {userEntry && userEntry.rank > 10 && (
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl p-4 border-2 border-blue-500/40">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-bold text-white">Tu Posición</p>
          </div>
          <LeaderboardRow entry={userEntry} config={config} highlight />
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400">
              Top {calculatePercentile(userEntry.rank, leaderboard.entries.length).toFixed(1)}% de todos los usuarios
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="pt-8">
            <PodiumCard 
              entry={topThree[1]} 
              config={config}
              position={2}
            />
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div>
            <PodiumCard 
              entry={topThree[0]} 
              config={config}
              position={1}
            />
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="pt-16">
            <PodiumCard 
              entry={topThree[2]} 
              config={config}
              position={3}
            />
          </div>
        )}
      </div>

      {/* Rest of Top 10 */}
      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-purple-400" />
            Top 10
          </h3>
        </div>
        <div className="divide-y divide-white/10">
          {restOfTop10.map((entry) => (
            <LeaderboardRow 
              key={entry.userId} 
              entry={entry} 
              config={config}
              highlight={entry.userId === user?.id}
            />
          ))}
        </div>
      </div>

      {/* CTA para membresía si no es VIP */}
      {user?.membership_tier !== 'vip' && (
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h3 className="font-bold text-white">Sube de Ranking</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Los miembros VIP obtienen bonos de trading que te ayudan a escalar posiciones más rápido
          </p>
          <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold">
            Mejorar a VIP
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para el podio
function PodiumCard({ 
  entry, 
  config, 
  position 
}: { 
  entry: LeaderboardEntry; 
  config: typeof LEADERBOARD_CONFIG[LeaderboardType];
  position: number;
}) {
  const heights = {
    1: 'h-32',
    2: 'h-24',
    3: 'h-16',
  };

  const gradients = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-amber-600 to-amber-800',
  };

  return (
    <div className="text-center">
      <div className={`bg-gradient-to-br ${gradients[position as keyof typeof gradients]} rounded-t-xl p-3 ${heights[position as keyof typeof heights]} flex items-end justify-center`}>
        <div className="text-4xl mb-2">
          {getRankIcon(position)}
        </div>
      </div>
      <div className="bg-white/10 rounded-b-xl p-3">
        <p className="text-xs text-gray-400 truncate">
          {entry.username || `${entry.walletAddress.slice(0, 6)}...`}
        </p>
        <p className="text-sm font-bold text-white mt-1">
          {config.formatValue(entry.value)}
        </p>
        {entry.change !== undefined && (
          <p className={`text-xs mt-1 ${formatRankChange(entry.change).color}`}>
            {formatRankChange(entry.change).icon} {formatRankChange(entry.change).text}
          </p>
        )}
      </div>
    </div>
  );
}

// Componente para fila de ranking
function LeaderboardRow({ 
  entry, 
  config,
  highlight = false
}: { 
  entry: LeaderboardEntry; 
  config: typeof LEADERBOARD_CONFIG[LeaderboardType];
  highlight?: boolean;
}) {
  const rankColor = getRankBadgeColor(entry.rank);
  const change = formatRankChange(entry.change);

  return (
    <div className={`p-4 ${highlight ? 'bg-blue-500/20' : 'hover:bg-white/5'} transition-colors`}>
      <div className="flex items-center gap-3">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${rankColor} flex items-center justify-center`}>
          <span className="text-xl font-bold text-white">
            {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
          </span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white truncate">
              {entry.username || `${entry.walletAddress.slice(0, 8)}...${entry.walletAddress.slice(-4)}`}
            </p>
            {entry.membershipTier === 'vip' && (
              <span className="text-xs">👑</span>
            )}
            {entry.membershipTier === 'plus' && (
              <span className="text-xs">⭐</span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {config.formatValue(entry.value)}
          </p>
        </div>

        {/* Change */}
        {entry.change !== undefined && (
          <div className="flex-shrink-0 text-right">
            <p className={`text-sm font-bold ${change.color}`}>
              {change.icon} {change.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
