"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { formatNumber, calculatePnL } from "@/lib/utils";

type MarketPair = "WLD/USDT" | "NUMA/WLD";

export default function Plataforma() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const positions = useAppStore((state) => state.positions);
  const user = useAppStore((state) => state.user);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);
  
  const [selectedPair, setSelectedPair] = useState<MarketPair>("NUMA/WLD");
  const [selectedLeverage, setSelectedLeverage] = useState(5);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [showGuide, setShowGuide] = useState(false);
  
  const [numaPrice, setNumaPrice] = useState(0.001);
  const [wldPrice, setWldPrice] = useState(2.5);

  const currentPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
  const availableBalance = selectedPair === "NUMA/WLD" ? user?.balanceNuma || 0 : user?.balanceWld || 0;
  const balanceSymbol = selectedPair === "NUMA/WLD" ? "NUMA" : "WLD";
  const amountNum = parseFloat(amount) || 0;

  // Simular precio en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setNumaPrice(prev => Math.max(prev + (Math.random() * 0.0002 - 0.0001), 0.0001));
      setWldPrice(prev => Math.max(prev + (Math.random() * 0.04 - 0.02), 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    
    if (amountNum < 0.10) {
      alert("❌ Mínimo 0.10");
      return;
    }

    const feeRate = selectedPair === "WLD/USDT" ? 0.001 : 0.01;
    const openingFee = amountNum * feeRate;
    
    if (selectedPair === "NUMA/WLD") {
      const totalNumaRequired = amountNum + openingFee;
      if (totalNumaRequired > user.balanceNuma) {
        alert(`❌ Balance insuficiente. Necesitas ${formatNumber(totalNumaRequired, 2)} NUMA`);
        return;
      }
    } else {
      const collateralRequired = (amountNum / selectedLeverage) + openingFee;
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
      amount: amountNum,
      leverage: selectedLeverage,
      pnl: 0,
      pnlPercentage: 0,
      openedAt: new Date(),
      closedAt: null,
      status: "open" as const,
    });

    setAmount("");
    alert(`✅ Posición ${direction.toUpperCase()} abierta`);
  };

  const myPositions = positions.filter(p => p.status === "open" && p.symbol === selectedPair);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-5 space-y-5">
        
        {/* Header con botón volver */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#FFD700]">Trading</h1>
            <p className="text-xs text-gray-500">Plataforma educativa</p>
          </div>
        </div>

        {/* Gráfica de Precio Simple */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value as MarketPair)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white font-bold text-sm"
              aria-label="Seleccionar par de trading"
            >
              <option value="NUMA/WLD">NUMA/WLD</option>
              <option value="WLD/USDT">WLD/USDT</option>
            </select>
            
            {myPositions.length > 0 && (
              <div className="bg-[#FFD700]/10 px-3 py-1 rounded-lg">
                <span className="text-[#FFD700] text-xs font-bold">{myPositions.length} abiertas</span>
              </div>
            )}
          </div>
          
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-2">{selectedPair}</div>
            <div className="text-6xl font-black text-white mb-4">
              {currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}
            </div>
            <div className="flex items-center justify-center gap-2">
              {Math.random() > 0.5 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={Math.random() > 0.5 ? "text-green-400 text-sm font-bold" : "text-red-400 text-sm font-bold"}>
                {(Math.random() * 2).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance:</span>
              <span className="text-white font-bold">{formatNumber(availableBalance, 2)} {balanceSymbol}</span>
            </div>
          </div>
        </div>

        {/* Controles de Trading */}
        <div className="card-premium p-6 space-y-5">
          
          {/* Long/Short */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDirection("long")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "long"
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                  : "bg-gray-900 text-gray-500 border border-gray-800"
              }`}
            >
              LONG ↗
            </button>
            <button
              onClick={() => setDirection("short")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "short"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-gray-900 text-gray-500 border border-gray-800"
              }`}
            >
              SHORT ↘
            </button>
          </div>

          {/* Apalancamiento */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Apalancamiento: <span className="text-white font-bold">{selectedLeverage}x</span></div>
            <div className="flex gap-2 flex-wrap">
              {[2, 5, 10, 25, 50].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setSelectedLeverage(lev)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all ${
                    selectedLeverage === lev
                      ? "bg-[#FFD700] text-black"
                      : "bg-gray-900 text-gray-500 border border-gray-800"
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
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-white text-xl font-bold focus:outline-none focus:border-[#FFD700]"
              step="0.01"
              min="0.10"
              placeholder="0.10"
            />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setAmount((availableBalance * (percent / 100)).toFixed(2))}
                  className="py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm font-bold text-gray-400 hover:border-[#FFD700] hover:text-[#FFD700] transition-all"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {amountNum >= 0.10 && (
            <div className="bg-gray-900 rounded-xl p-4 space-y-2 border border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio entrada:</span>
                <span className="text-white font-bold">{currentPrice.toFixed(selectedPair === "NUMA/WLD" ? 6 : 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Comisión ({selectedPair === "WLD/USDT" ? "0.1" : "1"}%):</span>
                <span className="text-red-400 font-bold">
                  -{formatNumber(amountNum * (selectedPair === "WLD/USDT" ? 0.001 : 0.01), 4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ganancias si sube 1%:</span>
                <span className="text-green-400 font-bold">
                  +{formatNumber(amountNum * selectedLeverage * 0.01, 2)}
                </span>
              </div>
            </div>
          )}

          {/* Botón Abrir */}
          <button
            onClick={handleOpenPosition}
            disabled={amountNum < 0.10}
            className={`w-full py-5 rounded-xl font-bold text-xl transition-all ${
              amountNum >= 0.10
                ? direction === "long"
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/30 active:scale-[0.98]"
                  : "bg-red-600 text-white shadow-lg shadow-red-600/30 active:scale-[0.98]"
                : "bg-gray-900 text-gray-600 cursor-not-allowed"
            }`}
          >
            {amountNum >= 0.10 ? `Abrir ${direction.toUpperCase()} ${selectedLeverage}x` : "Ingresa un monto"}
          </button>
        </div>

        {/* Posiciones Abiertas */}
        {myPositions.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 font-bold">Tus Posiciones ({myPositions.length})</div>
            {myPositions.map((position) => (
              <div key={position.id} className="card-premium p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-base font-bold ${position.type === "long" ? "text-green-400" : "text-red-400"}`}>
                      {position.type.toUpperCase()} {position.leverage}x
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{position.symbol}</div>
                  </div>
                  <div className={`text-2xl font-black ${position.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Entrada</div>
                    <div className="text-white font-bold">{formatNumber(position.entryPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Actual</div>
                    <div className="text-[#FFD700] font-bold">{formatNumber(position.currentPrice || currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Monto</div>
                    <div className="text-white font-bold">{formatNumber(position.amount, 2)}</div>
                  </div>
                </div>
                <button
                  onClick={() => closePosition(position.id)}
                  className="w-full py-3 rounded-xl bg-[#FFD700] text-black font-bold hover:bg-[#D4AF37] transition-all active:scale-[0.98]"
                >
                  Cerrar Posición
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Guía colapsable */}
        <div className="card-premium overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-4 flex items-center justify-between text-sm text-gray-400"
          >
            <span className="font-bold">📚 Guía de Trading</span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-300 border-t border-gray-800 pt-4">
              <div>
                <span className="font-bold text-green-400">LONG (↗):</span> Ganas si el precio sube
              </div>
              <div>
                <span className="font-bold text-red-400">SHORT (↘):</span> Ganas si el precio baja
              </div>
              <div>
                <span className="font-bold text-white">Apalancamiento:</span> Multiplica tus ganancias y pérdidas
              </div>
              <div>
                <span className="font-bold text-white">Comisiones:</span> WLD/USDT 0.1% | NUMA/WLD 1%
              </div>
            </div>
          )}
        </div>

        <div className="h-6"></div>
      </div>
    </div>
  );
}
