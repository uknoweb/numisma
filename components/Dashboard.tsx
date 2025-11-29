"use client";

import { useState } from "react";
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
  CandlestickChart,
  X,
  History,
} from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);
  const transactions = useAppStore((state) => state.transactions);
  
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedToken, setSelectedToken] = useState<"NUMA" | "WLD" | "ALL">("ALL");

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
          <button
            onClick={() => {
              setSelectedToken("NUMA");
              setShowTransactionHistory(true);
            }}
            className="card-modern p-6 text-left hover:shadow-lg transition-all cursor-pointer"
          >
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
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>≈ {formatNumber(user.balanceNuma * 0.001, 2)} WLD</span>
              <History className="w-4 h-4" />
            </div>
          </button>

          {/* WLD */}
          <button
            onClick={() => {
              setSelectedToken("WLD");
              setShowTransactionHistory(true);
            }}
            className="card-modern p-6 text-left hover:shadow-lg transition-all cursor-pointer"
          >
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
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>💰 En tiempo real</span>
              <History className="w-4 h-4" />
            </div>
          </button>
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
          {/* Trading */}
          <button
            onClick={() => setCurrentView("trading")}
            className="card-modern p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CandlestickChart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Trading de Futuros</h3>
                  <p className="text-sm text-gray-500">Opera WLD/USDT y NUMA/WLD con apalancamiento</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

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

      {/* Modal de Historial de Transacciones */}
      {showTransactionHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Historial de Transacciones</h3>
                <p className="text-sm text-gray-500">
                  {selectedToken === "ALL" ? "Todas las transacciones" : `Transacciones de ${selectedToken}`}
                </p>
              </div>
              <button
                onClick={() => setShowTransactionHistory(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filtros */}
            <div className="px-6 py-4 border-b border-gray-200 flex gap-2">
              <button
                onClick={() => setSelectedToken("ALL")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedToken === "ALL"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSelectedToken("NUMA")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedToken === "NUMA"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                NUMA
              </button>
              <button
                onClick={() => setSelectedToken("WLD")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedToken === "WLD"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                WLD
              </button>
            </div>

            {/* Lista de transacciones */}
            <div className="flex-1 overflow-y-auto p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No hay transacciones aún</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Tus movimientos aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions
                    .filter(tx => selectedToken === "ALL" || tx.token === selectedToken)
                    .map((tx) => {
                      const isPositive = tx.type === "staking_claim" || 
                                        tx.type === "pioneer_withdraw" ||
                                        tx.type === "trading_close";
                      
                      return (
                        <div
                          key={tx.id}
                          className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-gray-900 text-sm">
                                {tx.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(tx.timestamp).toLocaleString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <div className={`text-lg font-bold ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}>
                              {isPositive ? "+" : "-"}{formatNumber(Math.abs(tx.amount), 2)} {tx.token}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <span>Balance después:</span>
                            <span className="font-bold">
                              {formatNumber(tx.balanceAfter.numa, 0)} NUMA · {formatNumber(tx.balanceAfter.wld, 2)} WLD
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTransactionHistory(false)}
                className="w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
