# 📊 Analytics Integration - PostHog

## Setup Completado

### 1. **PostHog SDK Instalado**
```bash
npm install posthog-js
```

### 2. **Archivos Creados**

- `/lib/analytics.ts` - Cliente de analytics singleton
- `/hooks/useAnalytics.ts` - React hook para usar en componentes

### 3. **Eventos Implementados**

#### User Events
- `user_login` - Usuario hace login
- `user_logout` - Usuario cierra sesión
- `user_created` - Nuevo usuario registrado
- `world_id_verified` - World ID verificado

#### Onboarding Events
- `onboarding_started` - Tutorial iniciado
- `onboarding_step_completed` - Paso completado
- `onboarding_completed` - Tutorial terminado
- `onboarding_skipped` - Tutorial saltado

#### Trading Events
- `position_opened` - Posición abierta
- `position_closed` - Posición cerrada
- `position_liquidated` - Posición liquidada

#### Payment Events
- `membership_modal_opened` - Modal de membresía abierto
- `membership_selected` - Tier seleccionado
- `payment_initiated` - Pago iniciado
- `payment_completed` - Pago exitoso
- `payment_failed` - Pago fallido

#### Navigation Events
- `tab_changed` - Tab cambiado
- `view_changed` - Vista cambiada

#### Error Events
- `error_occurred` - Error ocurrido
- `api_error` - Error de API

---

## Configuración de PostHog

### Paso 1: Crear Cuenta en PostHog

1. Ir a: https://posthog.com
2. Crear cuenta gratis
3. Crear nuevo proyecto: "Numisma"

### Paso 2: Obtener API Key

1. Project Settings → Project API Key
2. Copiar el key
3. Copiar el host (generalmente `https://app.posthog.com` o tu dominio)

### Paso 3: Agregar Variables de Entorno

**Agregar a `.env.local`:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Agregar a Vercel:**
```
NEXT_PUBLIC_POSTHOG_KEY = phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST = https://app.posthog.com
```

---

## Uso en Componentes

### Opción 1: Usar el Hook

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function MyComponent() {
  const analytics = useAnalytics();

  const handleAction = () => {
    analytics.track('button_clicked', {
      buttonName: 'Subscribe',
      location: 'Homepage'
    });
  };

  return <button onClick={handleAction}>Click me</button>;
}
```

### Opción 2: Importar Directamente

```tsx
import analytics from '@/lib/analytics';

analytics.track('custom_event', { foo: 'bar' });
```

---

## Eventos Ya Implementados

### En WorldIdVerification
```tsx
// Al hacer login
analytics.trackLogin(userId, walletAddress);

// Al crear usuario
analytics.track('user_created', { walletAddress });
```

### En OnboardingTutorial
```tsx
// Al iniciar
analytics.trackOnboardingStarted();

// Por cada paso
analytics.trackOnboardingStep(currentStep, stepName);

// Al completar
analytics.trackOnboardingCompleted(100);

// Si salta
analytics.trackOnboardingSkipped(currentStep);
```

### En BottomNavigation
```tsx
// Al cambiar tab
analytics.trackTabChange(previousView, newView);
```

### En Trading
```tsx
// Al abrir posición
analytics.trackPositionOpened('long', 1000, 5);

// Al cerrar
analytics.trackPositionClosed(150, 0.65); // pnl, winRate
```

### En Payments
```tsx
// Al comprar membresía
analytics.trackMembershipPurchase('plus', 1, 5);

// Si falla
analytics.trackPaymentFailed('Insufficient balance');
```

---

## Métricas en PostHog

Una vez configurado, podrás ver:

### 1. **Dashboard de Usuarios**
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- New users por día
- Retention rate

### 2. **Funnels de Conversión**
- Login → Onboarding → First Trade
- Membership Modal → Payment → Success
- Free → Plus → VIP

### 3. **User Paths**
- Cómo navegan los usuarios
- Dónde abandonan
- Rutas más comunes

### 4. **Cohorts**
- Usuarios por tier (free/plus/vip)
- Usuarios activos vs inactivos
- High-value users (muchos trades)

### 5. **Session Recordings** (opcional)
- Grabaciones de sesiones reales
- Ver interacciones del usuario
- Debugging UX issues

---

## Features Adicionales

### A. **User Properties**
```tsx
analytics.setUserProperties({
  membershipTier: 'vip',
  totalTrades: 150,
  winRate: 0.68,
  lifetimeValue: 500
});
```

### B. **Incremental Properties**
```tsx
// Se incrementa automáticamente en cada evento
analytics.incrementUserProperty('sessions_count');
analytics.incrementUserProperty('total_spent', 10);
```

### C. **Error Tracking**
```tsx
try {
  // código
} catch (error) {
  analytics.trackError(error, {
    component: 'Trading',
    action: 'openPosition'
  });
}
```

---

## Próximos Pasos

### 1. **Crear Cuenta PostHog** (5 min)
- https://posthog.com
- Plan gratis: 1M eventos/mes

### 2. **Agregar Env Vars** (2 min)
- En `.env.local`
- En Vercel Dashboard

### 3. **Deploy** (2 min)
```bash
git add -A
git commit -m "feat: Add PostHog analytics integration"
git push
```

### 4. **Verificar** (10 min)
- Abrir app en World App
- Hacer algunas acciones
- Ver eventos en PostHog Dashboard

### 5. **Crear Dashboards** (20 min)
- Dashboard de conversión
- Dashboard de trading
- Dashboard de pagos

---

## Plan Gratuito PostHog

✅ **Incluye:**
- 1,000,000 eventos/mes
- Unlimited projects
- Retention analysis
- Funnels
- Cohorts
- User paths
- Session recordings (5,000/mes)
- Feature flags (1M requests/mes)

🚀 **Suficiente para:**
- Hasta ~10,000 usuarios activos/mes
- ~100 eventos por usuario
- Análisis completo

---

## Estado Actual

✅ Código implementado
✅ Hook creado
✅ Eventos principales cubiertos
⏳ Necesita configuración PostHog
⏳ Necesita variables de entorno

**Tiempo estimado para completar:** 10-15 minutos
