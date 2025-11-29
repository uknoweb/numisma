# 📝 Configuración de Variables de Entorno en Vercel

Este documento explica cómo configurar las variables de entorno necesarias para que el oráculo funcione en producción (Vercel).

---

## 🔐 Variables Requeridas

### 1. ORACLE_PRIVATE_KEY
**Descripción:** Private key de la wallet que actualizará el precio en el contrato  
**Valor:** `0x8c7a9b73ae17936b4cdbc5011485dedc766576c1d0a72e64e5f936d7f978f31e`  
**Scopes:** Production, Preview, Development  
**⚠️ IMPORTANTE:** Esta es tu wallet de testnet. Para mainnet, usa una wallet diferente con fondos limitados.

---

### 2. CRON_SECRET
**Descripción:** Secret para autenticar las llamadas del Vercel Cron  
**Valor:** `c285e2e50d1edc4c349c58e5cd919bcfb9a4b45d4d591c8850393c8bf924897f`  
**Scopes:** Production, Preview, Development  
**Propósito:** Evita que personas no autorizadas llamen al endpoint /api/oracle/update

---

### 3. NEXT_PUBLIC_ALCHEMY_API_KEY
**Descripción:** API key de Alchemy para RPC  
**Valor:** `g1QFr3bVPNavTzfZTRVif` (ya configurado)  
**Scopes:** Production, Preview, Development

---

### 4. NEXT_PUBLIC_POOL_CONTRACT_ADDRESS
**Descripción:** Dirección del contrato PoolCentinelaRegeneracion deployed  
**Valor:** `0xED888019DE2e5922E8c65f68Cf10d016ad330E60`  
**Scopes:** Production, Preview, Development

---

## 📋 Pasos para Configurar en Vercel

### Opción A: Desde el Dashboard Web

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Settings** (arriba derecha)
3. En el menú lateral, click en **Environment Variables**
4. Para cada variable:
   - Click en **Add New**
   - **Key:** (nombre de la variable)
   - **Value:** (valor de la variable)
   - **Environments:** Selecciona Production, Preview, Development
   - Click en **Save**

### Opción B: Desde Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Agregar variables (ejecutar desde el directorio del proyecto)
vercel env add ORACLE_PRIVATE_KEY production
# Pegar: 0x8c7a9b73ae17936b4cdbc5011485dedc766576c1d0a72e64e5f936d7f978f31e

vercel env add CRON_SECRET production
# Pegar: c285e2e50d1edc4c349c58e5cd919bcfb9a4b45d4d591c8850393c8bf924897f
```

---

## ✅ Verificar Configuración

Después de agregar las variables:

1. **Re-deploy** tu aplicación en Vercel:
   ```bash
   git push origin main
   ```
   O desde el dashboard: Deployments > Re-deploy

2. **Probar el endpoint manualmente:**
   ```bash
   curl -X POST https://numisma-gamma.vercel.app/api/oracle/update \
     -H "Authorization: Bearer c285e2e50d1edc4c349c58e5cd919bcfb9a4b45d4d591c8850393c8bf924897f"
   ```

3. **Ver logs del Cron:**
   - Ve a Deployments > (última deployment) > Functions
   - Click en `/api/oracle/update`
   - Verás los logs de ejecución cada 5 minutos

---

## 📊 Monitoreo

### Verificar que el Cron esté funcionando:

1. **Dashboard de Vercel:**
   - Settings > Cron Jobs
   - Verás el job configurado: `*/5 * * * *` (cada 5 minutos)
   - Estado: ✅ Enabled

2. **Logs de ejecución:**
   - Deployments > (deployment activo) > Functions
   - Busca `/api/oracle/update`
   - Verás cada ejecución con:
     - Timestamp
     - Status (200 = success, 500 = error)
     - Response data

3. **Verificar transacciones en blockchain:**
   - Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/0xED888019DE2e5922E8c65f68Cf10d016ad330E60
   - Verás una transacción `updateWLDPrice()` cada 5 minutos
   - Deberías ver el hash de transacción en los logs de Vercel

---

## 🚨 Troubleshooting

### Error: "ORACLE_PRIVATE_KEY not configured"
- Verifica que agregaste la variable en Vercel
- Re-deploy la aplicación
- Verifica que no tenga espacios extra

### Error: "Unauthorized" (401)
- Verifica que CRON_SECRET esté configurado en Vercel
- Asegúrate de que el header `Authorization: Bearer <secret>` sea correcto
- Si usas Vercel Cron, el header se agrega automáticamente

### Error: "Insufficient funds"
- La wallet oracle necesita ETH para pagar gas
- Verifica balance: https://worldchain-sepolia.explorer.alchemy.com/address/0xC570167Cf09D4f001d07786ee66da35909709370
- Consigue testnet ETH: https://www.alchemy.com/faucets/worldchain-sepolia

### Error: "Execution reverted"
- Verifica que la wallet oracle sea el owner del contrato
- O que tenga permisos para llamar `updateWLDPrice()`

---

## 📈 Estimación de Costos de Gas

**Testnet (World Chain Sepolia):**
- Costo por actualización: ~0.0002 ETH
- Actualizaciones por día: 288 (cada 5 min)
- Costo diario: ~0.0576 ETH
- Con 0.078 ETH: ~1.35 días de operación

**Mainnet (estimado):**
- Costo por actualización: ~0.001 ETH (~$2.50 con ETH a $2,500)
- Actualizaciones por día: 288
- Costo diario: ~$720

💡 **Recomendación:** Para mainnet, considera:
- Aumentar intervalo a 15-30 minutos
- Usar Chainlink Price Feeds en lugar de oráculo propio
- Configurar wallet separada con fondos limitados

---

## 🔄 Próximos Pasos

1. ✅ Configurar variables en Vercel
2. ✅ Re-deploy aplicación
3. ✅ Verificar logs del primer cron execution
4. ✅ Confirmar transacción en blockchain
5. ⏳ Monitorear por 1 hora (12 ejecuciones)
6. ⏳ Si funciona correctamente, dejar corriendo

---

**Última actualización:** 29 de Noviembre 2025  
**Archivo relacionado:** `app/api/oracle/update/route.ts`
