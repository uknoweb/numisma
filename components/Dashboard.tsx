"use client";

import { useAppStore } from "@/lib/store";
import { formatNumber, formatCurrency, formatTimeRemaining } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  if (!user) return null;

  // Calcular ganancias/pérdidas totales
  const openPositions = positions.filter((p) => p.status === "open");
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnlMXN = totalPnl * 20; // Simulación: 1 WLD = 20 MXN

  // Membresía
  const membershipLabel =
    user.membership.tier === "free"
      ? "Gratis"
      : user.membership.tier === "plus"
      ? "Plus"
      : "VIP";
  const membershipColor =
    user.membership.tier === "free"
      ? "text-gray-400"
      : user.membership.tier === "plus"
      ? "text-blue-400"
      : "text-[--color-gold]";

  const timeRemaining = user.membership.expiresAt
    ? formatTimeRemaining(user.membership.expiresAt)
    : "Sin límite";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[--color-gold] flex items-center gap-3">
              <Coins className="w-8 h-8" />
              Numisma
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Plataforma Educativa de Trading
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Membresía</div>
            <div className={`text-lg font-semibold ${membershipColor}`}>
              {membershipLabel}
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Balance NUMA */}
          <Card className="border-[--color-gold]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Balance NUMA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[--color-gold]">
                {formatNumber(user.balanceNuma, 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ≈ {formatNumber(user.balanceNuma * 0.001, 3)} WLD
              </div>
            </CardContent>
          </Card>

          {/* Balance WLD */}
          <Card className="border-[--color-gold]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Balance WLD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatNumber(user.balanceWld, 2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ≈ {formatCurrency(user.balanceWld * 20)}
              </div>
            </CardContent>
          </Card>

          {/* PnL */}
          <Card className="border-[--color-gold]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ganancias/Pérdidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalPnl >= 0 ? "text-[--color-success]" : "text-[--color-error]"
                }`}
              >
                {totalPnl >= 0 ? "+" : ""}
                {formatCurrency(totalPnlMXN)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {openPositions.length} posiciones abiertas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Membership Info */}
        <Card className="border-[--color-gold]/20 bg-gradient-to-r from-[--color-gray-900] to-[--color-gray-800]">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-[--color-gold]" />
                <div>
                  <div className="text-xs text-gray-500">Plan Actual</div>
                  <div className={`font-semibold ${membershipColor}`}>
                    {membershipLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[--color-gold]" />
                <div>
                  <div className="text-xs text-gray-500">Tiempo Restante</div>
                  <div className="font-semibold text-white">{timeRemaining}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-[--color-gold]" />
                <div>
                  <div className="text-xs text-gray-500">Recompensa Diaria</div>
                  <div className="font-semibold text-[--color-gold]">
                    {user.membership.dailyRewards} NUMA
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Botón 1: Plataforma */}
          <Button
            onClick={() => setCurrentView("plataforma")}
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-3 hover:border-[--color-gold] hover:bg-[--color-gold]/10"
          >
            <div className="w-12 h-12 rounded-lg bg-[--color-gold]/10 flex items-center justify-center">
              <CandlestickChart className="w-6 h-6 text-[--color-gold]" />
            </div>
            <div className="text-left w-full">
              <h3 className="font-semibold text-lg text-[--color-gold] mb-1">
                Plataforma
              </h3>
              <p className="text-xs text-gray-400">
                Trading, gráficos y historial de posiciones
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[--color-gold] ml-auto" />
          </Button>

          {/* Botón 2: Staking */}
          <Button
            onClick={() => setCurrentView("staking")}
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-3 hover:border-[--color-gold] hover:bg-[--color-gold]/10"
          >
            <div className="w-12 h-12 rounded-lg bg-[--color-gold]/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-[--color-gold]" />
            </div>
            <div className="text-left w-full">
              <h3 className="font-semibold text-lg text-[--color-gold] mb-1">
                Staking
              </h3>
              <p className="text-xs text-gray-400">
                Swap, membresías, pioneros y recompensas
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[--color-gold] ml-auto" />
          </Button>

          {/* Botón 3: Créditos (placeholder) */}
          <Button
            onClick={() => setCurrentView("creditos")}
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-3 hover:border-[--color-gold] hover:bg-[--color-gold]/10 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="w-12 h-12 rounded-lg bg-[--color-gold]/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[--color-gold]" />
            </div>
            <div className="text-left w-full">
              <h3 className="font-semibold text-lg text-[--color-gold] mb-1">
                Créditos
              </h3>
              <p className="text-xs text-gray-400">
                Préstamos garantizados (Pioneros)
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[--color-gold] ml-auto" />
          </Button>
        </div>

        {/* Quick Stats */}
        <Card className="border-[--color-gold]/20">
          <CardHeader>
            <CardTitle className="text-base">Resumen Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[--color-gold]">
                  x{user.membership.maxLeverage}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Apalancamiento Máx.
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(user.balanceNuma + user.balanceWld * 1000, 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Capital Total (NUMA)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[--color-success]">
                  {positions.filter((p) => p.status === "closed" && p.pnl > 0).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Trades Ganadores</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[--color-error]">
                  {positions.filter((p) => p.status === "closed" && p.pnl < 0).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Trades Perdedores</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
