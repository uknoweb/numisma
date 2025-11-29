"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatNumber, calculatePnL } from "@/lib/utils";

type MarketPair = "WLD/USDT" | "NUMA/WLD";
type Direction = "long" | "short";

export default function Trading() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const user = useAppStore((state) => state.user);
  const positions = useAppStore((state) => state.positions);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);
  const updateBalance = useAppStore((state) => state.updateBalance);

  const [selectedPair, setSelectedPair] = useState<MarketPair>("WLD/USDT");
  const [direction, setDirection] = useState<Direction>("long");
  const [leverage, setLeverage] = useState(5);
  const [amount, setAmount] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Precios en tiempo real
  const [wldPrice, setWldPrice] = useState(2.5);
  const [numaPrice, setNumaPrice] = useState(0.001);
  
  // Historial de precios para la gráfica (últimos 50 puntos) - inicializar con datos
  const [wldPriceHistory, setWldPriceHistory] = useState<number[]>(() => {
    const initialHistory = [];
    for (let i = 0; i < 50; i++) {
      initialHistory.push(2.5 + (Math.random() * 0.2 - 0.1));
    }
    return initialHistory;
  });
  const [numaPriceHistory, setNumaPriceHistory] = useState<number[]>(() => {
    const initialHistory = [];
    for (let i = 0; i < 50; i++) {
      initialHistory.push(0.001 + (Math.random() * 0.0002 - 0.0001));
    }
    return initialHistory;
  });

  // Actualizar precio en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setWldPrice(prev => {
        const newPrice = Math.max(prev + (Math.random() * 0.04 - 0.02), 1);
        setWldPriceHistory(h => [...h.slice(-49), newPrice]);
        return newPrice;
      });
      
      setNumaPrice(prev => {
        const newPrice = Math.max(prev + (Math.random() * 0.0002 - 0.0001), 0.0001);
        setNumaPriceHistory(h => [...h.slice(-49), newPrice]);
        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Actualizar P&L de posiciones y cerrar automáticamente si balance < 0.1
  useEffect(() => {
    if (!user) return; // Validar que user exista
    
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

      // Calcular balance actual después del P&L
      const currentBalance = position.symbol === "WLD/USDT" 
        ? user.balanceWld + pnl
        : user.balanceNuma + pnl;

      // Cerrar automáticamente si balance < 0.1
      if (currentBalance < 0.1) {
        closePosition(position.id);
        alert(`⚠️ Posición #${position.id.slice(-4)} cerrada automáticamente\nBalance insuficiente (< 0.1 ${position.symbol === "WLD/USDT" ? "WLD" : "NUMA"})`);
      } else {
        // Actualizar P&L normal
        useAppStore.setState((state) => ({
          positions: state.positions.map((p) =>
            p.id === position.id ? { ...p, pnl, currentPrice: currentMarketPrice } : p
          ),
        }));
      }
    });
  }, [wldPrice, numaPrice, positions, user?.balanceWld, user?.balanceNuma, closePosition]);

  // Dibujar gráfica en Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 20;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Calcular rango de precios
    const history = selectedPair === "WLD/USDT" ? wldPriceHistory : numaPriceHistory;
    const maxPrice = Math.max(...history);
    const minPrice = Math.min(...history);
    const priceRange = maxPrice - minPrice || 0.01;

    // Dibujar grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Línea horizontal del medio
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();
    
    // Líneas verticales
    ctx.setLineDash([]);
    for (let i = 1; i <= 3; i++) {
      const x = padding + (width - 2 * padding) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Dibujar línea de precio
    if (history.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();

      history.forEach((price, i) => {
        const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
        const y = padding + ((maxPrice - price) / priceRange) * (height - 2 * padding);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Dibujar marcadores de posiciones
    const myPositions = positions.filter(
      p => p.status === "open" && p.symbol === selectedPair
    );

    myPositions.forEach((pos) => {
      const entryY = padding + ((maxPrice - pos.entryPrice) / priceRange) * (height - 2 * padding);
      const color = pos.type === "long" ? "#22c55e" : "#ef4444";

      // Línea punteada
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(padding, entryY);
      ctx.lineTo(width - padding, entryY);
      ctx.stroke();

      // Círculo
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(width - padding - 10, entryY, 6, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [wldPriceHistory, numaPriceHistory, selectedPair, positions]);

  // Validar que el usuario exista
  if (!user) return null;

  const currentPrice = selectedPair === "WLD/USDT" ? wldPrice : numaPrice;
  const priceHistory = selectedPair === "WLD/USDT" ? wldPriceHistory : numaPriceHistory;
  const amountNum = parseFloat(amount) || 0;
  const availableBalance = selectedPair === "WLD/USDT" ? user.balanceWld : user.balanceNuma;
  const balanceSymbol = selectedPair === "WLD/USDT" ? "WLD" : "NUMA";

  // Comisiones
  const feeRate = selectedPair === "WLD/USDT" ? 0.001 : 0.01; // 0.1% WLD, 1% NUMA
  const openingFee = amountNum * feeRate;
  const estimatedPnL1Percent = amountNum * leverage * 0.01;

  const handleOpenPosition = () => {
    if (amountNum < 0.1) {
      alert("❌ Monto mínimo: 0.1");
      return;
    }

    if (amountNum + openingFee > availableBalance) {
      alert(`❌ Balance insuficiente\nNecesitas: ${formatNumber(amountNum + openingFee, 2)} ${balanceSymbol}`);
      return;
    }

    const newPosition = {
      id: `pos_${Date.now()}`,
      userId: user.id,
      symbol: selectedPair,
      type: direction,
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      amount: amountNum,
      leverage: leverage,
      pnl: 0,
      pnlPercentage: 0,
      openedAt: new Date(),
      closedAt: null,
      status: "open" as const,
    };

    addPosition(newPosition);

    // Descontar del balance correspondiente
    if (selectedPair === "WLD/USDT") {
      updateBalance(user.balanceNuma, user.balanceWld - amountNum - openingFee);
    } else {
      updateBalance(user.balanceNuma - amountNum - openingFee, user.balanceWld);
    }

    setAmount("");
    alert(`✅ Posición ${direction.toUpperCase()} abierta\n${amountNum} ${balanceSymbol} @ ${formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}`);
  };

  const handleClosePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const closingFee = position.amount * feeRate;
    const finalPnL = position.pnl - closingFee;

    // Devolver al balance
    if (position.symbol === "WLD/USDT") {
      updateBalance(user.balanceNuma, user.balanceWld + position.amount + finalPnL);
    } else {
      updateBalance(user.balanceNuma + position.amount + finalPnL, user.balanceWld);
    }

    closePosition(positionId);
    alert(`✅ Posición cerrada\nP&L: ${finalPnL >= 0 ? "+" : ""}${formatNumber(finalPnL, 2)} ${position.symbol === "WLD/USDT" ? "WLD" : "NUMA"}`);
  };

  const myPositions = positions.filter(
    p => p.status === "open" && p.symbol === selectedPair
  );

  // Calcular rango de la gráfica
  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);
  const priceRange = maxPrice - minPrice || 0.01;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="w-12 h-12 rounded-xl card-modern flex items-center justify-center hover:shadow-md transition-all"
            aria-label="Volver al menú"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading de Futuros</h1>
            <p className="text-sm text-gray-500">Opera con apalancamiento en tiempo real</p>
          </div>
        </div>

        {/* Selector de Par */}
        <div className="card-modern p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Par de trading:</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value as MarketPair)}
              className="px-4 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Seleccionar par de trading"
            >
              <option value="WLD/USDT">WLD/USDT</option>
              <option value="NUMA/WLD">NUMA/WLD</option>
            </select>
            {myPositions.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                {myPositions.length} {myPositions.length === 1 ? "posición" : "posiciones"} abiertas
              </span>
            )}
          </div>
        </div>

        {/* Gráfica de Precio */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 font-medium">{selectedPair}</div>
              <div className="text-4xl font-bold text-gray-900">
                {formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {Math.random() > 0.5 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-bold text-sm">+{(Math.random() * 2).toFixed(2)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-bold text-sm">-{(Math.random() * 2).toFixed(2)}%</span>
                </>
              )}
            </div>
          </div>

          {/* Gráfica simple con líneas */}
          <div className="h-64 bg-gray-50 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 p-4">
              <canvas 
                ref={canvasRef}
                className="w-full h-full block"
              />
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance disponible:</span>
              <span className="font-bold text-gray-900">
                {formatNumber(availableBalance, 2)} {balanceSymbol}
              </span>
            </div>
            {/* Info de debug para verificar datos */}
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <div>Puntos de datos: {priceHistory.length}</div>
              <div>Precio actual: {formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
              <div>Rango: {formatNumber(minPrice, selectedPair === "NUMA/WLD" ? 6 : 2)} - {formatNumber(maxPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}</div>
            </div>
          </div>
        </div>

        {/* Controles de Trading */}
        <div className="card-modern p-6 space-y-5">
          <h3 className="text-lg font-bold text-gray-900">Abrir Posición</h3>

          {/* Long/Short */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDirection("long")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "long"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              LONG ↗
            </button>
            <button
              onClick={() => setDirection("short")}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                direction === "short"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              SHORT ↘
            </button>
          </div>

          {/* Apalancamiento */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Apalancamiento: <span className="text-indigo-600 font-bold">{leverage}x</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[2, 5, 10, 25, 50, 100].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setLeverage(lev)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all ${
                    leverage === lev
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Monto ({balanceSymbol})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-gray-300 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.1 mínimo"
              step="0.1"
              min="0.1"
            />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setAmount((availableBalance * (percent / 100)).toFixed(2))}
                  className="py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {amountNum >= 0.1 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio de entrada:</span>
                <span className="font-bold text-gray-900">
                  {formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Comisión de apertura ({(feeRate * 100).toFixed(1)}%):</span>
                <span className="text-red-600 font-bold">
                  -{formatNumber(openingFee, 4)} {balanceSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">P&L estimado (+1%):</span>
                <span className="text-green-600 font-bold">
                  +{formatNumber(estimatedPnL1Percent, 2)} {balanceSymbol}
                </span>
              </div>
            </div>
          )}

          {/* Botón Abrir */}
          <button
            onClick={handleOpenPosition}
            disabled={amountNum < 0.1}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              amountNum >= 0.1
                ? direction === "long"
                  ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]"
                  : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {amountNum >= 0.1 
              ? `Abrir ${direction.toUpperCase()} ${leverage}x` 
              : "Ingresa un monto (mín. 0.1)"}
          </button>
        </div>

        {/* Posiciones Abiertas */}
        {myPositions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">
              Tus Posiciones ({myPositions.length})
            </h3>
            {myPositions.map((position) => (
              <div key={position.id} className="card-modern p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={`text-lg font-bold ${
                      position.type === "long" ? "text-green-600" : "text-red-600"
                    }`}>
                      {position.type.toUpperCase()} {position.leverage}x
                    </div>
                    <div className="text-sm text-gray-500">{position.symbol}</div>
                  </div>
                  <div className={`text-3xl font-bold ${
                    position.pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {position.pnl >= 0 ? "+" : ""}{formatNumber(position.pnl, 2)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Entrada</div>
                    <div className="font-bold text-gray-900">
                      {formatNumber(position.entryPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Actual</div>
                    <div className="font-bold text-indigo-600">
                      {formatNumber(position.currentPrice || currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Monto</div>
                    <div className="font-bold text-gray-900">
                      {formatNumber(position.amount, 2)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleClosePosition(position.id)}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                  Cerrar Posición
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Guía Colapsable */}
        <div className="card-modern overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-4 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <span className="font-bold flex items-center gap-2">
              <Info className="w-4 h-4" />
              ¿Cómo funciona el trading de futuros?
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-700 border-t border-gray-200 pt-4">
              <div>
                <span className="font-bold text-green-600">LONG (↗):</span> Ganas si el precio sube. 
                Pierdes si baja.
              </div>
              <div>
                <span className="font-bold text-red-600">SHORT (↘):</span> Ganas si el precio baja. 
                Pierdes si sube.
              </div>
              <div>
                <span className="font-bold text-indigo-600">Apalancamiento:</span> Multiplica tus 
                ganancias Y pérdidas. 10x = 10 veces más ganancias o pérdidas.
              </div>
              <div>
                <span className="font-bold text-gray-900">Comisiones:</span> WLD/USDT cobra 0.1%, 
                NUMA/WLD cobra 1% al abrir y cerrar.
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <span className="font-bold text-yellow-800">⚠️ Cierre automático:</span> Si tu 
                balance cae por debajo de 0.1, tu posición se cerrará automáticamente.
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="font-bold text-blue-800">💡 Tip:</span> Los marcadores en la 
                gráfica muestran tu precio de entrada. Verde = LONG, Rojo = SHORT.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
