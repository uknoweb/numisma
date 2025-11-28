"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "@/lib/store";
import { formatNumber, calculatePnL } from "@/lib/utils";

interface TradingChartMobileProps {
  onClose: () => void;
}

type Timeframe = "1s" | "1m" | "5m" | "10m" | "30m";
type MarketPair = "WLD/USDT" | "NUMA/WLD";

export default function TradingChartMobile({ onClose }: TradingChartMobileProps) {
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);

  const [selectedPair, setSelectedPair] = useState<MarketPair>("NUMA/WLD");
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [selectedLeverage, setSelectedLeverage] = useState(2);
  const [amount, setAmount] = useState(0.10);
  const [direction, setDirection] = useState<"long" | "short">("long");
  
  const [numaPrice, setNumaPrice] = useState(0.001);
  const [wldPrice, setWldPrice] = useState(2.5);

  const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;

  // Generar datos del gráfico
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      const points = 30;
      
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
      const { pnl, fees } = calculatePnL(
        position.entryPrice,
        currentMarketPrice,
        position.amount,
        position.leverage,
        position.type,
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
      alert("❌ El monto mínimo para abrir una posición es de 0.10");
      return;
    }

    const feeRate = selectedPair === "WLD/USDT" ? 0.001 : 0.01;
    const openingFee = amount * feeRate;
    
    if (selectedPair === "NUMA/WLD") {
      const totalNumaRequired = amount + openingFee;
      if (user.balanceNuma < totalNumaRequired) {
        alert(`❌ Balance NUMA insuficiente.\nTotal: ${totalNumaRequired.toFixed(2)} NUMA\nDisponible: ${user.balanceNuma.toFixed(2)} NUMA`);
        return;
      }
    } else {
      const collateral = amount / selectedLeverage;
      const totalRequired = collateral + openingFee;
      if (user.balanceWld < totalRequired) {
        alert(`❌ Balance WLD insuficiente.\nTotal: ${totalRequired.toFixed(4)} WLD\nDisponible: ${user.balanceWld.toFixed(4)} WLD`);
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

    setAmount(0.10);
  };

  const handleClosePosition = (positionId: string) => {
    closePosition(positionId);
  };

  const myPositions = positions.filter(p => p.status === "open");

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[--color-gold]/20 bg-[--color-gray-900]">
        <h2 className="text-lg font-bold text-[--color-gold]">📊 Trading</h2>
        <Button onClick={onClose} variant="ghost" size="sm" className="text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* MITAD SUPERIOR: Gráfico (50vh) */}
      <div className="h-[50vh] flex flex-col p-3 border-b border-[--color-gold]/20 bg-black">
        {/* Selector de Par */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSelectedPair("NUMA/WLD")}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedPair === "NUMA/WLD"
                ? "bg-[--color-gold] text-black"
                : "bg-[--color-gray-800] text-gray-400"
            }`}
          >
            📊 NUMA/WLD
          </button>
          <button
            onClick={() => setSelectedPair("WLD/USDT")}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedPair === "WLD/USDT"
                ? "bg-[--color-gold] text-black"
                : "bg-[--color-gray-800] text-gray-400"
            }`}
          >
            🌍 WLD/USDT
          </button>
        </div>

        {/* Precio */}
        <div className="bg-[--color-gray-900] rounded-lg p-2 mb-2">
          <div className="text-[10px] text-gray-400">{selectedPair}</div>
          <div className="text-xl font-bold text-[--color-gold]">
            {selectedPair === "NUMA/WLD" 
              ? `${formatNumber(currentPrice, 6)} WLD`
              : `$${formatNumber(currentPrice, 2)}`}
          </div>
        </div>

        {/* Gráfico */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "1px solid #FFD700",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="price" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MITAD INFERIOR: Controles y Posiciones (50vh) */}
      <div className="h-[50vh] overflow-y-auto bg-[--color-gray-900] p-3">
        {/* Controles de Trading */}
        <div className="space-y-3 mb-4">
          {/* Dirección */}
          <div className="flex gap-2">
            <button
              onClick={() => setDirection("long")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                direction === "long"
                  ? "bg-green-600 text-white"
                  : "bg-[--color-gray-800] text-gray-400"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              LONG
            </button>
            <button
              onClick={() => setDirection("short")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                direction === "short"
                  ? "bg-red-600 text-white"
                  : "bg-[--color-gray-800] text-gray-400"
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-1" />
              SHORT
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Cantidad {selectedPair === "NUMA/WLD" ? "NUMA" : "WLD"} (mín 0.10)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-[--color-gray-800] text-white rounded-lg px-3 py-2 text-sm"
              min="0.10"
              step="0.01"
              placeholder="0.10"
              aria-label="Cantidad para trading"
            />
          </div>

          {/* Apalancamiento */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Apalancamiento: x{selectedLeverage}
            </label>
            <div className="flex gap-2">
              {[2, 5, 10, 25, 50, 100].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setSelectedLeverage(lev)}
                  className={`flex-1 py-1.5 rounded text-xs font-bold ${
                    selectedLeverage === lev
                      ? "bg-[--color-gold] text-black"
                      : "bg-[--color-gray-800] text-gray-400"
                  }`}
                >
                  x{lev}
                </button>
              ))}
            </div>
          </div>

          {/* Botón Abrir Posición */}
          <button
            onClick={handleOpenPosition}
            className="w-full bg-gradient-to-r from-[--color-gold] to-[--color-gold-dark] text-black font-bold py-3 rounded-lg shadow-lg"
          >
            Abrir Posición {direction === "long" ? "LONG" : "SHORT"}
          </button>
        </div>

        {/* Posiciones Abiertas */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[--color-gold] mb-2">
            Mis Posiciones ({myPositions.length})
          </h3>
          
          {myPositions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No tienes posiciones abiertas
            </div>
          ) : (
            myPositions.map((position) => {
              const { pnl, pnlPercentage, fees } = calculatePnL(
                position.entryPrice,
                position.currentPrice,
                position.amount,
                position.leverage,
                position.type,
                position.symbol
              );
              const netPnl = pnl - fees.closing;
              const isProfit = netPnl > 0;

              return (
                <div
                  key={position.id}
                  className="bg-[--color-gray-800] rounded-lg p-3 border border-[--color-gold]/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{position.symbol}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          position.type === "long"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {position.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">x{position.leverage}</span>
                    </div>
                    <button
                      onClick={() => handleClosePosition(position.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Entrada:</span>
                      <span className="text-white ml-1">{formatNumber(position.entryPrice, 4)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Actual:</span>
                      <span className="text-white ml-1">{formatNumber(position.currentPrice, 4)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">PnL:</span>
                      <span className={`ml-1 font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}{formatNumber(netPnl, 4)} WLD
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">%:</span>
                      <span className={`ml-1 font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}{pnlPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
