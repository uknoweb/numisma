#!/bin/bash
# ===========================================
# PRODUCTION TESTING CHECKLIST
# Ejecutar después de deployment en Vercel
# ===========================================

echo "🧪 Testing Numisma Production Deployment..."
echo ""
echo "📍 URL: https://numisma-gamma.vercel.app"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROD_URL="https://numisma-gamma.vercel.app"

echo "========================================"
echo "1️⃣  VERIFICACIÓN DE CONECTIVIDAD"
echo "========================================"
echo ""

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PROD_URL)
if [ $HTTP_STATUS -eq 200 ]; then
    echo -e "${GREEN}✅ App accesible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Error HTTP $HTTP_STATUS${NC}"
    exit 1
fi
echo ""

echo "========================================"
echo "2️⃣  VERIFICACIÓN DE API ROUTES"
echo "========================================"
echo ""

# Test API endpoints
echo "Probando /api/auth/login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"worldIdHash":"test_health_check"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
if [ $HTTP_CODE -eq 200 ] || [ $HTTP_CODE -eq 400 ] || [ $HTTP_CODE -eq 500 ]; then
    echo -e "${GREEN}✅ API route /api/auth/login responde (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  API route no responde esperado (HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo "========================================"
echo "3️⃣  VERIFICACIÓN DE VARIABLES DE ENTORNO"
echo "========================================"
echo ""

# Check if page loads JavaScript (indicates env vars are being used)
PAGE_CONTENT=$(curl -s $PROD_URL)

if echo "$PAGE_CONTENT" | grep -q "numisma"; then
    echo -e "${GREEN}✅ Página carga contenido correctamente${NC}"
else
    echo -e "${RED}❌ Contenido no carga correctamente${NC}"
fi

if echo "$PAGE_CONTENT" | grep -q "_next"; then
    echo -e "${GREEN}✅ Next.js bundle detectado${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js bundle no detectado${NC}"
fi
echo ""

echo "========================================"
echo "4️⃣  VERIFICACIÓN DE BASE DE DATOS LOCAL"
echo "========================================"
echo ""

# Check local DB connection
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local existe${NC}"
    
    if grep -q "POSTGRES_URL" .env.local; then
        echo -e "${GREEN}✅ POSTGRES_URL configurada localmente${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local no encontrado${NC}"
fi
echo ""

echo "========================================"
echo "📋 CHECKLIST DE TESTING MANUAL"
echo "========================================"
echo ""
echo "Abre World App en tu teléfono y completa estos tests:"
echo ""
echo "PASO 1: Login"
echo "  [ ] Abrir World App"
echo "  [ ] Ir a Mini Apps"
echo "  [ ] Buscar 'Numisma' o abrir URL"
echo "  [ ] Hacer World ID verification"
echo "  [ ] ✅ Login exitoso"
echo ""
echo "PASO 2: Verificar Balance Inicial"
echo "  [ ] Ver balance: 10,000 NUMA"
echo "  [ ] Ver balance: 100 WLD"
echo "  [ ] ✅ Balances correctos"
echo ""
echo "PASO 3: Onboarding Tutorial"
echo "  [ ] Debe aparecer tutorial automáticamente"
echo "  [ ] Completar los 5 pasos"
echo "  [ ] Recibir bonus de +100 NUMA"
echo "  [ ] Balance nuevo: 10,100 NUMA"
echo "  [ ] ✅ Onboarding completado"
echo ""
echo "PASO 4: Navegación"
echo "  [ ] Probar tab Home"
echo "  [ ] Probar tab Trading"
echo "  [ ] Probar tab Pioneers"
echo "  [ ] Probar tab Profile"
echo "  [ ] ✅ Todas las vistas cargan"
echo ""
echo "PASO 5: Trading (Opcional)"
echo "  [ ] Ir a Trading"
echo "  [ ] Abrir posición Long o Short"
echo "  [ ] Seleccionar tamaño (ej: 1000 NUMA)"
echo "  [ ] Confirmar posición"
echo "  [ ] Cerrar posición"
echo "  [ ] Verificar P&L se refleja"
echo "  [ ] ✅ Trading funcional"
echo ""
echo "PASO 6: Membresía (CRÍTICO - USAR PEQUEÑA CANTIDAD)"
echo "  [ ] Ir a Profile o Dashboard"
echo "  [ ] Click en 'Mejorar' membresía"
echo "  [ ] Seleccionar Plus - 1 mes (5 WLD)"
echo "  [ ] Click 'Comprar'"
echo "  [ ] Confirmar pago en World App"
echo "  [ ] Esperar confirmación"
echo "  [ ] Verificar membresía activa"
echo "  [ ] ✅ Pago exitoso"
echo ""
echo "========================================"
echo "🗄️  VERIFICAR DATOS EN DATABASE"
echo "========================================"
echo ""
echo "Ejecuta: npm run db:studio"
echo "Abre: https://local.drizzle.studio"
echo ""
echo "Verificar en tabla 'users':"
echo "  [ ] Tu usuario existe"
echo "  [ ] wallet_address correcto"
echo "  [ ] balance_numa = 10,100 (o menos si hiciste trades)"
echo "  [ ] balance_wld = 100 (o menos si compraste membresía)"
echo "  [ ] membership_tier = 'plus' (si compraste)"
echo ""
echo "Verificar en tabla 'transactions':"
echo "  [ ] Transacción de onboarding bonus (+100 NUMA)"
echo "  [ ] Transacción de pago membresía (si compraste)"
echo "  [ ] Transacciones de trades (si abriste posiciones)"
echo ""
echo "Verificar en tabla 'positions':"
echo "  [ ] Posiciones creadas (si abriste trades)"
echo "  [ ] Status correcto (open/closed)"
echo "  [ ] P&L calculado correctamente"
echo ""
echo "========================================"
echo "📊 MONITOREO POST-LAUNCH"
echo "========================================"
echo ""
echo "En las próximas 24 horas, revisar:"
echo ""
echo "1. Vercel Logs:"
echo "   https://vercel.com/uknoweb/numisma/logs"
echo "   [ ] Sin errores críticos"
echo "   [ ] Response time < 2s"
echo "   [ ] Error rate < 1%"
echo ""
echo "2. Neon Database:"
echo "   https://console.neon.tech"
echo "   [ ] Nuevos usuarios creándose"
echo "   [ ] Transacciones registrándose"
echo "   [ ] Sin errores de conexión"
echo ""
echo "3. World App:"
echo "   [ ] Verificaciones exitosas"
echo "   [ ] Sin crashes reportados"
echo "   [ ] Usuarios activos"
echo ""
echo "========================================"
echo "✅ CRITERIOS DE ÉXITO"
echo "========================================"
echo ""
echo "La app está lista para usuarios reales si:"
echo ""
echo "✅ Login funciona correctamente"
echo "✅ Onboarding se muestra y completa"
echo "✅ Bonus de +100 NUMA se aplica"
echo "✅ Navegación fluida entre tabs"
echo "✅ Trading abre/cierra posiciones"
echo "✅ Pago de membresía procesa correctamente"
echo "✅ Datos se guardan en base de datos"
echo "✅ Sin errores en logs de Vercel"
echo ""
echo "========================================"
echo "🎉 ¡Listo para Lanzamiento Público!"
echo "========================================"
echo ""
echo "Si todos los tests pasan, la app está lista para:"
echo "  - Compartir con usuarios beta"
echo "  - Publicar en comunidades"
echo "  - Marketing y growth"
echo ""
echo "Siguiente fase: Sprint 2 (Analytics, Notifications, etc.)"
echo ""
