# 🚀 Guía Rápida de Inicio - Blockchain Ready

**¿Qué acabamos de preparar mientras compilaba Node.js?**

---

## ✅ Archivos Creados (Listos para usar)

### 1. Integración Blockchain
```
✅ lib/blockchain.ts          → Funciones Viem para Smart Contracts
✅ lib/minikit.ts             → MiniKit SDK wrapper
✅ hooks/useBlockchain.ts     → React hook para transacciones
✅ app/api/verify/route.ts    → API para verificar World ID
```

### 2. Configuración Hardhat
```
✅ hardhat.config.ts           → Config de World Chain
✅ scripts/deploy.ts           → Script de deploy automatizado
✅ ignition/modules/Numisma.ts → Ignition module
✅ contracts-package.json      → Scripts de blockchain
```

### 3. Archivos de entorno
```
✅ .env.local.example         → Template de variables
✅ .gitignore                 → Actualizado con Hardhat
```

### 4. Documentación
```
✅ README_BLOCKCHAIN.md       → README completo con blockchain
✅ HYBRID_PLAN.md            → Plan híbrido DB + Smart Contracts
```

---

## 🎯 Siguiente Paso: Cuando termine Node.js

### 1. Verificar instalación
```bash
node --version  # Debe mostrar v20.x.x
```

### 2. Instalar dependencias blockchain
```bash
cd /Users/capote/Desktop/numisma

# Frontend blockchain
npm install @worldcoin/minikit-js viem

# Hardhat (dev)
npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

### 3. Inicializar Hardhat
```bash
npx hardhat init

# Seleccionar:
# → Create a TypeScript project
# → Yes to all
```

### 4. Crear .env.local
```bash
cp .env.local.example .env.local

# Editar y agregar:
# - World App ID (de developer.worldcoin.org)
# - Alchemy API Key (de alchemy.com)
```

### 5. Crear los Smart Contracts

Copiar los 3 contratos de `HYBRID_PLAN.md`:
```bash
mkdir -p contracts
# Copiar NumismaToken.sol
# Copiar TradingPool.sol
# Copiar PioneerVault.sol
```

### 6. Compilar contratos
```bash
npx hardhat compile
```

### 7. Deploy a testnet
```bash
# Primero obtener WLD de testnet en:
# https://faucet.worldchain.org

# Deploy
npm run deploy:testnet

# Copiar las addresses impresas a .env.local
```

### 8. Probar frontend
```bash
npm run dev
# Abrir http://localhost:3000
```

---

## 📊 Estado Actual del Proyecto

### ✅ Completado (100%)
- [x] Frontend completo (5 pantallas)
- [x] UI/UX gold/black premium
- [x] Sistema de trading simulado
- [x] Staking + membresías
- [x] Sistema de Pioneros con tutorial
- [x] Mock World ID verification
- [x] Zustand store con persistencia
- [x] Utilidades y helpers
- [x] Documentación completa (6 archivos)
- [x] Integración blockchain preparada
- [x] Smart Contracts diseñados
- [x] Configuración Hardhat lista

### ⏳ Pendiente (esperando Node.js)
- [ ] npm install de deps blockchain
- [ ] Hardhat init
- [ ] Compilar contratos
- [ ] Deploy a testnet
- [ ] Integración MiniKit real
- [ ] Testing end-to-end

---

## 🎨 Lo que ya funciona (sin blockchain)

### Puedes probar ahora mismo:
```bash
# Si ya tienes Node.js 20
npm run dev
```

1. **Verificación mock** (2 segundos de loading)
2. **Dashboard** con balances y navegación
3. **Plataforma de trading** con gráfico TradingView
4. **Abrir/cerrar posiciones** con PnL en tiempo real
5. **Staking** con swap y vista de membresías
6. **Tutorial de Pioneros** completo y funcional

Todo esto usando **datos locales** (Zustand + localStorage).

---

## 🔥 Lo que falta para producción

### Checklist de deployment:

#### Backend (2-3 días)
- [ ] Crear cuenta en Alchemy → API Key
- [ ] Crear cuenta en World Developer Portal → App ID
- [ ] Crear wallet de testnet → Private Key
- [ ] Configurar .env.local
- [ ] Deploy contratos a testnet
- [ ] Probar transacciones

#### Frontend (1 día)
- [ ] Actualizar WorldIdVerification.tsx con MiniKit real
- [ ] Actualizar TradingChart.tsx con blockchain
- [ ] Actualizar Staking.tsx con transacciones
- [ ] Agregar Toast notifications para txs
- [ ] Loading states durante confirmaciones

#### Testing (2 días)
- [ ] Unit tests de contratos (Hardhat)
- [ ] Tests de integración frontend
- [ ] Auditoría con Slither
- [ ] Probar en testnet con usuarios reales

#### Deploy (1 día)
- [ ] npx vercel (deploy frontend)
- [ ] Agregar Vercel Postgres
- [ ] Deploy contratos a mainnet
- [ ] Verificar contratos en explorer
- [ ] Registrar en World App Store

**Total:** ~7 días de trabajo

---

## 💡 Decisiones de Arquitectura

### ¿Por qué híbrido (DB + Blockchain)?

**Base de datos (Vercel Postgres):**
- ✅ Lectura instantánea (<50ms)
- ✅ Cache de balances y posiciones
- ✅ Analytics y métricas
- ✅ Historial de trades

**Smart Contracts (World Chain):**
- ✅ Dinero real protegido on-chain
- ✅ Inmutable y auditable
- ✅ Trustless (sin confiar en servidor)
- ✅ Proof of ownership

**Resultado:**
- UX rápida (DB responde primero)
- Seguridad máxima (dinero en blockchain)
- Costos bajos (solo transacciones críticas)

---

## 🎯 Próximos 30 Minutos

Mientras termina de compilar, puedes:

1. **Crear cuenta en Alchemy:**
   - Ir a https://alchemy.com
   - Sign up gratis
   - Create App → World Chain Sepolia
   - Copiar API Key

2. **Crear cuenta en World Developer Portal:**
   - Ir a https://developer.worldcoin.org
   - Sign up
   - Create New App → "Numisma"
   - Copiar App ID y Action ID

3. **Conseguir WLD de testnet:**
   - Crear wallet nueva (MetaMask)
   - Ir a https://faucet.worldchain.org
   - Pegar address
   - Recibir WLD gratis

4. **Revisar documentación:**
   - Leer `HYBRID_PLAN.md` (Smart Contracts completos)
   - Leer `DEPLOY_ROADMAP.md` (Plan de 7 días)
   - Leer `BACKEND_PLAN.md` (APIs necesarias)

---

## ❓ FAQ

### ¿Cuánto falta para que compile Node.js?
Entre 5-15 minutos. OpenSSL es lento pero es normal.

### ¿Puedo usar la app sin blockchain?
Sí, todo el frontend funciona con datos mock. Útil para desarrollo.

### ¿Cuánto cuesta deployar?
- Testnet: $0 (WLD gratis en faucet)
- Mainnet: ~$50-100 en gas fees
- Vercel: $0 (plan gratuito)
- Alchemy: $0 (300M compute units/mes gratis)

### ¿Necesito auditoría de contratos?
Recomendado antes de mainnet. Opciones:
- Slither (gratis, automatizado)
- CertiK (~$5k-10k, top tier)
- OpenZeppelin (~$3k-8k)

### ¿Qué pasa si encuentro un bug?
El código está listo para desarrollo. En producción:
1. Pausar contratos (función de emergencia)
2. Avisar a usuarios
3. Migrar fondos a contratos nuevos
4. Re-deploy con fix

---

## 🎉 ¿Listo?

En cuanto termine Node.js, ejecuta:

```bash
node --version
cd /Users/capote/Desktop/numisma
npm install @worldcoin/minikit-js viem
npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init
```

Y seguimos con el deploy! 🚀
