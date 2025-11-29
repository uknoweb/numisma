# Advanced Trading Features - Stop Loss, Take Profit & Trailing Stops

## 📋 Resumen

Sistema completo de órdenes avanzadas para gestión de riesgo:
- **Stop Loss**: Limita pérdidas automáticamente
- **Take Profit**: Asegura ganancias al alcanzar objetivo
- **Trailing Stop**: Stop loss dinámico que se ajusta con el precio

---

## 🛡️ Stop Loss

### Características

- **Trigger automático** cuando el precio alcanza nivel definido
- **Configuración por porcentaje** o precio exacto
- **Protección contra pérdidas** mayores al límite establecido
- **Ejecución inmediata** al alcanzar trigger

### Funcionamiento

**Para Long:**
- Stop Loss se coloca **por debajo** del precio de entrada
- Se ejecuta cuando precio **cae** hasta el nivel de SL
- Ejemplo: Entry $100, SL -5% = $95

**Para Short:**
- Stop Loss se coloca **por encima** del precio de entrada
- Se ejecuta cuando precio **sube** hasta el nivel de SL
- Ejemplo: Entry $100, SL +5% = $105

### Implementación

```typescript
import { calculateStopLossPrice, validateStopLoss } from '@/lib/advanced-trading';

// Calcular precio de SL
const slPrice = calculateStopLossPrice(
  entryPrice: 50000,    // $50,000 entry
  percentage: 3,        // 3% loss
  side: 'long'
);
// Output: $48,500

// Validar SL
const validation = validateStopLoss(slPrice, entryPrice, 'long');
// { valid: true }
```

---

## 🎯 Take Profit

### Características

- **Cierra automáticamente** al alcanzar objetivo de ganancia
- **Configurable por porcentaje** o precio específico
- **Asegura profits** sin necesidad de monitorear
- **Múltiples niveles** (próximamente)

### Funcionamiento

**Para Long:**
- Take Profit se coloca **por encima** del precio de entrada
- Se ejecuta cuando precio **sube** hasta el nivel de TP
- Ejemplo: Entry $100, TP +10% = $110

**Para Short:**
- Take Profit se coloca **por debajo** del precio de entrada
- Se ejecuta cuando precio **cae** hasta el nivel de TP
- Ejemplo: Entry $100, TP -10% = $90

### Implementación

```typescript
import { calculateTakeProfitPrice, validateTakeProfit } from '@/lib/advanced-trading';

// Calcular precio de TP
const tpPrice = calculateTakeProfitPrice(
  entryPrice: 50000,
  percentage: 9,        // 9% profit
  side: 'long'
);
// Output: $54,500

// Validar TP
const validation = validateTakeProfit(tpPrice, entryPrice, 'long');
// { valid: true }
```

---

## 📈 Trailing Stop

### Características

- **Stop loss dinámico** que se mueve con el precio
- **Protege ganancias** mientras permite que corran
- **Se ajusta automáticamente** en una sola dirección
- **No retrocede** - solo sigue el precio favorable

### Funcionamiento

**Para Long:**
1. Se establece a X% por debajo del precio actual
2. Si precio sube → trailing stop **sube** manteniendo distancia X%
3. Si precio baja → trailing stop **se mantiene** (no baja)
4. Se ejecuta si precio cae hasta el trailing stop

**Para Short:**
1. Se establece a X% por encima del precio actual
2. Si precio baja → trailing stop **baja** manteniendo distancia X%
3. Si precio sube → trailing stop **se mantiene** (no sube)
4. Se ejecuta si precio sube hasta el trailing stop

### Ejemplo Práctico (Long)

```
Entry: $50,000
Trailing Stop: 5%

Precio sube a $55,000:
  → Trailing stop sube a $52,250 (5% abajo)
  
Precio sube a $60,000:
  → Trailing stop sube a $57,000 (5% abajo)
  
Precio baja a $58,000:
  → Trailing stop SE MANTIENE en $57,000
  
Precio baja a $57,000:
  → ¡TRIGGER! Posición se cierra
  → Profit: $7,000 (14% ganancia)
```

### Implementación

```typescript
import { 
  calculateTrailingStopPrice, 
  updateTrailingStop,
  validateTrailingStop 
} from '@/lib/advanced-trading';

// Crear trailing stop inicial
const initialStop = calculateTrailingStopPrice(
  currentPrice: 50000,
  highestPrice: 50000,
  lowestPrice: 50000,
  trailingPercentage: 5,
  side: 'long'
);
// Output: $47,500

// Actualizar con nuevo precio
const updatedOrder = updateTrailingStop(
  order: trailingStopOrder,
  currentPrice: 55000,
  side: 'long'
);
// updatedOrder.highestPrice: $55,000
// updatedOrder.currentTriggerPrice: $52,250
```

---

## 📊 Risk Management

### Risk/Reward Ratio

Métrica clave para evaluar calidad de trade:

```typescript
import { calculateRiskRewardRatio } from '@/lib/advanced-trading';

const ratio = calculateRiskRewardRatio(
  entryPrice: 50000,
  stopLossPrice: 48500,    // -3%
  takeProfitPrice: 54500,  // +9%
  side: 'long'
);
// Output: 3.0 (R:R = 1:3)

// Interpretación:
// - Ratio >= 2: ✅ Excelente
// - Ratio >= 1.5: ⚠️ Aceptable
// - Ratio < 1.5: ❌ Bajo (no recomendado)
```

### Presets de Riesgo

```typescript
import { RISK_PRESETS } from '@/lib/advanced-trading';

// Conservador 🛡️
RISK_PRESETS.conservative
// SL: -2%, TP: +4% (R:R = 1:2)

// Equilibrado ⚖️
RISK_PRESETS.balanced
// SL: -3%, TP: +9% (R:R = 1:3)

// Agresivo 🚀
RISK_PRESETS.aggressive
// SL: -5%, TP: +15% (R:R = 1:3)

// Personalizado ⚙️
RISK_PRESETS.custom
// Definir valores manualmente
```

### Estimación de P&L

```typescript
import { calculateEstimatedPnL } from '@/lib/advanced-trading';

// Calcular profit si alcanza TP
const tpPnL = calculateEstimatedPnL(
  entryPrice: 50000,
  targetPrice: 54500,
  collateral: 1000,      // 1,000 NUMA
  leverage: 10,
  side: 'long'
);
// Output: +900 NUMA (90% ganancia con 10x leverage)

// Calcular pérdida si alcanza SL
const slPnL = calculateEstimatedPnL(
  entryPrice: 50000,
  targetPrice: 48500,
  collateral: 1000,
  leverage: 10,
  side: 'long'
);
// Output: -300 NUMA (30% pérdida con 10x leverage)
```

---

## 🎮 Componentes UI

### StopLossTakeProfitPanel

Panel completo para configurar SL y TP:

**Props:**
```typescript
{
  positionId: number;
  entryPrice: number;
  currentPrice: number;
  collateral: number;
  leverage: number;
  side: OrderSide;
  onClose: () => void;
}
```

**Características:**
- Presets de riesgo (Conservador, Equilibrado, Agresivo, Custom)
- Sliders para ajustar SL y TP
- Preview de precios y P&L estimado
- Cálculo de Risk/Reward ratio en tiempo real
- Indicadores de calidad (✅/⚠️/❌)
- Vista de órdenes activas
- Cancelación de órdenes

### TrailingStopPanel

Panel para configurar Trailing Stop:

**Props:**
```typescript
{
  positionId: number;
  currentPrice: number;
  side: OrderSide;
  onClose: () => void;
}
```

**Características:**
- Slider para trailing distance (1-20%)
- Presets sugeridos (3%, 5%, 10%)
- Explicación interactiva de funcionamiento
- Preview con ejemplos
- Vista de trailing stop activo
- Actualización en tiempo real del trigger

---

## 🔌 Hooks

### useAdvancedOrders

Hook para gestión de órdenes avanzadas:

```typescript
const {
  orders,              // Array de órdenes activas
  isLoading,           // Estado de carga
  createStopLoss,      // Crear SL
  createTakeProfit,    // Crear TP
  createTrailingStop,  // Crear trailing
  cancelOrder,         // Cancelar orden
  updateTrailingStops, // Actualizar trailing stops
  checkTriggers,       // Verificar si debe ejecutarse
  refresh,             // Recargar órdenes
} = useAdvancedOrders(positionId);

// Crear Stop Loss
const result = await createStopLoss(
  entryPrice: 50000,
  percentage: 3,
  side: 'long'
);
// { success: true, order: {...} }

// Crear Take Profit
await createTakeProfit(entryPrice, 9, 'long');

// Crear Trailing Stop
await createTrailingStop(currentPrice, 5, 'long');

// Cancelar orden
await cancelOrder(orderId);

// Actualizar trailing stops (llamar en cada tick de precio)
updateTrailingStops(newPrice, side);

// Verificar triggers
const triggered = checkTriggers(newPrice, side);
if (triggered) {
  // Ejecutar cierre de posición
}
```

---

## 🌐 API Routes

### POST /api/orders/create

Crea una orden avanzada

**Request:**
```json
{
  "positionId": 123,
  "type": "stop_loss",
  "triggerPrice": 48500,
  "triggerType": "percentage",
  "percentage": 3,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 456,
  "message": "Orden stop_loss creada exitosamente"
}
```

### GET /api/orders/list?positionId=123

Obtiene órdenes de una posición

**Response:**
```json
{
  "orders": [
    {
      "id": 456,
      "positionId": 123,
      "type": "stop_loss",
      "triggerPrice": 48500,
      "triggerType": "percentage",
      "percentage": 3,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/orders/cancel

Cancela una orden

**Request:**
```json
{
  "orderId": 456
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orden cancelada exitosamente"
}
```

---

## 📊 Base de Datos (TODO)

### Tabla: advanced_orders

```sql
CREATE TABLE advanced_orders (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('stop_loss', 'take_profit', 'trailing_stop')),
  
  -- Trigger config
  trigger_price DECIMAL(18, 8),
  trigger_type VARCHAR(20) CHECK (trigger_type IN ('price', 'percentage')),
  percentage DECIMAL(5, 2),
  
  -- Trailing stop specific
  trailing_percentage DECIMAL(5, 2),
  highest_price DECIMAL(18, 8),
  lowest_price DECIMAL(18, 8),
  current_trigger_price DECIMAL(18, 8),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'triggered', 'cancelled', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  triggered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(position_id, type) -- Solo 1 orden de cada tipo por posición
);

-- Índices
CREATE INDEX idx_orders_position ON advanced_orders(position_id);
CREATE INDEX idx_orders_user ON advanced_orders(user_id);
CREATE INDEX idx_orders_status ON advanced_orders(status);
CREATE INDEX idx_orders_type ON advanced_orders(type);
```

### Queries

**Obtener órdenes activas de posición:**
```sql
SELECT * FROM advanced_orders
WHERE position_id = $1
AND status IN ('active', 'pending')
ORDER BY created_at DESC;
```

**Verificar triggers (ejecutar cada tick):**
```sql
SELECT ao.*, p.side, p.current_price
FROM advanced_orders ao
JOIN positions p ON ao.position_id = p.id
WHERE ao.status = 'active'
AND p.status = 'open'
AND (
  -- Stop Loss triggers
  (ao.type = 'stop_loss' AND p.side = 'long' AND p.current_price <= ao.trigger_price) OR
  (ao.type = 'stop_loss' AND p.side = 'short' AND p.current_price >= ao.trigger_price) OR
  
  -- Take Profit triggers
  (ao.type = 'take_profit' AND p.side = 'long' AND p.current_price >= ao.trigger_price) OR
  (ao.type = 'take_profit' AND p.side = 'short' AND p.current_price <= ao.trigger_price) OR
  
  -- Trailing Stop triggers
  (ao.type = 'trailing_stop' AND p.side = 'long' AND p.current_price <= ao.current_trigger_price) OR
  (ao.type = 'trailing_stop' AND p.side = 'short' AND p.current_price >= ao.current_trigger_price)
);
```

**Actualizar trailing stop:**
```sql
UPDATE advanced_orders
SET 
  highest_price = GREATEST(highest_price, $1),
  current_trigger_price = GREATEST(highest_price, $1) * (1 - trailing_percentage / 100)
WHERE id = $2
AND type = 'trailing_stop'
AND position_id IN (SELECT id FROM positions WHERE side = 'long');
```

---

## 🔄 Proceso de Ejecución

### 1. Monitoreo de Precio (Background Job)

```typescript
// Ejecutar cada 1-5 segundos
async function monitorOrders() {
  // 1. Obtener posiciones abiertas con órdenes activas
  const positions = await getOpenPositionsWithOrders();
  
  for (const position of positions) {
    const currentPrice = await getCurrentPrice(position.asset);
    
    // 2. Actualizar trailing stops si existen
    if (position.hasTrailingStop) {
      await updateTrailingStopPrice(position.id, currentPrice, position.side);
    }
    
    // 3. Verificar si alguna orden debe ejecutarse
    const triggered = await checkOrderTriggers(position.id, currentPrice, position.side);
    
    if (triggered) {
      // 4. Ejecutar cierre de posición
      await closePosition(position.id, currentPrice, 'order_triggered');
      
      // 5. Marcar orden como triggered
      await markOrderTriggered(triggered.orderId);
      
      // 6. Notificar usuario
      await notifyUser(position.userId, {
        type: triggered.type,
        positionId: position.id,
        price: currentPrice,
      });
      
      // 7. Log analytics
      await trackEvent('order_triggered', {
        orderId: triggered.orderId,
        type: triggered.type,
        positionId: position.id,
      });
    }
  }
}
```

### 2. Integración con Cierre de Posición

```typescript
// En closePosition()
async function closePosition(
  positionId: number,
  exitPrice: number,
  reason: 'manual' | 'order_triggered' | 'liquidation'
) {
  // 1. Cerrar posición
  const pnl = calculatePnL(position, exitPrice);
  await updatePosition(positionId, { status: 'closed', exit_price: exitPrice, pnl });
  
  // 2. Cancelar todas las órdenes restantes
  if (reason === 'order_triggered' || reason === 'manual') {
    await cancelAllOrders(positionId);
  }
  
  // 3. Actualizar balance
  await updateUserBalance(position.userId, pnl);
  
  // 4. Crear transacción
  await createTransaction(position.userId, 'position_closed', pnl);
  
  // 5. Actualizar stats para gamificación
  await updateUserStats(position.userId, { 
    positions_closed: 1,
    total_pnl: pnl,
    // ... other stats
  });
}
```

---

## ✅ Testing Checklist

- [ ] Crear Stop Loss por porcentaje
- [ ] Crear Stop Loss por precio
- [ ] Crear Take Profit por porcentaje
- [ ] Crear Take Profit por precio
- [ ] Crear Trailing Stop
- [ ] Validación de precios SL/TP
- [ ] Cálculo de R:R ratio
- [ ] Estimación de P&L
- [ ] Preview de órdenes
- [ ] Cancelar órdenes
- [ ] Ver órdenes activas
- [ ] Actualizar trailing stop con precio
- [ ] Verificar triggers de órdenes
- [ ] Ejecución automática de SL
- [ ] Ejecución automática de TP
- [ ] Ejecución automática de trailing
- [ ] Notificaciones de ejecución
- [ ] Analytics de órdenes

---

## 🚀 Deployment

### Background Job

Configurar cron job o worker para monitorear órdenes:

**Vercel Cron (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/monitor-orders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Railway/Render:**
```bash
# Background worker
npm run worker:orders
```

### Environment Variables

Ninguna adicional requerida

---

## 🎯 Próximos Pasos

1. **Implementar DB:**
   - Crear tabla `advanced_orders`
   - Implementar API routes reales
   - Background job de monitoreo

2. **Órdenes Parciales:**
   - Cerrar X% de posición en TP1
   - Mover SL a breakeven después de TP1
   - Múltiples niveles de TP

3. **OCO Orders (One-Cancels-Other):**
   - SL y TP vinculados
   - Si uno se ejecuta, cancelar el otro

4. **Time-based Orders:**
   - Expiración de órdenes
   - Órdenes programadas

5. **Advanced Features:**
   - Auto-adjust SL a breakeven
   - Dynamic trailing distance
   - Precio de activación para trailing
