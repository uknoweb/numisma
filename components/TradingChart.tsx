"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAppStore } from "@/lib/store";
import { formatNumber, calculatePnL } from "@/lib/utils";

interface TradingChartProps {
  onClose: () => void;
}

type Timeframe = "1s" | "1m" | "5m" | "10m" | "30m";
type MarketPair = "WLD/USDT" | "NUMA/WLD";

export default function TradingChart({ onClose }: TradingChartProps) {
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const addPosition = useAppStore((state) => state.addPosition);
  const updatePosition = useAppStore((state) => state.updatePosition);
  const closePosition = useAppStore((state) => state.closePosition);
  const marketPrice = useAppStore((state) => state.marketPrice);
  const setMarketPrice = useAppStore((state) => state.setMarketPrice);

  const [selectedPair, setSelectedPair] = useState<MarketPair>("NUMA/WLD");
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [selectedLeverage, setSelectedLeverage] = useState(2);
  const [amount, setAmount] = useState(0.10);
  
  // Precio de NUMA/WLD (simulado, alta volatilidad)
  const [numaPrice, setNumaPrice] = useState(0.001);
  
  // Precio de WLD/USDT (real, menor volatilidad)
  const [wldPrice, setWldPrice] = useState(2.5);

  // Generar datos del gráfico según el par seleccionado
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      const points = 50;
      
      if (selectedPair === "NUMA/WLD") {
        // NUMA/WLD: Alta volatilidad para generar más usuarios
        let basePrice = 0.001;
        for (let i = 0; i < points; i++) {
          // Volatilidad del 10-20% por tick
          const volatility = (Math.random() * 0.0004 - 0.0002);
          basePrice += volatility;
          basePrice = Math.max(basePrice, 0.0001); // Mínimo 0.0001 WLD
          data.push({
            time: `${i}`,
            price: basePrice,
          });
        }
        setNumaPrice(basePrice);
      } else {
        // WLD/USDT: Precio real con menor volatilidad
        let basePrice = 2.5;
        for (let i = 0; i < points; i++) {
          // Volatilidad del 1-3% por tick (más realista)
          const volatility = (Math.random() * 0.15 - 0.075);
          basePrice += volatility;
          basePrice = Math.max(basePrice, 1.0); // Mínimo 1 USDT
          data.push({
            time: `${i}`,
            price: basePrice,
          });
        }
        setWldPrice(basePrice);
      }
      
      return data;
    };

    setChartData(generateChartData());
  }, [timeframe, selectedPair]);

  // Actualizar precio del mercado según el par seleccionado
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedPair === "NUMA/WLD") {
        // NUMA/WLD: Alta volatilidad (10-20%)
        const volatility = (Math.random() * 0.0004 - 0.0002);
        const newPrice = Math.max(numaPrice + volatility, 0.0001);
        setNumaPrice(newPrice);
        setMarketPrice(newPrice);
      } else {
        // WLD/USDT: Menor volatilidad (1-3%), precio más cuidadoso
        const volatility = (Math.random() * 0.15 - 0.075);
        const newPrice = Math.max(wldPrice + volatility, 1.0);
        setWldPrice(newPrice);
        setMarketPrice(newPrice);
      }

      // Actualizar PnL de posiciones abiertas del par actual
      const openPositions = positions.filter(
        (p) => p.status === "open" && p.symbol === selectedPair
      );
      
      openPositions.forEach((position) => {
        const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
        const { pnl, pnlPercentage, fees } = calculatePnL(
          position.entryPrice,
          currentPrice,
          position.amount,
          position.leverage,
          position.type === "long",
          position.symbol
        );
        updatePosition(position.id, {
          currentPrice,
          pnl,
          pnlPercentage,
        });
        
        // Liquidación automática: si el balance actual + PnL - fees <= 0.01 WLD
        const collateral = position.amount / position.leverage;
        const currentBalance = (user?.balanceWld || 0) + collateral + pnl - fees;
        
        if (currentBalance <= 0.01) {
          closePosition(position.id);
          alert(`⚠️ Posición ${position.type.toUpperCase()} en ${position.symbol} liquidada. Balance insuficiente.`);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [numaPrice, wldPrice, selectedPair, positions, setMarketPrice, updatePosition, closePosition, user]);

  const handleOpenPosition = (type: "long" | "short") => {
    if (!user) return;
    
    // Validar monto mínimo de 0.10
    if (amount < 0.10) {
      alert(
        `❌ Monto mínimo no alcanzado\n` +
        `Mínimo: 0.10 ${selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"}\n` +
        `Tu monto: ${amount.toFixed(2)}`
      );
      return;
    }
    
    // Calcular comisión de apertura según el par
    const feeRate = selectedPair === "WLD/USDT" ? 0.001 : 0.01; // 0.1% WLD, 1% NUMA
    const openingFee = amount * feeRate;
    
    // Validar que tenga balance suficiente para el colateral + comisión
    const collateral = amount / selectedLeverage;
    const totalRequired = collateral + openingFee;
    
    // Validar balance según el par
    if (selectedPair === "NUMA/WLD") {
      // En NUMA/WLD opera solo con NUMA (amount + comisión)
      const totalNumaRequired = amount + openingFee;
      if (user.balanceNuma < totalNumaRequired) {
        alert(
          `❌ Balance NUMA insuficiente.\n` +
          `Cantidad: ${amount.toFixed(2)} NUMA\n` +
          `Comisión (1%): ${openingFee.toFixed(2)} NUMA\n` +
          `Total: ${totalNumaRequired.toFixed(2)} NUMA\n` +
          `Disponible: ${user.balanceNuma.toFixed(2)} NUMA`
        );
        return;
      }
    } else {
      // En WLD/USDT opera solo con WLD (colateral + comisión)
      if (user.balanceWld < totalRequired) {
        alert(
          `❌ Balance WLD insuficiente.\n` +
          `Colateral: ${collateral.toFixed(4)} WLD\n` +
          `Comisión (${feeRate * 100}%): ${openingFee.toFixed(4)} WLD\n` +
          `Total: ${totalRequired.toFixed(4)} WLD\n` +
          `Disponible: ${user.balanceWld.toFixed(4)} WLD`
        );
        return;
      }
    }

    const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;

    const newPosition = {
      id: `pos_${Date.now()}`,
      userId: user.id,
      symbol: selectedPair,
      type,
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      amount,
      leverage: selectedLeverage,
      pnl: 0,
      pnlPercentage: 0,
      openedAt: new Date(),
      closedAt: null,
      status: "open" as const,
    };

    addPosition(newPosition);
    alert(
      `✅ Posición ${type.toUpperCase()} abierta en ${selectedPair}\n` +
      `Precio: ${currentPrice.toFixed(priceDecimals)}\n` +
      `Colateral: ${collateral.toFixed(4)} WLD\n` +
      `Comisión: ${openingFee.toFixed(4)} WLD (${feeRate * 100}%)\n` +
      `Total deducido: ${totalRequired.toFixed(4)} WLD`
    );
  };

  const maxLeverage = user?.membership.maxLeverage || 10;
  const leverageOptions = [2, 5, 10, 20, 30, 50, 100, 500].filter(
    (lev) => lev <= maxLeverage
  );

  const openPositions = positions.filter(
    (p) => p.status === "open" && p.symbol === selectedPair
  );
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
  
  const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
  const priceDecimals = selectedPair === "NUMA/WLD" ? 6 : 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col">
        <Card className="flex-1 border-[--color-gold]/20 flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">Gráfico de Trading</CardTitle>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 overflow-auto">
            {/* Selector de Par de Mercado */}
            <div className="flex items-center gap-2 bg-[--color-gray-800] rounded-lg p-2">
              <button
                onClick={() => setSelectedPair("NUMA/WLD")}
                className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                  selectedPair === "NUMA/WLD"
                    ? "bg-[--color-gold] text-black shadow-lg shadow-[#FFD700]/20"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                📊 NUMA/WLD
                <span className="block text-xs opacity-80 mt-0.5">
                  Alta Volatilidad
                </span>
              </button>
              <button
                onClick={() => setSelectedPair("WLD/USDT")}
                className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                  selectedPair === "WLD/USDT"
                    ? "bg-[--color-gold] text-black shadow-lg shadow-[#FFD700]/20"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                🌍 WLD/USDT
                <span className="block text-xs opacity-80 mt-0.5">
                  Precio Real
                </span>
              </button>
            </div>

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

            {/* Precio actual y Balance en Tiempo Real */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[--color-gray-800] rounded-lg p-4">
                <div className="text-sm text-gray-400">
                  {selectedPair} • Precio Actual
                </div>
                <div className="text-3xl font-bold text-[--color-gold]">
                  {selectedPair === "NUMA/WLD" 
                    ? `${formatNumber(currentPrice, 6)} WLD`
                    : `$${formatNumber(currentPrice, 2)}`
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedPair === "NUMA/WLD" 
                    ? "🎯 Simulado - Alta Volatilidad"
                    : "📡 Precio Real de Mercado"
                  }
                </div>
              </div>
              
              <div className="bg-[--color-gray-800] rounded-lg p-4">
                <div className="text-sm text-gray-400">Balance WLD (Tiempo Real)</div>
                <div className="text-3xl font-bold text-white">
                  {formatNumber(user?.balanceWld || 0, 4)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💰 Actualizado cada segundo
                </div>
              </div>
              
              <div className="bg-[--color-gray-800] rounded-lg p-4">
                <div className="text-sm text-gray-400">PnL Total ({selectedPair})</div>
                <div
                  className={`text-3xl font-bold ${
                    totalPnl >= 0 ? "text-[--color-success]" : "text-[--color-error]"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}{formatNumber(totalPnl, 4)} WLD
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {openPositions.length} posición{openPositions.length !== 1 ? "es" : ""} abierta{openPositions.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-[--color-gray-800] rounded-lg p-4 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis 
                    stroke="#666" 
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => 
                      selectedPair === "NUMA/WLD" 
                        ? value.toFixed(6) 
                        : value.toFixed(2)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      selectedPair === "NUMA/WLD" 
                        ? `${value.toFixed(6)} WLD` 
                        : `$${value.toFixed(2)}`,
                      "Precio"
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot={false}
                  />
                  {openPositions.map((pos) => (
                    <ReferenceLine
                      key={pos.id}
                      y={pos.entryPrice}
                      stroke={pos.type === 'long' ? '#10b981' : '#ef4444'}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `${pos.type.toUpperCase()} ${
                          selectedPair === "NUMA/WLD" 
                            ? pos.entryPrice.toFixed(6) 
                            : "$" + formatNumber(pos.entryPrice, 2)
                        }`,
                        fill: pos.type === 'long' ? '#10b981' : '#ef4444',
                        fontSize: 12,
                        position: 'insideTopRight'
                      }}
                    />
                  ))}
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
                    Cantidad ({selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"})
                  </label>
                  <input
                    id="trade-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[--color-gray-900] border border-[--color-gray-700] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[--color-gold]"
                    min={0.10}
                    step={0.01}
                    max={selectedPair === "NUMA/WLD" ? (user?.balanceNuma || 1000) : (user?.balanceWld || 100)}
                    aria-label={`Cantidad de ${selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"} para trading`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedPair === "NUMA/WLD" 
                      ? `Disponible: ${formatNumber(user?.balanceNuma || 0, 0)} NUMA`
                      : `Disponible: ${formatNumber(user?.balanceWld || 0, 2)} WLD`
                    }
                  </div>
                  <div className="text-xs text-amber-400 mt-0.5">
                    💡 Mínimo: 0.10 {selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"}
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
                <div className="bg-[--color-gray-900] rounded-lg p-3 space-y-2">
                  <div className="text-xs text-gray-400">Resumen de Operación</div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Valor Total:</span>
                    <span className="text-sm font-semibold text-white">
                      {formatNumber(amount * selectedLeverage, 2)} {selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Colateral:</span>
                    <span className="text-sm text-amber-400">
                      {formatNumber(amount / selectedLeverage, 4)} WLD
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                    <span className="text-xs text-gray-500">
                      Comisión ({selectedPair === "WLD/USDT" ? "0.1%" : "1%"}):
                    </span>
                    <span className="text-sm text-red-400">
                      {formatNumber(amount * (selectedPair === "WLD/USDT" ? 0.001 : 0.01), 4)} WLD
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                    <span className="text-xs font-semibold text-gray-300">Total Requerido:</span>
                    <span className="text-base font-bold text-[--color-gold]">
                      {formatNumber(
                        (amount / selectedLeverage) + (amount * (selectedPair === "WLD/USDT" ? 0.001 : 0.01)),
                        4
                      )} WLD
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-800/50 rounded">
                    💡 {selectedPair === "WLD/USDT" 
                      ? "WLD/USDT: Menor comisión (0.1%), precio real" 
                      : "NUMA/WLD: Mayor volatilidad, comisión 1%"
                    }
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
                  <div className="text-sm text-gray-400 mb-2">
                    Posiciones Abiertas ({openPositions.length})
                  </div>
                  {openPositions.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-2">
                      No hay posiciones abiertas
                    </div>
                  ) : (
                    openPositions.map((position) => {
                      const closingFee = position.amount * (position.symbol === "WLD/USDT" ? 0.001 : 0.01);
                      const netPnl = position.pnl - closingFee;
                      
                      return (
                      <div
                        key={position.id}
                        className="bg-[--color-gray-900] rounded-lg p-3 border border-[--color-gray-700]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`text-sm font-semibold ${
                              position.type === 'long' 
                                ? 'text-[--color-success]' 
                                : 'text-[--color-error]'
                            }`}>
                              {position.type.toUpperCase()} x{position.leverage}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">
                              Entrada: {selectedPair === "NUMA/WLD" 
                                ? `${formatNumber(position.entryPrice, 6)} WLD`
                                : `$${formatNumber(position.entryPrice, 2)}`
                              }
                            </div>
                            <div className="text-xs text-red-400 mt-0.5">
                              Fee cierre: -{formatNumber(closingFee, 4)} WLD
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              position.pnl >= 0
                                ? "text-[--color-success]"
                                : "text-[--color-error]"
                            }`}>
                              {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 4)} WLD
                            </div>
                            <div className={`text-xs ${
                              position.pnlPercentage >= 0
                                ? "text-[--color-success]"
                                : "text-[--color-error]"
                            }`}>
                              {position.pnlPercentage >= 0 ? "+" : ""}{position.pnlPercentage.toFixed(2)}%
                            </div>
                            <div className={`text-xs font-semibold ${
                              netPnl >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              Neto: {netPnl >= 0 ? "+" : ""}{formatNumber(netPnl, 4)}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const closePosition = useAppStore.getState().closePosition;
                            closePosition(position.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                        >
                          Cerrar Posición
                        </Button>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
