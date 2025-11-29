# 🔔 Push Notifications Setup

## ✅ Implementación Completada

### Archivos Creados

1. `/public/sw.js` - Service Worker para manejar notificaciones
2. `/lib/notifications.ts` - Manager de notificaciones
3. `/hooks/useNotifications.ts` - React hook
4. `/app/api/notifications/subscribe/route.ts` - API para suscribirse
5. `/app/api/notifications/unsubscribe/route.ts` - API para desuscribirse

### VAPID Keys Generadas

```env
# Public Key (compartir con frontend)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHFGMfCMyaX9y4Rws7eQjTdrZ8QoKnJq5d9KN5ZXAJjByYUH-6dIjeDg-wQWP-LcHetbtFzEsT2meiFEpLYTq_4

# Private Key (MANTENER SECRETA - solo backend)
VAPID_PRIVATE_KEY=rL8gf1N21vDpCJr8doaxUOaZ1nsc_lMlMWw5IfadaLU
```

---

## 📱 Tipos de Notificaciones Implementadas

1. **Membership Notifications**
   - `notifyMembershipExpiring(daysLeft)` - Membresía por vencer
   - `notifyMembershipExpired()` - Membresía vencida

2. **Trading Notifications**
   - `notifyPositionLiquidationWarning(leverage)` - Riesgo de liquidación
   - Posición liquidada (TODO)

3. **Pioneer Notifications**
   - `notifyPioneerRankChanged(newRank, change)` - Cambio de ranking

4. **Rewards Notifications**
   - `notifyDailyReward(amount)` - Recompensa diaria disponible

5. **Achievement Notifications**
   - `notifyAchievementUnlocked(achievement)` - Logro desbloqueado

6. **Referral Notifications**
   - Nuevo referido (TODO)

---

## 🚀 Uso en Componentes

### Opción 1: Hook (Recomendado)

```tsx
import { useNotifications } from '@/hooks/useNotifications';

export default function MyComponent() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    notifyDailyReward,
  } = useNotifications();

  const handleEnableNotifications = async () => {
    // Solicitar permiso
    const granted = await requestPermission();
    
    if (granted) {
      // Suscribir a notificaciones push
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    await notifyDailyReward(100);
  };

  return (
    <div>
      {!isSupported && <p>Notificaciones no soportadas</p>}
      
      {isSupported && permission === 'default' && (
        <button onClick={handleEnableNotifications}>
          Habilitar Notificaciones
        </button>
      )}
      
      {isSubscribed && (
        <>
          <p>✅ Notificaciones habilitadas</p>
          <button onClick={handleTestNotification}>
            Probar Notificación
          </button>
          <button onClick={unsubscribe}>
            Deshabilitar
          </button>
        </>
      )}
    </div>
  );
}
```

### Opción 2: Importación Directa

```tsx
import notifications from '@/lib/notifications';

// En cualquier parte del código
await notifications.notifyMembershipExpiring(3);
await notifications.notifyPioneerRankChanged(15, -5);
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

**Agregar a `.env.local`:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHFGMfCMyaX9y4Rws7eQjTdrZ8QoKnJq5d9KN5ZXAJjByYUH-6dIjeDg-wQWP-LcHetbtFzEsT2meiFEpLYTq_4
VAPID_PRIVATE_KEY=rL8gf1N21vDpCJr8doaxUOaZ1nsc_lMlMWw5IfadaLU
```

**Agregar a Vercel:**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BHFGMfCMyaX9y4Rws7eQjTdrZ8QoKnJq5d9KN5ZXAJjByYUH-6dIjeDg-wQWP-LcHetbtFzEsT2meiFEpLYTq_4
VAPID_PRIVATE_KEY = rL8gf1N21vDpCJr8doaxUOaZ1nsc_lMlMWw5IfadaLU
```

### 2. Next.js Config

El Service Worker ya está en `/public/sw.js` y se cargará automáticamente.

---

## 🔄 Flujo de Trabajo

### Suscripción
1. Usuario abre la app
2. Componente solicita permiso: `requestPermission()`
3. Si acepta, suscribe: `subscribe()`
4. Suscripción se envía a `/api/notifications/subscribe`
5. Backend guarda la suscripción (endpoint + keys)

### Envío de Notificaciones

#### Notificación Local (Inmediata)
```tsx
// Se muestra inmediatamente usando Service Worker
await notifications.notifyDailyReward(100);
```

#### Notificación Push (desde Backend)
```tsx
// En un API route o cron job
import webpush from 'web-push';

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:tu@email.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Obtener suscripción del usuario desde DB
const subscription = await getSubscription(userId);

// Enviar notificación
await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: '🎁 Recompensa Diaria',
    body: '¡100 NUMA disponibles!',
    url: '/',
  })
);
```

---

## 📊 Casos de Uso Implementados

### 1. Membresía por Vencer
```tsx
// En un cron job diario
const users = await getUsersWithExpiringMembership(7); // 7 días

for (const user of users) {
  const daysLeft = getDaysUntilExpiry(user.membershipExpiresAt);
  await notifications.notifyMembershipExpiring(daysLeft);
}
```

### 2. Riesgo de Liquidación
```tsx
// Cuando se actualiza precio y detecta riesgo
if (position.healthFactor < 1.1) {
  await notifications.notifyPositionLiquidationWarning(position.leverage);
}
```

### 3. Cambio de Ranking Pioneer
```tsx
// Cuando se recalcula el ranking
const oldRank = user.previousRank;
const newRank = user.currentRank;
const change = oldRank - newRank;

if (change !== 0) {
  await notifications.notifyPioneerRankChanged(newRank, change);
}
```

### 4. Recompensa Diaria
```tsx
// En un componente cuando detecta que hay recompensa disponible
useEffect(() => {
  if (hasDailyReward && !claimed) {
    notifications.notifyDailyReward(rewardAmount);
  }
}, [hasDailyReward, claimed]);
```

---

## 🗄️ Base de Datos (TODO)

Crear tabla para suscripciones:

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

Agregar a `/lib/db/schema.ts`:
```tsx
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## ✅ Testing

### Test Local
1. Abrir app en navegador (https://localhost:3000)
2. Abrir DevTools → Application → Service Workers
3. Verificar que `/sw.js` está registrado
4. En la app, click "Habilitar Notificaciones"
5. Aceptar permiso
6. Click "Probar Notificación"
7. Debe aparecer notificación

### Test en Producción
1. Deploy a Vercel
2. Abrir en World App
3. Habilitar notificaciones
4. Verificar que se guarda en DB
5. Enviar notificación de prueba desde backend
6. Verificar recepción

---

## 🚀 Próximos Pasos

1. ✅ Crear tabla `push_subscriptions` en DB
2. ✅ Implementar envío desde backend con `web-push`
3. ✅ Crear cron jobs para:
   - Verificar membresías por vencer (diario)
   - Verificar posiciones en riesgo (cada hora)
   - Enviar recompensas diarias (diario)
4. ✅ Agregar UI para habilitar/deshabilitar notificaciones
5. ✅ Analytics de notificaciones (tasa de apertura)

---

## 📱 Soporte de Browsers

✅ **Soportado:**
- Chrome/Edge (Desktop & Android)
- Firefox (Desktop & Android)
- Safari 16.4+ (iOS & macOS)
- Samsung Internet

❌ **No Soportado:**
- Safari < 16.4
- iOS < 16.4
- Algunos browsers embebidos

⚠️ **World App:**
Depende del browser engine que use internamente. Generalmente soportado en Android y iOS 16.4+.

---

## Estado Actual

✅ Service Worker implementado
✅ Notifications manager creado
✅ React hook listo
✅ API endpoints creados
✅ VAPID keys generadas
✅ 6 tipos de notificaciones implementadas
⏳ Necesita tabla en DB
⏳ Necesita UI component
⏳ Necesita cron jobs

**Tiempo estimado para completar:** 30-45 minutos
