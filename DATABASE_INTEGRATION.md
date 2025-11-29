# Integración de Base de Datos - Numisma

## 📋 Descripción

Integración completa de **Vercel Postgres** con **Drizzle ORM** para persistencia de datos en producción. Reemplaza `localStorage` con una base de datos PostgreSQL escalable, segura y compatible con Edge Runtime.

## 🗃️ Esquema de Base de Datos

### Tablas Implementadas

1. **users** - Usuarios verificados con World ID
   - `id` (UUID): Identificador único
   - `walletAddress` (TEXT): Dirección de wallet (único)
   - `worldIdHash` (TEXT): Hash de World ID para Sybil resistance (único)
   - `balanceNuma`, `balanceWld` (REAL): Balances de tokens
   - `membershipTier` (VARCHAR): Nivel de membresía (free/plus/vip)
   - Timestamps: createdAt, updatedAt, lastLoginAt

2. **positions** - Posiciones de trading
   - `id` (UUID): Identificador único
   - `userId` (UUID): Foreign key a users
   - `symbol` (VARCHAR): Par de trading (NUMA/WLD, WLD/USDT)
   - `side` (VARCHAR): Dirección (long/short)
   - `amount`, `leverage`, `entryPrice`, `liquidationPrice`: Detalles de posición
   - `status` (VARCHAR): Estado (open/closed/liquidated)
   - `pnl` (REAL): Profit & Loss calculado

3. **pioneers** - Sistema de staking
   - `userId` (UUID): Foreign key a users (único - un usuario puede ser pioneer)
   - `capitalLocked` (REAL): WLD bloqueado
   - `rank` (INTEGER): Posición en el ranking
   - `totalRewardsEarned`, `claimableProfits`: Recompensas

4. **transactions** - Historial completo
   - `userId` (UUID): Foreign key a users
   - `type`, `description`, `amount`, `token`: Detalles de transacción
   - `balanceAfterNuma`, `balanceAfterWld`: Balances resultantes
   - `metadata` (JSONB): Datos adicionales flexibles

5. **achievements** - Sistema de logros
   - `userId` (UUID): Foreign key a users
   - `achievementType`, `title`, `description`, `reward`: Detalles del logro
   - `isCompleted`, `isClaimed`: Estados de progreso

6. **daily_rewards** - Recompensas de membresía
   - `userId` (UUID): Foreign key a users
   - `amount`, `membershipTier`, `date`: Tracking de reclamos diarios

7. **referrals** - Sistema de referencias
   - `referrerId`, `referredId` (UUID): Foreign keys a users
   - `rewardPaid`, `rewardAmount`: Control de incentivos

8. **analytics_events** - Tracking de eventos
   - `userId` (UUID): Foreign key a users (opcional para eventos anónimos)
   - `eventName`, `eventData` (JSONB): Evento y contexto
   - `sessionId`, `userAgent`: Metadata de sesión

## 🚀 Configuración

### 1. Instalar Dependencias

```bash
npm install @vercel/postgres drizzle-orm drizzle-kit dotenv
```

### 2. Configurar Variables de Entorno

Crear `.env.local`:

```env
# Vercel Postgres (obtener de Vercel Dashboard)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### 3. Generar y Aplicar Migraciones

```bash
# Generar archivos de migración SQL
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:push

# (Opcional) Abrir Drizzle Studio para explorar datos
npm run db:studio
```

## 📚 Uso en Componentes

### Hook `useDatabase`

```tsx
import { useDatabase } from "@/hooks/useDatabase";

function MyComponent() {
  const {
    loginUser,          // Autenticar usuario
    syncBalances,       // Sincronizar balances
    createPosition,     // Crear posición
    createTransaction,  // Registrar transacción
    isLoading,
    error,
  } = useDatabase();

  // Ejemplo: Login
  const handleLogin = async () => {
    const { user, isNewUser } = await loginUser(
      walletAddress,
      worldIdHash
    );
    console.log(isNewUser ? "Nuevo usuario!" : "Bienvenido de vuelta!");
  };
}
```

### Context Provider

El `DatabaseProvider` ya está configurado en `app/layout.tsx` y sincroniza automáticamente:
- ✅ Balances cuando cambian en Zustand
- ✅ Posiciones nuevas
- ✅ Transacciones

## 🔌 API Routes

### Auth

- `POST /api/auth/login`
  - Body: `{ walletAddress, worldIdHash }`
  - Response: `{ user, isNewUser }`

### Users

- `GET /api/user/[walletAddress]`
  - Obtener datos del usuario
- `PATCH /api/user/[walletAddress]`
  - Actualizar usuario (balances, membresía)

### Positions

- `GET /api/positions/[userId]?status=open`
  - Listar posiciones (filtrable por status)
- `POST /api/positions/[userId]`
  - Crear nueva posición
- `PATCH /api/positions/update/[positionId]`
  - Actualizar posición (precio, PnL, status)

### Transactions

- `GET /api/transactions/[userId]?limit=50&type=trade`
  - Historial de transacciones
- `POST /api/transactions/[userId]`
  - Registrar transacción

## 🔄 Flujo de Sincronización

### 1. Login del Usuario

```
User clicks "Verificar con World ID"
  ↓
WorldIdVerification component
  ↓
useDatabase.loginUser(wallet, worldIdHash)
  ↓
POST /api/auth/login
  ↓
getOrCreateUser() in DB
  ↓
User data → Zustand store
  ↓
setWorldIdVerified(true) → Dashboard
```

### 2. Trading Flow

```
User opens position
  ↓
Trading component
  ↓
Zustand: addPosition()
  ↓
DatabaseContext detects change
  ↓
createPosition() → POST /api/positions/[userId]
  ↓
Position saved to DB
```

### 3. Balance Update

```
User executes trade/claim/deposit
  ↓
Zustand: updateBalance(numa, wld)
  ↓
DatabaseContext useEffect (debounced 1s)
  ↓
syncBalances() → PATCH /api/user/[walletAddress]
  ↓
Balances persisted to DB
```

## 🛡️ Seguridad

### Sybil Resistance
- Cada usuario tiene un `worldIdHash` único
- Constraint UNIQUE en la tabla previene duplicados
- Hash del nullifier de World ID = 1 usuario = 1 cuenta

### Data Integrity
- Foreign keys aseguran consistencia relacional
- Timestamps automáticos para auditoría
- JSONB metadata para extensibilidad sin romper schema

### Edge Runtime Compatible
- `@vercel/postgres` usa conexiones pooled
- Compatible con Vercel Edge Functions
- Latencia <100ms en regiones globales

## 📊 Migración desde localStorage

### Antes (localStorage)
```tsx
// ❌ Se pierde al limpiar cache
const user = localStorage.getItem('user');
```

### Después (Database)
```tsx
// ✅ Persistente, multi-device, auditable
const { user } = await loginUser(wallet, worldId);
```

## 🔍 Debugging

### Verificar Conexión
```bash
# Test de conexión a Postgres
npm run db:studio
```

### Logs de Sync
```tsx
// En DatabaseContext.tsx
console.log("Syncing balances:", numa, wld);
```

### Ver Datos en Vercel
1. Dashboard → Storage → Postgres
2. Query Editor → SELECT * FROM users;

## 📈 Próximos Pasos

- [ ] Implementar cache con Redis para queries frecuentes
- [ ] Añadir índices compuestos para optimizar búsquedas
- [ ] Background jobs para calcular rankings de pioneers
- [ ] WebSockets para updates en tiempo real
- [ ] Exportar CSV de transacciones para usuarios

## 🆘 Troubleshooting

### "Cannot connect to database"
- Verificar variables de entorno en `.env.local`
- Confirmar que Vercel Postgres está creado
- Revisar que las migraciones se aplicaron: `npm run db:push`

### "User not found" en login
- Verificar que `getOrCreateUser()` crea usuarios nuevos
- Revisar logs en `/api/auth/login`

### "Foreign key constraint violation"
- Asegurar que el `userId` existe antes de crear positions/transactions
- Verificar que el usuario esté autenticado

---

**Documentación completa**: Ver `DATABASE.md` para detalles del esquema
**Código fuente**: `lib/db/schema.ts`, `lib/db/index.ts`, `hooks/useDatabase.ts`
