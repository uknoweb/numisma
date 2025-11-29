"use client";

import { useState, useEffect } from "react";
import { OrderSide, RISK_PRESETS, calculateStopLossPrice, calculateTakeProfitPrice, calculateEstimatedPnL, calculateRiskRewardRatio } from "@/lib/advanced-trading";
import { useAdvancedOrders } from "@/hooks/useAdvancedOrders";
import { TrendingDown, TrendingUp, X, AlertCircle, Target, Shield } from "lucide-react";

interface StopLossTakeProfitPanelProps {
  positionId: number;
  entryPrice: number;
  currentPrice: number;
  collateral: number;
  leverage: number;
  side: OrderSide;
  onClose: () => void;
}

export default function StopLossTakeProfitPanel({
  positionId,
  entryPrice,
  currentPrice,
  collateral,
  leverage,
  side,
  onClose,
}: StopLossTakeProfitPanelProps) {
  const { orders, createStopLoss, createTakeProfit, cancelOrder, isLoading } = useAdvancedOrders(positionId);
  
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof RISK_PRESETS>('balanced');
  const [slPercentage, setSlPercentage] = useState(3);
  const [tpPercentage, setTpPercentage] = useState(9);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar preset
  useEffect(() => {
    const preset = RISK_PRESETS[selectedPreset];
    if (selectedPreset !== 'custom') {
      setSlPercentage(preset.stopLoss);
      setTpPercentage(preset.takeProfit);
    }
  }, [selectedPreset]);

  const slPrice = calculateStopLossPrice(entryPrice, slPercentage, side);
  const tpPrice = calculateTakeProfitPrice(entryPrice, tpPercentage, side);
  const slPnL = calculateEstimatedPnL(entryPrice, slPrice, collateral, leverage, side);
  const tpPnL = calculateEstimatedPnL(entryPrice, tpPrice, collateral, leverage, side);
  const riskReward = calculateRiskRewardRatio(entryPrice, slPrice, tpPrice, side);

  const hasStopLoss = orders.some(o => o.type === 'stop_loss' && o.status === 'active');
  const hasTakeProfit = orders.some(o => o.type === 'take_profit' && o.status === 'active');

  const handleCreateOrders = async () => {
    let success = true;

    if (!hasStopLoss && slPercentage > 0) {
      const result = await createStopLoss(entryPrice, slPercentage, side);
      if (!result.success) {
        success = false;
        alert(result.error);
      }
    }

    if (!hasTakeProfit && tpPercentage > 0) {
      const result = await createTakeProfit(entryPrice, tpPercentage, side);
      if (!result.success) {
        success = false;
        alert(result.error);
      }
    }

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleRemoveOrder = async (orderId: number) => {
    await cancelOrder(orderId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Stop Loss & Take Profit</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-bold text-white">¡Órdenes Creadas!</p>
            <p className="text-gray-400 mt-2">Tus órdenes están activas</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Órdenes Activas */}
            {orders.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Órdenes Activas
                </h3>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-black/40 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {order.type === 'stop_loss' ? '🛡️ Stop Loss' : '🎯 Take Profit'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {'triggerPrice' in order && `$${order.triggerPrice.toLocaleString()}`}
                          {order.percentage && ` (${order.percentage}%)`}
                        </p>
                      </div>
                      <button
                        onClick={() => order.id && handleRemoveOrder(order.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Presets */}
            <div>
              <h3 className="font-bold text-white mb-3">Estrategia de Riesgo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(RISK_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key as keyof typeof RISK_PRESETS)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPreset === key
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-2">{preset.icon}</div>
                    <p className="text-sm font-bold text-white">{preset.name}</p>
                    {key !== 'custom' && (
                      <p className="text-xs text-gray-400 mt-1">
                        -{preset.stopLoss}% / +{preset.takeProfit}%
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Loss */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-white">Stop Loss</h3>
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Pérdida Máxima (%)</label>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={slPercentage}
                  onChange={(e) => {
                    setSlPercentage(parseFloat(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-400">0.5%</span>
                  <span className="text-lg font-bold text-white">{slPercentage}%</span>
                  <span className="text-sm text-gray-400">20%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Precio</p>
                  <p className="text-sm font-bold text-white">${slPrice.toLocaleString()}</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <p className="text-xs text-gray-400">P&L Estimado</p>
                  <p className="text-sm font-bold text-red-400">{slPnL.toLocaleString()} NUMA</p>
                </div>
              </div>
            </div>

            {/* Take Profit */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-white">Take Profit</h3>
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Ganancia Objetivo (%)</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={tpPercentage}
                  onChange={(e) => {
                    setTpPercentage(parseFloat(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-400">1%</span>
                  <span className="text-lg font-bold text-white">{tpPercentage}%</span>
                  <span className="text-sm text-gray-400">50%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Precio</p>
                  <p className="text-sm font-bold text-white">${tpPrice.toLocaleString()}</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <p className="text-xs text-gray-400">P&L Estimado</p>
                  <p className="text-sm font-bold text-green-400">+{tpPnL.toLocaleString()} NUMA</p>
                </div>
              </div>
            </div>

            {/* Risk/Reward Ratio */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Risk/Reward Ratio</p>
                  <p className="text-xs text-gray-500 mt-1">Recompensa por unidad de riesgo</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">1:{riskReward.toFixed(1)}</p>
                  <p className={`text-xs mt-1 ${riskReward >= 2 ? 'text-green-400' : riskReward >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {riskReward >= 2 ? '✅ Excelente' : riskReward >= 1.5 ? '⚠️ Aceptable' : '❌ Bajo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrders}
                disabled={isLoading || (hasStopLoss && hasTakeProfit)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-colors"
              >
                {isLoading ? 'Creando...' : hasStopLoss && hasTakeProfit ? 'Órdenes Activas' : 'Crear Órdenes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
