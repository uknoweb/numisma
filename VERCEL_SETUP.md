# 🚀 Configuración Final de Vercel - Numisma

## ✅ Completado hasta ahora:

1. ✅ Base de datos Neon creada
2. ✅ Migraciones ejecutadas (8 tablas creadas)
3. ✅ Código pusheado a GitHub
4. ✅ Vercel auto-deploy en progreso

---

## 📋 Pasos Finales (5 minutos)

### Paso 1: Configurar Variables de Entorno en Vercel

**Ir a: https://vercel.com/uknoweb/numisma/settings/environment-variables**

Copiar y pegar TODAS estas variables:

```env
POSTGRES_URL=postgresql://neondb_owner:npg_SO7Xfl8woysM@ep-wispy-grass-ahslxglu-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_SO7Xfl8woysM@ep-wispy-grass-ahslxglu-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_SO7Xfl8woysM@ep-wispy-grass-ahslxglu.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_USER=neondb_owner

POSTGRES_HOST=ep-wispy-grass-ahslxglu-pooler.c-3.us-east-1.aws.neon.tech

POSTGRES_PASSWORD=npg_SO7Xfl8woysM

POSTGRES_DATABASE=neondb

NEXT_PUBLIC_WORLD_APP_ID=app_451b35a6a72649c51df0753758419566

NEXT_PUBLIC_WORLD_ACTION_ID=verify_human

NEXT_PUBLIC_ALCHEMY_API_KEY=g1QFr3bVPNavTzfZTRVif

NEXT_PUBLIC_CHAIN_ID=4801

NEXT_PUBLIC_CHAIN_NAME=worldchain-sepolia

NEXT_PUBLIC_NUMA_TOKEN_ADDRESS=0xa57917BC4568B9e392869AbAc504fEe746e7bede

NEXT_PUBLIC_WLD_TOKEN_ADDRESS=0x25f36A04387aA3E68d8eD41Cd4478BEd7422A9f4

NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x73387224339C83eB19b0389BA3Aa33C37944ff72

NEXT_PUBLIC_MEMBERSHIP_ADDRESS=0x526b22e2878334240aDdB9c13b42d848a783cc09

NEXT_PUBLIC_PIONEER_VAULT_ADDRESS=0xAda711D20cfb0f34bAcDdeEA148f12a6D10e63Dd

NEXT_PUBLIC_APP_URL=https://numisma-gamma.vercel.app

ORACLE_PRIVATE_KEY=0x8c7a9b73ae17936b4cdbc5011485dedc766576c1d0a72e64e5f936d7f978f31e

CRON_SECRET=c285e2e50d1edc4c349c58e5cd919bcfb9a4b45d4d591c8850393c8bf924897f
```

**⚠️ IMPORTANTE - Agregar también:**

```env
NEXT_PUBLIC_PAYMENT_RECEIVER=0xTU_WALLET_AQUI
```

*(Cambiar `0xTU_WALLET_AQUI` por tu wallet real donde recibirás pagos WLD)*

**Para cada variable:**
- Environment: Seleccionar **Production**, **Preview**, **Development**
- Click "Add"

---

### Paso 2: Redeploy (si es necesario)

Si el deploy actual falló porque no tenía las variables:

1. Ir a: https://vercel.com/uknoweb/numisma
2. Click en el último deployment
3. Click en los 3 puntos (...)
4. Click "Redeploy"
5. Marcar "Use existing Build Cache"
6. Click "Redeploy"

---

### Paso 3: Verificar Deployment

**Esperar ~2 minutos y verificar:**

✅ Build exitoso (verde)
✅ URL de producción activa
✅ Sin errores en logs

**URL de producción:** https://numisma-gamma.vercel.app

---

### Paso 4: Testing en Producción

**Abrir la app en World App:**

1. Abrir World App en tu teléfono
2. Ir a Mini Apps
3. Buscar "Numisma" o abrir por URL
4. Probar:
   - ✅ World ID verification
   - ✅ Login (debe crear usuario en DB)
   - ✅ Ver balance inicial (10,000 NUMA, 100 WLD)
   - ✅ Onboarding tutorial (debe aparecer)
   - ✅ Completar onboarding (bonus +100 NUMA)
   - ✅ Navegación con bottom nav
   - ✅ Abrir posición de trading (debe guardar en DB)
   - ✅ Ver perfil
   - ✅ **Comprar membresía** (con WLD real - empezar con 1 mes Plus)

---

### Paso 5: Verificar Base de Datos

**Opción A: Drizzle Studio (local)**

```bash
npm run db:studio
# Abre en: https://local.drizzle.studio
```

**Opción B: Neon Dashboard**

1. Ir a: https://console.neon.tech
2. Seleccionar proyecto
3. SQL Editor
4. Verificar datos:

```sql
-- Ver usuarios creados
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Ver posiciones
SELECT * FROM positions ORDER BY opened_at DESC LIMIT 10;

-- Ver transacciones
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Ver membresías activas
SELECT 
  wallet_address,
  membership_tier,
  membership_expires_at,
  consecutive_months
FROM users 
WHERE membership_tier != 'free' 
ORDER BY membership_expires_at DESC;
```

---

## 🎯 Checklist de Producción

### Pre-Launch
- [ ] Variables de entorno configuradas en Vercel
- [ ] Payment receiver wallet configurado (multisig recomendado)
- [ ] Build exitoso sin errores
- [ ] Base de datos conectada y verificada

### Testing Básico
- [ ] World ID verification funciona
- [ ] Usuario se crea en base de datos
- [ ] Balance inicial correcto (10k NUMA, 100 WLD)
- [ ] Onboarding tutorial se muestra
- [ ] Bonus de onboarding se aplica (+100 NUMA)

### Testing Avanzado
- [ ] Abrir posición de trading (long/short)
- [ ] Posición se guarda en DB
- [ ] Cerrar posición
- [ ] P&L se calcula correctamente
- [ ] Balance se actualiza
- [ ] Transacción se registra en DB

### Testing de Pagos (CRÍTICO)
- [ ] Intentar comprar membresía Plus (1 mes)
- [ ] MiniKit Pay se abre correctamente
- [ ] Pago se procesa (usar cantidad pequeña primero)
- [ ] Verificación de pago exitosa
- [ ] Membresía se activa en DB
- [ ] Transacción se registra
- [ ] UI muestra nueva membresía

### Testing de Navegación
- [ ] Bottom navigation funciona (4 tabs)
- [ ] Transiciones suaves entre vistas
- [ ] ProfileView muestra datos correctos
- [ ] Trading view carga posiciones de DB
- [ ] Pioneers view muestra info correcta

### Monitoreo Post-Launch
- [ ] Revisar logs de Vercel cada hora (primeras 24h)
- [ ] Verificar errores en Sentry (si configurado)
- [ ] Monitorear creación de usuarios en DB
- [ ] Verificar transacciones de pago
- [ ] Analizar tiempo de respuesta de API routes

---

## ⚠️ Posibles Problemas y Soluciones

### Error: "Failed to connect to database"
**Solución:**
- Verificar que POSTGRES_URL esté configurada en Vercel
- Revisar que la conexión SSL esté habilitada (`?sslmode=require`)
- Verificar que Neon database esté activa

### Error: "World ID verification failed"
**Solución:**
- Verificar NEXT_PUBLIC_WORLD_APP_ID en Vercel
- Confirmar que el App ID esté activo en World Developer Portal
- Revisar que el Action ID sea correcto

### Error: "Payment verification failed"
**Solución:**
- Verificar NEXT_PUBLIC_PAYMENT_RECEIVER
- Revisar logs en `/api/payments/verify`
- Confirmar que el usuario tenga balance WLD suficiente

### Build Error: "Type error in..."
**Solución:**
- Ejecutar `npm run build` localmente
- Revisar errores de TypeScript
- Verificar imports en archivos nuevos

---

## 📊 Métricas a Monitorear

### Día 1
- Usuarios únicos creados
- World ID verifications exitosas
- Posiciones abiertas
- Pagos de membresía procesados

### Semana 1
- DAU (Daily Active Users)
- Retention (usuarios que regresan)
- Conversión a membresías pagas
- Volumen de trading

### Mes 1
- MAU (Monthly Active Users)
- LTV (Lifetime Value por usuario)
- Churn rate de membresías
- Total revenue (en WLD)

---

## 🚀 Próximos Pasos Después del Launch

### Sprint 2 (1-2 semanas)
1. **Analytics & Tracking** (Gap #5)
   - Integrar PostHog o Mixpanel
   - Event tracking (trades, payments)
   - Funnels de conversión

2. **Push Notifications** (Gap #6)
   - Web Push API
   - Notificaciones de membresía
   - Alertas de trading

3. **Enhanced Gamification** (Gap #7)
   - Sistema de achievements
   - XP y leveling
   - Daily streaks

4. **Social Features** (Gap #8)
   - Referral program activo
   - Leaderboards
   - Social sharing

### Sprint 3 (1-2 semanas)
5. **Advanced Trading** (Gap #9)
   - Stop Loss / Take Profit
   - Trailing stops
   - Limit orders

6. **Educational Content** (Gap #10)
   - Trading academy
   - Video tutorials
   - Knowledge base

---

## ✅ ¡Listo para Lanzar!

Una vez completado este checklist, **Numisma está en producción** con:

✅ Base de datos persistente (Neon Postgres)
✅ Autenticación real (World ID)
✅ Pagos reales (MiniKit Pay con WLD)
✅ UI mobile-first (bottom navigation)
✅ Onboarding interactivo
✅ Sistema de membresías funcional
✅ Trading con posiciones persistentes
✅ Sistema de pioneros (staking)

**La app está 100% funcional para usuarios reales.**

---

## 📞 Contacto y Soporte

**Si necesitas ayuda:**

1. **Logs de Vercel:** https://vercel.com/uknoweb/numisma/logs
2. **Neon Dashboard:** https://console.neon.tech
3. **World Developer Portal:** https://developer.worldcoin.org
4. **GitHub Issues:** https://github.com/uknoweb/numisma/issues

**Documentación del proyecto:**
- `/DEPLOYMENT.md` - Checklist completo de deployment
- `/ANALISIS_GAPS.md` - Roadmap de mejoras
- `/DATABASE_INTEGRATION.md` - Guía de base de datos
- `/DATABASE.md` - Esquema de tablas

---

**¡Éxito con el lanzamiento! 🎉🚀**
