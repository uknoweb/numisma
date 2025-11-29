"use client";

import { useState, useEffect } from "react";
import { OrderSide, validateTrailingStop, calculateTrailingStopPrice } from "@/lib/advanced-trading";
import { useAdvancedOrders } from "@/hooks/useAdvancedOrders";
import { TrendingDown, X, Info } from "lucide-react";

interface TrailingStopPanelProps {
  positionId: number;
  currentPrice: number;
  side: OrderSide;
  onClose: () => void;
}

export default function TrailingStopPanel({
  positionId,
  currentPrice,
  side,
  onClose,
}: TrailingStopPanelProps) {
  const { orders, createTrailingStop, cancelOrder, isLoading } = useAdvancedOrders(positionId);
  
  const [percentage, setPercentage] = useState(5);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasTrailingStop = orders.some(o => o.type === 'trailing_stop' && o.status === 'active');
  const activeTrailingStop = orders.find(o => o.type === 'trailing_stop' && o.status === 'active');

  const triggerPrice = calculateTrailingStopPrice(
    currentPrice,
    currentPrice,
    currentPrice,
    percentage,
    side
  );

  const handleCreate = async () => {
    const result = await createTrailingStop(currentPrice, percentage, side);
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      alert(result.error);
    }
  };

  const handleRemove = async () => {
    if (activeTrailingStop?.id) {
      await cancelOrder(activeTrailingStop.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Trailing Stop</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-bold text-white">¡Trailing Stop Activado!</p>
            <p className="text-gray-400 mt-2">Se ajustará automáticamente</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-1">¿Qué es un Trailing Stop?</p>
                  <p>
                    Es un stop loss que se ajusta automáticamente a medida que el precio se mueve a tu favor, 
                    protegiéndote mientras maximizas ganancias.
                  </p>
                </div>
              </div>
            </div>

            {/* Orden Activa */}
            {hasTrailingStop && activeTrailingStop && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">Trailing Stop Activo</h3>
                  <button
                    onClick={handleRemove}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Trailing %</p>
                    <p className="text-sm font-bold text-white">
                      {'trailingPercentage' in activeTrailingStop && `${activeTrailingStop.trailingPercentage}%`}
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Trigger Actual</p>
                    <p className="text-sm font-bold text-orange-400">
                      {'currentTriggerPrice' in activeTrailingStop && `$${activeTrailingStop.currentTriggerPrice.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Configuración */}
            {!hasTrailingStop && (
              <>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Trailing Distance (%)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Distancia desde el {side === 'long' ? 'máximo' : 'mínimo'} alcanzado
                  </p>
                  
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={percentage}
                    onChange={(e) => setPercentage(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-400">1%</span>
                    <span className="text-2xl font-bold text-white">{percentage}%</span>
                    <span className="text-sm text-gray-400">20%</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-white text-sm">Vista Previa</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Precio Actual</p>
                      <p className="text-sm font-bold text-white">${currentPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Trigger Inicial</p>
                      <p className="text-sm font-bold text-orange-400">${triggerPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Ejemplo de Funcionamiento:</p>
                    <div className="text-xs text-gray-300 space-y-1">
                      {side === 'long' ? (
                        <>
                          <p>• Precio sube a ${(currentPrice * 1.1).toLocaleString()} → Trigger sube a ${(currentPrice * 1.1 * (1 - percentage / 100)).toLocaleString()}</p>
                          <p>• Precio baja a ${(currentPrice * 1.05).toLocaleString()} → Trigger se mantiene</p>
                          <p>• Precio cae a trigger → Posición se cierra automáticamente</p>
                        </>
                      ) : (
                        <>
                          <p>• Precio baja a ${(currentPrice * 0.9).toLocaleString()} → Trigger baja a ${(currentPrice * 0.9 * (1 + percentage / 100)).toLocaleString()}</p>
                          <p>• Precio sube a ${(currentPrice * 0.95).toLocaleString()} → Trigger se mantiene</p>
                          <p>• Precio sube a trigger → Posición se cierra automáticamente</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presets Sugeridos */}
                <div>
                  <p className="text-sm text-gray-400 mb-3">Configuraciones Sugeridas:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPercentage(3)}
                      className={`p-3 rounded-lg border transition-colors ${
                        percentage === 3
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-lg font-bold text-white">3%</p>
                      <p className="text-xs text-gray-400">Estricto</p>
                    </button>
                    <button
                      onClick={() => setPercentage(5)}
                      className={`p-3 rounded-lg border transition-colors ${
                        percentage === 5
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-lg font-bold text-white">5%</p>
                      <p className="text-xs text-gray-400">Moderado</p>
                    </button>
                    <button
                      onClick={() => setPercentage(10)}
                      className={`p-3 rounded-lg border transition-colors ${
                        percentage === 10
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-lg font-bold text-white">10%</p>
                      <p className="text-xs text-gray-400">Flexible</p>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-colors"
                  >
                    {isLoading ? 'Activando...' : 'Activar Trailing Stop'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
