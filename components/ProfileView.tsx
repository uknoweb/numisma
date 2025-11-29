"use client";

import { User, Settings, LogOut, Award, TrendingUp, Wallet } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";
import Image from "next/image";

export default function ProfileView() {
  const user = useAppStore((state) => state.user);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);

  if (!user) return null;

  // Estadísticas
  const totalTrades = positions.length;
  const winningTrades = positions.filter((p) => p.status === "closed" && p.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

  const membershipLabel =
    user.membership.tier === "free"
      ? "Gratis"
      : user.membership.tier === "plus"
      ? "Plus"
      : "VIP";

  return (
    <div className="min-h-screen bg-black pb-24 px-4 pt-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <button 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Configuración"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trader</h2>
              <p className="text-sm text-gray-400">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Balance Total</p>
              <p className="text-lg font-bold text-white">
                {formatNumber(user.balanceNuma + user.balanceWld * 1000, 0)} NUMA
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Membresía</p>
              <p className="text-lg font-bold text-indigo-400">{membershipLabel}</p>
            </div>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Estadísticas de Trading
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Trades</span>
              <span className="text-lg font-bold text-white">{totalTrades}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Win Rate</span>
              <span className={`text-lg font-bold ${winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                {winRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total P&L</span>
              <span className={`text-lg font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalPnl >= 0 ? "+" : ""}{formatNumber(totalPnl, 0)} NUMA
              </span>
            </div>
          </div>
        </div>

        {/* Pioneer Status */}
        {currentUserPioneer && (
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl p-6 border border-yellow-500/20">
            <h3 className="text-sm font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Estado Pioneer
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Ranking</span>
                <span className="text-xl font-bold text-yellow-400">
                  #{currentUserPioneer.rank}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Capital Bloqueado</span>
                <span className="text-lg font-bold text-white">
                  {formatNumber(currentUserPioneer.capitalLocked, 0)} WLD
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => setCurrentView("staking")}
            className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-4 flex items-center justify-between transition-colors border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Convertirse en Pioneer</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          
          <button
            onClick={() => setCurrentView("trading")}
            className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-4 flex items-center justify-between transition-colors border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-medium">Mis Posiciones</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
              window.location.reload();
            }
          }}
          className="w-full bg-red-500/10 hover:bg-red-500/20 rounded-xl p-4 flex items-center justify-center gap-3 transition-colors border border-red-500/20"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
