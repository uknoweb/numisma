# 🔐 Plan Híbrido: MVP + Smart Contracts - Numisma

**Objetivo:** Lanzar rápido con seguridad blockchain desde el inicio

---

## 🎯 Estrategia Híbrida (Mejor de Ambos Mundos)

### Arquitectura Propuesta:

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js) - Ya listo ✅       │
│  - Verificación World ID                │
│  - UI/UX completo                       │
│  - Estado local (Zustand)              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Backend (Vercel + Prisma)              │
│  - APIs REST                            │
│  - Autenticación                        │
│  - Cache y velocidad                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Smart Contracts (World Chain) 🔐       │
│  - NumismaToken (NUMA)                  │
│  - TradingPool (Pool de riesgo)        │
│  - PioneerVault (Pioneros + Vesting)   │
│  - LoanManager (Préstamos)             │
└─────────────────────────────────────────┘
```

### ¿Por qué este enfoque?

✅ **Velocidad:** DB para lectura rápida, blockchain para escritura crítica  
✅ **Seguridad:** Dinero real en Smart Contracts inmutables  
✅ **UX:** Usuario no espera 10-30s por cada acción  
✅ **Costos:** Solo transacciones importantes van on-chain  
✅ **Escalabilidad:** DB maneja millones de lecturas/segundo  

---

## 📊 División de Responsabilidades

### 🗄️ Base de Datos (Vercel Postgres)
**Para:** Datos que cambian frecuentemente o son temporales

- ✅ Posiciones de trading (abiertas/cerradas)
- ✅ Historial de trades
- ✅ Cache de balances
- ✅ Precios de mercado en tiempo real
- ✅ Sesiones de usuario
- ✅ Analytics y métricas

**Ventaja:** Respuesta instantánea (<50ms)

### ⛓️ Smart Contracts (World Chain)
**Para:** Dinero real y operaciones críticas

- 🔐 Balances reales de NUMA y WLD
- 🔐 Compra de membresías (transacción real)
- 🔐 Sistema de Pioneros (capital bloqueado)
- 🔐 Préstamos garantizados
- 🔐 Swap NUMA → WLD (con comisión)
- 🔐 Distribución de ganancias

**Ventaja:** Inmutable, auditable, trustless

---

## 🚀 Plan de Implementación (7-10 días)

### Día 1-2: Setup Completo

#### 1. World ID + Backend
```bash
# Ya instalaste en terminal (esperando a que termine):
# - Node.js 20
# - Dependencias base

# Cuando termine, ejecuta:
npm install @worldcoin/minikit-js @prisma/client jose
npm install -D prisma hardhat @nomicfoundation/hardhat-toolbox

# Inicializar Prisma
npx prisma init

# Inicializar Hardhat (Smart Contracts)
npx hardhat init
# Seleccionar: "Create a TypeScript project"
```

#### 2. Estructura del Proyecto
```
numisma/
├── contracts/              # Smart Contracts ⛓️
│   ├── NumismaToken.sol
│   ├── TradingPool.sol
│   ├── PioneerVault.sol
│   └── LoanManager.sol
├── scripts/                # Deploy scripts
│   └── deploy.ts
├── test/                   # Tests de contratos
│   └── Numisma.test.ts
├── app/api/               # Backend APIs
│   ├── auth/
│   ├── trading/
│   ├── staking/
│   └── pioneer/
├── prisma/
│   └── schema.prisma      # DB Schema
└── lib/
    ├── contracts.ts       # ABIs y addresses
    └── blockchain.ts      # Helpers Web3
```

---

### Día 3-4: Smart Contracts

#### NumismaToken.sol (Token ERC-20)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NumismaToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant NUMA_TO_WLD_RATE = 1000; // 1 WLD = 1000 NUMA
    uint256 public constant SWAP_FEE = 3; // 3%
    
    mapping(address => uint256) public lastClaimTime;
    mapping(address => MembershipTier) public memberships;
    
    enum MembershipTier { FREE, PLUS, VIP }
    
    event DailyRewardClaimed(address indexed user, uint256 amount);
    event MembershipUpgraded(address indexed user, MembershipTier tier);
    event Swapped(address indexed user, uint256 numaAmount, uint256 wldAmount, uint256 fee);
    
    constructor() ERC20("Numisma", "NUMA") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function claimDailyReward() external {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + 1 days,
            "Claim not available yet"
        );
        
        uint256 reward = getDailyReward(msg.sender);
        require(reward > 0, "No reward available");
        
        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, reward * 10**18);
        
        emit DailyRewardClaimed(msg.sender, reward);
    }
    
    function getDailyReward(address user) public view returns (uint256) {
        MembershipTier tier = memberships[user];
        
        if (tier == MembershipTier.FREE) return 50;
        if (tier == MembershipTier.PLUS) return 200;
        if (tier == MembershipTier.VIP) return 500;
        
        return 0;
    }
    
    function upgradeMembership(MembershipTier tier) external payable {
        require(tier > memberships[msg.sender], "Invalid upgrade");
        
        uint256 price;
        if (tier == MembershipTier.PLUS) {
            price = 5 ether; // 5 WLD
        } else if (tier == MembershipTier.VIP) {
            price = 15 ether; // 15 WLD
        }
        
        require(msg.value >= price, "Insufficient payment");
        
        memberships[msg.sender] = tier;
        
        emit MembershipUpgraded(msg.sender, tier);
        
        // Devolver exceso
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }
    
    function swapNumaToWld(uint256 numaAmount) external {
        require(balanceOf(msg.sender) >= numaAmount, "Insufficient NUMA");
        
        uint256 wldAmount = numaAmount / NUMA_TO_WLD_RATE;
        uint256 fee = (wldAmount * SWAP_FEE) / 100;
        uint256 wldToSend = wldAmount - fee;
        
        require(address(this).balance >= wldToSend, "Insufficient liquidity");
        
        _burn(msg.sender, numaAmount);
        payable(msg.sender).transfer(wldToSend);
        
        emit Swapped(msg.sender, numaAmount, wldToSend, fee);
    }
    
    receive() external payable {}
}
```

#### TradingPool.sol (Pool de Riesgo)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NumismaToken.sol";

contract TradingPool is Ownable {
    NumismaToken public numaToken;
    
    struct Position {
        address trader;
        bool isLong;
        uint256 entryPrice;
        uint256 amount;
        uint256 leverage;
        uint256 openedAt;
        bool isOpen;
    }
    
    mapping(uint256 => Position) public positions;
    uint256 public nextPositionId;
    
    uint256 public totalPoolBalance;
    uint256 public creatorEarnings; // 80% de pérdidas de usuarios
    
    event PositionOpened(uint256 indexed positionId, address indexed trader, bool isLong, uint256 amount, uint256 leverage);
    event PositionClosed(uint256 indexed positionId, int256 pnl);
    
    constructor(address _numaToken) Ownable(msg.sender) {
        numaToken = NumismaToken(_numaToken);
    }
    
    function openPosition(
        bool isLong,
        uint256 amount,
        uint256 leverage,
        uint256 entryPrice
    ) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(leverage >= 2, "Leverage must be >= 2");
        
        // Transferir NUMA al pool
        require(
            numaToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 positionId = nextPositionId++;
        
        positions[positionId] = Position({
            trader: msg.sender,
            isLong: isLong,
            entryPrice: entryPrice,
            amount: amount,
            leverage: leverage,
            openedAt: block.timestamp,
            isOpen: true
        });
        
        emit PositionOpened(positionId, msg.sender, isLong, amount, leverage);
        
        return positionId;
    }
    
    function closePosition(uint256 positionId, uint256 currentPrice) external {
        Position storage pos = positions[positionId];
        require(pos.trader == msg.sender, "Not your position");
        require(pos.isOpen, "Position already closed");
        
        int256 pnl = calculatePnL(positionId, currentPrice);
        
        pos.isOpen = false;
        
        // Calcular payout
        uint256 payout;
        if (pnl > 0) {
            // Usuario ganó
            payout = pos.amount + uint256(pnl);
            require(totalPoolBalance >= uint256(pnl), "Insufficient pool balance");
            totalPoolBalance -= uint256(pnl);
        } else {
            // Usuario perdió
            uint256 loss = uint256(-pnl);
            if (loss >= pos.amount) {
                payout = 0;
                uint256 poolProfit = pos.amount;
                totalPoolBalance += poolProfit;
                creatorEarnings += (poolProfit * 80) / 100; // 80% para creador
            } else {
                payout = pos.amount - loss;
                totalPoolBalance += loss;
                creatorEarnings += (loss * 80) / 100;
            }
        }
        
        if (payout > 0) {
            require(
                numaToken.transfer(msg.sender, payout),
                "Transfer failed"
            );
        }
        
        emit PositionClosed(positionId, pnl);
    }
    
    function calculatePnL(uint256 positionId, uint256 currentPrice) public view returns (int256) {
        Position memory pos = positions[positionId];
        
        int256 priceChange;
        if (pos.isLong) {
            priceChange = int256(currentPrice) - int256(pos.entryPrice);
        } else {
            priceChange = int256(pos.entryPrice) - int256(currentPrice);
        }
        
        int256 pnlPercentage = (priceChange * 100 * int256(pos.leverage)) / int256(pos.entryPrice);
        int256 pnl = (int256(pos.amount) * pnlPercentage) / 100;
        
        return pnl;
    }
    
    function withdrawCreatorEarnings() external onlyOwner {
        uint256 amount = creatorEarnings;
        creatorEarnings = 0;
        
        require(
            numaToken.transfer(owner(), amount),
            "Transfer failed"
        );
    }
    
    function fundPool(uint256 amount) external {
        require(
            numaToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        totalPoolBalance += amount;
    }
}
```

#### PioneerVault.sol (Sistema de Pioneros)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PioneerVault is Ownable {
    struct Pioneer {
        address wallet;
        uint256 capitalLocked;
        uint256 lockedUntil;
        uint256 earningsAccumulated;
        uint256 lastPaymentTimestamp;
        bool hasActiveLoan;
        uint256 rank;
    }
    
    mapping(address => Pioneer) public pioneers;
    address[] public pioneerList;
    
    uint256 public constant MAX_PIONEERS = 100;
    uint256 public constant LOCK_PERIOD = 365 days;
    uint256 public constant EARNINGS_SHARE = 5; // 5%
    uint256 public constant PAYMENT_INTERVAL = 15 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 20; // 20%
    
    uint256 public totalEarningsPool;
    
    event PioneerJoined(address indexed pioneer, uint256 capitalLocked, uint256 rank);
    event EarningsDistributed(uint256 totalAmount);
    event EarlyWithdrawal(address indexed pioneer, uint256 penalty);
    
    constructor() Ownable(msg.sender) {}
    
    function joinPioneers() external payable {
        require(msg.value > 0, "Must lock capital");
        require(pioneers[msg.sender].capitalLocked == 0, "Already a pioneer");
        
        pioneers[msg.sender] = Pioneer({
            wallet: msg.sender,
            capitalLocked: msg.value,
            lockedUntil: block.timestamp + LOCK_PERIOD,
            earningsAccumulated: 0,
            lastPaymentTimestamp: block.timestamp,
            hasActiveLoan: false,
            rank: 0
        });
        
        pioneerList.push(msg.sender);
        updateRankings();
        
        // Verificar límite de 100 pioneros
        if (pioneerList.length > MAX_PIONEERS) {
            // Expulsar al último
            address lastPioneer = pioneerList[pioneerList.length - 1];
            uint256 returnAmount = pioneers[lastPioneer].capitalLocked;
            delete pioneers[lastPioneer];
            pioneerList.pop();
            
            payable(lastPioneer).transfer(returnAmount);
        }
        
        emit PioneerJoined(msg.sender, msg.value, pioneers[msg.sender].rank);
    }
    
    function updateRankings() internal {
        // Ordenar pioneros por capital bloqueado (simple bubble sort)
        for (uint i = 0; i < pioneerList.length; i++) {
            for (uint j = i + 1; j < pioneerList.length; j++) {
                if (pioneers[pioneerList[j]].capitalLocked > pioneers[pioneerList[i]].capitalLocked) {
                    address temp = pioneerList[i];
                    pioneerList[i] = pioneerList[j];
                    pioneerList[j] = temp;
                }
            }
        }
        
        // Actualizar ranks
        for (uint i = 0; i < pioneerList.length; i++) {
            pioneers[pioneerList[i]].rank = i + 1;
        }
    }
    
    function distributeEarnings() external onlyOwner {
        uint256 amountPerPioneer = (totalEarningsPool * EARNINGS_SHARE) / (100 * pioneerList.length);
        
        for (uint i = 0; i < pioneerList.length; i++) {
            Pioneer storage pioneer = pioneers[pioneerList[i]];
            
            if (block.timestamp >= pioneer.lastPaymentTimestamp + PAYMENT_INTERVAL) {
                pioneer.earningsAccumulated += amountPerPioneer;
                pioneer.lastPaymentTimestamp = block.timestamp;
            }
        }
        
        emit EarningsDistributed(totalEarningsPool * EARNINGS_SHARE / 100);
    }
    
    function withdrawEarnings() external {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.earningsAccumulated > 0, "No earnings");
        
        uint256 amount = pioneer.earningsAccumulated;
        pioneer.earningsAccumulated = 0;
        
        payable(msg.sender).transfer(amount);
    }
    
    function withdrawEarly() external {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.capitalLocked > 0, "Not a pioneer");
        require(block.timestamp < pioneer.lockedUntil, "Lock period ended");
        require(!pioneer.hasActiveLoan, "Has active loan");
        
        uint256 penalty = (pioneer.capitalLocked * EARLY_WITHDRAWAL_PENALTY) / 100;
        uint256 returnAmount = pioneer.capitalLocked - penalty;
        
        uint256 capital = pioneer.capitalLocked;
        delete pioneers[msg.sender];
        
        // Remover de lista
        for (uint i = 0; i < pioneerList.length; i++) {
            if (pioneerList[i] == msg.sender) {
                pioneerList[i] = pioneerList[pioneerList.length - 1];
                pioneerList.pop();
                break;
            }
        }
        
        updateRankings();
        
        payable(owner()).transfer(penalty);
        payable(msg.sender).transfer(returnAmount);
        
        emit EarlyWithdrawal(msg.sender, penalty);
    }
    
    function withdrawAfterLockPeriod() external {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.capitalLocked > 0, "Not a pioneer");
        require(block.timestamp >= pioneer.lockedUntil, "Still locked");
        require(!pioneer.hasActiveLoan, "Has active loan");
        
        uint256 amount = pioneer.capitalLocked + pioneer.earningsAccumulated;
        delete pioneers[msg.sender];
        
        // Remover de lista
        for (uint i = 0; i < pioneerList.length; i++) {
            if (pioneerList[i] == msg.sender) {
                pioneerList[i] = pioneerList[pioneerList.length - 1];
                pioneerList.pop();
                break;
            }
        }
        
        updateRankings();
        
        payable(msg.sender).transfer(amount);
    }
    
    function fundEarningsPool() external payable {
        totalEarningsPool += msg.value;
    }
    
    function getPioneerList() external view returns (address[] memory) {
        return pioneerList;
    }
}
```

---

### Día 5-6: Deployment y Testing

#### hardhat.config.ts
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    worldchain: {
      url: `https://worldchain-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 480,
    },
    "worldchain-sepolia": {
      url: `https://worldchain-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 4801,
    },
  },
  etherscan: {
    apiKey: {
      worldchain: process.env.ETHERSCAN_API_KEY!,
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://worldchain-mainnet.explorer.alchemy.com/api",
          browserURL: "https://worldchain-mainnet.explorer.alchemy.com",
        },
      },
    ],
  },
};

export default config;
```

#### Deploy Script
```bash
# Deploy a testnet primero
npx hardhat run scripts/deploy.ts --network worldchain-sepolia

# Verificar contratos
npx hardhat verify --network worldchain-sepolia DEPLOYED_ADDRESS

# Deploy a mainnet (cuando esté listo)
npx hardhat run scripts/deploy.ts --network worldchain
```

---

### Día 7-8: Integración Frontend + Blockchain

#### Instalar Wagmi + Viem
```bash
npm install wagmi viem@2.x @tanstack/react-query
```

#### lib/wagmi.ts
```typescript
import { createConfig, http } from 'wagmi'
import { worldchain, worldchainSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [worldchain, worldchainSepolia],
  transports: {
    [worldchain.id]: http(`https://worldchain-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    [worldchainSepolia.id]: http(`https://worldchain-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
  },
})
```

#### Actualizar app/layout.tsx
```typescript
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

---

### Día 9-10: Testing y Auditoría

#### Tests de Contratos
```bash
npx hardhat test
npx hardhat coverage
```

#### Auditoría (Recomendado antes de mainnet)
Opciones:
- **CertiK** (~$5k-10k) - Top tier
- **OpenZeppelin** (~$3k-8k) - Confiable
- **Hacken** (~$2k-5k) - Económico
- **Slither** (gratis) - Herramienta automatizada

```bash
# Auditoría automatizada con Slither
pip3 install slither-analyzer
slither contracts/
```

---

## 💰 Costos Estimados

| Concepto | Costo |
|----------|-------|
| **Hosting (Vercel)** | $0 (plan gratuito) |
| **DB (Vercel Postgres)** | $0 (hasta 256MB) |
| **Alchemy RPC** | $0 (hasta 300M compute units/mes) |
| **Deploy Contratos (testnet)** | $0 (testnet WLD gratis) |
| **Deploy Contratos (mainnet)** | ~$50-100 (gas fees) |
| **Auditoría (opcional)** | $2k-10k |
| **TOTAL para MVP** | **$50-100** |

---

## ⚡ Ventajas del Enfoque Híbrido

1. **Velocidad UX:** DB responde en 50ms, blockchain en 3-15s
2. **Seguridad:** Dinero real protegido on-chain
3. **Escalabilidad:** DB maneja millones de usuarios
4. **Costos:** Solo pagas gas en operaciones críticas
5. **Confianza:** Todo auditable en blockchain explorer

---

## 🎯 ¿Listo para Empezar?

Cuando termine la instalación de Node.js (está en progreso), ejecuta:

```bash
# Verificar Node.js
node --version  # Debe mostrar v20.x.x

# Instalar dependencias blockchain
npm install @openzeppelin/contracts hardhat @nomicfoundation/hardhat-toolbox

# Inicializar Hardhat
npx hardhat init
```

¿Te parece bien este plan híbrido? Es el mejor balance entre velocidad de desarrollo y seguridad máxima. 🚀
