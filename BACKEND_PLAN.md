# Plan de Integración Backend - Numisma

## 🎯 Objetivo
Conectar el frontend de Numisma con Smart Contracts en World Chain y servicios de backend para funcionalidad completa.

---

## 1️⃣ Fase 1: Configuración de Infraestructura

### 1.1 World Chain Setup
```bash
# Instalar dependencias
npm install @worldcoin/idkit viem@2.x wagmi@2.x @tanstack/react-query
```

**Configuración RPC:**
- Network: World Chain (Superchain L2)
- RPC URL: `https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- Chain ID: 480 (mainnet) o 4801 (testnet Sepolia)
- Block Explorer: `https://worldchain-mainnet.explorer.alchemy.com/`

### 1.2 Alchemy Setup
1. Crear cuenta en [Alchemy](https://alchemy.com)
2. Crear app para World Chain
3. Copiar API Key
4. Configurar en `.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WORLD_APP_ID=your_world_app_id
NEXT_PUBLIC_WORLD_ACTION_ID=your_action_id
```

### 1.3 Wallet Connection
```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { worldchain } from 'wagmi/chains'

export const config = createConfig({
  chains: [worldchain],
  transports: {
    [worldchain.id]: http(`https://worldchain-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
  }
})
```

---

## 2️⃣ Fase 2: Smart Contracts

### 2.1 Contratos a Desarrollar

#### NumismaToken.sol (ERC-20)
```solidity
// Token NUMA con funciones especiales
contract NumismaToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant NUMA_TO_WLD_RATE = 1000; // 1 WLD = 1000 NUMA
    
    mapping(address => uint256) public lastClaim;
    mapping(address => MembershipTier) public membershipTiers;
    
    function claimDailyReward() external;
    function swapNumaToWld(uint256 numaAmount) external;
    function upgradeMembership(MembershipTier tier) external payable;
}
```

#### TradingPool.sol
```solidity
// Pool de riesgo para posiciones de trading
contract TradingPool is Ownable {
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
    uint256 public creatorEarnings; // 80% de ganancias netas
    
    function openPosition(bool isLong, uint256 amount, uint256 leverage) external returns (uint256);
    function closePosition(uint256 positionId) external;
    function calculatePnL(uint256 positionId, uint256 currentPrice) public view returns (int256);
    function withdrawCreatorEarnings() external onlyOwner;
}
```

#### PioneerVault.sol
```solidity
// Sistema de Pioneros con vesting y préstamos
contract PioneerVault is Ownable {
    struct Pioneer {
        address wallet;
        uint256 capitalLocked;
        uint256 lockedUntil;
        uint256 earningsAccumulated;
        uint256 lastPaymentTimestamp;
        bool hasActiveLoan;
    }
    
    Pioneer[] public pioneers;
    mapping(address => uint256) public pioneerIndex;
    
    uint256 public constant MAX_PIONEERS = 100;
    uint256 public constant LOCK_PERIOD = 365 days;
    uint256 public constant EARNINGS_SHARE = 5; // 5%
    uint256 public constant PAYMENT_INTERVAL = 15 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 20; // 20%
    
    function joinPioneers(uint256 wldAmount) external;
    function withdrawEarly() external;
    function distributeEarnings() external;
    function getRanking() external view returns (Pioneer[] memory);
}
```

#### LoanManager.sol
```solidity
// Préstamos garantizados para Pioneros
contract LoanManager {
    struct Loan {
        address borrower;
        uint256 collateral;
        uint256 borrowed; // 90% del colateral
        uint256 fee; // 5% del colateral
        uint256 issuedAt;
        uint256 dueDate;
        bool isActive;
    }
    
    mapping(address => Loan) public loans;
    
    uint256 public constant LOAN_PERCENTAGE = 90;
    uint256 public constant FEE_PERCENTAGE = 5;
    uint256 public constant MARGIN_PROTECTION = 10;
    
    function requestLoan(uint256 collateralAmount) external returns (uint256);
    function repayLoan() external payable;
    function liquidateLoan(address borrower) external;
}
```

#### StakingRewards.sol
```solidity
// Distribución de recompensas diarias
contract StakingRewards {
    struct RewardConfig {
        uint256 initialReward;
        uint256 reducedReward;
        uint256 reductionThreshold; // 90 días
    }
    
    mapping(uint8 => RewardConfig) public tierRewards;
    mapping(address => uint256) public lastClaimTimestamp;
    mapping(address => uint256) public membershipStartDate;
    
    function claimReward() external;
    function getCurrentReward(address user) public view returns (uint256);
}
```

### 2.2 Deployment Script
```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  
  // 1. Deploy NUMA Token
  const NumismaToken = await ethers.getContractFactory("NumismaToken");
  const numaToken = await NumismaToken.deploy();
  await numaToken.waitForDeployment();
  console.log("NUMA Token deployed to:", await numaToken.getAddress());
  
  // 2. Deploy Trading Pool
  const TradingPool = await ethers.getContractFactory("TradingPool");
  const tradingPool = await TradingPool.deploy(await numaToken.getAddress());
  await tradingPool.waitForDeployment();
  console.log("Trading Pool deployed to:", await tradingPool.getAddress());
  
  // 3. Deploy Pioneer Vault
  const PioneerVault = await ethers.getContractFactory("PioneerVault");
  const pioneerVault = await PioneerVault.deploy();
  await pioneerVault.waitForDeployment();
  console.log("Pioneer Vault deployed to:", await pioneerVault.getAddress());
  
  // 4. Deploy Loan Manager
  const LoanManager = await ethers.getContractFactory("LoanManager");
  const loanManager = await LoanManager.deploy(await pioneerVault.getAddress());
  await loanManager.waitForDeployment();
  console.log("Loan Manager deployed to:", await loanManager.getAddress());
  
  // 5. Deploy Staking Rewards
  const StakingRewards = await ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(await numaToken.getAddress());
  await stakingRewards.waitForDeployment();
  console.log("Staking Rewards deployed to:", await stakingRewards.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 3️⃣ Fase 3: API Routes de Next.js

### 3.1 Estructura de API
```
app/api/
├── auth/
│   └── verify-world-id/
│       └── route.ts
├── trading/
│   ├── open-position/
│   │   └── route.ts
│   ├── close-position/
│   │   └── route.ts
│   └── positions/
│       └── route.ts
├── staking/
│   ├── claim/
│   │   └── route.ts
│   └── swap/
│       └── route.ts
├── membership/
│   └── upgrade/
│       └── route.ts
└── pioneer/
    ├── join/
    │   └── route.ts
    ├── ranking/
    │   └── route.ts
    └── loan/
        └── route.ts
```

### 3.2 Ejemplo: Verificación World ID
```typescript
// app/api/auth/verify-world-id/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof } from '@worldcoin/idkit';

export async function POST(req: NextRequest) {
  const { proof, merkle_root, nullifier_hash, verification_level } = await req.json();
  
  try {
    const verifyRes = await verifyCloudProof(
      proof,
      process.env.NEXT_PUBLIC_WORLD_APP_ID!,
      process.env.NEXT_PUBLIC_WORLD_ACTION_ID!,
      verification_level
    );
    
    if (verifyRes.success) {
      // Crear/actualizar usuario en DB
      // Generar JWT token
      return NextResponse.json({ 
        verified: true,
        userId: nullifier_hash // Usar como ID único
      });
    } else {
      return NextResponse.json({ verified: false }, { status: 400 });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
```

### 3.3 Ejemplo: Abrir Posición
```typescript
// app/api/trading/open-position/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import TradingPoolABI from '@/contracts/TradingPool.json';

export async function POST(req: NextRequest) {
  const { userId, isLong, amount, leverage } = await req.json();
  
  // Verificar autenticación (JWT)
  // ...
  
  try {
    const client = createPublicClient({
      chain: worldchain,
      transport: http(`https://worldchain-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
    });
    
    // Interactuar con Smart Contract
    const txHash = await client.writeContract({
      address: process.env.TRADING_POOL_ADDRESS as `0x${string}`,
      abi: TradingPoolABI,
      functionName: 'openPosition',
      args: [isLong, amount, leverage]
    });
    
    return NextResponse.json({ 
      success: true,
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Position opening error:', error);
    return NextResponse.json({ error: 'Failed to open position' }, { status: 500 });
  }
}
```

---

## 4️⃣ Fase 4: Base de Datos (Opcional)

### 4.1 PostgreSQL con Prisma
```bash
npm install prisma @prisma/client
npx prisma init
```

### 4.2 Schema Prisma
```prisma
// prisma/schema.prisma
model User {
  id                String       @id @default(cuid())
  worldId           String       @unique
  walletAddress     String       @unique
  balanceNuma       Float        @default(1000)
  balanceWld        Float        @default(10)
  membershipTier    MembershipTier @default(FREE)
  membershipExpires DateTime?
  createdAt         DateTime     @default(now())
  positions         Position[]
  pioneerProfile    Pioneer?
}

model Position {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  symbol       String
  type         PositionType
  entryPrice   Float
  amount       Float
  leverage     Int
  pnl          Float    @default(0)
  status       PositionStatus @default(OPEN)
  openedAt     DateTime @default(now())
  closedAt     DateTime?
}

model Pioneer {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  capitalLocked       Float
  rank                Int
  earningsAccumulated Float    @default(0)
  lockedUntil         DateTime
  hasActiveLoan       Boolean  @default(false)
}

enum MembershipTier {
  FREE
  PLUS
  VIP
}

enum PositionType {
  LONG
  SHORT
}

enum PositionStatus {
  OPEN
  CLOSED
}
```

---

## 5️⃣ Fase 5: Integración Frontend

### 5.1 Actualizar WorldIdVerification.tsx
```typescript
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';

const handleVerify = async (proof: any) => {
  const res = await fetch('/api/auth/verify-world-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proof),
  });
  
  const data = await res.json();
  if (data.verified) {
    setUser(data.user);
    setWorldIdVerified(true);
  }
};

return (
  <IDKitWidget
    app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID!}
    action={process.env.NEXT_PUBLIC_WORLD_ACTION_ID!}
    verification_level={VerificationLevel.Orb}
    handleVerify={handleVerify}
    onSuccess={() => console.log('Verified!')}
  >
    {({ open }) => <Button onClick={open}>Verificar con World ID</Button>}
  </IDKitWidget>
);
```

### 5.2 Hooks para Smart Contracts
```typescript
// hooks/useTrading.ts
import { useContractWrite } from 'wagmi';
import TradingPoolABI from '@/contracts/TradingPool.json';

export function useOpenPosition() {
  const { write, isLoading, isSuccess } = useContractWrite({
    address: process.env.NEXT_PUBLIC_TRADING_POOL_ADDRESS,
    abi: TradingPoolABI,
    functionName: 'openPosition',
  });
  
  return { openPosition: write, isLoading, isSuccess };
}
```

---

## 6️⃣ Timeline Estimado

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Configuración World Chain + Alchemy | 1-2 días | Alta |
| Desarrollo Smart Contracts | 5-7 días | Alta |
| Testing + Auditoría de contratos | 3-5 días | Crítica |
| Deployment a testnet | 1 día | Alta |
| API Routes + Backend Logic | 3-4 días | Alta |
| Integración Frontend | 2-3 días | Alta |
| Testing End-to-End | 2-3 días | Alta |
| Deployment a mainnet | 1 día | Alta |

**Total estimado: 18-26 días de desarrollo**

---

## 7️⃣ Consideraciones de Seguridad

### Smart Contracts
- ✅ Auditoría externa obligatoria antes de mainnet
- ✅ Implementar pausable/emergency stop
- ✅ Rate limiting en funciones críticas
- ✅ Reentrancy guards
- ✅ SafeMath para operaciones aritméticas

### Backend
- ✅ Validación de World ID proofs en servidor
- ✅ JWT con expiración corta (1h)
- ✅ Rate limiting en API routes
- ✅ Sanitización de inputs
- ✅ HTTPS obligatorio

### Frontend
- ✅ Nunca exponer private keys
- ✅ Validación de datos antes de enviar a blockchain
- ✅ Mensajes claros de confirmación de transacciones
- ✅ Manejo de errores de red

---

## 📚 Recursos Adicionales

- [World ID Docs](https://docs.worldcoin.org/)
- [World Chain Docs](https://docs.worldchain.org/)
- [Alchemy World Chain](https://docs.alchemy.com/docs/world-chain)
- [Viem Docs](https://viem.sh/)
- [Wagmi Docs](https://wagmi.sh/)
- [Hardhat Docs](https://hardhat.org/)

---

**Siguiente paso:** Configurar cuenta de Alchemy y crear app de World Chain para obtener API keys.
