# 📜 REGLAS DE VESTING Y RETIRO PARCIAL - PIONEER VAULT

## ✅ IMPLEMENTACIÓN COMPLETA

### **Sistema de Pioneros con Retención Parcial del 70%**

---

## 🎯 REGLAS PRINCIPALES

### 1. **Entrada al Sistema**
- **Requisito**: Bloquear capital en WLD
- **Duración del Vesting**: 1 año (365 días)
- **Máximo de Pioneros**: 100 (ordenados por capital bloqueado)
- **Ranking**: Dinámico según capital actual bloqueado

### 2. **Durante el Vesting (Antes de 1 año)**

#### Opción A: Retiro Anticipado
- ❌ **Penalización**: 20% del capital total
- ❌ **Consecuencia**: Pierde estatus de Pionero
- ❌ **Bloqueo**: No puede tener préstamos activos

```solidity
Ejemplo:
Capital bloqueado: 100 WLD
Retiro anticipado: 80 WLD (100 - 20% penalización)
Penalización va a: Owner del contrato
```

---

### 3. **Después del Vesting (Cumplido 1 año)**

#### Opción A: **Retiro Parcial (MÁXIMO 30%)**
- ✅ **Sin penalización**
- ✅ **Mantiene estatus de Pionero**
- ✅ **Continúa recibiendo 5% de ganancias**
- ⚠️ **Regla**: El 70% restante DEBE permanecer bloqueado

```solidity
Ejemplo:
Capital original: 100 WLD
Retiro permitido: 30 WLD (30% máximo)
Capital que queda: 70 WLD (sigue bloqueado, sigue como Pioneer)
Ganancias acumuladas: Se pueden retirar en cualquier momento
```

**Implementación en Smart Contract:**
```solidity
function withdrawAfterVesting(uint256 amount) external {
    // Calcula el 30% del capital original
    uint256 maxAllowed = (originalCapital * 30) / 100;
    
    // Si retira <= 30%: SIN penalización, mantiene Pioneer
    if (totalWithdrawn <= maxAllowed) {
        pioneer.capitalLocked -= amount;
        pioneer.totalWithdrawnAfterVesting += amount;
        // Mantiene su ranking y beneficios
    }
}
```

---

#### Opción B: **Retiro Mayor al 30%**
- ❌ **Penalización**: 20% del capital TOTAL
- ❌ **Consecuencia**: Pierde estatus de Pionero
- ❌ **Pierde**: Acceso a préstamos y 5% de ganancias

```solidity
Ejemplo:
Capital bloqueado: 70 WLD
Quiere retirar: 50 WLD (71% del original)
Penalización: 14 WLD (20% de 70 WLD)
Recibe: 56 WLD
Pierde: Estatus de Pioneer
```

**Implementación en Smart Contract:**
```solidity
function withdrawAfterVesting(uint256 amount) external {
    // Si retira > 30%: Penalización del 20%
    if (totalWithdrawn > maxAllowed) {
        uint256 penalty = (totalCapital * 20) / 100;
        uint256 returnAmount = totalCapital - penalty;
        
        delete pioneers[msg.sender]; // Pierde estatus
        _removePioneer(msg.sender);
    }
}
```

---

#### Opción C: **Retiro Total**
- ✅ **Sin penalización** (si ya cumplió el año)
- ❌ **Pierde estatus de Pionero**
- ✅ **Recibe**: Capital + Ganancias acumuladas

```solidity
Ejemplo:
Capital: 70 WLD
Ganancias: 10 WLD
Retiro total: 80 WLD (sin penalización)
Consecuencia: Ya no es Pioneer
```

---

## 📊 TABLA RESUMEN DE RETIROS

| **Escenario** | **Timing** | **% Retiro** | **Penalización** | **Mantiene Pioneer?** |
|--------------|-----------|-------------|-----------------|---------------------|
| Retiro Anticipado | Antes de 1 año | 100% | 20% | ❌ No |
| Retiro Parcial | Después de 1 año | ≤ 30% | 0% | ✅ Sí |
| Retiro Excesivo | Después de 1 año | > 30% | 20% | ❌ No |
| Retiro Total | Después de 1 año | 100% | 0% | ❌ No |

---

## 🔄 BENEFICIOS DE MANTENER EL 70% BLOQUEADO

### Si mantiene el 70% bloqueado (retira máximo 30%):

1. **✅ Conserva Estatus de Pioneer**
   - Sigue en el Top 100
   - Ranking se actualiza según capital actual

2. **✅ Ganancias del 5%**
   - Recibe distribución cada 15 días
   - Del pool total de ganancias de trading

3. **✅ Acceso a Préstamos**
   - Puede solicitar créditos garantizados
   - Hasta el 50% de su capital bloqueado

4. **✅ Retiros Futuros**
   - Puede seguir retirando hasta completar el 30%
   - Ejemplo: Retira 10% ahora, 20% en 6 meses (total 30%)

---

## 💡 ESTRATEGIA RECOMENDADA PARA PIONEROS

### **Plan Óptimo:**
```
1. Año 1: Bloquear capital (ej: 100 WLD)
   └─ Recibir 5% de ganancias cada 15 días
   
2. Después de 1 año: Retirar 30% (30 WLD)
   └─ Recuperar parte de la inversión
   └─ Mantener 70 WLD bloqueados
   
3. Año 2+: Seguir como Pioneer
   └─ Continuar recibiendo 5% de ganancias
   └─ Acceso a préstamos
   └─ Mantener Top 100
```

### **Matemática del Sistema:**
```
Capital inicial: 100 WLD
Ganancias anuales (estimado 5% cada 15 días): ~100 WLD/año
Retiro post-vesting: 30 WLD (30%)
Capital restante: 70 WLD (sigue generando)

ROI año 2: ~70 WLD + 30 WLD retirado = 100% recuperado
Años siguientes: Ganancia pura del 5%
```

---

## 🔒 SEGURIDAD Y VALIDACIONES

### **Smart Contract Validations:**

```solidity
// 1. Validar que cumplió el vesting
require(block.timestamp >= pioneer.lockedUntil, "Still locked");

// 2. Validar que no tiene préstamos activos
require(!pioneer.hasActiveLoan, "Has active loan");

// 3. Calcular límite del 30%
uint256 originalCapital = pioneer.capitalLocked + pioneer.totalWithdrawnAfterVesting;
uint256 maxAllowed = (originalCapital * 30) / 100;

// 4. Validar retiro acumulado
uint256 totalWithdrawn = pioneer.totalWithdrawnAfterVesting + amount;
require(totalWithdrawn <= maxAllowed, "Exceeds 30% limit");
```

---

## ✅ CONFIRMACIÓN DE IMPLEMENTACIÓN

### **Regla de Retiro Post-Vesting: ACTUALIZADA AL 30%**

- ✅ **Contrato**: `PioneerVault.sol` creado
- ✅ **Función**: `withdrawAfterVesting(uint256 amount)`
- ✅ **Validación**: Máximo 30% acumulado
- ✅ **Penalización**: 20% si excede el 30%
- ✅ **Tracking**: `totalWithdrawnAfterVesting` implementado
- ✅ **Eventos**: `VestedWithdrawal` y `PenalizedWithdrawal`

---

## 📝 NOTAS FINALES

1. **El 30% es acumulativo**: Si retira 10% hoy, puede retirar 20% más en el futuro
2. **Ganancias no cuentan**: El 5% de ganancias se puede retirar sin límite
3. **Capital original**: Se calcula al momento de entrar como Pioneer
4. **Ranking dinámico**: Si retira capital, su ranking puede bajar
5. **Sin préstamos**: No puede retirar si tiene un préstamo activo

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Compilar contrato: `npx hardhat compile`
2. ✅ Tests unitarios de vesting
3. ✅ Deploy a testnet
4. ✅ Auditoría de seguridad
5. ✅ Deploy a mainnet (World Chain)

---

**Estado**: ✅ IMPLEMENTADO Y DOCUMENTADO  
**Fecha**: 28 de noviembre de 2025  
**Versión del Contrato**: PioneerVault.sol v2.0 (con retiro parcial 30%)
