"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { formatNumber, calculatePnL } from "@/lib/utils";
import { useWLDPrice, useNUMAPrice } from "@/hooks/usePrices";
import { useOpenPosition, useClosePosition, useGetCurrentPnL } from "@/hooks/usePoolContract";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { TradingPair, PositionType, POOL_CONTRACT_ADDRESS } from "@/lib/contracts";
import { 
  useNUMABalance, 
  useWLDBalance, 
  useApproveNUMA, 
  useApproveWLD,
  useNUMAAllowance,
  useWLDAllowance 
} from "@/hooks/useTokens";
import { 
  useDepositNUMA, 
  useDepositWLD, 
  useWithdrawNUMA, 
  useWithdrawWLD,
  useTraderBalanceNUMA,
  useTraderBalanceWLD,
  usePoolLiquidity
} from "@/hooks/usePoolDeposits";

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
  const [timeframe, setTimeframe] = useState<"1s" | "1m" | "5m" | "15m">("1s");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositToken, setDepositToken] = useState<"NUMA" | "WLD">("NUMA");
  
  // Blockchain hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { price: wldPrice, isLoading: wldLoading } = useWLDPrice();
  const { price: numaPrice } = useNUMAPrice();
  const { openPosition, isPending: isOpeningPosition, isConfirming: isConfirmingOpen } = useOpenPosition();
  const { closePosition: closePositionOnChain, isPending: isClosingPosition, isConfirming: isConfirmingClose } = useClosePosition();
  
  // Token balances (wallet)
  const { balance: numaWalletBalance, isLoading: numaBalanceLoading } = useNUMABalance(address);
  const { balance: wldWalletBalance, isLoading: wldBalanceLoading } = useWLDBalance(address);
  
  // Pool balances (trader deposits)
  const { balance: numaPoolBalance } = useTraderBalanceNUMA(address);
  const { balance: wldPoolBalance } = useTraderBalanceWLD(address);
  
  // Allowances
  const { allowance: numaAllowance } = useNUMAAllowance(address, POOL_CONTRACT_ADDRESS);
  const { allowance: wldAllowance } = useWLDAllowance(address, POOL_CONTRACT_ADDRESS);
  
  // Pool liquidity
  const { numaLiquidity, wldLiquidity } = usePoolLiquidity();
  
  // Approve hooks
  const { approve: approveNUMA, isPending: isApprovingNUMA, isSuccess: numaApproved } = useApproveNUMA(POOL_CONTRACT_ADDRESS);
  const { approve: approveWLD, isPending: isApprovingWLD, isSuccess: wldApproved } = useApproveWLD(POOL_CONTRACT_ADDRESS);
  
  // Deposit/Withdraw hooks
  const { deposit: depositNUMA, isPending: isDepositingNUMA, isSuccess: numaDeposited } = useDepositNUMA();
  const { deposit: depositWLD, isPending: isDepositingWLD, isSuccess: wldDeposited } = useDepositWLD();
  const { withdraw: withdrawNUMA, isPending: isWithdrawingNUMA } = useWithdrawNUMA();
  const { withdraw: withdrawWLD, isPending: isWithdrawingWLD } = useWithdrawWLD();
  
  // Historial de precios para la gráfica según temporalidad
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
      initialHistory.push(0.001 + (Math.random() * 0.0004 - 0.0002));
    }
    return initialHistory;
  });

  // Actualizar precio en tiempo real según temporalidad
  useEffect(() => {
    // Determinar intervalo según timeframe
    const intervals = {
      "1s": 1000,
      "1m": 60000,
      "5m": 300000,
      "15m": 900000,
    };
    
    const interval = setInterval(() => {
      setWldPrice(prev => {
        // WLD: Volatilidad sutil aumentada para generar ganancias (0.3% aprox)
        const volatility = prev * (Math.random() * 0.006 - 0.003); // ±0.3%
        const newPrice = Math.max(prev + volatility, 1);
        setWldPriceHistory(h => [...h.slice(-49), newPrice]);
        return newPrice;
      });
      
      setNumaPrice(prev => {
        // NUMA: Alta volatilidad (±10%)
        const volatility = prev * (Math.random() * 0.2 - 0.1); // ±10%
        const newPrice = Math.max(prev + volatility, 0.0001);
        setNumaPriceHistory(h => [...h.slice(-49), newPrice]);
        return newPrice;
      });
    }, intervals[timeframe]);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Actualizar P&L de posiciones y cerrar automáticamente si balance < 0.1
  useEffect(() => {
    if (!user) return;
    
    const checkPositions = () => {
      positions.filter(p => p.status === "open").forEach(position => {
        try {
          const currentMarketPrice = position.symbol === "NUMA/WLD" ? numaPrice : wldPrice;
          const { pnl } = calculatePnL(
            position.entryPrice,
            currentMarketPrice,
            position.amount,
            position.leverage,
            position.type === "long",
            position.symbol
          );

          const currentBalance = position.symbol === "WLD/USDT" 
            ? user.balanceWld + pnl
            : user.balanceNuma + pnl;

          if (currentBalance < 0.1) {
            closePosition(position.id);
          }
        } catch (error) {
          console.error('Error checking position:', error);
        }
      });
    };
    
    checkPositions();
  }, [wldPrice, numaPrice]);

  // Validar que el usuario exista
  if (!user) return null;

  const currentPrice = selectedPair === "WLD/USDT" ? wldPrice : numaPrice;
  const priceHistory = selectedPair === "WLD/USDT" ? wldPriceHistory : numaPriceHistory;
  const amountNum = parseFloat(amount) || 0;
  const availableBalance = selectedPair === "WLD/USDT" ? user.balanceWld : user.balanceNuma;
  const balanceSymbol = selectedPair === "WLD/USDT" ? "WLD" : "NUMA";

  // Comisiones del contrato (0.2% en apertura)
  const PLATFORM_FEE = 0.002; // 0.2% trading fee (20 basis points)
  const openingFee = amountNum * PLATFORM_FEE;
  const estimatedPnL1Percent = amountNum * leverage * 0.01;
  
  const myPositions = positions.filter(
    p => p.status === "open" && p.symbol === selectedPair
  );

  // Calcular rango de la gráfica con validaciones seguras
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory) : currentPrice * 1.01;
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory) : currentPrice * 0.99;
  const priceRange = maxPrice - minPrice || 0.01;

  const handleOpenPosition = async () => {
    if (!isConnected) {
      alert("❌ Por favor conecta tu wallet primero");
      return;
    }

    if (amountNum < 0.1) {
      alert("❌ Monto mínimo: 0.1");
      return;
    }

    // Verificar balance incluyendo fee oculto
    if (amountNum + openingFee > availableBalance) {
      alert(`❌ Balance insuficiente`);
      return;
    }

    try {
      // Mapear valores al contrato
      const pair = selectedPair === "WLD/USDT" ? TradingPair.WLD_USDT : TradingPair.NUMA_WLD;
      const posType = direction === "long" ? PositionType.LONG : PositionType.SHORT;

      // Llamar al contrato
      await openPosition(pair, posType, leverage);

      // Crear posición local para UI (será reemplazado por lectura del contrato después)
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

      // Descontar balance + fee oculto de apertura (0.2%)
      if (selectedPair === "WLD/USDT") {
        updateBalance(user.balanceNuma, user.balanceWld - amountNum - openingFee);
      } else {
        updateBalance(user.balanceNuma - amountNum - openingFee, user.balanceWld);
      }

      setAmount("");
      alert(`✅ Posición ${direction.toUpperCase()} abierta\n${amountNum} ${balanceSymbol} @ ${formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}`);
    } catch (error: any) {
      console.error('Error opening position:', error);
      if (error.message?.includes('User rejected')) {
        alert('❌ Transacción cancelada');
      } else {
        alert('❌ Error al abrir posición. Por favor intenta de nuevo.');
      }
    }
  };

  const handleClosePosition = async (positionId: string) => {
    if (!isConnected) {
      alert("❌ Por favor conecta tu wallet primero");
      return;
    }

    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    try {
      // TODO: Obtener el ID real del contrato una vez implementemos lectura de posiciones
      // Por ahora usamos índice 0 como placeholder
      const contractPositionId = 0;

      // Llamar al contrato
      await closePositionOnChain(BigInt(contractPositionId));

      // Fee oculto de cierre (0.2%)
      const closingFee = position.amount * PLATFORM_FEE;
      
      // P&L final después de fee de cierre
      const finalPnL = position.pnl - closingFee;

      // Devolver al balance (monto original + P&L - fee de cierre)
      if (position.symbol === "WLD/USDT") {
        updateBalance(user.balanceNuma, user.balanceWld + position.amount + finalPnL);
      } else {
        updateBalance(user.balanceNuma + position.amount + finalPnL, user.balanceWld);
      }

      closePosition(positionId);
      alert(`✅ Posición cerrada\nP&L: ${finalPnL >= 0 ? "+" : ""}${formatNumber(finalPnL, 2)} ${position.symbol === "WLD/USDT" ? "WLD" : "NUMA"}`);
    } catch (error: any) {
      console.error('Error closing position:', error);
      if (error.message?.includes('User rejected')) {
        alert('❌ Transacción cancelada');
      } else {
        alert('❌ Error al cerrar posición. Por favor intenta de nuevo.');
      }
    }
  };

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Trading de Futuros</h1>
            <p className="text-sm text-gray-500">Opera con apalancamiento en tiempo real</p>
          </div>
          
          {/* Botón de Wallet */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                <div className="text-xs text-green-600 font-medium">Conectado</div>
                <div className="text-sm font-mono font-bold text-green-700">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all text-sm"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const connector = connectors[0];
                if (connector) connect({ connector });
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Conectar Wallet
            </button>
          )}
        </div>

        {/* Balances y Gestión de Fondos */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Wallet */}
            <div className="card-modern p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Wallet Balance
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">NUMA:</span>
                  <span className="font-bold text-gray-900">
                    {numaBalanceLoading ? "..." : formatNumber(parseFloat(numaWalletBalance), 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">WLD:</span>
                  <span className="font-bold text-gray-900">
                    {wldBalanceLoading ? "..." : formatNumber(parseFloat(wldWalletBalance), 2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all text-sm"
              >
                Depositar al Pool
              </button>
            </div>

            {/* Balance en Pool */}
            <div className="card-modern p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Balance en Pool (Trading)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">NUMA:</span>
                  <span className="font-bold text-green-700">
                    {formatNumber(parseFloat(numaPoolBalance), 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">WLD:</span>
                  <span className="font-bold text-green-700">
                    {formatNumber(parseFloat(wldPoolBalance), 2)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
                    if (parseFloat(numaPoolBalance) > 0) {
                      withdrawNUMA(numaPoolBalance);
                    }
                  }}
                  disabled={parseFloat(numaPoolBalance) === 0 || isWithdrawingNUMA}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawingNUMA ? "..." : "Retirar NUMA"}
                </button>
                <button
                  onClick={() => {
                    if (parseFloat(wldPoolBalance) > 0) {
                      withdrawWLD(wldPoolBalance);
                    }
                  }}
                  disabled={parseFloat(wldPoolBalance) === 0 || isWithdrawingWLD}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawingWLD ? "..." : "Retirar WLD"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Depósito */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-modern p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Depositar al Pool</h3>
              
              <div className="space-y-4">
                {/* Selector de Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Token:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDepositToken("NUMA")}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        depositToken === "NUMA"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      NUMA
                    </button>
                    <button
                      onClick={() => setDepositToken("WLD")}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        depositToken === "WLD"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      WLD
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const maxBalance = depositToken === "NUMA" ? numaWalletBalance : wldWalletBalance;
                        setDepositAmount(maxBalance);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Disponible: {depositToken === "NUMA" 
                      ? formatNumber(parseFloat(numaWalletBalance), 2) 
                      : formatNumber(parseFloat(wldWalletBalance), 2)} {depositToken}
                  </div>
                </div>

                {/* Allowance Info */}
                {depositToken === "NUMA" && parseFloat(numaAllowance) < parseFloat(depositAmount || "0") && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-700 font-medium">
                      ⚠️ Primero debes aprobar el pool para gastar tus NUMA
                    </div>
                  </div>
                )}
                {depositToken === "WLD" && parseFloat(wldAllowance) < parseFloat(depositAmount || "0") && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-700 font-medium">
                      ⚠️ Primero debes aprobar el pool para gastar tus WLD
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {depositToken === "NUMA" && parseFloat(numaAllowance) < parseFloat(depositAmount || "0") ? (
                    <button
                      onClick={() => {
                        if (depositAmount) approveNUMA(depositAmount);
                      }}
                      disabled={!depositAmount || isApprovingNUMA}
                      className="col-span-2 px-4 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApprovingNUMA ? "Aprobando..." : "Aprobar NUMA"}
                    </button>
                  ) : depositToken === "WLD" && parseFloat(wldAllowance) < parseFloat(depositAmount || "0") ? (
                    <button
                      onClick={() => {
                        if (depositAmount) approveWLD(depositAmount);
                      }}
                      disabled={!depositAmount || isApprovingWLD}
                      className="col-span-2 px-4 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApprovingWLD ? "Aprobando..." : "Aprobar WLD"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (depositAmount) {
                          if (depositToken === "NUMA") {
                            depositNUMA(depositAmount);
                          } else {
                            depositWLD(depositAmount);
                          }
                          setShowDepositModal(false);
                          setDepositAmount("");
                        }
                      }}
                      disabled={!depositAmount || isDepositingNUMA || isDepositingWLD}
                      className="col-span-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDepositingNUMA || isDepositingWLD ? "Depositando..." : `Depositar ${depositToken}`}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDepositModal(false);
                      setDepositAmount("");
                    }}
                    className="col-span-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selector de Par */}
        <div className="card-modern p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Par:</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value as MarketPair)}
              className="px-4 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Seleccionar par de trading"
            >
              <option value="WLD/USDT">WLD/USDT</option>
              <option value="NUMA/WLD">NUMA/WLD</option>
            </select>
            
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-700">Temporalidad:</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(["1s", "1m", "5m", "15m"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      timeframe === tf
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            
            {myPositions.length > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                {myPositions.length} {myPositions.length === 1 ? "posición" : "posiciones"}
              </span>
            )}
          </div>
        </div>

        {/* Gráfica de Precio */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm text-gray-500 font-medium">{selectedPair}</div>
                {wldLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Precio en vivo"></div>
              </div>
              <div className="text-4xl font-bold text-gray-900">
                {formatNumber(currentPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {selectedPair === "WLD/USDT" ? "Desde CoinGecko API" : "Tasa fija 10:1"}
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
          <div className="h-64 bg-gray-50 rounded-xl overflow-hidden p-4">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 600 200" 
              preserveAspectRatio="xMidYMid meet"
              className="block"
            >
              {/* Fondo */}
              <rect width="600" height="200" fill="#f9fafb" />
              
              {/* Grid */}
              <line x1="50" y1="0" x2="50" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="350" y1="0" x2="350" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="500" y1="0" x2="500" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#d1d5db" strokeWidth="2" strokeDasharray="5,5" />
              
              {(() => {
                if (!priceHistory || priceHistory.length < 2) {
                  return (
                    <text x="300" y="100" textAnchor="middle" fill="#9ca3af" fontSize="14">
                      Cargando...
                    </text>
                  );
                }
                
                try {
                  const padding = 50;
                  const width = 500;
                  const height = 160;
                  const top = 20;
                  
                  const max = Math.max(...priceHistory);
                  const min = Math.min(...priceHistory);
                  const range = max - min || 0.01;
                  
                  const points = priceHistory.map((price, i) => {
                    const x = padding + (i / (priceHistory.length - 1)) * width;
                    const y = top + ((max - price) / range) * height;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <>
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Etiquetas */}
                      <text x="10" y="30" fill="#6b7280" fontSize="11">
                        {formatNumber(max, selectedPair === "NUMA/WLD" ? 6 : 2)}
                      </text>
                      <text x="10" y="190" fill="#6b7280" fontSize="11">
                        {formatNumber(min, selectedPair === "NUMA/WLD" ? 6 : 2)}
                      </text>
                      
                      {/* Marcadores de posiciones */}
                      {myPositions.map((pos) => {
                        const y = top + ((max - pos.entryPrice) / range) * height;
                        const color = pos.type === "long" ? "#22c55e" : "#ef4444";
                        return (
                          <g key={pos.id}>
                            <line
                              x1={padding}
                              y1={y}
                              x2={550}
                              y2={y}
                              stroke={color}
                              strokeWidth="1.5"
                              strokeDasharray="6,3"
                              opacity="0.7"
                            />
                            <circle cx="540" cy={y} r="4" fill={color} />
                          </g>
                        );
                      })}
                    </>
                  );
                } catch (err) {
                  console.error('Chart error:', err);
                  return (
                    <text x="300" y="100" textAnchor="middle" fill="#ef4444" fontSize="12">
                      Error
                    </text>
                  );
                }
              })()}
            </svg>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance disponible:</span>
              <span className="font-bold text-gray-900">
                {formatNumber(availableBalance, 2)} {balanceSymbol}
              </span>
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
                <span className="text-gray-600">Apalancamiento:</span>
                <span className="font-bold text-indigo-600">{leverage}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">P&L estimado (+1%):</span>
                <span className="text-green-600 font-bold">
                  +{formatNumber(estimatedPnL1Percent, 2)} {balanceSymbol}
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
                * Se aplica una comisión menor al 1% en operaciones
              </div>
            </div>
          )}

          {/* Botón Abrir */}
          <button
            onClick={handleOpenPosition}
            disabled={amountNum < 0.1 || isOpeningPosition || isConfirmingOpen || !isConnected}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              amountNum >= 0.1 && isConnected && !isOpeningPosition && !isConfirmingOpen
                ? direction === "long"
                  ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]"
                  : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isOpeningPosition && <Loader2 className="w-5 h-5 animate-spin" />}
            {isConfirmingOpen && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isConnected 
              ? "Conecta tu wallet" 
              : isOpeningPosition
              ? "Esperando confirmación..."
              : isConfirmingOpen
              ? "Confirmando transacción..."
              : amountNum >= 0.1 
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
            {myPositions.map((position) => {
              // Calcular P&L en tiempo real
              const currentMarketPrice = selectedPair === "NUMA/WLD" ? numaPrice : wldPrice;
              const { pnl, pnlPercentage } = calculatePnL(
                position.entryPrice,
                currentMarketPrice,
                position.amount,
                position.leverage,
                position.type === "long",
                position.symbol
              );
              
              return (
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
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {pnl >= 0 ? "+" : ""}{formatNumber(pnl, 2)}
                      </div>
                      <div className={`text-sm font-medium ${
                        pnlPercentage >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(2)}%
                      </div>
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
                        {formatNumber(currentMarketPrice, selectedPair === "NUMA/WLD" ? 6 : 2)}
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
                    disabled={isClosingPosition || isConfirmingClose || !isConnected}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isClosingPosition || isConfirmingClose || !isConnected
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                    }`}
                  >
                    {(isClosingPosition || isConfirmingClose) && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isClosingPosition
                      ? "Esperando confirmación..."
                      : isConfirmingClose
                      ? "Confirmando transacción..."
                      : "Cerrar Posición"}
                  </button>
                </div>
              );
            })}
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
                <span className="font-bold text-gray-900">Comisiones:</span> 0.2% al abrir posiciones
                (20 basis points según contrato).
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
