"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatNumber, formatCurrency, calculatePnL } from "@/lib/utils";

export default function Plataforma() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const user = useAppStore((state) => state.user);
  const [showTutorial, setShowTutorial] = useState(false);

  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentView("dashboard")}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Menú
          </Button>
          <h1 className="text-2xl font-bold text-[--color-gold]">
            Plataforma de Trading
          </h1>
          <div className="w-32" /> {/* Spacer para centrar el título */}
        </div>

        {/* Tutorial desplegable */}
        <Card className="border-[--color-gold]/20">
          <CardHeader
            className="cursor-pointer hover:bg-[--color-gray-800] transition-colors"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[--color-gold]" />
                <CardTitle className="text-base">
                  Guía de Navegación y Trading
                </CardTitle>
              </div>
              {showTutorial ? (
                <ChevronUp className="w-5 h-5 text-[--color-gold]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[--color-gold]" />
              )}
            </div>
          </CardHeader>
          {showTutorial && (
            <CardContent className="space-y-4 pt-0">
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] text-sm">
                  📊 Cómo Funciona la Plataforma
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      <strong className="text-white">Posición LONG:</strong> Ganas
                      cuando el precio sube. Ideal para mercados alcistas.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      <strong className="text-white">Posición SHORT:</strong> Ganas
                      cuando el precio baja. Ideal para mercados bajistas.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      <strong className="text-white">Apalancamiento (Leverage):</strong>{" "}
                      Multiplica tus ganancias (y pérdidas). Tu plan{" "}
                      {user?.membership.tier.toUpperCase()} permite hasta x
                      {user?.membership.maxLeverage}.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      <strong className="text-white">PnL (Profit and Loss):</strong>{" "}
                      Ganancia o pérdida actual de tu posición en tiempo real.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] text-sm">
                  ⚠️ Advertencia Importante
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Esta es una plataforma <strong className="text-white">educativa</strong>.
                  Tus posiciones NO operan contra el mercado real, sino contra el{" "}
                  <strong className="text-[--color-gold]">
                    Pool de Riesgo de Numisma
                  </strong>
                  . El objetivo es aprender trading de futuros sin riesgo real.
                </p>
              </div>

              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] text-sm">
                  🎯 Navegación del Gráfico
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      Usa los botones de tiempo (1s, 1m, 5m, 10m, 30m) para cambiar
                      el intervalo del gráfico.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      El gráfico muestra precios históricos simulados de BTC/USDT.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[--color-gold]">•</span>
                    <span>
                      Tus posiciones abiertas se actualizan automáticamente con el
                      precio actual.
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Historial de Posiciones */}
        <Card className="border-[--color-gold]/20">
          <CardHeader>
            <CardTitle className="text-lg">Historial de Posiciones</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Posiciones Abiertas */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-[--color-gold] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Abiertas ({openPositions.length})
              </h4>
              {openPositions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tienes posiciones abiertas. Abre el gráfico para empezar a
                  operar.
                </div>
              ) : (
                <div className="space-y-2">
                  {openPositions.map((position) => (
                    <div
                      key={position.id}
                      className="bg-[--color-gray-800] rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {position.type === "long" ? (
                            <TrendingUp className="w-4 h-4 text-[--color-success]" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-[--color-error]" />
                          )}
                          <span className="font-semibold text-white">
                            {position.symbol}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              position.type === "long"
                                ? "bg-[--color-success]/20 text-[--color-success]"
                                : "bg-[--color-error]/20 text-[--color-error]"
                            }`}
                          >
                            {position.type.toUpperCase()}
                          </span>
                        </div>
                        <div
                          className={`font-semibold ${
                            position.pnl >= 0
                              ? "text-[--color-success]"
                              : "text-[--color-error]"
                          }`}
                        >
                          {position.pnl >= 0 ? "+" : ""}
                          {formatCurrency(position.pnl * 20)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                        <div>
                          <div className="text-gray-500">Entrada</div>
                          <div className="text-white">
                            ${formatNumber(position.entryPrice, 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Actual</div>
                          <div className="text-white">
                            ${formatNumber(position.currentPrice, 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Apal.</div>
                          <div className="text-[--color-gold]">
                            x{position.leverage}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">PnL %</div>
                          <div
                            className={
                              position.pnlPercentage >= 0
                                ? "text-[--color-success]"
                                : "text-[--color-error]"
                            }
                          >
                            {position.pnlPercentage >= 0 ? "+" : ""}
                            {formatNumber(position.pnlPercentage, 2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posiciones Cerradas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Cerradas ({closedPositions.length})
              </h4>
              {closedPositions.length === 0 ? (
                <div className="text-center py-4 text-gray-600 text-sm">
                  Sin historial de posiciones cerradas.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {closedPositions.slice(0, 5).map((position) => (
                    <div
                      key={position.id}
                      className="bg-[--color-gray-800]/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        {position.type === "long" ? (
                          <TrendingUp className="w-3 h-3 text-[--color-success]" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-[--color-error]" />
                        )}
                        <span className="text-gray-400">{position.symbol}</span>
                        <span className="text-xs text-gray-600">
                          x{position.leverage}
                        </span>
                      </div>
                      <div
                        className={`font-semibold text-sm ${
                          position.pnl >= 0
                            ? "text-[--color-success]"
                            : "text-[--color-error]"
                        }`}
                      >
                        {position.pnl >= 0 ? "+" : ""}
                        {formatCurrency(position.pnl * 20)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
