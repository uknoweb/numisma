"use client";

import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";
import {
  Wallet,
  Award,
  Clock,
  Coins,
  TrendingUp,
  ArrowRight,
  Trophy,
} from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);

  if (!user) return null;

  // Calcular estadísticas
  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);

  // Membresía
  const membershipLabel =
    user.membership.tier === "free"
      ? "Gratis"
      : user.membership.tier === "plus"
      ? "Plus"
      : "VIP";

  const isPioneerTop100 = currentUserPioneer && currentUserPioneer.rank <= 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Image 
            src="/numisma.png" 
            alt="Numisma" 
            width={56} 
            height={56}
            className="rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Numisma</h1>
            <p className="text-sm text-gray-500">Plataforma educativa de trading</p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* NUMA */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium">Balance NUMA</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatNumber(user.balanceNuma, 0)}
            </div>
            <div className="text-sm text-gray-500">
              ≈ {formatNumber(user.balanceNuma * 0.001, 2)} WLD
            </div>
          </div>

          {/* WLD */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium">Balance WLD</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatNumber(user.balanceWld, 2)}
            </div>
            <div className="text-sm text-gray-500">
              💰 En tiempo real
            </div>
          </div>
        </div>

        {/* P&L Card */}
        {positions.length > 0 && (
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  totalPnl >= 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    totalPnl >= 0 ? "text-green-600" : "text-red-600"
                  }`} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Ganancias/Pérdidas</div>
                  <div className="text-xs text-gray-400">{openPositions.length} posiciones abiertas</div>
                </div>
              </div>
            </div>
            <div className={`text-5xl font-bold ${
              totalPnl >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {totalPnl >= 0 ? "+" : ""}{formatNumber(totalPnl, 2)} WLD
            </div>
          </div>
        )}

        {/* Membership Info */}
        <div className="card-modern p-6">
          <div className="text-sm text-gray-500 font-medium mb-4">Tu Membresía</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-xs text-gray-500">Plan</div>
              <div className="font-bold text-gray-900 mt-1">{membershipLabel}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-xs text-gray-500">Duración</div>
              <div className="font-bold text-gray-900 mt-1">
                {user.membership.expiresAt ? "1 año" : "∞"}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-xs text-gray-500">Diario</div>
              <div className="font-bold text-gray-900 mt-1">
                {user.membership.dailyRewards}
              </div>
            </div>
          </div>
        </div>

        {/* Pioneer Status */}
        {currentUserPioneer && (
          <div className="card-modern p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isPioneerTop100 ? "bg-yellow-100" : "bg-gray-100"
                }`}>
                  <Trophy className={`w-6 h-6 ${
                    isPioneerTop100 ? "text-yellow-600" : "text-gray-400"
                  }`} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {isPioneerTop100 ? "🏆 Pionero Elite" : "⏳ Pionero en Espera"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Ranking: #{currentUserPioneer.rank}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                isPioneerTop100 
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {isPioneerTop100 ? "Top 100" : "En espera"}
              </div>
            </div>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-1 gap-4">
          {/* Staking */}
          <button
            onClick={() => setCurrentView("staking")}
            className="card-modern p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Staking</h3>
                  <p className="text-sm text-gray-500">Recompensas y sistema de pioneros</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Créditos (si es top 100) */}
          {isPioneerTop100 && (
            <button
              onClick={() => setCurrentView("creditos")}
              className="card-modern p-6 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Créditos</h3>
                    <p className="text-sm text-gray-500">Préstamos garantizados hasta 50%</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}
        </div>

        {/* Trading Stats */}
        {positions.length > 0 && (
          <div className="card-modern p-6">
            <div className="text-sm text-gray-500 font-medium mb-4">📊 Estadísticas de Trading</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {positions.filter((p) => p.status === "closed" && p.pnl > 0).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Ganados</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">
                  {positions.filter((p) => p.status === "closed" && p.pnl < 0).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Perdidos</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
