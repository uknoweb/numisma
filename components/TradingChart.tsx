"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "@/lib/store";
import { formatNumber, calculatePnL } from "@/lib/utils";

interface TradingChartProps {
  onClose: () => void;
}

type Timeframe = "1s" | "1m" | "5m" | "10m" | "30m";

export default function TradingChart({ onClose }: TradingChartProps) {
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const addPosition = useAppStore((state) => state.addPosition);
  const updatePosition = useAppStore((state) => state.updatePosition);
  const marketPrice = useAppStore((state) => state.marketPrice);
  const setMarketPrice = useAppStore((state) => state.setMarketPrice);

  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [selectedLeverage, setSelectedLeverage] = useState(2);
  const [amount, setAmount] = useState(100);

  // Generar datos del gráfico
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      let basePrice = 50000;
      const points = 50;

      for (let i = 0; i < points; i++) {
        const volatility = Math.random() * 1000 - 500;
        basePrice += volatility;
        data.push({
          time: `${i}`,
          price: Math.max(basePrice, 40000),
        });
      }
      return data;
    };

    setChartData(generateChartData());
  }, [timeframe]);

  // Actualizar precio del mercado
  useEffect(() => {
    const interval = setInterval(() => {
      const newPrice = marketPrice + (Math.random() * 200 - 100);
      setMarketPrice(Math.max(newPrice, 40000));

      // Actualizar PnL de posiciones abiertas
      const openPositions = positions.filter((p) => p.status === "open");
      openPositions.forEach((position) => {
        const { pnl, pnlPercentage } = calculatePnL(
          position.entryPrice,
          newPrice,
          position.amount,
          position.leverage,
          position.type === "long"
        );
        updatePosition(position.id, {
          currentPrice: newPrice,
          pnl,
          pnlPercentage,
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [marketPrice, positions, setMarketPrice, updatePosition]);

  const handleOpenPosition = (type: "long" | "short") => {
    if (!user) return;

    const newPosition = {
      id: `pos_${Date.now()}`,
      userId: user.id,
      symbol: "BTC/USDT",
      type,
      entryPrice: marketPrice,
      currentPrice: marketPrice,
      amount,
      leverage: selectedLeverage,
      pnl: 0,
      pnlPercentage: 0,
      openedAt: new Date(),
      closedAt: null,
      status: "open" as const,
    };

    addPosition(newPosition);
  };

  const maxLeverage = user?.membership.maxLeverage || 10;
  const leverageOptions = [2, 5, 10, 20, 30, 50, 100, 500].filter(
    (lev) => lev <= maxLeverage
  );

  const openPositions = positions.filter((p) => p.status === "open");
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col">
        <Card className="flex-1 border-[--color-gold]/20 flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">Gráfico de Trading - BTC/USDT</CardTitle>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 overflow-auto">
            {/* Timeframe selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Intervalo:</span>
              {(["1s", "1m", "5m", "10m", "30m"] as Timeframe[]).map((tf) => (
                <Button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  className="h-8"
                >
                  {tf}
                </Button>
              ))}
            </div>

            {/* Precio actual */}
            <div className="bg-[--color-gray-800] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Precio Actual</div>
                  <div className="text-3xl font-bold text-[--color-gold]">
                    ${formatNumber(marketPrice, 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">PnL Total</div>
                  <div
                    className={`text-2xl font-bold ${
                      totalPnl >= 0 ? "text-[--color-success]" : "text-[--color-error]"
                    }`}
                  >
                    {totalPnl >= 0 ? "+" : ""}${formatNumber(totalPnl, 2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-[--color-gray-800] rounded-lg p-4 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#666" domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Controles de trading */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Panel izquierdo: Configuración */}
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-[--color-gold]">
                  Configurar Posición
                </h3>

                {/* Cantidad */}
                <div>
                  <label htmlFor="trade-amount" className="text-sm text-gray-400 block mb-2">
                    Cantidad (NUMA)
                  </label>
                  <input
                    id="trade-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[--color-gray-900] border border-[--color-gray-700] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[--color-gold]"
                    min={10}
                    max={user?.balanceNuma || 1000}
                    aria-label="Cantidad de NUMA para trading"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Disponible: {formatNumber(user?.balanceNuma || 0, 0)} NUMA
                  </div>
                </div>

                {/* Apalancamiento */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Apalancamiento: x{selectedLeverage}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {leverageOptions.map((lev) => (
                      <Button
                        key={lev}
                        onClick={() => setSelectedLeverage(lev)}
                        variant={selectedLeverage === lev ? "default" : "outline"}
                        size="sm"
                      >
                        x{lev}
                      </Button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Máximo: x{maxLeverage} (Plan {user?.membership.tier.toUpperCase()})
                  </div>
                </div>

                {/* Valor de la operación */}
                <div className="bg-[--color-gray-900] rounded-lg p-3">
                  <div className="text-xs text-gray-400">Valor de Operación</div>
                  <div className="text-lg font-semibold text-white">
                    {formatNumber(amount * selectedLeverage, 0)} NUMA
                  </div>
                  <div className="text-xs text-gray-500">
                    ≈ ${formatNumber((amount * selectedLeverage * 0.001) * marketPrice, 2)}
                  </div>
                </div>
              </div>

              {/* Panel derecho: Botones de acción */}
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-[--color-gold]">
                  Abrir Posición
                </h3>

                <Button
                  onClick={() => handleOpenPosition("long")}
                  variant="success"
                  size="lg"
                  className="w-full gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  LONG (Comprar)
                </Button>

                <Button
                  onClick={() => handleOpenPosition("short")}
                  variant="danger"
                  size="lg"
                  className="w-full gap-2"
                >
                  <TrendingDown className="w-5 h-5" />
                  SHORT (Vender)
                </Button>

                {/* Posiciones abiertas actuales */}
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-400">
                    Posiciones Abiertas ({openPositions.length})
                  </div>
                  {openPositions.slice(0, 3).map((position) => (
                    <div
                      key={position.id}
                      className="bg-[--color-gray-900] rounded p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white">
                          {position.type.toUpperCase()} x{position.leverage}
                        </span>
                        <span
                          className={
                            position.pnl >= 0
                              ? "text-[--color-success]"
                              : "text-[--color-error]"
                          }
                        >
                          {position.pnl >= 0 ? "+" : ""}
                          {formatNumber(position.pnlPercentage, 2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
