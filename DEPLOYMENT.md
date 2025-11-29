# 🚀 Deployment Checklist - Numisma

## ✅ Sprint 1 Completado (100%)

### Gap #1: Mobile-First UI ✅
- [x] Bottom Navigation implementada
- [x] ProfileView con estadísticas
- [x] Responsive design
- [x] Animaciones y transiciones

### Gap #2: Database Infrastructure ✅
- [x] Drizzle ORM + Vercel Postgres
- [x] 8 tablas creadas
- [x] API routes implementadas
- [x] Auto-sync con Zustand

### Gap #3: MiniKit Pay ✅
- [x] Integración de pagos reales
- [x] Precios por tier y duración
- [x] Verificación de pagos
- [x] Actualización automática de membresías

### Gap #4: Onboarding Tutorial ✅
- [x] Tutorial interactivo de 5 pasos
- [x] Bonus de bienvenida (100 NUMA)
- [x] Progress tracking
- [x] Skip option

---

## 📋 Pre-Deployment Checklist

### 1. Variables de Entorno (CRÍTICO) ⚠️

Crear archivo `.env.local` en producción (Vercel Dashboard):

```env
# World App
NEXT_PUBLIC_WORLD_APP_ID="app_staging_xxxxx"  # ⚠️ CAMBIAR a app_production_xxxxx
NEXT_PUBLIC_WORLD_ACTION_ID="verify_human"

# Vercel Postgres (auto-generadas por Vercel)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Payments
NEXT_PUBLIC_PAYMENT_RECEIVER="0x..."  # ⚠️ Wallet para recibir pagos WLD

# Blockchain (World Chain Sepolia)
NEXT_PUBLIC_NUMA_TOKEN="0xa57917BC4568B9e392869AbAc504fEe746e7bede"
NEXT_PUBLIC_WLD_TOKEN="0x25f36A04387aA3E68d8eD41Cd4478BEd7422A9f4"
NEXT_PUBLIC_POOL_V2="0x73387224339C83eB19b0389BA3Aa33C37944ff72"
NEXT_PUBLIC_MEMBERSHIP_MANAGER="0x526b22e2878334240aDdB9c13b42d848a783cc09"
NEXT_PUBLIC_PIONEER_VAULT="0xAda711D20cfb0f34bAcDdeEA148f12a6D10e63Dd"

# RPC
NEXT_PUBLIC_ALCHEMY_KEY="..."  # ⚠️ Obtener en Alchemy Dashboard
NEXT_PUBLIC_RPC_URL="https://worldchain-sepolia.g.alchemy.com/v2/..."
```

### 2. Configuración de Base de Datos 🗃️

**En Vercel Dashboard:**

1. **Crear Postgres Database:**
   ```bash
   # En Vercel Dashboard:
   Storage → Create Database → Postgres
   Region: Washington, D.C. (iad1) - Más cerca de usuarios
   ```

2. **Ejecutar Migraciones:**
   ```bash
   # Generar archivos SQL
   npm run db:generate
   
   # Aplicar a la base de datos
   npm run db:push
   ```

3. **Verificar Conexión:**
   ```bash
   npm run db:studio
   # Abre Drizzle Studio en localhost:4983
   ```

### 3. Configuración de World App 🌍

**En World Developer Portal (developer.worldcoin.org):**

1. **Crear App de Producción:**
   - Name: "Numisma"
   - App ID: Copiar a `NEXT_PUBLIC_WORLD_APP_ID`
   - Whitelist callback URLs:
     - `https://numisma.vercel.app`
     - `https://www.numisma.app` (si tienes dominio)

2. **Crear Action para Verificación:**
   - Action Name: "verify_human"
   - Action ID: Copiar a `NEXT_PUBLIC_WORLD_ACTION_ID`
   - Signal: "dynamic" (se genera por usuario)
   - Verification Level: "orb" (máxima seguridad)

3. **Configurar MiniKit:**
   - Enable MiniKit Pay: ✅
   - Supported Tokens: WLD
   - Payment Receiver: Tu wallet multisig

### 4. Configuración de Alchemy 🔗

**En Alchemy Dashboard (alchemy.com):**

1. **Crear App:**
   - Chain: World Chain Sepolia
   - Name: "Numisma Production"

2. **Copiar API Key:**
   - Settings → API Keys
   - Copiar a `NEXT_PUBLIC_ALCHEMY_KEY`

3. **Configurar Webhooks (opcional):**
   - Notificaciones de transacciones
   - Alerts de smart contracts

### 5. Deploy a Vercel 🚀

**Opción A: GitHub (Recomendado)**

```bash
# Ya tienes el repo en GitHub: uknoweb/numisma
# Solo conecta en Vercel Dashboard:

1. vercel.com → New Project
2. Import Git Repository → numisma
3. Framework Preset: Next.js (auto-detectado)
4. Environment Variables: Pegar todas las de .env.local
5. Deploy → Wait ~2 minutos
```

**Opción B: CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar env vars
vercel env add POSTGRES_URL
vercel env add NEXT_PUBLIC_WORLD_APP_ID
# ... (repetir para todas)
```

### 6. Post-Deployment Verification ✅

**Checklist de pruebas:**

- [ ] **World ID Verification**
  - Abrir app en World App
  - Verificar identidad
  - Confirmar creación de usuario en DB

- [ ] **Database Queries**
  - Verificar usuario se guarda
  - Crear posición de prueba
  - Revisar transacciones

- [ ] **MiniKit Pay**
  - Intentar comprar membresía Plus (1 mes)
  - Confirmar pago en World App
  - Verificar actualización en DB
  - Confirmar balance actualizado

- [ ] **Navigation**
  - Probar bottom navigation
  - Verificar todas las vistas
  - Revisar ProfileView

- [ ] **Onboarding**
  - Limpiar localStorage
  - Recargar app
  - Completar tutorial
  - Confirmar bonus de 100 NUMA

### 7. Monitoreo y Analytics 📊

**Vercel Analytics (Incluido):**
- Analytics → Enable
- Speed Insights → Enable

**Opcional - PostHog (Gratis hasta 1M eventos/mes):**
```bash
npm install posthog-js
```

**Sentry (Monitoreo de Errores):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 8. Dominio Personalizado (Opcional) 🌐

**En Vercel Dashboard:**

1. Settings → Domains
2. Add Domain: `numisma.app` o `numisma.io`
3. Configurar DNS:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

### 9. Seguridad 🔒

**Headers de Seguridad (next.config.js):**

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

**Rate Limiting en API Routes:**
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";

export async function middleware(request: Request) {
  // Implementar rate limiting para API routes
  // 10 requests por 10 segundos
}
```

### 10. Backup y Recovery 💾

**Backup automático de Vercel Postgres:**
- Vercel hace backups automáticos
- Retention: 7 días (Free/Hobby), 30 días (Pro)

**Export manual:**
```bash
# Conectar a DB
psql $POSTGRES_URL

# Export
pg_dump $POSTGRES_URL > backup.sql

# Restore
psql $POSTGRES_URL < backup.sql
```

---

## 🎯 Lo que FALTA (No Bloqueante)

### Sprint 2 - Features Importantes (1-2 semanas)

1. **Analytics & Tracking (Gap #5)**
   - PostHog integration
   - Event tracking (trades, payments, etc.)
   - User journey analytics
   - Conversion funnels

2. **Push Notifications (Gap #6)**
   - Web Push API
   - Membership expiry alerts
   - Trading signals
   - Pioneer ranking updates

3. **Enhanced Gamification (Gap #7)**
   - Achievement system (achievements table ya existe)
   - XP and leveling
   - Daily streaks
   - Leaderboards

4. **Social Features (Gap #8)**
   - Referral system (referrals table ya existe)
   - Invite friends bonus
   - Social sharing
   - Public profiles

### Sprint 3 - Advanced Features (1-2 semanas)

5. **Advanced Trading (Gap #9)**
   - Stop Loss / Take Profit
   - Trailing stops
   - Limit orders
   - Portfolio charts

6. **Educational Content (Gap #10)**
   - Trading academy
   - Video tutorials
   - Knowledge base
   - Glossary

---

## 🚨 CRÍTICO Antes de Lanzar

### ⚠️ Cambiar a Producción:

1. **World App ID:**
   ```env
   # CAMBIAR DE:
   NEXT_PUBLIC_WORLD_APP_ID="app_staging_xxxxx"
   
   # A:
   NEXT_PUBLIC_WORLD_APP_ID="app_production_xxxxx"
   ```

2. **Payment Receiver:**
   ```env
   # Usar wallet MULTISIG (NO personal)
   NEXT_PUBLIC_PAYMENT_RECEIVER="0xTU_MULTISIG_AQUI"
   ```

3. **World Chain Mainnet (cuando esté listo):**
   ```env
   # Cambiar de Sepolia a Mainnet
   NEXT_PUBLIC_RPC_URL="https://worldchain-mainnet.g.alchemy.com/v2/..."
   ```

---

## ✅ Deployment Final

```bash
# 1. Verificar build local
npm run build

# 2. Test production build
npm run start

# 3. Push a GitHub
git push origin main

# 4. Vercel auto-deploys
# Esperar ~2 minutos

# 5. Verificar en:
https://numisma.vercel.app
```

---

## 📞 Soporte

**Si algo falla:**

1. **Logs de Vercel:**
   - Dashboard → Deployments → Logs
   - Ver errores de build o runtime

2. **Database Issues:**
   - `npm run db:studio` para inspeccionar
   - Revisar Vercel Postgres Dashboard

3. **Payment Issues:**
   - Verificar `NEXT_PUBLIC_PAYMENT_RECEIVER`
   - Revisar logs en `/api/payments/verify`

4. **World ID Issues:**
   - Verificar App ID y Action ID
   - Revisar World Developer Portal

---

## 🎉 ¡Listo para Lanzar!

Una vez completado este checklist:
- ✅ Sprint 1 completo (4 gaps críticos)
- ✅ Base de datos configurada
- ✅ Pagos funcionando
- ✅ Onboarding activo
- ✅ App desplegada

**La app está 100% funcional y lista para usuarios reales.**

Sprints 2 y 3 son mejoras que se pueden hacer en vivo mientras hay usuarios usando la app.
