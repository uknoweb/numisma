# 💰 Distribución de Tokens NUMA - Seguridad y Control

**Pregunta crítica:** ¿A qué wallet van los 1,000,000,000 NUMA cuando se crea el contrato?

---

## 🔐 Respuesta: Al Deployer (TÚ)

### En el constructor del contrato:

```solidity
contract NumismaToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    
    constructor() ERC20("Numisma", "NUMA") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);  // ← AQUÍ
        //     ^^^^^^^^^^
        //     Esta es tu wallet (el deployer)
    }
}
```

**`msg.sender`** = La wallet que ejecuta `npx hardhat run scripts/deploy.ts`

---

## 📊 Flujo Completo de Tokens

### 1️⃣ Deploy (Momento Cero)

```
Wallet del Deployer (TÚ)
└─ 1,000,000,000 NUMA (100% del supply)
```

**¿Quién controla esto?**
- La wallet cuyo `PRIVATE_KEY` está en `.env.local`
- **⚠️ CRÍTICO:** Quien tenga esa private key controla TODO el supply inicial

---

### 2️⃣ Distribución Inicial (Script de Deploy)

En `scripts/deploy.ts` puedes programar distribución automática:

```typescript
async function main() {
  // 1. Deploy del token
  const NumismaToken = await ethers.getContractFactory("NumismaToken");
  const numaToken = await NumismaToken.deploy();
  await numaToken.waitForDeployment();
  
  // 2. Deploy del TradingPool
  const TradingPool = await ethers.getContractFactory("TradingPool");
  const tradingPool = await TradingPool.deploy(numaToken.address);
  
  // 3. FONDEAR EL TRADING POOL (Liquidez inicial)
  const liquidityAmount = ethers.parseEther("100000000"); // 100M NUMA
  await numaToken.transfer(tradingPool.address, liquidityAmount);
  await tradingPool.fundPool(liquidityAmount);
  
  console.log("✅ TradingPool financiado con 100M NUMA");
  
  // 4. Distribución restante (opcional)
  // - 500M NUMA → Reserva de la plataforma
  // - 200M NUMA → Recompensas de staking
  // - 100M NUMA → Equipo (vesting)
  // - 100M NUMA → Marketing/Airdrops
}
```

**Después del deploy:**
```
Deployer Wallet: 900M NUMA (retenido)
TradingPool:     100M NUMA (liquidez para ganancias de usuarios)
```

---

## 🎯 Distribución Recomendada

### Opción 1: Control Total del Deployer (Riesgoso)

```
Deployer:    1,000,000,000 NUMA (100%)
```

**❌ Problemas:**
- Centralización total
- Los usuarios deben confiar en ti
- Riesgo de hack de tu wallet = pérdida total

---

### Opción 2: Distribución Segura (Recomendado)

```solidity
constructor() ERC20("Numisma", "NUMA") Ownable(msg.sender) {
    uint256 totalSupply = 1_000_000_000 * 10**18;
    
    // 1. Trading Pool (40%) - Para pagar ganancias de usuarios
    _mint(TRADING_POOL_ADDRESS, totalSupply * 40 / 100);
    
    // 2. Staking Rewards (30%) - Para claims diarios
    _mint(STAKING_VAULT_ADDRESS, totalSupply * 30 / 100);
    
    // 3. Pioneer Rewards (10%) - Para pagos cada 15 días
    _mint(PIONEER_VAULT_ADDRESS, totalSupply * 10 / 100);
    
    // 4. Equipo + Dev (10%) - Con vesting de 1 año
    _mint(TEAM_VESTING_ADDRESS, totalSupply * 10 / 100);
    
    // 5. Reserva de emergencia (10%)
    _mint(TREASURY_ADDRESS, totalSupply * 10 / 100);
}
```

**✅ Ventajas:**
- Tokens bloqueados en contratos (no en wallet personal)
- Transparente y auditable
- Reducción de riesgo de centralización

---

## 🔒 Mejores Prácticas de Seguridad

### 1. Multi-Signature Wallet (Recomendado para Mainnet)

En lugar de una wallet personal, usar **Gnosis Safe**:

```typescript
// Deploy con Safe (requiere 3 de 5 firmas para mover fondos)
const DEPLOYER = "0xYourGnosisSafeAddress";

constructor() Ownable(DEPLOYER) {
    _mint(DEPLOYER, INITIAL_SUPPLY);
}
```

**Setup:**
1. Crear Gnosis Safe en https://safe.global
2. Agregar 5 wallets del equipo
3. Configurar: "3 de 5 firmas requeridas"
4. Usar Safe address como deployer

---

### 2. Timelock Contract (Para cambios críticos)

```solidity
import "@openzeppelin/contracts/governance/TimelockController.sol";

// Deploy con Timelock (cambios tardan 48h en aplicarse)
TimelockController timelock = new TimelockController(
    2 days,           // Delay mínimo
    [admin1, admin2], // Proposers
    [admin1, admin2], // Executors
    address(0)        // Admin
);
```

---

### 3. Vesting para el Equipo

```solidity
import "@openzeppelin/contracts/finance/VestingWallet.sol";

// 10% del supply con vesting de 1 año
VestingWallet teamVesting = new VestingWallet(
    teamAddress,
    block.timestamp,               // Start
    365 days                       // Duration
);

_mint(address(teamVesting), totalSupply * 10 / 100);
```

---

## 🚨 Escenarios de Riesgo

### Escenario 1: Hack de Deployer Wallet

**Si solo tienes 1 wallet personal:**
```
Hacker obtiene PRIVATE_KEY
  → Transfiere 1B NUMA a su wallet
  → Vende todo en DEX
  → Proyecto MUERTO ☠️
```

**Solución:** Multi-sig + Hardware Wallet (Ledger/Trezor)

---

### Escenario 2: Deployer Pierde Access

**Si pierdes seed phrase:**
```
No puedes:
  - Pausar contratos en emergencia
  - Actualizar parámetros
  - Fondear pools
  
Resultado: Proyecto se queda sin governance
```

**Solución:** Backup de seeds en 3 lugares físicos diferentes

---

### Escenario 3: Rug Pull (Desconfianza de usuarios)

**Si tienes control total:**
```
Usuario piensa:
  "El creador tiene 1B NUMA, puede vender y desaparecer"
  
  → No invierte
  → No usa la app
  → Proyecto no crece
```

**Solución:** Tokens bloqueados en contratos verificados + auditoría pública

---

## 📋 Plan de Distribución Recomendado para Numisma

### Para Testnet (Rápido, menos seguro)

```typescript
// scripts/deploy.ts
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying con wallet:", deployer.address);
  
  // Deploy contratos
  const numaToken = await NumismaToken.deploy();
  const tradingPool = await TradingPool.deploy(numaToken.address);
  const pioneerVault = await PioneerVault.deploy();
  
  // Distribución simple
  await numaToken.transfer(tradingPool.address, ethers.parseEther("400000000")); // 40%
  await numaToken.transfer(pioneerVault.address, ethers.parseEther("100000000")); // 10%
  
  // Deployer retiene: 500M NUMA (50%)
  console.log("Deployer balance:", await numaToken.balanceOf(deployer.address));
}
```

**Balance final:**
```
Deployer Wallet:  500,000,000 NUMA (50%)
TradingPool:      400,000,000 NUMA (40%)
PioneerVault:     100,000,000 NUMA (10%)
```

---

### Para Mainnet (Seguro, recomendado)

```typescript
// scripts/deploy-mainnet.ts
async function main() {
  // 1. Deployer es un Gnosis Safe
  const GNOSIS_SAFE = "0x..."; // Tu Safe multi-sig
  
  // 2. Deploy contratos
  const numaToken = await NumismaToken.deploy();
  const tradingPool = await TradingPool.deploy(numaToken.address);
  const pioneerVault = await PioneerVault.deploy();
  
  // 3. Deploy Vesting para equipo
  const teamVesting = await VestingWallet.deploy(
    TEAM_MULTISIG,
    block.timestamp,
    365 days
  );
  
  // 4. Distribución segura
  await numaToken.transfer(tradingPool.address, "400000000"); // 40%
  await numaToken.transfer(pioneerVault.address, "100000000"); // 10%
  await numaToken.transfer(teamVesting.address, "100000000");  // 10% (vesting)
  await numaToken.transfer(STAKING_REWARDS, "300000000");      // 30%
  await numaToken.transfer(TREASURY, "100000000");             // 10%
  
  // 5. Transferir ownership a Safe
  await numaToken.transferOwnership(GNOSIS_SAFE);
  await tradingPool.transferOwnership(GNOSIS_SAFE);
  await pioneerVault.transferOwnership(GNOSIS_SAFE);
  
  console.log("✅ Ownership transferido a Safe:", GNOSIS_SAFE);
}
```

**Balance final:**
```
Gnosis Safe:      0 NUMA (pero es owner de todos los contratos)
TradingPool:      400M NUMA (40%)
PioneerVault:     100M NUMA (10%)
TeamVesting:      100M NUMA (10%, bloqueado 1 año)
StakingRewards:   300M NUMA (30%)
Treasury:         100M NUMA (10%)
```

---

## 🎯 Recomendación para Ti

### Testnet (Ahora):
```bash
# Usar 1 wallet personal
# - Rápido para probar
# - No hay dinero real
# - Puedes experimentar

PRIVATE_KEY=0x...tu_testnet_key
```

### Mainnet (Producción):
```bash
# Opción 1: Hardware Wallet (Mínimo)
# - Ledger Nano X + MetaMask
# - Seeds guardadas en bóveda física

# Opción 2: Gnosis Safe (Recomendado)
# - 3 de 5 multi-sig
# - 5 personas del equipo
# - Nadie puede actuar solo

# Opción 3: DAO (Ideal, futuro)
# - Governance descentralizada
# - Holders de NUMA votan
# - Timelock de 48h
```

---

## 🔍 Cómo Verificar la Distribución

### Después del deploy, cualquiera puede verificar:

```javascript
// 1. Total Supply
const totalSupply = await numaToken.totalSupply();
console.log("Total:", totalSupply); // 1,000,000,000 NUMA

// 2. Balance del Deployer
const deployerBalance = await numaToken.balanceOf(DEPLOYER_ADDRESS);
console.log("Deployer tiene:", deployerBalance);

// 3. Balance del TradingPool
const poolBalance = await numaToken.balanceOf(TRADING_POOL_ADDRESS);
console.log("Pool tiene:", poolBalance);

// 4. Owner del contrato
const owner = await numaToken.owner();
console.log("Owner:", owner);
```

**Todo esto es público en el blockchain explorer:**
```
https://worldchain-mainnet.explorer.alchemy.com/address/0x...
```

---

## ✅ Checklist de Seguridad

Antes de deploy a mainnet:

- [ ] PRIVATE_KEY guardada offline (papel, bóveda)
- [ ] Backup de seed phrase en 3 lugares seguros
- [ ] Usar hardware wallet (Ledger/Trezor)
- [ ] Considerar Gnosis Safe multi-sig
- [ ] Plan de distribución definido
- [ ] Tokens del equipo con vesting
- [ ] Auditoría de contratos completa
- [ ] Transferir ownership después del deploy
- [ ] Documentar addresses públicamente

---

## 🎓 Respuesta Directa a tu Pregunta

**¿A qué wallet van los tokens creados?**

1. **Al deployer** (wallet que ejecuta el script de deploy)
2. **Específicamente:** La wallet cuya `PRIVATE_KEY` está en `.env.local`
3. **Dirección:** La que corresponda a esa private key

**Ejemplo:**
```bash
# En .env.local
PRIVATE_KEY=0xabc123...

# Esta private key corresponde a:
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Cuando hagas deploy:
NumismaToken deployed to: 0x...
Initial supply (1B NUMA) → 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**⚠️ IMPORTANTE:**
- Para testnet: Usa wallet nueva, no importa si se pierde
- Para mainnet: Usa Gnosis Safe o hardware wallet
- NUNCA uses wallet con fondos personales para deploy

---

¿Quieres que prepare un script de deploy con distribución segura?
