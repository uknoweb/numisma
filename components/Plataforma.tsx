"use client";

import { useState, useEffect } from "react";
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

type MarketPair = "WLD/USDT" | "NUMA/WLD";

export default function Plataforma() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const user = useAppStore((state) => state.user);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedPair, setSelectedPair] = useState<MarketPair>("NUMA/WLD");
  const [selectedLeverage, setSelectedLeverage] = useState(2);
  const [amount, setAmount] = useState(0.10);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [showPositions, setShowPositions] = useState(true);
  
  const [numaPrice, setNumaPrice] = useState(0.001);
  const [wldPrice, setWldPrice] = useState(2.5);

  const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
  const availableBalance = selectedPair === "NUMA/WLD" ? user?.balanceNuma || 0 : user?.balanceWld || 0;
  const balanceSymbol = selectedPair === "NUMA/WLD" ? "NUMA" : "WLD";

  // Actualizar precio en tiempo real
  useEffect(() => {
    const updatePrice = () => {
      if (selectedPair === "NUMA/WLD") {
        setNumaPrice(prev => {
          const volatility = (Math.random() * 0.0002 - 0.0001);
          return Math.max(prev + volatility, 0.0001);
        });
      } else {
        setWldPrice(prev => {
          const volatility = (Math.random() * 0.04 - 0.02);
          return Math.max(prev + volatility, 1);
        });
      }
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

  const myPositionsFiltered = positions.filter(p => p.status === "open" && p.symbol === selectedPair);

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header Simple */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            {/* Selector de Par */}
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value as MarketPair)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              aria-label="Seleccionar par de trading"
            >
              <option value="NUMA/WLD">NUMA/WLD</option>
              <option value="WLD/USDT">WLD/USDT</option>
            </select>
            
            {/* Botón de posiciones */}
            <button
              onClick={() => setShowPositions(!showPositions)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white relative text-sm"
              aria-label="Ver posiciones abiertas"
            >
              Posiciones
              {myPositionsFiltered.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[--color-gold] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {myPositionsFiltered.length}
                </span>
              )}
            </button>
          </div>
          
          <h1 className="text-lg font-bold text-[--color-gold]">Trading</h1>
        </div>

        {/* Precio Actual */}
        <div className="bg-gray-900 px-6 py-6 border-b border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Precio Actual {selectedPair}</div>
          <div className="text-5xl font-black text-[--color-gold]">
            {currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Balance: {formatNumber(availableBalance, 2)} {balanceSymbol}
          </div>
        </div>

        {/* Controles de Trading */}
        <div className="px-6 py-6 space-y-6">
          
          {/* Botones Long/Short */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setDirection("long")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "long"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => setDirection("short")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "short"
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              SHORT
            </button>
          </div>

          {/* Apalancamiento */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Apalancamiento: {selectedLeverage}x</div>
            <div className="flex gap-2 flex-wrap">
              {[2, 5, 10, 25, 50, 100, 125].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setSelectedLeverage(lev)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    selectedLeverage === lev
                      ? "bg-[--color-gold] text-black"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Monto ({balanceSymbol})</div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-2xl font-bold"
              step="0.01"
              min="0.10"
              placeholder="0.10"
            />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setAmount(availableBalance * (percent / 100))}
                  className="py-2 bg-gray-800 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-700"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Precio:</span>
              <span className="text-white font-bold">{currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Comisión ({selectedPair === "WLD/USDT" ? "0.1" : "1"}%):</span>
              <span className="text-red-400 font-bold">
                -{formatNumber(amount * (selectedPair === "WLD/USDT" ? 0.001 : 0.01), 4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">P&L estimado (1%):</span>
              <span className="text-green-400 font-bold">
                +{formatNumber(amount * selectedLeverage * 0.01, 2)}
              </span>
            </div>
          </div>

          {/* Botón Abrir */}
          <button
            onClick={handleOpenPosition}
            className={`w-full py-5 rounded-xl font-bold text-xl ${
              direction === "long"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            Abrir {direction.toUpperCase()} {selectedLeverage}x
          </button>

          {/* Posiciones Abiertas */}
          {showPositions && myPositionsFiltered.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-gray-400">Tus Posiciones ({myPositionsFiltered.length})</div>
              {myPositionsFiltered.map((position) => (
                <div key={position.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <span className={`text-sm font-bold ${position.type === "long" ? "text-green-400" : "text-red-400"}`}>
                        {position.type.toUpperCase()} {position.leverage}x
                      </span>
                      <div className="text-xs text-gray-500">{position.symbol}</div>
                    </div>
                    <div className={`text-lg font-bold ${position.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-gray-500">Entrada</div>
                      <div className="text-white">{formatNumber(position.entryPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Actual</div>
                      <div className="text-[--color-gold]">{formatNumber(position.currentPrice || currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Monto</div>
                      <div className="text-white">{formatNumber(position.amount, 2)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClosePosition(position.id)}
                    className="w-full py-2 rounded-lg bg-[--color-gold] text-black font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tutorial colapsado */}
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-400 flex items-center justify-between px-4"
          >
            <span>📚 Guía de Trading</span>
            {showTutorial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTutorial && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2 text-sm text-gray-300">
              <p><strong className="text-[--color-gold]">LONG:</strong> Ganas si el precio sube</p>
              <p><strong className="text-red-400">SHORT:</strong> Ganas si el precio baja</p>
              <p><strong className="text-white">Apalancamiento:</strong> Multiplica ganancias y pérdidas</p>
              <p><strong className="text-white">Comisión:</strong> WLD/USDT 0.1% | NUMA/WLD 1%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
