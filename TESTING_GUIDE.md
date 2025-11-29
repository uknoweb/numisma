# 🧪 Guía de Testing - Numisma Trading Platform

## 📋 Pre-requisitos

### 1. MetaMask instalado
- Extensión de Chrome/Firefox/Brave
- Wallet configurada

### 2. World Chain Sepolia configurada en MetaMask

**Agregar red manualmente:**

```
Network Name: World Chain Sepolia
RPC URL: https://worldchain-sepolia.g.alchemy.com/v2/g1QFr3bVPNavTzfZTRVif
Chain ID: 4801
Currency Symbol: ETH
Block Explorer: https://worldchain-sepolia.explorer.alchemy.com
```

**O usar chainlist.org:**
1. Ir a https://chainlist.org
2. Buscar "World Chain Sepolia"
3. Click en "Add to MetaMask"

### 3. ETH de testnet en tu wallet

**Faucets disponibles:**
- Alchemy: https://www.alchemy.com/faucets/worldchain-sepolia
- World Chain: https://faucet.worldchain.org

**Necesitas:** ~0.01 ETH para testing (suficiente para 20-30 transacciones)

---

## 🚀 Testing Local

### Paso 1: Iniciar servidor

```bash
cd /Users/capote/Desktop/numisma
npm run dev
```

Servidor corriendo en: http://localhost:3000

---

### Paso 2: Conectar Wallet

1. Abrir http://localhost:3000
2. Ir a sección **Trading**
3. Click en botón **"Conectar Wallet"** (arriba derecha)
4. MetaMask se abrirá automáticamente
5. Seleccionar cuenta
6. Click **"Connect"**
7. Verificar que aparezca tu dirección truncada (ej: `0xC570...9370`)

✅ **Esperado:** Badge verde "Conectado" con tu address

---

### Paso 3: Verificar Precio Real de WLD

1. En la pantalla de Trading, observar el precio de WLD/USDT
2. Deberías ver:
   - Precio numérico (ej: `2.45`)
   - Punto verde pulsante (indica live price)
   - Texto "Desde CoinGecko API"

3. Abrir DevTools del navegador (F12)
4. Ir a Console
5. Deberías ver logs cada ~1 segundo actualizando el precio

✅ **Esperado:** Precio se actualiza automáticamente desde API

---

### Paso 4: Abrir Posición LONG

1. **Configurar parámetros:**
   - Par: WLD/USDT
   - Dirección: LONG ↗ (botón verde)
   - Apalancamiento: 5x
   - Monto: 0.1 WLD

2. **Revisar preview:**
   - Precio de entrada: (precio actual)
   - Apalancamiento: 5x
   - P&L estimado (+1%): ~0.005 WLD

3. **Click en "Abrir LONG 5x"**

4. **MetaMask popup aparecerá:**
   - Verificar detalles de transacción
   - Gas fee: ~0.0005 ETH
   - Click **"Confirm"**

5. **Estados en UI:**
   - Botón cambia a "Esperando confirmación..."
   - Luego "Confirmando transacción..."
   - Loading spinner visible

6. **Transacción confirmada:**
   - Alert: "✅ Posición LONG abierta"
   - Nueva card aparece en "Tus Posiciones"

✅ **Esperado:** Posición creada, balance descontado, transacción en blockchain

---

### Paso 5: Verificar Transacción en Blockchain

1. Copiar hash de transacción de DevTools console
2. Abrir explorer: https://worldchain-sepolia.explorer.alchemy.com
3. Pegar tx hash en búsqueda
4. Verificar:
   - Status: Success ✅
   - From: Tu wallet address
   - To: `0xED888019DE2e5922E8c65f68Cf10d016ad330E60` (Pool contract)
   - Function: `openPosition(uint8 pair, uint8 positionType, uint256 leverage)`

✅ **Esperado:** Transacción confirmada on-chain

---

### Paso 6: Observar P&L en Tiempo Real

1. Con la posición abierta, observar la card
2. Deberías ver:
   - **Tipo:** LONG 5x
   - **P&L:** Número que cambia (positivo en verde, negativo en rojo)
   - **Porcentaje:** % de ganancia/pérdida
   - **Precio entrada:** Tu precio de entrada
   - **Precio actual:** Actualizado en tiempo real

3. Esperar 30-60 segundos
4. El precio de WLD cambiará ligeramente
5. El P&L se actualizará automáticamente

✅ **Esperado:** P&L refleja cambios de precio en tiempo real

---

### Paso 7: Cerrar Posición

1. En la card de tu posición, click **"Cerrar Posición"**
2. MetaMask popup:
   - Verificar gas fee
   - Click **"Confirm"**
3. Estados en UI:
   - "Esperando confirmación..."
   - "Confirmando transacción..."
4. Confirmación:
   - Alert: "✅ Posición cerrada"
   - P&L: +/- X WLD
   - Balance actualizado

✅ **Esperado:** Posición cerrada, fondos devueltos (monto + P&L - fees)

---

### Paso 8: Verificar Comisiones

**Comisión de apertura:** 0.2%
- Si abriste con 0.1 WLD
- Fee = 0.1 * 0.002 = 0.0002 WLD

**Comisión de cierre:** 0.2%
- Del monto original
- Fee = 0.1 * 0.002 = 0.0002 WLD

**Total fees:** 0.0004 WLD (~$0.001)

**Calcular balance final:**
```
Balance inicial: X WLD
Después de abrir: X - 0.1 - 0.0002 WLD
Después de cerrar: X - 0.1 - 0.0002 + 0.1 + P&L - 0.0002
                 = X + P&L - 0.0004
```

✅ **Esperado:** Balance refleja P&L menos comisiones totales

---

## 🧪 Casos de Prueba Adicionales

### Test Case 2: Posición SHORT

1. Mismo flujo que LONG
2. Seleccionar **SHORT ↘** (botón rojo)
3. Ganas si precio baja, pierdes si sube
4. P&L debería ser inverso al precio

### Test Case 3: Apalancamiento Alto (50x)

1. Apalancamiento: 50x
2. Monto: 0.1 WLD
3. Exposición: 5 WLD
4. P&L se mueve 50x más rápido
5. ⚠️ Más riesgo de liquidación

### Test Case 4: NUMA/WLD (tasa fija)

1. Cambiar par a **NUMA/WLD**
2. Precio fijo: 10:1 (10 NUMA = 1 WLD)
3. Abrir posición
4. Verificar precio no cambia (es fijo)

### Test Case 5: Múltiples Posiciones

1. Abrir 2-3 posiciones simultáneas
2. Diferentes direcciones (LONG/SHORT)
3. Diferentes apalancamientos
4. Cerrar una por una
5. Verificar balance correcto

---

## ❌ Errores Comunes y Soluciones

### Error: "Por favor conecta tu wallet primero"
**Causa:** Wallet no conectada  
**Solución:** Click en "Conectar Wallet" arriba

### Error: "Balance insuficiente"
**Causa:** No tienes suficiente WLD/NUMA en Zustand store  
**Solución:** Esto es mock por ahora, ajusta balance en Dashboard

### Error: "User rejected transaction"
**Causa:** Cancelaste en MetaMask  
**Solución:** Intenta de nuevo, confirma en MetaMask

### Error: "Insufficient funds for gas"
**Causa:** No tienes ETH en wallet  
**Solución:** Consigue ETH de testnet de faucets

### Error: Network no encontrada
**Causa:** MetaMask no tiene World Chain Sepolia  
**Solución:** Agregar red manualmente (ver pre-requisitos)

---

## 📊 Monitoreo y Logs

### Browser Console (F12)

**Logs esperados:**
```
[Trading] Opening position: LONG 5x with 0.1 WLD
[Wagmi] Transaction sent: 0xabc...def
[Wagmi] Waiting for confirmation...
[Wagmi] Transaction confirmed in block 12345678
```

### Network Tab

**Requests esperados:**
- `GET /api/prices/wld` - cada 1 segundo
- Respuesta: `{ price: 2.45, priceForContract: 2450000, ... }`

### MetaMask Activity

**Transacciones esperadas:**
- openPosition() - Contract Interaction
- closePosition() - Contract Interaction
- Gas usado: ~0.0005 ETH cada una

---

## 🎯 Checklist Final

**Testing Exitoso si:**
- ✅ Wallet conecta correctamente
- ✅ Precio WLD se actualiza cada segundo
- ✅ Posición LONG abre con tx confirmada
- ✅ P&L se actualiza en tiempo real
- ✅ Posición cierra correctamente
- ✅ Balance refleja P&L menos fees
- ✅ Todas las transacciones visibles en explorer
- ✅ No hay errores en console

---

## 🔗 Links Útiles

**Blockchain:**
- Explorer: https://worldchain-sepolia.explorer.alchemy.com
- Contract: https://worldchain-sepolia.explorer.alchemy.com/address/0xED888019DE2e5922E8c65f68Cf10d016ad330E60
- Faucet: https://www.alchemy.com/faucets/worldchain-sepolia

**Documentación:**
- Next.js: https://nextjs.org/docs
- Wagmi: https://wagmi.sh
- Viem: https://viem.sh

**Proyecto:**
- GitHub: https://github.com/uknoweb/numisma
- Vercel: https://numisma-gamma.vercel.app

---

**Última actualización:** 29 de Noviembre 2025  
**Versión:** 1.0 - Testing Local Guide
