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

  // Generar datos del gráfico
  useEffect(() => {
    const generateChartData = () => {
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

    generateChartData();
    const interval = setInterval(generateChartData, 1000);
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
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[--color-gold]/20 bg-[--color-gray-900] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[--color-gold] rounded"></div>
          <h2 className="text-base font-bold text-[--color-gold]">{selectedPair}</h2>
          <div className={`text-xs px-2 py-0.5 rounded ${
            direction === "long" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
          }`}>
            {direction === "long" ? "LONG" : "SHORT"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPositions(!showPositions)}
            className="text-xs px-3 py-1.5 rounded bg-[--color-gray-800] text-[--color-gold] border border-[--color-gold]/30"
            aria-label="Ver posiciones abiertas"
          >
            Posiciones ({myPositionsFiltered.length})
          </button>
          <button 
            onClick={onClose} 
            className="text-white p-1.5 hover:bg-[--color-gray-800] rounded active:scale-95"
            aria-label="Cerrar ventana de trading"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Precio Actual Grande */}
      <div className="bg-[--color-gray-900] px-4 py-2 border-b border-[--color-gold]/10 flex-shrink-0">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-[--color-gold]">
            {selectedPair === "NUMA/WLD" 
              ? formatNumber(currentPrice, 6)
              : formatNumber(currentPrice, 2)}
          </div>
          <div className="text-xs text-gray-500">
            {selectedPair === "NUMA/WLD" ? "WLD" : "USDT"}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setSelectedPair("NUMA/WLD")}
            className={`text-xs px-2 py-1 rounded ${
              selectedPair === "NUMA/WLD"
                ? "bg-[--color-gold] text-black font-bold"
                : "bg-transparent text-gray-500"
            }`}
          >
            NUMA/WLD
          </button>
          <button
            onClick={() => setSelectedPair("WLD/USDT")}
            className={`text-xs px-2 py-1 rounded ${
              selectedPair === "WLD/USDT"
                ? "bg-[--color-gold] text-black font-bold"
                : "bg-transparent text-gray-500"
            }`}
          >
            WLD/USDT
          </button>
        </div>
      </div>

      {/* Gráfico Compacto */}
      <div className="h-[35vh] bg-black p-2 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid #FFD700",
                borderRadius: "4px",
                fontSize: "11px",
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#FFD700" 
              strokeWidth={2} 
              dot={false}
              fill="url(#goldFill)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controles de Trading - Estilo MEXC */}
      <div className="flex-1 overflow-y-auto bg-[--color-gray-900] p-3 space-y-3">
        
        {/* Toggle Long/Short Grande estilo MEXC */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDirection("long")}
            className={`py-4 rounded-lg font-bold text-base transition-all ${
              direction === "long"
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                : "bg-[--color-gray-800] text-gray-500 border border-gray-700"
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-1" />
            Comprar / Long
          </button>
          <button
            onClick={() => setDirection("short")}
            className={`py-4 rounded-lg font-bold text-base transition-all ${
              direction === "short"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                : "bg-[--color-gray-800] text-gray-500 border border-gray-700"
            }`}
          >
            <TrendingDown className="w-5 h-5 inline mr-1" />
            Vender / Short
          </button>
        </div>

        {/* Apalancamiento */}
        <div className="bg-[--color-gray-800] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Apalancamiento</span>
            <span className="text-sm font-bold text-[--color-gold]">{selectedLeverage}x</span>
          </div>
          <div className="flex gap-2">
            {[2, 5, 10, 20, 50, 100, 125].map((lev) => (
              <button
                key={lev}
                onClick={() => setSelectedLeverage(lev)}
                className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                  selectedLeverage === lev
                    ? "bg-[--color-gold] text-black"
                    : "bg-[--color-gray-700] text-gray-400 hover:bg-[--color-gray-600]"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Monto */}
        <div className="bg-[--color-gray-800] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Monto</span>
            <span className="text-xs text-gray-500">
              Balance: {formatNumber(availableBalance, 2)} {balanceSymbol}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[--color-gray-900] rounded-lg px-3 py-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0.10}
              max={maxAmount}
              step={0.10}
              placeholder="0.10"
              aria-label="Monto de la posición"
              className="flex-1 bg-transparent text-white text-lg font-bold outline-none"
            />
            <span className="text-sm text-gray-400">{balanceSymbol}</span>
          </div>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => setAmount((maxAmount * percent) / 100)}
                className="flex-1 py-1.5 rounded text-xs bg-[--color-gray-700] text-gray-400 hover:text-white hover:bg-[--color-gray-600] transition-all"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Preview de la Operación */}
        <div className="bg-gradient-to-br from-[--color-gold]/10 to-transparent border border-[--color-gold]/30 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400 mb-1">📊 Preview de Operación</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-500">Precio entrada</div>
              <div className="text-white font-semibold">
                {selectedPair === "NUMA/WLD" ? formatNumber(currentPrice, 6) : formatNumber(currentPrice, 2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Comisión</div>
              <div className="text-red-400 font-semibold">
                {selectedPair === "WLD/USDT" ? "0.1%" : "1%"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Estimado +1%</div>
              <div className="text-green-400 font-semibold">
                +{formatNumber(estimatedPnL, 2)} {selectedPair === "NUMA/WLD" ? "WLD" : "USDT"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Monto total</div>
              <div className="text-white font-semibold">
                {formatNumber(amount * selectedLeverage, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Abrir Posición - Estilo MEXC */}
        <button
          onClick={handleOpenPosition}
          disabled={amount < 0.10 || amount > maxAmount}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            amount >= 0.10 && amount <= maxAmount
              ? direction === "long"
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 shadow-lg active:scale-[0.98]"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg active:scale-[0.98]"
              : "bg-[--color-gray-700] text-gray-500 cursor-not-allowed"
          }`}
        >
          {direction === "long" ? "🚀 Abrir Long" : "📉 Abrir Short"}
        </button>

        {/* Posiciones Abiertas */}
        {showPositions && myPositionsFiltered.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase">Tus Posiciones</div>
            {myPositionsFiltered.map((position) => (
              <div
                key={position.id}
                className="bg-[--color-gray-800] border border-[--color-gold]/20 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-0.5 rounded font-bold ${
                      position.type === "long" 
                        ? "bg-green-600/20 text-green-400" 
                        : "bg-red-600/20 text-red-400"
                    }`}>
                      {position.type.toUpperCase()} {position.leverage}x
                    </div>
                    <div className="text-xs text-gray-400">{position.symbol}</div>
                  </div>
                  <div className={`text-sm font-bold ${
                    position.pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <div className="text-gray-500">Entrada</div>
                    <div className="text-white font-semibold">
                      {formatNumber(position.entryPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Actual</div>
                    <div className="text-[--color-gold] font-semibold">
                      {formatNumber(position.currentPrice || currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Monto</div>
                    <div className="text-white font-semibold">
                      {formatNumber(position.amount, 2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleClosePosition(position.id)}
                  className="w-full py-2 rounded bg-[--color-gold] text-black text-sm font-bold hover:bg-[--color-gold-dark] transition-all active:scale-[0.98]"
                >
                  Cerrar Posición
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Educativa */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">
              <strong className="text-blue-400">Modo educativo:</strong> Esta es una simulación para aprender trading de futuros. 
              {direction === "long" ? " Long = apuestas a que el precio subirá." : " Short = apuestas a que el precio bajará."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
