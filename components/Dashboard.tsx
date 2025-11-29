"use client";

import { useAppStore } from "@/lib/store";
import { formatNumber, formatCurrency, formatTimeRemaining } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  Award,
  Clock,
  ArrowRight,
  Coins,
  CandlestickChart,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);

  if (!user) return null;

  // Calcular ganancias/pérdidas totales
  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
  
  // Calcular comisiones totales pagadas
  const totalFeesPaid = positions.reduce((sum, p) => {
    const feeRate = p.symbol === "WLD/USDT" ? 0.001 : 0.01;
    const openingFee = p.amount * feeRate;
    const closingFee = p.status === "closed" ? p.amount * feeRate : 0;
    return sum + openingFee + closingFee;
  }, 0);

  // Membresía
  const membershipLabel =
    user.membership.tier === "free"
      ? "Gratis"
      : user.membership.tier === "plus"
      ? "Plus"
      : "VIP";
  const membershipColor =
    user.membership.tier === "free"
      ? "text-gray-500"
      : user.membership.tier === "plus"
      ? "text-blue-400"
      : "text-[#FFD700]";

  const timeRemaining = user.membership.expiresAt
    ? formatTimeRemaining(user.membership.expiresAt)
    : "∞";

  // Verificar si es pionero top 100
  const isPioneerTop100 = currentUserPioneer && currentUserPioneer.rank <= 100;
  
  // Mensaje de acceso a créditos
  const creditAccessMessage = isPioneerTop100
    ? `✅ Tienes acceso a Créditos (Pionero #${currentUserPioneer.rank})`
    : "🔒 Créditos disponibles solo para Top 100 Pioneros";

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-5 sm:p-6 space-y-6">
        {/* Header con Logo */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Image 
              src="/numisma.png" 
              alt="Numisma Logo" 
              width={56} 
              height={56}
              className="rounded-full shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-black text-gold-gradient">
                Numisma
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Plataforma Educativa de Trading
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-600 uppercase tracking-wide">Plan</div>
            <div className={`text-sm font-bold ${membershipColor}`}>
              {membershipLabel}
            </div>
          </div>
        </div>

        {/* Balance Cards - Estilo DIAMANTE con glassmorphism */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Balance NUMA */}
          <div className="card-premium p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700] opacity-5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#D4AF37] flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-black" />
              </div>
              <span className="text-sm text-gray-400 uppercase tracking-wider font-bold">NUMA</span>
            </div>
            <div className="text-4xl font-black text-[#FFD700] mb-2">
              {formatNumber(user.balanceNuma, 0)}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              ≈ {formatNumber(user.balanceNuma * 0.001, 2)} WLD
            </div>
          </div>

          {/* Balance WLD */}
          <div className="card-premium p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-black" />
              </div>
              <span className="text-sm text-gray-400 uppercase tracking-wider font-bold">WLD</span>
            </div>
            <div className="text-4xl font-black text-white mb-2">
              {formatNumber(user.balanceWld, 2)}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              💰 En vivo
            </div>
          </div>
        </div>

        {/* PnL Card Grande */}
        <div className="card-premium p-8 mb-8 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-40 h-40 ${
            totalPnl >= 0 ? "bg-green-500" : "bg-red-500"
          } opacity-10 rounded-full blur-3xl`}></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${
                totalPnl >= 0 ? "bg-green-500/20" : "bg-red-500/20"
              } flex items-center justify-center shadow-lg`}>
                <TrendingUp className={`w-6 h-6 ${
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                }`} />
              </div>
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Ganancias/Pérdidas</div>
                <div className="text-sm text-gray-500 font-medium">{openPositions.length} posiciones abiertas</div>
              </div>
            </div>
          </div>
          <div className={`text-6xl font-black ${
            totalPnl >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {totalPnl >= 0 ? "+" : ""}{formatNumber(totalPnl, 2)} WLD
          </div>
        </div>

        {/* Estadísticas de Trading */}
        {positions.length > 0 && (
          <div className="card-premium p-4">
            <div className="text-xs text-gray-400 uppercase mb-3">📊 Estadísticas de Trading</div>
            <div className="grid grid-cols-3 gap-5 mt-4">
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Total Trades</div>
                <div className="text-lg font-black text-white">{positions.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Cerradas</div>
                <div className="text-lg font-black text-blue-400">{closedPositions.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Comisiones</div>
                <div className="text-lg font-black text-red-400">
                  {formatNumber(totalFeesPaid, 4)} WLD
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">💡 Optimiza con WLD/USDT (0.1% fee)</span>
                <span className="text-amber-400 font-semibold">vs NUMA/WLD (1% fee)</span>
              </div>
            </div>
          </div>
        )}

        {/* Membership Info */}
        <div className="card-premium p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Award className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div className="text-xs text-gray-600 uppercase font-bold">Plan</div>
              <div className={`font-black text-base mt-1 ${membershipColor}`}>
                {membershipLabel}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div className="text-xs text-gray-600 uppercase font-bold">Tiempo</div>
              <div className="font-black text-base mt-1 text-white">{timeRemaining}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Coins className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div className="text-xs text-gray-600 uppercase font-bold">Diario</div>
              <div className="font-black text-base mt-1 text-white">
                {user.membership.dailyRewards}
              </div>
            </div>
          </div>
        </div>

        {/* Info de Acceso a Créditos */}
        {currentUserPioneer && (
          <div className={`card-premium p-5 ${isPioneerTop100 ? 'border-2 border-[#FFD700]/30' : 'border-2 border-gray-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className={`w-6 h-6 ${isPioneerTop100 ? 'text-[#FFD700]' : 'text-gray-500'}`} />
                <div>
                  <div className="text-base font-black text-white">
                    {isPioneerTop100 ? '🏆 Pionero Elite' : '⏳ Pionero en Espera'}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    Ranking: #{currentUserPioneer.rank} de {currentUserPioneer.rank <= 100 ? '100' : 'Total'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${isPioneerTop100 ? 'text-[#FFD700]' : 'text-gray-500'}`}>
                  {isPioneerTop100 ? 'Créditos Activos' : 'Créditos Bloqueados'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Buttons - Estilo DIAMANTE */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Trading Button */}
          <button
            onClick={() => setCurrentView("plataforma")}
            className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#FFD700]/20 via-[#D4AF37]/10 to-transparent border-2 border-[#FFD700]/30 active:scale-[0.97] transition-all shadow-lg shadow-[#FFD700]/20"
          >
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FFD700] opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#D4AF37] flex items-center justify-center shadow-lg">
                <CandlestickChart className="w-7 h-7 text-black" />
              </div>
              <h3 className="font-black text-lg text-[#FFD700] mb-1">
                Trading
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Posiciones long/short
              </p>
            </div>
          </button>

          {/* Staking Button */}
          <button
            onClick={() => setCurrentView("staking")}
            className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent border-2 border-purple-400/30 active:scale-[0.97] transition-all shadow-lg shadow-purple-500/20"
          >
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500 opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-lg text-purple-400 mb-1">
                Staking
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Recompensas y pioneros
              </p>
            </div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          {/* Membresía */}
          <button
            onClick={() => setCurrentView("staking")}
            className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-500/15 via-blue-600/5 to-transparent border border-blue-400/30 active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">Tu Plan</div>
                <div className={`font-bold text-sm ${membershipColor}`}>
                  {membershipLabel}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              ⏰ {timeRemaining}
            </div>
          </button>

          {/* Pioneer Status */}
          {currentUserPioneer ? (
            <button
              onClick={() => setCurrentView("staking")}
              className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${
                isPioneerTop100 
                  ? "from-[#FFD700]/15 via-[#D4AF37]/5 to-transparent border-2 border-[#FFD700]/30" 
                  : "from-gray-500/15 via-gray-600/5 to-transparent border border-gray-400/30"
              } active:scale-[0.97] transition-all`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPioneerTop100 
                    ? "bg-gradient-to-br from-[#FFD700]/30 to-[#D4AF37]/30" 
                    : "bg-gray-500/30"
                }`}>
                  <Award className={`w-5 h-5 ${isPioneerTop100 ? "text-[#FFD700]" : "text-gray-400"}`} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Pionero</div>
                  <div className={`font-bold text-sm ${isPioneerTop100 ? "text-[#FFD700]" : "text-gray-400"}`}>
                    #{currentUserPioneer.rank}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {isPioneerTop100 ? "✅ Top 100" : "⏳ En espera"}
              </div>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView("staking")}
              className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-500/15 via-amber-600/5 to-transparent border border-amber-400/30 active:scale-[0.97] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Diario</div>
                  <div className="font-bold text-sm text-amber-400">
                    {user.membership.dailyRewards}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                🎁 NUMA tokens
              </div>
            </button>
          )}
        </div>

        {/* Estadísticas de Trading */}
        {positions.length > 0 && (
          <div className="card-premium p-5">
            <div className="text-xs text-gray-400 uppercase mb-4 font-semibold tracking-wider">📊 Estadísticas</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-black/40 rounded-xl">
                <div className="text-2xl font-bold text-white">{positions.length}</div>
                <div className="text-[10px] text-gray-500 mt-1">Total</div>
              </div>
              <div className="text-center p-3 bg-black/40 rounded-xl">
                <div className="text-2xl font-bold text-green-400">
                  {positions.filter((p) => p.status === "closed" && p.pnl > 0).length}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Ganados</div>
              </div>
              <div className="text-center p-3 bg-black/40 rounded-xl">
                <div className="text-2xl font-bold text-red-400">
                  {positions.filter((p) => p.status === "closed" && p.pnl < 0).length}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Perdidos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
