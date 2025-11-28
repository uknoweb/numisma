# 📋 Checklist de Producción - Numisma

Use este checklist para asegurar un deploy exitoso a producción.

---

## 🔧 Pre-requisitos (Cuentas necesarias)

- [ ] **Alchemy** - Crear cuenta y obtener API Key
  - URL: https://alchemy.com
  - Plan: Gratis (300M compute units/mes)
  - Red: World Chain Sepolia (testnet) / World Chain (mainnet)
  
- [ ] **World Developer Portal** - Crear App
  - URL: https://developer.worldcoin.org
  - Crear: "Numisma" app
  - Obtener: App ID + Action ID
  
- [ ] **Vercel** - Hosting y database
  - URL: https://vercel.com
  - Plan: Hobby (gratis)
  - Instalar: Vercel CLI (`npm i -g vercel`)
  
- [ ] **MetaMask/Wallet** - Para deploy de contratos
  - Crear wallet nueva (seguridad)
  - Guardar seed phrase OFFLINE
  - Exportar private key para .env

- [ ] **Faucet (testnet)** - WLD gratis
  - URL: https://faucet.worldchain.org
  - Pegar address de wallet
  - Esperar ~1 min

---

## 📦 Instalación Local

### 1. Node.js y dependencias
- [ ] Node.js >= v20.9.0 instalado
  ```bash
  node --version  # Verificar
  ```
  
- [ ] Dependencies instaladas
  ```bash
  npm install
  ```

### 2. Variables de entorno
- [ ] Copiar .env.local.example → .env.local
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] Llenar todas las variables:
  ```env
  NEXT_PUBLIC_WORLD_APP_ID=app_staging_xxxxx
  NEXT_PUBLIC_WORLD_ACTION_ID=verify_human
  NEXT_PUBLIC_ALCHEMY_API_KEY=tu_api_key
  PRIVATE_KEY=0x...
  ```

### 3. Hardhat setup
- [ ] Inicializar Hardhat
  ```bash
  npx hardhat init
  # Seleccionar: TypeScript project
  ```

- [ ] Crear carpeta contracts/
  ```bash
  mkdir -p contracts
  ```

- [ ] Copiar Smart Contracts
  - [ ] NumismaToken.sol (de HYBRID_PLAN.md)
  - [ ] TradingPool.sol (de HYBRID_PLAN.md)
  - [ ] PioneerVault.sol (de HYBRID_PLAN.md)

---

## 🧪 Testing Local

### Compilación
- [ ] Compilar Smart Contracts
  ```bash
  npx hardhat compile
  ```
  
- [ ] Verificar TypeScript
  ```bash
  npx tsc --noEmit
  ```

- [ ] Build Next.js
  ```bash
  npm run build
  ```

### Tests
- [ ] Tests de contratos (Hardhat)
  ```bash
  npx hardhat test
  ```

- [ ] Coverage de contratos
  ```bash
  npx hardhat coverage
  ```

- [ ] Slither (análisis estático)
  ```bash
  pip3 install slither-analyzer
  slither contracts/
  ```

### Desarrollo
- [ ] Iniciar dev server
  ```bash
  npm run dev
  ```

- [ ] Probar flujos:
  - [ ] Verificación World ID (mock)
  - [ ] Dashboard con balances
  - [ ] Trading: abrir y cerrar posición
  - [ ] Staking: reclamar diario
  - [ ] Swap NUMA → WLD
  - [ ] Ver membresías
  - [ ] Tutorial de Pioneros

---

## ⛓️ Deploy a Testnet (World Chain Sepolia)

### 1. Preparación
- [ ] Verificar balance de WLD en testnet
  ```bash
  # Ver balance en: https://worldchain-sepolia.explorer.alchemy.com/
  # Address: (tu wallet address)
  ```

- [ ] Verificar configuración de red en hardhat.config.ts
  ```typescript
  networks: {
    "worldchain-sepolia": {
      url: "https://worldchain-sepolia.g.alchemy.com/v2/...",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 4801,
    }
  }
  ```

### 2. Deploy
- [ ] Ejecutar script de deploy
  ```bash
  npx hardhat run scripts/deploy.ts --network worldchain-sepolia
  ```

- [ ] Copiar addresses impresas:
  ```
  NumismaToken:  0x...
  TradingPool:   0x...
  PioneerVault:  0x...
  ```

- [ ] Pegar en .env.local:
  ```env
  NEXT_PUBLIC_NUMA_TOKEN_ADDRESS=0x...
  NEXT_PUBLIC_TRADING_POOL_ADDRESS=0x...
  NEXT_PUBLIC_PIONEER_VAULT_ADDRESS=0x...
  ```

### 3. Verificación en Explorer
- [ ] Verificar contratos
  ```bash
  npx hardhat verify --network worldchain-sepolia 0x... [constructor args]
  ```

- [ ] Revisar en explorer:
  - [ ] https://worldchain-sepolia.explorer.alchemy.com/
  - [ ] Buscar cada address
  - [ ] Verificar código fuente (verde ✓)

---

## 🌐 Deploy Frontend a Vercel

### 1. Primera vez
- [ ] Login a Vercel
  ```bash
  npx vercel login
  ```

- [ ] Deploy (staging)
  ```bash
  npx vercel
  ```

- [ ] Seguir prompts:
  - Set up project: Yes
  - Project name: numisma
  - Framework: Next.js
  - Root directory: ./
  - Override settings: No

### 2. Variables de entorno
- [ ] Ir a Vercel Dashboard → Project → Settings → Environment Variables

- [ ] Agregar variables (Production):
  ```
  NEXT_PUBLIC_WORLD_APP_ID
  NEXT_PUBLIC_WORLD_ACTION_ID
  NEXT_PUBLIC_ALCHEMY_API_KEY
  NEXT_PUBLIC_NUMA_TOKEN_ADDRESS
  NEXT_PUBLIC_TRADING_POOL_ADDRESS
  NEXT_PUBLIC_PIONEER_VAULT_ADDRESS
  ```

### 3. Database (Vercel Postgres)
- [ ] En Vercel Dashboard → Storage → Create Database

- [ ] Seleccionar: Postgres

- [ ] Connect to Project: numisma

- [ ] Las variables se agregan automáticamente:
  ```
  POSTGRES_URL
  POSTGRES_PRISMA_URL
  POSTGRES_URL_NON_POOLING
  ```

### 4. Re-deploy
- [ ] Deploy a producción
  ```bash
  npx vercel --prod
  ```

- [ ] Abrir URL generada
  - Formato: https://numisma-xxxxx.vercel.app

---

## 🧪 Testing en Testnet

### Flujo completo de usuario
- [ ] Abrir app en navegador (URL de Vercel)

- [ ] Verificar World ID (mock o real si MiniKit está integrado)

- [ ] Conectar wallet (MetaMask con World Chain Sepolia)

- [ ] Realizar operaciones:
  - [ ] Reclamar recompensa diaria (claim)
  - [ ] Abrir posición de trading
  - [ ] Cerrar posición con ganancia/pérdida
  - [ ] Swap NUMA → WLD
  - [ ] Comprar membresía Plus/VIP

### Verificar transacciones
- [ ] Cada tx tiene hash visible en UI

- [ ] Ver tx en explorer:
  ```
  https://worldchain-sepolia.explorer.alchemy.com/tx/0x...
  ```

- [ ] Verificar eventos emitidos

- [ ] Confirmar cambios de balance on-chain

---

## 🚀 Deploy a Mainnet (World Chain)

⚠️ **SOLO después de:**
- Testnet 100% funcional
- Auditoría de Smart Contracts completa
- Testing con usuarios reales
- Plan de emergencia preparado

### 1. Auditoría de Seguridad
- [ ] Slither (automatizado) - GRATIS
  ```bash
  slither contracts/ > audit-report.txt
  ```

- [ ] CertiK / OpenZeppelin - PAGO (~$3k-10k)
  - Contactar equipo de auditoría
  - Enviar contratos
  - Esperar informe (2-4 semanas)
  - Corregir issues encontrados

### 2. Preparar Mainnet
- [ ] Crear wallet de producción (nueva, segura)

- [ ] Fondear con WLD real (~$100-200 para gas)

- [ ] Actualizar hardhat.config.ts:
  ```typescript
  networks: {
    worldchain: {
      url: "https://worldchain-mainnet.g.alchemy.com/v2/...",
      accounts: [process.env.PRIVATE_KEY_MAINNET],
      chainId: 480,
    }
  }
  ```

### 3. Deploy
- [ ] Deploy contratos a mainnet
  ```bash
  npx hardhat run scripts/deploy.ts --network worldchain
  ```

- [ ] Copiar addresses y actualizar .env

- [ ] Verificar en explorer mainnet:
  ```
  https://worldchain-mainnet.explorer.alchemy.com/
  ```

### 4. Update Frontend
- [ ] Actualizar variables en Vercel (Production):
  - Contract addresses (mainnet)
  - Chain ID: 480

- [ ] Re-deploy
  ```bash
  npx vercel --prod
  ```

---

## 📱 World App Store Submission

### 1. World Developer Portal
- [ ] Login: https://developer.worldcoin.org

- [ ] Ir a: Apps → Numisma → Mini App Settings

- [ ] Llenar información:
  - **Name:** Numisma
  - **Description:** Plataforma educativa de trading...
  - **URL:** https://numisma-xxxxx.vercel.app
  - **Logo:** Upload (512x512px, PNG)
  - **Screenshots:** 3-5 capturas de pantalla
  - **Category:** Finance / Education

### 2. Información Requerida
- [ ] **Privacy Policy URL**
  - Crear página: /privacy-policy
  - Subir a Vercel

- [ ] **Terms of Service URL**
  - Crear página: /terms
  - Subir a Vercel

- [ ] **Support Email**
  - Configurar: support@numisma.app (o Gmail)

### 3. Submission
- [ ] Click "Submit for Review"

- [ ] Esperar aprobación (1-2 semanas)

- [ ] Responder a feedback si es rechazado

- [ ] ✅ LIVE en World App Store!

---

## 🔒 Seguridad Post-Deploy

### Monitoreo
- [ ] Configurar alertas en Alchemy

- [ ] Monitorear transacciones sospechosas

- [ ] Dashboard de analytics (Vercel)

### Backups
- [ ] Backup de private keys (offline, seguro)

- [ ] Backup de código fuente (GitHub privado)

- [ ] Backup de base de datos (Vercel auto backup)

### Plan de Emergencia
- [ ] Documentar proceso de pausa de contratos

- [ ] Contactos de emergencia del equipo

- [ ] Plan de comunicación con usuarios

---

## ✅ Checklist Final

Antes de marcar como "DONE":

- [ ] Testnet funcionando 100%
- [ ] Auditoría de contratos completada
- [ ] Mainnet deployed y verificado
- [ ] Frontend en producción (Vercel)
- [ ] World App Store submission enviada
- [ ] Documentación completa
- [ ] Equipo entrenado en operación
- [ ] Plan de marketing listo

---

## 📊 KPIs a Monitorear

Post-launch, trackear:

- **Users:** Total verificados con World ID
- **TVL:** Total Value Locked (NUMA + WLD en contratos)
- **Pioneers:** Número de pioneros activos
- **Trading Volume:** Volumen de posiciones abiertas
- **Memberships:** Free / Plus / VIP ratio
- **Revenue:** Comisiones generadas (swap 3% + membresías)

---

## 🎉 ¡Listo para Producción!

Cuando todos los checkboxes estén marcados, Numisma estará lista para usuarios reales en World App. 🚀
