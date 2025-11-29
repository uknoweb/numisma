# Base de Datos Numisma

Sistema de persistencia con **Vercel Postgres** y **Drizzle ORM**.

## 📋 Configuración

### 1. Crear base de datos en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a la pestaña "Storage"
3. Click en "Create Database"
4. Selecciona "Postgres"
5. Elige región más cercana (recomendado: `us-east-1` o `eu-west-1`)
6. Click en "Create"

### 2. Conectar variables de entorno

Vercel automáticamente agregará estas variables a tu proyecto:

```bash
POSTGRES_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

Para desarrollo local:

1. En Vercel Dashboard, ve a Settings → Environment Variables
2. Copia las variables y pégalas en `.env.local`:

```bash
# .env.local
POSTGRES_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

### 3. Generar y ejecutar migraciones

```bash
# Generar migración basada en el esquema
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:migrate

# Abrir Drizzle Studio para explorar la DB (opcional)
npm run db:studio
```

Agrega estos scripts a `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

## 🗃️ Esquema de Tablas

### `users`
- Información de usuarios verificados con World ID
- Balances (NUMA, WLD)
- Estado de membresía
- Timestamps de login

### `positions`
- Posiciones de trading (NUMA/WLD, WLD/USDT)
- Estado: open, closed, liquidated
- PnL en tiempo real
- Detalles de apalancamiento

### `pioneers`
- Sistema de staking/pioneros
- Capital bloqueado en WLD
- Ranking dinámico
- Recompensas acumuladas

### `transactions`
- Historial completo de transacciones
- Tipos: trade, deposit, withdrawal, membership, staking, reward
- Balances después de cada transacción

### `achievements`
- Sistema de logros gamificados
- Recompensas en NUMA
- Estado: completed, claimed

### `daily_rewards`
- Registro de recompensas diarias reclamadas
- Tracking por tier de membresía

### `referrals`
- Sistema de referencias entre usuarios
- Recompensas pagadas

### `analytics_events`
- Tracking de eventos para análisis
- Datos de sesión y user agent

## 🔌 API Routes

### Auth
- `POST /api/auth/login` - Login con World ID

### Users
- `GET /api/user/:walletAddress` - Obtener usuario
- `PATCH /api/user/:walletAddress` - Actualizar usuario

### Positions
- `GET /api/positions/:userId` - Listar posiciones
- `POST /api/positions/:userId` - Crear posición

### Transactions
- `GET /api/transactions/:userId` - Historial
- `POST /api/transactions/:userId` - Nueva transacción

### Analytics
- `POST /api/analytics/track` - Trackear evento

## 💡 Uso en Componentes

```typescript
// Hook personalizado para obtener usuario desde DB
async function fetchUser(walletAddress: string) {
  const res = await fetch(`/api/user/${walletAddress}`);
  const data = await res.json();
  return data.user;
}

// Login con World ID
async function loginUser(walletAddress: string, worldIdHash: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, worldIdHash }),
  });
  const data = await res.json();
  return data.user;
}
```

## 📊 Migración desde localStorage

Para migrar datos existentes en localStorage a la base de datos:

1. Los usuarios existentes mantendrán sus datos en localStorage
2. Al hacer login nuevamente, se sincronizarán con la DB
3. La DB se convierte en la fuente de verdad
4. localStorage se usa como cache local

## 🔒 Seguridad

- ✅ World ID hash único por usuario (prevent sybil attacks)
- ✅ Wallet address único
- ✅ API routes protegidas
- ✅ Validación de datos en servidor
- ✅ Vercel Postgres con SSL/TLS

## 📈 Escalabilidad

- **Vercel Postgres Hobby (Free)**: 
  - 256 MB storage
  - 60 horas compute/mes
  - Perfecto para <1000 usuarios activos

- **Vercel Postgres Pro ($20/mes)**:
  - 512 MB - 1 GB storage
  - Compute ilimitado
  - Recomendado para >1000 usuarios

## 🧪 Testing Local

```bash
# Usar Drizzle Studio para ver/editar datos
npm run db:studio

# Abrir en http://localhost:4983
```

## 🚀 Deploy

Al hacer deploy a Vercel:

1. Las variables de entorno ya están configuradas
2. Las migraciones se aplican automáticamente en el primer deploy
3. La DB está lista para producción

## 📝 Notas

- Las migraciones se generan automáticamente desde el esquema TypeScript
- Drizzle ORM es type-safe (sin errores de tipos)
- Compatible con edge runtime de Vercel
- Queries optimizadas para baja latencia
