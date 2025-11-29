# Estado del Proyecto Numisma - Pool V2 con Tokens
*Última actualización: 29 Nov 2024*

## ✅ Completado

### 1. Smart Contracts Deployados
| Contrato | Address | Estado |
|----------|---------|--------|
| NumismaToken | `0xa57917BC4568B9e392869AbAc504fEe746e7bede` | ✅ Deployed & Distributed |
| MockWLD | `0x25f36A04387aA3E68d8eD41Cd4478BEd7422A9f4` | ✅ Deployed (10B supply) |
| PoolCentinelaRegeneracionV2 | `0x737bAD06542F26995a126801274561b0499B2c97` | ✅ Deployed & Funded |

### 2. Tokenomics NUMA (1B total supply)
- ✅ **Trading Pool**: 400M NUMA (40%) → `0xED888019...` (Pool V1)
- ✅ **Staking Rewards**: 300M NUMA (30%)
- ✅ **Pioneer Vault**: 100M NUMA (10%)
- ✅ **Team Vesting**: 100M NUMA (10%)
- ✅ **Treasury**: 100M NUMA (10%)

### 3. Pool V2 Liquidity
- ✅ **NUMA**: 50,000,000 tokens
- ✅ **WLD**: 1,000,000 tokens
- ✅ Ratio funcional para testing

### 4. Arquitectura Pool V2
```solidity
// Reemplaza internal balances con tokens reales
IERC20 public numaToken;
IERC20 public wldToken;

// Balances de traders en el pool
mapping(address => uint256) public traderBalanceNUMA;
mapping(address => uint256) public traderBalanceWLD;

// Liquidez del pool
uint256 public poolBalanceNUMA;
uint256 public poolBalanceWLD;
```

**Nuevas funciones:**
- ✅ `depositNUMA(amount)` - Trader deposita NUMA
- ✅ `depositWLD(amount)` - Trader deposita WLD
- ✅ `withdrawNUMA(amount)` - Trader retira NUMA
- ✅ `withdrawWLD(amount)` - Trader retira WLD
- ✅ `fundPoolNUMA(amount)` - Owner añade liquidez NUMA
- ✅ `fundPoolWLD(amount)` - Owner añade liquidez WLD
- ✅ Profit/Loss usa transferencias reales de tokens

### 5. Frontend Hooks Creados
| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useNUMABalance()` | `hooks/useTokens.ts` | Balance de NUMA del usuario |
| `useWLDBalance()` | `hooks/useTokens.ts` | Balance de WLD del usuario |
| `useApproveNUMA()` | `hooks/useTokens.ts` | Aprobar NUMA al pool |
| `useApproveWLD()` | `hooks/useTokens.ts` | Aprobar WLD al pool |
| `useDepositNUMA()` | `hooks/usePoolDeposits.ts` | Depositar NUMA en pool |
| `useDepositWLD()` | `hooks/usePoolDeposits.ts` | Depositar WLD en pool |
| `useWithdrawNUMA()` | `hooks/usePoolDeposits.ts` | Retirar NUMA del pool |
| `useWithdrawWLD()` | `hooks/usePoolDeposits.ts` | Retirar WLD del pool |
| `useTraderBalanceNUMA()` | `hooks/usePoolDeposits.ts` | Balance en pool (NUMA) |
| `useTraderBalanceWLD()` | `hooks/usePoolDeposits.ts` | Balance en pool (WLD) |
| `usePoolLiquidity()` | `hooks/usePoolDeposits.ts` | Liquidez total del pool |

### 6. Scripts de Deployment
- ✅ `npm run deploy:numa` - Deploy NumismaToken
- ✅ `npm run deploy:wld` - Deploy MockWLD
- ✅ `npm run deploy:pool-v2` - Deploy Pool V2
- ✅ `npm run distribute:numa` - Distribuir tokenomics
- ✅ `npm run fund:pool` - Fondear pool con WLD
- ✅ Script adicional para fondear NUMA

### 7. Configuración
- ✅ `hardhat.config.js` con `viaIR: true` para compilación
- ✅ `.env.local` actualizado con nuevos addresses
- ✅ `lib/contracts.ts` usa Pool V2 ABI
- ✅ Token addresses exportados

## 🔄 En Progreso

### Migración de Frontend
- ⏳ Actualizar `components/Trading.tsx` para usar deposit/withdraw
- ⏳ Agregar UI para mostrar balances en pool vs wallet
- ⏳ Implementar flujo: Approve → Deposit → Trade → Withdraw
- ⏳ Agregar indicadores de allowance

## ⏳ Pendiente

### Sprint 1 - Sistema de Tokens (75% completo)
- ✅ Deploy NUMA token
- ✅ Deploy Mock WLD
- ✅ Deploy Pool V2 con tokens
- ✅ Fondear pool con liquidez
- ⏳ Actualizar frontend para V2
- ⏳ Testing end-to-end

### Sprint 2 - Membresías
- ⏳ MembershipManager contract
  - Free tier: 5x leverage (gratis)
  - Plus tier: 50x leverage (5 WLD)
  - VIP tier: 500x leverage (15 WLD)
- ⏳ Integración con Pool V2 (verificar membership antes de abrir posición)
- ⏳ UI para comprar membresías

### Sprint 3 - Pioneer Vault
- ⏳ PioneerVault contract
  - Top 100 holders por capital
  - Lock 1 año
  - Ganan 5% profit del pool
  - Penalty 20% por early withdrawal
- ⏳ Ranking system
- ⏳ UI para pioneers

### Sprint 4 - Loan Manager
- ⏳ LoanManager contract
  - Pedir prestado hasta 90% del capital locked
  - Fee 5%
  - Auto-liquidación si no se paga
- ⏳ UI para préstamos

### Sprint 5 - World ID Integration
- ⏳ Verificación World ID para trading
- ⏳ Beneficios para usuarios verificados

## 📊 Métricas Actuales

### Blockchain
- **Network**: World Chain Sepolia (Testnet)
- **Chain ID**: 4801
- **Deployer**: `0xC570167Cf09D4f001d07786ee66da35909709370`
- **ETH Remaining**: ~0.0799 ETH

### Gas Costs (Estimados)
- Deploy NumismaToken: ~0.0002 ETH
- Deploy MockWLD: ~0.0002 ETH
- Deploy Pool V2: ~0.0003 ETH
- Distribute tokens: ~0.0001 ETH
- Fund pool: ~0.0001 ETH cada token

### Tokens Distribuidos
- **Deployer**: 550M NUMA, 9B WLD
- **Pool V2**: 50M NUMA, 1M WLD (liquidity)
- **Pool V1**: 400M NUMA (de distribución)
- **Otros pools**: 300M NUMA (staking), 100M cada uno (pioneer, team, treasury)

## 🔗 Enlaces

### Explorers
- [NUMA Token](https://worldchain-sepolia.explorer.alchemy.com/address/0xa57917BC4568B9e392869AbAc504fEe746e7bede)
- [MockWLD Token](https://worldchain-sepolia.explorer.alchemy.com/address/0x25f36A04387aA3E68d8eD41Cd4478BEd7422A9f4)
- [Pool V2](https://worldchain-sepolia.explorer.alchemy.com/address/0x737bAD06542F26995a126801274561b0499B2c97)

### Transacciones Importantes
- [NUMA Distribution](https://worldchain-sepolia.explorer.alchemy.com/tx/0x0fb322c857a5d69d9edd73f7f8bb4cadb92e1384e735de7fe4cfd2ac725dea9b) - Block 21944511

## 🎯 Próximos Pasos Inmediatos

1. **Actualizar Trading.tsx** 
   - Agregar sección de Wallet Balance vs Pool Balance
   - Implementar Approve + Deposit flow
   - Botones para Withdraw
   
2. **Testing Completo**
   - Deposit NUMA → Open position → Close → Withdraw
   - Verificar P&L con tokens reales
   - Probar con WLD también

3. **Crear MembershipManager**
   - Contract con 3 tiers
   - Function buyMembership(tier)
   - Integration con Pool V2

4. **Documentación**
   - User guide para deposit/withdraw
   - API docs para nuevas funciones
   - Testing guide actualizado

## ⚠️ Notas Importantes

1. **MockWLD es SOLO para testing**
   - En mainnet usar WLD token oficial
   - Tiene función `faucet()` que da 1000 WLD gratis
   - Total supply: 10B WLD

2. **Pool V1 vs Pool V2**
   - V1 (`0xED88...`) usa internal balances
   - V2 (`0x737b...`) usa tokens ERC-20
   - Frontend debe migrar a V2
   - V1 aún tiene 400M NUMA de distribución

3. **Hardhat Configuration**
   - Usa `viaIR: true` para compilar (evita "stack too deep")
   - Node 18.20.8 funciona pero con warnings
   - CommonJS (no ES modules)

4. **Seguridad**
   - Pool V2 usa OpenZeppelin SafeERC20
   - ReentrancyGuard en todas las funciones públicas
   - Owner controls para funding

## 📈 Progreso General

**Total: 58% completo**
- Smart Contracts: 75%
- Frontend Integration: 40%
- Testing: 30%
- Documentation: 60%

---

*Este proyecto sigue la arquitectura definida en PROYECTO_NUMISMA.md*
*Opción A elegida: Complete Smart Contract Ecosystem*
