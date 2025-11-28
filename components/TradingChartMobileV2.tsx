"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Info, Settings2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "@/lib/store";
import { formatNumber, calculatePnL } from "@/lib/utils";

interface TradingChartMobileV2Props {
  onClose: () => void;
}

type MarketPair = "WLD/USDT" | "NUMA/WLD";

export default function TradingChartMobileV2({ onClose }: TradingChartMobileV2Props) {
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);

  const [selectedPair, setSelectedPair] = useState<MarketPair>("NUMA/WLD");
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [selectedLeverage, setSelectedLeverage] = useState(2);
  const [amount, setAmount] = useState(0.10);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [showPositions, setShowPositions] = useState(false);
  
  const [numaPrice, setNumaPrice] = useState(0.001);
  const [wldPrice, setWldPrice] = useState(2.5);

  const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
  const availableBalance = selectedPair === "NUMA/WLD" ? user?.balanceNuma || 0 : user?.balanceWld || 0;
  const balanceSymbol = selectedPair === "NUMA/WLD" ? "NUMA" : "WLD";

  // Inicializar gráfico con datos históricos
  useEffect(() => {
    const initializeChart = () => {
      const data = [];
      const points = 40;
      
      if (selectedPair === "NUMA/WLD") {
        let basePrice = 0.001;
        for (let i = 0; i < points; i++) {
          const volatility = (Math.random() * 0.0004 - 0.0002);
          basePrice += volatility;
          basePrice = Math.max(basePrice, 0.0001);
          data.push({ time: `${i}`, price: basePrice });
        }
        setNumaPrice(basePrice);
      } else {
        let basePrice = 2.5;
        for (let i = 0; i < points; i++) {
          const volatility = (Math.random() * 0.06 - 0.03);
          basePrice += volatility;
          basePrice = Math.max(basePrice, 1);
          data.push({ time: `${i}`, price: basePrice });
        }
        setWldPrice(basePrice);
      }
      
      setChartData(data);
    };

    initializeChart();
  }, [selectedPair]);

  // Actualizar precio en tiempo real (solo agrega nuevos puntos)
  useEffect(() => {
    const updatePrice = () => {
      setChartData(prev => {
        const lastPrice = prev[prev.length - 1]?.price || (selectedPair === "NUMA/WLD" ? 0.001 : 2.5);
        
        let newPrice;
        if (selectedPair === "NUMA/WLD") {
          const volatility = (Math.random() * 0.0002 - 0.0001);
          newPrice = Math.max(lastPrice + volatility, 0.0001);
          setNumaPrice(newPrice);
        } else {
          const volatility = (Math.random() * 0.04 - 0.02);
          newPrice = Math.max(lastPrice + volatility, 1);
          setWldPrice(newPrice);
        }
        
        const newData = [...prev.slice(-39), { time: `${Date.now()}`, price: newPrice }];
        return newData;
      });
    };

    const interval = setInterval(updatePrice, 1000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Actualizar PnL de posiciones
  useEffect(() => {
    positions.filter(p => p.status === "open").forEach(position => {
      const currentMarketPrice = position.symbol === "NUMA/WLD" ? numaPrice : wldPrice;
      const { pnl } = calculatePnL(
        position.entryPrice,
        currentMarketPrice,
        position.amount,
        position.leverage,
        position.type === "long",
        position.symbol
      );
      
      useAppStore.setState((state) => ({
        positions: state.positions.map((p) =>
          p.id === position.id ? { ...p, pnl, currentPrice: currentMarketPrice } : p
        ),
      }));
    });
  }, [numaPrice, wldPrice, positions]);

  const handleOpenPosition = () => {
    if (!user) return;
    
    if (amount < 0.10) {
      alert("❌ El monto mínimo es 0.10");
      return;
    }

    const feeRate = selectedPair === "WLD/USDT" ? 0.001 : 0.01;
    const openingFee = amount * feeRate;
    
    if (selectedPair === "NUMA/WLD") {
      const totalNumaRequired = amount + openingFee;
      if (totalNumaRequired > user.balanceNuma) {
        alert(`❌ Balance insuficiente. Necesitas ${formatNumber(totalNumaRequired, 2)} NUMA`);
        return;
      }
    } else {
      const collateralRequired = (amount / selectedLeverage) + openingFee;
      if (collateralRequired > user.balanceWld) {
        alert(`❌ Balance insuficiente. Necesitas ${formatNumber(collateralRequired, 2)} WLD`);
        return;
      }
    }

    addPosition({
      id: `pos_${Date.now()}`,
      userId: user.id,
      symbol: selectedPair,
      type: direction,
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      amount,
      leverage: selectedLeverage,
      pnl: 0,
      pnlPercentage: 0,
      openedAt: new Date(),
      closedAt: null,
      status: "open" as const,
    });

    alert(`✅ Posición ${direction.toUpperCase()} abierta\n${amount} @ ${currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}`);
  };

  const handleClosePosition = (positionId: string) => {
    closePosition(positionId);
  };

  const myPositions = positions.filter(p => p.status === "open");
  const myPositionsFiltered = myPositions.filter(p => p.symbol === selectedPair);

  if (!user) return null;

  const maxAmount = selectedPair === "NUMA/WLD" 
    ? user.balanceNuma * 0.95 
    : (user.balanceWld * selectedLeverage * 0.95);

  const estimatedPnL = direction === "long" 
    ? ((currentPrice * 1.01 - currentPrice) / currentPrice) * amount * selectedLeverage
    : ((currentPrice - currentPrice * 0.99) / currentPrice) * amount * selectedLeverage;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header Profesional */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800/50 backdrop-blur-sm bg-black/50">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Selector de Par */}
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value as MarketPair)}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-[--color-gold]/30 rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg hover:border-[--color-gold]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[--color-gold]/50"
            aria-label="Seleccionar par de trading"
          >
            <option value="NUMA/WLD">NUMA/WLD</option>
            <option value="WLD/USDT">WLD/USDT</option>
          </select>
          
          {/* Botón de posiciones */}
          <button
            onClick={() => setShowPositions(!showPositions)}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-[--color-gold]/30 rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-white relative shadow-lg hover:border-[--color-gold]/50 transition-all"
            aria-label="Ver posiciones abiertas"
          >
            <span className="hidden sm:inline">Posiciones</span>
            <span className="sm:hidden">Pos.</span>
            {myPositionsFiltered.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-br from-[--color-gold] to-yellow-600 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                {myPositionsFiltered.length}
              </span>
            )}
          </button>
        </div>
        
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-[--color-gold] transition-colors p-2 rounded-lg hover:bg-gray-800/50" 
          aria-label="Cerrar ventana de trading"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Precio Actual */}
      <div className="px-4 sm:px-6 py-5">
        <div className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">Precio Actual</div>
        <div className="flex items-end gap-3">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}
          </div>
          {chartData.length >= 2 && (
            <div className={`text-lg sm:text-xl font-bold mb-1.5 flex items-center gap-1.5 ${chartData[chartData.length - 1]?.price > chartData[chartData.length - 2]?.price ? 'text-green-400' : 'text-red-400'}`}>
              {chartData[chartData.length - 1]?.price > chartData[chartData.length - 2]?.price ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {Math.abs(((chartData[chartData.length - 1]?.price - chartData[chartData.length - 2]?.price) / chartData[chartData.length - 2]?.price * 100)).toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* Gráfico sin saltos */}
      <div className="h-[38vh] px-3 sm:px-4 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FFD700" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                borderRadius: '12px',
                padding: '12px',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: '#FFD700', fontWeight: 'bold' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${value.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}`, 'Precio']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FFD700"
              strokeWidth={3}
              dot={false}
              fill="url(#priceGradient)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controles de Trading Profesionales */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
        
        {/* Botones Long/Short */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setDirection("long")}
            className={`py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              direction === "long"
                ? "bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-xl shadow-green-500/50 border-2 border-green-400"
                : "bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
            }`}
          >
            <TrendingUp className="w-6 h-6" />
            LONG
          </button>
          <button
            onClick={() => setDirection("short")}
            className={`py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              direction === "short"
                ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-xl shadow-red-500/50 border-2 border-red-400"
                : "bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
            }`}
          >
            <TrendingDown className="w-6 h-6" />
            SHORT
          </button>
        </div>

        {/* Apalancamiento */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-semibold">Apalancamiento</span>
            <span className="text-lg font-black text-[--color-gold]">{selectedLeverage}x</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[2, 5, 10, 25, 50, 100, 125].map((lev) => (
              <button
                key={lev}
                onClick={() => setSelectedLeverage(lev)}
                className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition-all active:scale-95 ${
                  selectedLeverage === lev
                    ? "bg-gradient-to-br from-[--color-gold] via-yellow-500 to-[--color-gold] text-black shadow-lg shadow-[--color-gold]/50 border-2 border-yellow-300"
                    : "bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Monto */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-semibold">Monto ({balanceSymbol})</span>
            <span className="text-xs text-[--color-gold] font-medium">
              Disponible: {formatNumber(availableBalance, 2)}
            </span>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl p-5 shadow-lg">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-white text-3xl font-black outline-none placeholder-gray-600"
              step="0.01"
              min="0.10"
              placeholder="0.10"
              aria-label="Monto de la operación"
            />
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setAmount(availableBalance * (percent / 100))}
                  className="py-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl text-sm font-bold text-gray-300 hover:border-[--color-gold]/50 hover:text-[--color-gold] transition-all active:scale-95"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview de la Operación */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-[--color-gold]/20 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Precio de Entrada:</span>
            <span className="text-base text-white font-bold">{currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Comisión ({selectedPair === "WLD/USDT" ? "0.1" : "1"}%):</span>
            <span className="text-base text-red-400 font-bold">
              -{formatNumber(amount * (selectedPair === "WLD/USDT" ? 0.001 : 0.01), 4)} {balanceSymbol}
            </span>
          </div>
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 font-medium">P&L Estimado (1%):</span>
              <span className="text-lg text-green-400 font-black">
                +{formatNumber(amount * selectedLeverage * 0.01, 2)} {balanceSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de apertura */}
        <button
          onClick={handleOpenPosition}
          className={`w-full py-6 rounded-2xl font-black text-2xl transition-all active:scale-95 border-2 shadow-2xl ${
            direction === "long"
              ? "bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-green-500/50 border-green-400 hover:shadow-green-500/70"
              : "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-red-500/50 border-red-400 hover:shadow-red-500/70"
          }`}
        >
          🚀 Abrir {direction.toUpperCase()} {selectedLeverage}x
        </button>

        {/* Posiciones Abiertas */}
        {showPositions && myPositionsFiltered.length > 0 && (
          <div className="space-y-3 mt-6">
            <div className="text-sm text-gray-400 uppercase font-bold">Tus Posiciones</div>
            {myPositionsFiltered.map((position) => (
              <div
                key={position.id}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-[--color-gold]/20 rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm px-3 py-1 rounded-xl font-black ${
                      position.type === "long" 
                        ? "bg-green-600/30 text-green-400 border border-green-500/50" 
                        : "bg-red-600/30 text-red-400 border border-red-500/50"
                    }`}>
                      {position.type.toUpperCase()} {position.leverage}x
                    </div>
                    <div className="text-sm text-gray-400 font-semibold">{position.symbol}</div>
                  </div>
                  <div className={`text-lg font-black ${
                    position.pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Entrada</div>
                    <div className="text-white font-bold">
                      {formatNumber(position.entryPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Actual</div>
                    <div className="text-[--color-gold] font-bold">
                      {formatNumber(position.currentPrice || currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Monto</div>
                    <div className="text-white font-bold">
                      {formatNumber(position.amount, 2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleClosePosition(position.id)}
                  className="w-full py-3 rounded-xl bg-[--color-gold] text-black text-base font-black hover:bg-yellow-500 transition-all active:scale-95 shadow-lg"
                >
                  Cerrar Posición
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Educativa */}
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-2 border-blue-500/30 rounded-2xl p-4 mt-6 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <strong className="text-blue-400 font-bold">Modo educativo:</strong> Esta es una simulación para aprender trading de futuros. 
              {direction === "long" ? " Long = apuestas a que el precio subirá." : " Short = apuestas a que el precio bajará."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
