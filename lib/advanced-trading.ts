/**
 * Advanced Trading Features
 * Stop Loss, Take Profit, Trailing Stops
 */

export type OrderType = 'market' | 'limit' | 'stop_loss' | 'take_profit' | 'trailing_stop';
export type OrderSide = 'long' | 'short';
export type OrderStatus = 'pending' | 'active' | 'triggered' | 'cancelled' | 'expired';

export interface StopLossOrder {
  id?: number;
  positionId: number;
  type: 'stop_loss';
  triggerPrice: number;
  triggerType: 'price' | 'percentage';
  percentage?: number; // Para trailing stop
  status: OrderStatus;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface TakeProfitOrder {
  id?: number;
  positionId: number;
  type: 'take_profit';
  triggerPrice: number;
  triggerType: 'price' | 'percentage';
  percentage?: number;
  status: OrderStatus;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface TrailingStopOrder {
  id?: number;
  positionId: number;
  type: 'trailing_stop';
  trailingPercentage: number;
  highestPrice: number; // Para long
  lowestPrice: number; // Para short
  currentTriggerPrice: number;
  status: OrderStatus;
  createdAt: Date;
  triggeredAt?: Date;
}

export type AdvancedOrder = StopLossOrder | TakeProfitOrder | TrailingStopOrder;

/**
 * Calcula precio de Stop Loss basado en porcentaje
 */
export function calculateStopLossPrice(
  entryPrice: number,
  percentage: number,
  side: OrderSide
): number {
  if (side === 'long') {
    // Para long, SL está por debajo del entry
    return entryPrice * (1 - percentage / 100);
  } else {
    // Para short, SL está por encima del entry
    return entryPrice * (1 + percentage / 100);
  }
}

/**
 * Calcula precio de Take Profit basado en porcentaje
 */
export function calculateTakeProfitPrice(
  entryPrice: number,
  percentage: number,
  side: OrderSide
): number {
  if (side === 'long') {
    // Para long, TP está por encima del entry
    return entryPrice * (1 + percentage / 100);
  } else {
    // Para short, TP está por debajo del entry
    return entryPrice * (1 - percentage / 100);
  }
}

/**
 * Calcula precio de Trailing Stop
 */
export function calculateTrailingStopPrice(
  currentPrice: number,
  highestPrice: number,
  lowestPrice: number,
  trailingPercentage: number,
  side: OrderSide
): number {
  if (side === 'long') {
    // Para long, trailing stop baja desde el máximo
    return highestPrice * (1 - trailingPercentage / 100);
  } else {
    // Para short, trailing stop sube desde el mínimo
    return lowestPrice * (1 + trailingPercentage / 100);
  }
}

/**
 * Actualiza Trailing Stop con nuevo precio
 */
export function updateTrailingStop(
  order: TrailingStopOrder,
  currentPrice: number,
  side: OrderSide
): TrailingStopOrder {
  let updated = { ...order };

  if (side === 'long') {
    // Actualizar máximo si el precio subió
    if (currentPrice > order.highestPrice) {
      updated.highestPrice = currentPrice;
      updated.currentTriggerPrice = calculateTrailingStopPrice(
        currentPrice,
        currentPrice,
        order.lowestPrice,
        order.trailingPercentage,
        side
      );
    }
  } else {
    // Actualizar mínimo si el precio bajó
    if (currentPrice < order.lowestPrice) {
      updated.lowestPrice = currentPrice;
      updated.currentTriggerPrice = calculateTrailingStopPrice(
        currentPrice,
        order.highestPrice,
        currentPrice,
        order.trailingPercentage,
        side
      );
    }
  }

  return updated;
}

/**
 * Verifica si una orden debe ser ejecutada
 */
export function shouldTriggerOrder(
  order: AdvancedOrder,
  currentPrice: number,
  side: OrderSide
): boolean {
  if (order.status !== 'active') return false;

  if (order.type === 'stop_loss') {
    if (side === 'long') {
      // Long: trigger si precio cae por debajo del SL
      return currentPrice <= order.triggerPrice;
    } else {
      // Short: trigger si precio sube por encima del SL
      return currentPrice >= order.triggerPrice;
    }
  }

  if (order.type === 'take_profit') {
    if (side === 'long') {
      // Long: trigger si precio sube por encima del TP
      return currentPrice >= order.triggerPrice;
    } else {
      // Short: trigger si precio cae por debajo del TP
      return currentPrice <= order.triggerPrice;
    }
  }

  if (order.type === 'trailing_stop') {
    if (side === 'long') {
      // Long: trigger si precio cae por debajo del trailing stop
      return currentPrice <= order.currentTriggerPrice;
    } else {
      // Short: trigger si precio sube por encima del trailing stop
      return currentPrice >= order.currentTriggerPrice;
    }
  }

  return false;
}

/**
 * Calcula P&L estimado en precio objetivo
 */
export function calculateEstimatedPnL(
  entryPrice: number,
  targetPrice: number,
  collateral: number,
  leverage: number,
  side: OrderSide
): number {
  const priceChange = side === 'long' 
    ? (targetPrice - entryPrice) / entryPrice
    : (entryPrice - targetPrice) / entryPrice;

  return collateral * leverage * priceChange;
}

/**
 * Calcula Risk/Reward Ratio
 */
export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  side: OrderSide
): number {
  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(takeProfitPrice - entryPrice);

  if (risk === 0) return 0;
  return reward / risk;
}

/**
 * Presets comunes de SL/TP
 */
export const RISK_PRESETS = {
  conservative: {
    name: 'Conservador',
    stopLoss: 2, // 2% de pérdida
    takeProfit: 4, // 4% de ganancia (R:R = 1:2)
    icon: '🛡️',
  },
  balanced: {
    name: 'Equilibrado',
    stopLoss: 3,
    takeProfit: 9, // R:R = 1:3
    icon: '⚖️',
  },
  aggressive: {
    name: 'Agresivo',
    stopLoss: 5,
    takeProfit: 15, // R:R = 1:3
    icon: '🚀',
  },
  custom: {
    name: 'Personalizado',
    stopLoss: 0,
    takeProfit: 0,
    icon: '⚙️',
  },
};

/**
 * Validaciones de órdenes
 */
export function validateStopLoss(
  stopLossPrice: number,
  entryPrice: number,
  side: OrderSide
): { valid: boolean; error?: string } {
  if (stopLossPrice <= 0) {
    return { valid: false, error: 'Precio de Stop Loss debe ser mayor a 0' };
  }

  if (side === 'long' && stopLossPrice >= entryPrice) {
    return { valid: false, error: 'Stop Loss debe estar por debajo del precio de entrada (long)' };
  }

  if (side === 'short' && stopLossPrice <= entryPrice) {
    return { valid: false, error: 'Stop Loss debe estar por encima del precio de entrada (short)' };
  }

  return { valid: true };
}

export function validateTakeProfit(
  takeProfitPrice: number,
  entryPrice: number,
  side: OrderSide
): { valid: boolean; error?: string } {
  if (takeProfitPrice <= 0) {
    return { valid: false, error: 'Precio de Take Profit debe ser mayor a 0' };
  }

  if (side === 'long' && takeProfitPrice <= entryPrice) {
    return { valid: false, error: 'Take Profit debe estar por encima del precio de entrada (long)' };
  }

  if (side === 'short' && takeProfitPrice >= entryPrice) {
    return { valid: false, error: 'Take Profit debe estar por debajo del precio de entrada (short)' };
  }

  return { valid: true };
}

export function validateTrailingStop(
  percentage: number
): { valid: boolean; error?: string } {
  if (percentage <= 0) {
    return { valid: false, error: 'Porcentaje debe ser mayor a 0' };
  }

  if (percentage > 50) {
    return { valid: false, error: 'Porcentaje muy alto (máximo 50%)' };
  }

  return { valid: true };
}
