"use client";

import { useState, useEffect } from "react";
import {
  AdvancedOrder,
  StopLossOrder,
  TakeProfitOrder,
  TrailingStopOrder,
  OrderSide,
  calculateStopLossPrice,
  calculateTakeProfitPrice,
  calculateTrailingStopPrice,
  updateTrailingStop,
  shouldTriggerOrder,
  validateStopLoss,
  validateTakeProfit,
  validateTrailingStop,
} from "@/lib/advanced-trading";

export function useAdvancedOrders(positionId: number) {
  const [orders, setOrders] = useState<AdvancedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Carga órdenes activas para una posición
   */
  useEffect(() => {
    loadOrders();
  }, [positionId]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from API
      const response = await fetch(`/api/orders/list?positionId=${positionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crea Stop Loss
   */
  const createStopLoss = async (
    entryPrice: number,
    percentage: number,
    side: OrderSide
  ): Promise<{ success: boolean; error?: string; order?: StopLossOrder }> => {
    const triggerPrice = calculateStopLossPrice(entryPrice, percentage, side);
    
    const validation = validateStopLoss(triggerPrice, entryPrice, side);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const order: StopLossOrder = {
      positionId,
      type: 'stop_loss',
      triggerPrice,
      triggerType: 'percentage',
      percentage,
      status: 'active',
      createdAt: new Date(),
    };

    setIsLoading(true);
    try {
      // TODO: Call API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      const createdOrder = { ...order, id: data.orderId };
      setOrders([...orders, createdOrder]);
      
      return { success: true, order: createdOrder };
    } catch (error) {
      console.error('Error creating stop loss:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crea Take Profit
   */
  const createTakeProfit = async (
    entryPrice: number,
    percentage: number,
    side: OrderSide
  ): Promise<{ success: boolean; error?: string; order?: TakeProfitOrder }> => {
    const triggerPrice = calculateTakeProfitPrice(entryPrice, percentage, side);
    
    const validation = validateTakeProfit(triggerPrice, entryPrice, side);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const order: TakeProfitOrder = {
      positionId,
      type: 'take_profit',
      triggerPrice,
      triggerType: 'percentage',
      percentage,
      status: 'active',
      createdAt: new Date(),
    };

    setIsLoading(true);
    try {
      // TODO: Call API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      const createdOrder = { ...order, id: data.orderId };
      setOrders([...orders, createdOrder]);
      
      return { success: true, order: createdOrder };
    } catch (error) {
      console.error('Error creating take profit:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crea Trailing Stop
   */
  const createTrailingStop = async (
    currentPrice: number,
    percentage: number,
    side: OrderSide
  ): Promise<{ success: boolean; error?: string; order?: TrailingStopOrder }> => {
    const validation = validateTrailingStop(percentage);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const order: TrailingStopOrder = {
      positionId,
      type: 'trailing_stop',
      trailingPercentage: percentage,
      highestPrice: currentPrice,
      lowestPrice: currentPrice,
      currentTriggerPrice: calculateTrailingStopPrice(
        currentPrice,
        currentPrice,
        currentPrice,
        percentage,
        side
      ),
      status: 'active',
      createdAt: new Date(),
    };

    setIsLoading(true);
    try {
      // TODO: Call API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      const createdOrder = { ...order, id: data.orderId };
      setOrders([...orders, createdOrder]);
      
      return { success: true, order: createdOrder };
    } catch (error) {
      console.error('Error creating trailing stop:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancela una orden
   */
  const cancelOrder = async (orderId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      // TODO: Call API
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        return false;
      }

      setOrders(orders.filter(o => o.id !== orderId));
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualiza trailing stops con precio actual
   */
  const updateTrailingStops = (currentPrice: number, side: OrderSide) => {
    const updatedOrders = orders.map(order => {
      if (order.type === 'trailing_stop' && order.status === 'active') {
        return updateTrailingStop(order, currentPrice, side);
      }
      return order;
    });

    setOrders(updatedOrders);
  };

  /**
   * Verifica si alguna orden debe ejecutarse
   */
  const checkTriggers = (currentPrice: number, side: OrderSide): AdvancedOrder | null => {
    for (const order of orders) {
      if (shouldTriggerOrder(order, currentPrice, side)) {
        return order;
      }
    }
    return null;
  };

  return {
    orders,
    isLoading,
    createStopLoss,
    createTakeProfit,
    createTrailingStop,
    cancelOrder,
    updateTrailingStops,
    checkTriggers,
    refresh: loadOrders,
  };
}
