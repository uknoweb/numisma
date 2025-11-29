# 📊 PROYECTO NUMISMA - Estado Actual y Roadmap

**Última actualización:** 28 de Noviembre, 2025  
**Ubicación:** `/Users/capote/Desktop/numisma`  
**Repositorio:** https://github.com/uknoweb/numisma  
**Deploy:** https://numisma-gamma.vercel.app

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

### ✅ COMPLETADO (100%)

#### 1. **Frontend - Interfaz de Usuario**
- ✅ Diseño profesional dorado/negro minimalista
- ✅ Interfaz de trading simplificada (sin gráficas complejas)
- ✅ Sistema de navegación completo entre vistas
- ✅ Responsive design mobile-first
- ✅ Componentes UI reutilizables (Button, Card, Dialog)
- ✅ Glassmorphism y efectos visuales premium

#### 2. **Módulos Funcionales**
- ✅ **WorldIdVerification** - Pantalla de verificación (simulada)
- ✅ **Dashboard** - Menú principal con balances y navegación
- ✅ **TradingChartMobileV2** - Trading LONG/SHORT simplificado
- ✅ **Staking** - Swap, membresías, pioneros, recompensas
- ✅ **Plataforma** - Vista alternativa de trading

#### 3. **Estado y Lógica**
- ✅ Zustand store con localStorage persistente
- ✅ Cálculos de PnL en tiempo real
- ✅ Sistema de recompensas diarias
- ✅ Lógica de apalancamiento por tier
- ✅ Validación de balances y operaciones

#### 4. **Deployment**
- ✅ GitHub: uknoweb/numisma (sincronizado)
- ✅ Vercel: numisma-gamma.vercel.app (live)
- ✅ Variables de entorno configuradas
- ✅ World ID integrado con MiniKit SDK

---

## 🚧 TAREAS ACTUALES

### **ÚLTIMA TAREA COMPLETADA:**
**Simplificación de interfaz de trading** (28 Nov 2025)
- ❌ Eliminada gráfica compleja con Recharts que no se visualizaba
- ✅ Diseño básico y funcional implementado
- ✅ Precio grande y visible sin gráficos confusos
- ✅ Botones claros Long/Short sin decoraciones excesivas
- ✅ Código más ligero sin dependencias pesadas

### **ESTADO DE LA APLICACIÓN:**
```
✅ Frontend: 100% funcional
❌ Backend: 0% (pendiente)
❌ Smart Contracts: 0% (no iniciado)
❌ Base de Datos: 0% (no configurada)
❌ World ID Real: 20% (SDK integrado, falta verificación real)
```

---

## 📋 PRÓXIMOS PASOS PRIORITARIOS

### **FASE 1: Backend y Base de Datos** (7-10 días)

#### Tarea 1: Configurar Vercel Postgres
```bash
# En Vercel Dashboard
1. Storage → Create Database → Postgres
2. Connect to Project: numisma
3. Copiar variables de entorno
```

#### Tarea 2: Configurar Prisma
```bash
npm install @prisma/client
npm install -D prisma

npx prisma init
# Editar prisma/schema.prisma con modelos
npx prisma migrate dev --name init
npx prisma generate
```

**Modelos necesarios:**
- User (wallet, worldId, balances, membership)
- Position (trading history)
- Pioneer (capital, rank, earnings)
- Transaction (historial completo)

#### Tarea 3: API Routes
Crear endpoints en `/app/api/`:
- `/api/auth/verify` - Verificación World ID real
- `/api/trading/open` - Abrir posición
- `/api/trading/close` - Cerrar posición
- `/api/staking/claim` - Reclamar recompensa
- `/api/swap/numa-wld` - Swap tokens

---

### **FASE 2: Smart Contracts** (10-14 días)

#### Tarea 4: Setup Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Seleccionar: TypeScript project
```

#### Tarea 5: Desarrollar Contratos
Implementar en `contracts/`:

**1. NumismaToken.sol** (Token ERC-20)
- Supply: 1,000,000,000 NUMA
- Funciones: mint, burn, transfer
- Membresías: Free, Plus, VIP
- Recompensas diarias

**2. TradingPool.sol** (Pool de Riesgo)
- Abrir/cerrar posiciones
- Cálculo de PnL
- Distribución de ganancias/pérdidas
- Pool de liquidez

**3. PioneerVault.sol** (Sistema Pioneros)
- Lock de capital (1 año)
- Ranking por capital
- Distribución de ganancias (5%)
- Penalización por retiro anticipado (20%)

**4. LoanManager.sol** (Préstamos)
- Préstamos al 90% del capital bloqueado
- Tarifa del 5%
- Liquidación automática si no se paga

#### Tarea 6: Testing y Deploy
```bash
# Tests
npx hardhat test
npx hardhat coverage

# Deploy a testnet
npx hardhat run scripts/deploy.ts --network worldchain-sepolia

# Verificar contratos
npx hardhat verify --network worldchain-sepolia DEPLOYED_ADDRESS
```

---

### **FASE 3: Integración Frontend-Blockchain** (5-7 días)

#### Tarea 7: Instalar Wagmi + Viem
```bash
npm install wagmi viem@2.x @tanstack/react-query
```

#### Tarea 8: Configurar Providers
Actualizar `app/layout.tsx`:
- WagmiProvider
- QueryClientProvider
- Config de World Chain

#### Tarea 9: Conectar UI con Contratos
- Reemplazar Zustand por llamadas a contratos
- Implementar useReadContract para lecturas
- Implementar useWriteContract para escrituras
- Agregar manejo de transacciones y estados

---

## 🗓️ ROADMAP COMPLETO

### **Sprint 1** (Semanas 1-2) - Backend
- [ ] Vercel Postgres configurado
- [ ] Prisma schemas creados
- [ ] API Routes básicas
- [ ] Autenticación con World ID real

### **Sprint 2** (Semanas 3-4) - Smart Contracts
- [ ] 4 contratos desarrollados
- [ ] Tests unitarios (>80% coverage)
- [ ] Deploy a testnet
- [ ] Verificación en explorer

### **Sprint 3** (Semanas 5-6) - Integración
- [ ] Wagmi configurado
- [ ] Frontend conectado a blockchain
- [ ] Transacciones funcionando
- [ ] Testing end-to-end

### **Sprint 4** (Semana 7) - Testing y Auditoría
- [ ] Testing con usuarios reales en testnet
- [ ] Auditoría automatizada (Slither)
- [ ] Corrección de bugs
- [ ] Optimización de gas

### **Sprint 5** (Semana 8) - Producción
- [ ] Deploy a mainnet
- [ ] Verificación de contratos
- [ ] Actualización de frontend
- [ ] Launch en World App Store

---

## 💰 ARQUITECTURA HÍBRIDA

### **Base de Datos (Rápida - <50ms)**
- ✅ Posiciones de trading abiertas/cerradas
- ✅ Historial de trades
- ✅ Cache de balances
- ✅ Precios en tiempo real
- ✅ Analytics y métricas

### **Smart Contracts (Segura - On-chain)**
- 🔐 Balances reales de NUMA y WLD
- 🔐 Compra de membresías
- 🔐 Sistema de Pioneros
- 🔐 Préstamos garantizados
- 🔐 Swap NUMA → WLD
- 🔐 Distribución de ganancias

---

## 🎨 DISEÑO Y UX

### **Paleta de Colores**
```css
--color-gold: #FFD700
--color-gold-dark: #D4AF37
--color-black: #000000
--color-gray-900: #0a0a0a
--color-green: #10b981 (ganancias)
--color-red: #ef4444 (pérdidas)
```

### **Tipografía**
- Sistema: SF Pro / Segoe UI / Roboto
- Pesos: Regular (400), Medium (500), Bold (700), Black (900)
- Escalas: text-sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl

### **Componentes**
- Cards con glassmorphism
- Botones con gradientes y sombras
- Inputs con bordes dorados
- Modals con backdrop blur

---

## 📊 DISTRIBUCIÓN DE TOKENS NUMA

### **Supply Total: 1,000,000,000 NUMA**

```
TradingPool:      400,000,000 NUMA (40%) - Liquidez para ganancias
StakingRewards:   300,000,000 NUMA (30%) - Recompensas diarias
PioneerVault:     100,000,000 NUMA (10%) - Pagos pioneros
TeamVesting:      100,000,000 NUMA (10%) - Equipo (lock 1 año)
Treasury:         100,000,000 NUMA (10%) - Reserva emergencia
```

### **Seguridad**
- ✅ Multi-signature wallet (Gnosis Safe) recomendado
- ✅ Timelock de 48h para cambios críticos
- ✅ Vesting para tokens del equipo
- ✅ Auditoría antes de mainnet

---

## 🔐 CONFIGURACIÓN DE SEGURIDAD

### **Variables de Entorno (.env.local)**
```env
# World ID
NEXT_PUBLIC_WORLD_APP_ID=app_451b35a6a72649c51df0753758419566
NEXT_PUBLIC_WORLD_ACTION_ID=verify_human

# Alchemy
NEXT_PUBLIC_ALCHEMY_API_KEY=g1QFr3bVPNavTzfZTRVif

# World Chain
NEXT_PUBLIC_CHAIN_ID=4801
NEXT_PUBLIC_CHAIN_NAME=worldchain-sepolia

# Private Key (NUNCA COMMITEAR)
PRIVATE_KEY=0x...

# Database (auto-generado por Vercel)
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
```

### **Mejores Prácticas**
- ✅ Private keys en .env.local (gitignored)
- ✅ Hardware wallet para mainnet
- ✅ Backup de seeds offline (3 lugares físicos)
- ✅ Gnosis Safe para control multi-sig
- ✅ Auditoría de contratos pre-launch

---

## 📈 MÉTRICAS Y KPIs

### **Post-Launch Tracking**
- **Users:** Total verificados con World ID
- **TVL:** Total Value Locked (NUMA + WLD)
- **Pioneers:** Número de pioneros activos (max 100)
- **Trading Volume:** Volumen de posiciones
- **Memberships:** Ratio Free/Plus/VIP
- **Revenue:** Comisiones generadas
  - Swap: 3% de cada conversión NUMA→WLD
  - Membresías: 5 WLD (Plus) + 15 WLD (VIP)
  - Préstamos: 5% tarifa

---

## 🛠️ TECNOLOGÍAS Y STACK

### **Frontend**
```json
{
  "next": "16.0.5",
  "react": "19.2.0",
  "typescript": "5.x",
  "tailwindcss": "4.x",
  "zustand": "5.0.8",
  "@radix-ui/react-*": "1.x",
  "lucide-react": "0.555.0"
}
```

### **Blockchain**
```json
{
  "hardhat": "2.22.x",
  "@openzeppelin/contracts": "5.1.x",
  "wagmi": "latest",
  "viem": "2.x",
  "@worldcoin/minikit-js": "0.0.82"
}
```

### **Backend**
```json
{
  "@prisma/client": "latest",
  "@vercel/postgres": "latest",
  "jose": "latest"
}
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
numisma/
├── app/
│   ├── api/                    # ❌ Pendiente
│   │   ├── auth/
│   │   ├── trading/
│   │   └── staking/
│   ├── layout.tsx              # ✅ Completo
│   ├── page.tsx                # ✅ Completo
│   └── globals.css             # ✅ Completo
├── components/
│   ├── ui/                     # ✅ Completo
│   ├── Dashboard.tsx           # ✅ Completo
│   ├── TradingChartMobileV2.tsx # ✅ Simplificado
│   ├── Staking.tsx             # ✅ Completo
│   └── Plataforma.tsx          # ✅ Completo
├── contracts/                  # ❌ Pendiente
│   ├── NumismaToken.sol
│   ├── TradingPool.sol
│   ├── PioneerVault.sol
│   └── LoanManager.sol
├── lib/
│   ├── utils.ts                # ✅ Completo
│   ├── types.ts                # ✅ Completo
│   ├── store.ts                # ✅ Completo
│   ├── wagmi.ts                # ❌ Pendiente
│   └── contracts.ts            # ❌ Pendiente
├── prisma/
│   └── schema.prisma           # ❌ Pendiente
├── scripts/
│   └── deploy.ts               # ❌ Pendiente
├── test/                       # ❌ Pendiente
│   └── Numisma.test.ts
└── hardhat.config.ts           # ❌ Pendiente
```

---

## 🚀 CÓMO EJECUTAR LOCALMENTE

### **Prerequisitos**
```bash
# Node.js >= 20.9.0
node --version

# Si necesitas actualizar
brew install node@20  # macOS
nvm install 20        # o con nvm
```

### **Instalación**
```bash
cd /Users/capote/Desktop/numisma
npm install
npm run dev
```

**URL:** http://localhost:3000

---

## 📝 CHECKLIST PRE-PRODUCCIÓN

### **Testnet (Actual)**
- [x] Frontend funcional
- [x] Deploy en Vercel
- [x] GitHub sincronizado
- [x] World ID SDK integrado
- [ ] Backend API funcionando
- [ ] Contratos deployed a testnet
- [ ] Frontend conectado a blockchain
- [ ] Testing end-to-end

### **Mainnet (Futuro)**
- [ ] Auditoría de contratos completa
- [ ] Testing con usuarios reales
- [ ] Multi-sig wallet configurado
- [ ] Plan de emergencia documentado
- [ ] Contratos deployed a mainnet
- [ ] Frontend apuntando a mainnet
- [ ] Submission a World App Store
- [ ] Marketing y comunicación

---

## 💡 NOTAS IMPORTANTES

### **Cambios Recientes**
1. **28 Nov 2025:** Simplificación de interfaz de trading
   - Eliminada gráfica Recharts compleja
   - Diseño básico y funcional implementado
   - Mejor rendimiento sin dependencias pesadas

2. **28 Nov 2025:** Mejoras de accesibilidad
   - Agregadas aria-labels a inputs y botones
   - Placeholders en campos de texto
   - Limpieza de código duplicado

3. **27 Nov 2025:** Diseño DIAMANTE inspirado
   - Glassmorphism profesional
   - Espaciado mejorado
   - Cards más grandes y legibles

### **Limitaciones Actuales**
- ❌ Sin verificación World ID real (simulada)
- ❌ Sin transacciones blockchain (todo local)
- ❌ Sin persistencia en servidor (solo localStorage)
- ❌ Sin precios reales de mercado
- ❌ Sin sistema de referidos

### **Riesgos y Mitigación**
1. **Centralización:** Usar Gnosis Safe multi-sig
2. **Seguridad:** Auditoría pre-mainnet obligatoria
3. **Escalabilidad:** DB para cache, blockchain para verdad
4. **UX:** Optimistic updates para mejor experiencia
5. **Regulación:** Disclaimer educativo prominente

---

## 📚 DOCUMENTACIÓN CONSOLIDADA

Este documento reemplaza y consolida:
- ✅ HYBRID_PLAN.md
- ✅ PROJECT_STATUS.md
- ✅ PRODUCTION_CHECKLIST.md
- ✅ TOKEN_DISTRIBUTION.md
- ✅ README_BLOCKCHAIN.md

**Mantener:**
- README.md (documentación pública)
- QUICKSTART.md (guía rápida inicio)

**Eliminar:**
- BACKEND_PLAN.md (integrado aquí)
- DEPLOY_ROADMAP.md (integrado aquí)
- COMMANDS.md (obsoleto)

---

## 🎯 OBJETIVO FINAL

**Lanzar Numisma como la primera plataforma educativa de trading en World Chain, verificada con World ID, con:**

1. ✅ Interfaz premium y profesional
2. 🔄 Smart Contracts seguros y auditados
3. 🔄 Sistema de Pioneros único (top 100)
4. 🔄 Préstamos garantizados innovadores
5. 🔄 Membresías con beneficios reales
6. 🔄 Token NUMA con utilidad clara
7. 🔄 100% transparente on-chain

**Timeline estimado:** 8 semanas de desarrollo full-time

---

**Última actualización:** 28 de Noviembre, 2025  
**Próxima revisión:** Después de completar Backend (Fase 1)  
**Desarrollado con ❤️ para el ecosistema Worldcoin**
