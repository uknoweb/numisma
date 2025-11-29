# 🏆 Pioneer Vault - Estado del Deployment

## 📊 Información del Contrato

**Dirección del Contrato:** `0xAda711D20cfb0f34bAcDdeEA148f12a6D10e63Dd`

**Red:** World Chain Sepolia (Chain ID: 4801)

**Deployer:** `0xC570167Cf09D4f001d07786ee66da35909709370`

**Block de Deployment:** (Ver deployment-pioneer-vault.json)

**Fecha de Deployment:** (Ver deployment-pioneer-vault.json)

---

## 🎯 Características Principales

### Reglas del Vault

- **Max Pioneers:** 100 usuarios máximo
- **Capital:** Depositado en tokens NUMA (ERC-20)
- **Lock Period:** 1 año (365 días) desde el depósito
- **Profit Share:** 5% de las ganancias del pool de trading
- **Early Withdrawal Penalty:** 20% de penalización

### Funcionalidades

1. **Deposit Capital** ✅
   - Depositar NUMA para convertirse en Pioneer
   - Sistema de ranking automático por capital
   - Top 100 holders son admitidos
   - Si alguien deposita más y hay 100+ pioneers, el #101 es expulsado

2. **Withdraw Capital** ✅
   - Antes de 1 año: penalización del 20%
   - Después de 1 año: sin penalización
   - Retiro parcial actualiza ranking
   - Retiro total sale del vault

3. **Claim Profits** ✅
   - Reclamar profits acumulados en cualquier momento
   - Distribución proporcional según capital locked
   - 5% de las ganancias del pool

4. **Rankings** ✅
   - Ordenamiento automático por capital
   - Top 100 activos en todo momento
   - Vista pública de leaderboard

---

## 🔗 Integraciones

### Contratos Relacionados

- **NUMA Token:** `0xa57917BC4568B9e392869AbAc504fEe746e7bede`
- **Trading Pool V2:** `0x73387224339C83eB19b0389BA3Aa33C37944ff72`

### Flujo de Profits

```
Trading Pool (genera profits)
    ↓
distributeProfits() llamado por owner/pool
    ↓
Pioneer Vault recibe 5% de profits
    ↓
Distribución proporcional a cada pioneer según su capital
    ↓
Pioneers reclaman con claimProfits()
```

---

## 📝 Funciones del Smart Contract

### Lectura (View)

```solidity
function getRanking(address pioneer) external view returns (uint256)
function getPioneerInfo(address pioneer) external view returns (...)
function getTopPioneers(uint256 n) external view returns (...)
function getStats() external view returns (...)
```

### Escritura (State-Changing)

```solidity
function depositCapital(uint256 amount) external
function withdrawCapital(uint256 amount) external
function claimProfits() external
function distributeProfits(uint256 amount) external  // Solo pool/owner
function setTradingPool(address newPool) external    // Solo owner
```

---

## 🎨 Frontend Integration

### Hooks Creados

**Archivo:** `hooks/usePioneerVault.ts`

**Hooks de Lectura:**
- `usePioneerInfo(address)` - Info completa del pioneer
- `usePioneerRanking(address)` - Ranking actual
- `useTopPioneers(count)` - Top N pioneers
- `useVaultStats()` - Estadísticas generales
- `useVaultConstants()` - Constantes del contrato

**Hooks de Escritura:**
- `useDepositCapital()` - Depositar NUMA
- `useWithdrawCapital()` - Retirar capital
- `useClaimProfits()` - Reclamar profits

**Helpers:**
- `formatPioneerInfo(data)` - Formatear info de pioneer
- `formatVaultStats(data)` - Formatear stats del vault
- `formatTopPioneers(data)` - Formatear leaderboard

### Componente Creado

**Archivo:** `components/PioneerVaultSection.tsx`

**Características:**
- Panel de stats generales (4 cards)
- Panel del usuario (status de pioneer)
- Deposit/Withdraw flows con approve
- Claim profits button
- Top 10 leaderboard con highlight del usuario
- Indicadores visuales de lock status
- Warnings de penalización

---

## 🚀 Siguientes Pasos

### 1. Integrar en Dashboard ⏳
- [ ] Agregar PioneerVaultSection a página principal
- [ ] Crear tab/sección dedicada para pioneers
- [ ] Agregar navegación al vault

### 2. Pool Integration ⏳
- [ ] Modificar Pool V2 para distribuir 5% de profits al vault
- [ ] Agregar función `distributeProfitsToVault()` en Pool
- [ ] Automatizar distribución cada X tiempo

### 3. Testing ⏳
- [ ] Depositar capital de varios usuarios
- [ ] Verificar rankings correctos
- [ ] Simular distribución de profits
- [ ] Probar early withdrawal con penalty
- [ ] Verificar withdrawal después de 1 año

---

## 📊 Estado Actual

✅ Smart Contract desplegado
✅ ABI extraído
✅ Hooks de frontend creados
✅ Componente UI creado
✅ Scripts de deployment
✅ Documentación completa

⏳ Pendiente:
- Integración con Pool para distribución automática
- Agregar al dashboard principal
- Testing end-to-end

---

## 🔍 Comandos Útiles

### Deployment
```bash
npm run deploy:vault
```

### Verificación en Etherscan
```bash
npx hardhat verify --network worldchain-sepolia \
  0xAda711D20cfb0f34bAcDdeEA148f12a6D10e63Dd \
  "0xa57917BC4568B9e392869AbAc504fEe746e7bede" \
  "0x73387224339C83eB19b0389BA3Aa33C37944ff72"
```

### Compilar
```bash
npx hardhat compile
```

---

## 💡 Notas Importantes

1. **Capital Mínimo:** Se actualiza automáticamente al capital del pioneer #100
2. **Expulsión:** Si hay >100 pioneers, el #101 es expulsado automáticamente
3. **Rankings:** Se recalculan en cada deposit/withdraw
4. **Profits:** Distribución manual por owner/pool (puede automatizarse)
5. **Lock Period:** Cuenta desde el primer depósito individual
6. **Partial Withdrawals:** Permitidos, actualizan ranking

---

## 🎯 Ejemplo de Uso

```typescript
// Usuario deposita 10,000 NUMA
const { deposit } = useDepositCapital();
deposit(parseUnits("10000", 18));

// Verificar ranking
const { data: ranking } = usePioneerRanking(address);
console.log("Ranking:", ranking); // Ej: 5

// Reclamar profits después de distribución
const { claim } = useClaimProfits();
claim();

// Retirar capital después de 1 año
const { withdraw } = useWithdrawCapital();
withdraw(parseUnits("5000", 18)); // Sin penalización
```

---

**Última actualización:** [Fecha actual]
**Versión:** 1.0.0
**Status:** ✅ Deployed & Ready
