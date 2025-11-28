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
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-gold-gradient flex items-center gap-2">
              <Coins className="w-7 h-7 text-[#FFD700]" />
              Numisma
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Plataforma Educativa
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-600 uppercase tracking-wide">Plan</div>
            <div className={`text-sm font-bold ${membershipColor}`}>
              {membershipLabel}
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Balance NUMA */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">NUMA</span>
            </div>
            <div className="text-xl font-bold text-[#FFD700]">
              {formatNumber(user.balanceNuma, 0)}
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              ≈ {formatNumber(user.balanceNuma * 0.001, 2)} WLD
            </div>
          </div>

          {/* Balance WLD */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">WLD</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatNumber(user.balanceWld, 2)}
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              💰 Actualizado en vivo
            </div>
          </div>

          {/* PnL */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">P&L</span>
            </div>
            <div
              className={`text-xl font-bold ${
                totalPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {totalPnl >= 0 ? "+" : ""}{formatNumber(totalPnl, 1)}
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              {openPositions.length} pos.
            </div>
          </div>
        </div>

        {/* Estadísticas de Trading */}
        {positions.length > 0 && (
          <div className="card-premium p-4">
            <div className="text-xs text-gray-400 uppercase mb-3">📊 Estadísticas de Trading</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-gray-500">Total Trades</div>
                <div className="text-base font-bold text-white">{positions.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Cerradas</div>
                <div className="text-base font-bold text-blue-400">{closedPositions.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Comisiones</div>
                <div className="text-base font-bold text-red-400">
                  {formatNumber(totalFeesPaid, 4)} WLD
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">💡 Optimiza con WLD/USDT (0.1% fee)</span>
                <span className="text-amber-400">vs NUMA/WLD (1% fee)</span>
              </div>
            </div>
          </div>
        )}

        {/* Membership Info */}
        <div className="card-premium p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="text-[10px] text-gray-600 uppercase">Plan</div>
              <div className={`font-bold text-sm ${membershipColor}`}>
                {membershipLabel}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="text-[10px] text-gray-600 uppercase">Tiempo</div>
              <div className="font-bold text-sm text-white">{timeRemaining}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="text-[10px] text-gray-600 uppercase">Diario</div>
              <div className="font-bold text-sm text-white">
                {user.membership.dailyRewards}
              </div>
            </div>
          </div>
        </div>

        {/* Info de Acceso a Créditos */}
        {currentUserPioneer && (
          <div className={`card-premium p-4 ${isPioneerTop100 ? 'border border-[#FFD700]/30' : 'border border-gray-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className={`w-5 h-5 ${isPioneerTop100 ? 'text-[#FFD700]' : 'text-gray-500'}`} />
                <div>
                  <div className="text-sm font-semibold text-white">
                    {isPioneerTop100 ? '🏆 Pionero Elite' : '⏳ Pionero en Espera'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ranking: #{currentUserPioneer.rank} de {currentUserPioneer.rank <= 100 ? '100' : 'Total'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium ${isPioneerTop100 ? 'text-[#FFD700]' : 'text-gray-500'}`}>
                  {isPioneerTop100 ? 'Créditos Activos' : 'Créditos Bloqueados'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className={`grid ${isPioneerTop100 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          {/* Plataforma */}
          <button
            onClick={() => setCurrentView("plataforma")}
            className="card-premium p-5 flex flex-col items-start gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 flex items-center justify-center">
              <CandlestickChart className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-base text-[#FFD700] mb-1">
                Trading
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Gráficos y posiciones
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FFD700] ml-auto" />
          </button>

          {/* Staking */}
          <button
            onClick={() => setCurrentView("staking")}
            className="card-premium p-5 flex flex-col items-start gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-base text-[#FFD700] mb-1">
                Staking
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Recompensas y swap
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FFD700] ml-auto" />
          </button>

          {/* Créditos - Solo para Top 100 Pioneros */}
          {isPioneerTop100 && (
            <button
              onClick={() => setCurrentView("creditos")}
              className="card-premium p-5 flex flex-col items-start gap-4 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-[#FFD700] mb-1">
                  Créditos
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Préstamos Pioneer
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FFD700] ml-auto" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card-premium p-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
              <div className="text-xl font-bold text-[#FFD700]">
                x{user.membership.maxLeverage}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Apalancamiento
              </div>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
              <div className="text-xl font-bold text-white">
                {formatNumber(user.balanceNuma + user.balanceWld * 1000, 0)}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Capital (NUMA)
              </div>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
              <div className="text-xl font-bold text-[#22c55e]">
                {positions.filter((p) => p.status === "closed" && p.pnl > 0).length}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Ganadores
              </div>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
              <div className="text-xl font-bold text-[#ef4444]">
                {positions.filter((p) => p.status === "closed" && p.pnl < 0).length}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Perdedores
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
