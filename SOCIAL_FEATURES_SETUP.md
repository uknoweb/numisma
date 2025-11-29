# Social Features - Sistema de Referidos y Leaderboards

## 📋 Resumen

Sistema completo de características sociales que incluye:
- **Referral System**: Invita amigos y gana recompensas
- **Leaderboards**: Rankings públicos de traders y pioneers
- **Social Sharing**: Comparte logros en redes sociales

---

## 🎁 Referral System

### Características

1. **Códigos Únicos**
   - Formato: `NUMA-{base36}{checksum}`
   - Ejemplo: `NUMA-1Q7`
   - Generación automática por usuario
   - Validación con checksum

2. **Recompensas**
   - **Referrer** (quien invita): 500 NUMA + 200 XP
   - **Referee** (invitado): 300 NUMA + 100 XP
   - Ambos ganan al registrarse el nuevo usuario

3. **Milestones**
   - 5 referidos: +1,000 NUMA + 500 XP (Social Butterfly 🦋)
   - 10 referidos: +2,500 NUMA + 1,000 XP (Networker 🌐)
   - 20 referidos: +5,000 NUMA + 2,000 XP (Influencer 🌟)
   - 50 referidos: +15,000 NUMA + 5,000 XP (Ambassador 👑)
   - 100 referidos: +50,000 NUMA + 10,000 XP (Legend 💎)

### Implementación

#### lib/referrals.ts

```typescript
// Generar código de referido
const code = generateReferralCode(userId);
// Output: "NUMA-1Q7"

// Validar código
const validation = validateReferralCode("NUMA-1Q7");
// { valid: true, userId: 123 }

// Obtener milestone actual
const { current, next, progress } = getReferralMilestone(7);
// current: 5 referidos (Social Butterfly)
// next: 10 referidos (Networker)
// progress: 40% (2/5)

// Calcular recompensas totales
const rewards = calculateReferralRewards(15);
// totalNuma: base (15*500) + milestones (1000 + 2500 + 5000)
// totalXp: base (15*200) + milestones (500 + 1000 + 2000)
```

#### hooks/useReferrals.ts

```typescript
const { applyReferralCode, getReferrals, isProcessing } = useReferrals();

// Aplicar código de referido
const result = await applyReferralCode("NUMA-1Q7");
// { success: true, message: "¡Genial! Recibiste 300 NUMA..." }

// Obtener lista de referidos
const { count, referrals } = await getReferrals();
// count: 5
// referrals: [{ userId, walletAddress, createdAt, rewardClaimed }, ...]
```

#### components/ReferralPanel.tsx

Panel completo de referidos con:
- Código único y botón para copiar link
- Stats de invitados y NUMA ganado
- Información de recompensas
- Progreso de milestone con barra
- Bonus al alcanzar milestone
- Instrucciones de cómo funciona

### API Routes

#### POST /api/referrals/apply

Aplica código de referido al usuario

**Request:**
```json
{
  "userId": 123,
  "referrerId": 456,
  "code": "NUMA-1Q7"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Código de referido aplicado exitosamente",
  "rewards": {
    "numa": 300,
    "xp": 100
  }
}
```

**TODO DB:**
- Verificar que usuario no haya usado código antes
- Crear registro en tabla `referrals`
- Actualizar balances (referrer + referee)
- Crear transacciones de recompensa
- Incrementar stats para achievements

#### GET /api/referrals/list?userId=123

Obtiene lista de referidos

**Response:**
```json
{
  "count": 5,
  "referrals": [
    {
      "userId": 789,
      "walletAddress": "0x1234...5678",
      "createdAt": "2024-01-15T10:30:00Z",
      "rewardClaimed": true
    }
  ]
}
```

---

## 🏆 Leaderboard System

### Tipos de Leaderboards

1. **P&L All Time** 💎
   - Top traders por ganancias totales
   - Sin límite de tiempo

2. **P&L Weekly** 🔥
   - Top traders de la semana
   - Se reinicia cada lunes

3. **P&L Monthly** ⭐
   - Top traders del mes
   - Se reinicia cada mes

4. **Top Pioneers** 🏆
   - Usuarios con mayor NUMA staked
   - Ranking de pioneros

5. **Top Referrers** 🌟
   - Usuarios con más referidos
   - Incentiva invitaciones

6. **Top Achievers** 🏅
   - Usuarios con más logros desbloqueados
   - Gamificación social

### Características

- **Podio Top 3** con colores (oro, plata, bronce)
- **Top 10** destacado con badges especiales
- **Posición del usuario** visible aunque no esté en top 10
- **Cambios de ranking** (↑↓) desde última actualización
- **Percentile** para mostrar top %
- **Badges VIP/Plus** para miembros premium

### Implementación

#### lib/leaderboards.ts

```typescript
// Configuración de cada leaderboard
const config = LEADERBOARD_CONFIG['pnl_all_time'];
// { title, description, icon, valueLabel, formatValue }

// Obtener color de badge según rank
const color = getRankBadgeColor(5);
// "from-purple-400 to-purple-600" (Top 10)

// Obtener ícono según rank
const icon = getRankIcon(1);
// "🥇"

// Formatear cambio de ranking
const change = formatRankChange(+5);
// { text: "+5", color: "text-green-400", icon: "↑" }

// Calcular percentile
const percentile = calculatePercentile(15, 1000);
// 98.5 (top 1.5%)
```

#### components/Leaderboard.tsx

Componente completo con:
- **Tabs** para cambiar tipo de leaderboard
- **Header** con título, descripción, última actualización
- **User Position Card** (si no está en top 10)
- **Podio Top 3** con diseño especial
- **Lista Top 10** con detalles
- **CTA Membresía** para usuarios free

**Subcomponentes:**
- `PodiumCard`: Tarjeta para top 3 con alturas diferentes
- `LeaderboardRow`: Fila de ranking con badge, usuario, valor, cambio

### Mock Data

Función `getMockLeaderboardData()` para desarrollo:
- Genera 100 entradas mock
- Asigna membership tiers realistas
- Calcula cambios de ranking aleatorios
- Identifica posición del usuario

**TODO DB:**
- Implementar queries reales por tipo
- Agregar paginación para >100 usuarios
- Cache de rankings (actualizar cada 5 min)
- Histórico de rankings para cambios

---

## 📱 Social Sharing

### Plataformas Soportadas

1. **Native Share** (Web Share API)
   - Usa menú nativo del dispositivo
   - Fallback automático a específicos

2. **Twitter**
   - Tweet directo con texto y URL

3. **Telegram**
   - Share URL en chats/canales

4. **WhatsApp**
   - Mensaje directo con link

### Templates de Mensajes

```typescript
// Compartir victoria
SHARE_TEMPLATES.position_win(1500, 'BTC/USD', 10)
// "¡Acabo de ganar 1,500 NUMA en una operación de BTC/USD con 10x leverage! 💰"

// Compartir milestone
SHARE_TEMPLATES.milestone_reached('Top 10 Trader', 50000)
// "¡Alcancé Top 10 Trader en Numisma con 50,000! 🎉"

// Compartir logro
SHARE_TEMPLATES.achievement_unlocked('High Leverage Master')
// "Acabo de desbloquear "High Leverage Master" en Numisma! 🏅"

// Compartir pioneer rank
SHARE_TEMPLATES.pioneer_rank(42)
// "¡Soy Pioneer #42 en Numisma! 👑"

// Referral invite
SHARE_TEMPLATES.referral('NUMA-1Q7')
// "Úsa mi código NUMA-1Q7 y recibe 300 NUMA gratis al registrarte 💎"

// General invite
SHARE_TEMPLATES.general_invite()
// "Tradea BTC, ETH y SOL con hasta 100x leverage, directo desde World App 📱"
```

### Implementación

#### lib/social.ts

```typescript
// Compartir con plataforma específica
await shareContent(
  { title, text, url },
  'twitter' // o 'telegram', 'whatsapp', 'native'
);

// Copiar al portapapeles
const success = await copyToClipboard('texto');
```

#### components/ShareButton.tsx

Botón de compartir con 2 variantes:

**Button variant:**
```tsx
<ShareButton 
  data={SHARE_TEMPLATES.position_win(1500, 'BTC/USD', 10)}
  variant="button"
  size="md"
/>
```

**Icon variant:**
```tsx
<ShareButton 
  data={SHARE_TEMPLATES.referral(code)}
  variant="icon"
  size="sm"
  className="absolute top-4 right-4"
/>
```

Muestra menú dropdown con 3 opciones:
- Twitter (azul)
- Telegram (azul)
- WhatsApp (verde)

---

## 🔗 Integración con Otras Features

### Analytics

Eventos a trackear:
```typescript
analytics.track('referral_code_shared', { code, platform });
analytics.track('referral_code_applied', { code, referrerId });
analytics.track('leaderboard_viewed', { type });
analytics.track('content_shared', { platform, type });
```

### Achievements

Logros relacionados:
- `first_referral`: Primer amigo invitado
- `social_butterfly`: 5 referidos
- `influencer`: 20 referidos
- `top_100/50/10`: Posiciones en leaderboard

### Notifications

Notificaciones:
- Nuevo referido registrado
- Milestone de referidos alcanzado
- Cambio de posición en leaderboard
- Alguien superó tu ranking

---

## 📊 Base de Datos (TODO)

### Tabla: referrals

```sql
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id),
  referred_user_id INTEGER REFERENCES users(id),
  code VARCHAR(20) NOT NULL,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(code);
```

### Tabla: leaderboard_snapshots

```sql
CREATE TABLE leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  leaderboard_type VARCHAR(50) NOT NULL,
  rank INTEGER NOT NULL,
  value DECIMAL(18, 2) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leaderboard_type_period ON leaderboard_snapshots(leaderboard_type, period_start);
CREATE INDEX idx_leaderboard_user ON leaderboard_snapshots(user_id, leaderboard_type);
```

### Queries

**Top 100 de P&L All Time:**
```sql
SELECT 
  u.id,
  u.wallet_address,
  u.username,
  u.membership_tier,
  SUM(CASE WHEN p.pnl > 0 THEN p.pnl ELSE 0 END) as total_pnl,
  ROW_NUMBER() OVER (ORDER BY SUM(p.pnl) DESC) as rank
FROM users u
LEFT JOIN positions p ON u.id = p.user_id AND p.status = 'closed'
GROUP BY u.id
ORDER BY total_pnl DESC
LIMIT 100;
```

**Top Pioneers:**
```sql
SELECT 
  u.id,
  u.wallet_address,
  u.username,
  u.membership_tier,
  p.numa_staked,
  ROW_NUMBER() OVER (ORDER BY p.numa_staked DESC) as rank
FROM users u
INNER JOIN pioneers p ON u.id = p.user_id
WHERE p.status = 'active'
ORDER BY numa_staked DESC
LIMIT 100;
```

---

## ✅ Testing Checklist

- [ ] Generar código de referido
- [ ] Copiar link de referido
- [ ] Aplicar código (mock)
- [ ] Ver contador de referidos
- [ ] Ver progreso de milestone
- [ ] Ver leaderboard P&L
- [ ] Ver leaderboard Pioneers
- [ ] Cambiar entre tabs de leaderboards
- [ ] Ver posición personal en ranking
- [ ] Compartir en Twitter
- [ ] Compartir en Telegram
- [ ] Compartir en WhatsApp
- [ ] Usar native share (mobile)
- [ ] Ver podio top 3
- [ ] Ver badges de membership
- [ ] Ver cambios de ranking (↑↓)

---

## 🚀 Deployment

### Environment Variables

Ninguna requerida para esta feature (usa endpoints existentes)

### Próximos Pasos

1. **Implementar DB:**
   - Crear tablas `referrals` y `leaderboard_snapshots`
   - Implementar API routes reales
   - Agregar cache de rankings

2. **Social Auth (Futuro):**
   - Login con Twitter para auto-follow
   - Login con Telegram para auto-join channel
   - Share rewards (bonus por compartir)

3. **Gamificación:**
   - Logros por posiciones en leaderboard
   - Logros por milestones de referidos
   - Badges especiales para top 10

4. **Analytics:**
   - Tracking de shares por plataforma
   - Conversion rate de referidos
   - Engagement de leaderboards
