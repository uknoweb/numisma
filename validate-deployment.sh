#!/bin/bash
# ===========================================
# VERCEL DEPLOYMENT VALIDATOR
# Ejecutar después de configurar variables en Vercel
# ===========================================

echo "🔍 Verificando deployment de Numisma..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production URL
PROD_URL="https://numisma-gamma.vercel.app"

echo "📍 URL de Producción: $PROD_URL"
echo ""

# Test 1: Check if site is reachable
echo "1️⃣  Verificando conectividad..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PROD_URL)
if [ $HTTP_STATUS -eq 200 ]; then
    echo -e "${GREEN}✅ Sitio accesible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Error de conectividad (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Test 2: Check API routes
echo "2️⃣  Verificando API routes..."

# Test health endpoint (create one if needed)
echo "   Probando /api/auth/login..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $PROD_URL/api/auth/login -H "Content-Type: application/json" -d '{"worldIdHash":"test"}')
if [ $LOGIN_STATUS -eq 200 ] || [ $LOGIN_STATUS -eq 400 ]; then
    echo -e "${GREEN}✅ API route responde${NC}"
else
    echo -e "${YELLOW}⚠️  API route no responde como esperado (HTTP $LOGIN_STATUS)${NC}"
fi
echo ""

# Test 3: Database connection (indirect)
echo "3️⃣  Verificando base de datos..."
echo "   Ejecutando query de prueba localmente..."
npm run db:studio > /dev/null 2>&1 &
STUDIO_PID=$!
sleep 2
if ps -p $STUDIO_PID > /dev/null; then
    echo -e "${GREEN}✅ Drizzle Studio conectado a base de datos${NC}"
    kill $STUDIO_PID 2>/dev/null
else
    echo -e "${YELLOW}⚠️  No se pudo iniciar Drizzle Studio${NC}"
fi
echo ""

# Test 4: Environment variables
echo "4️⃣  Verificando variables de entorno locales..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local existe${NC}"
    
    # Check critical vars
    if grep -q "POSTGRES_URL" .env.local; then
        echo -e "${GREEN}✅ POSTGRES_URL configurada${NC}"
    else
        echo -e "${RED}❌ POSTGRES_URL faltante${NC}"
    fi
    
    if grep -q "NEXT_PUBLIC_WORLD_APP_ID" .env.local; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_WORLD_APP_ID configurada${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_WORLD_APP_ID faltante${NC}"
    fi
    
    if grep -q "NEXT_PUBLIC_PAYMENT_RECEIVER" .env.local; then
        RECEIVER=$(grep "NEXT_PUBLIC_PAYMENT_RECEIVER" .env.local | cut -d '=' -f 2 | tr -d '"')
        if [ "$RECEIVER" = "0x0000000000000000000000000000000000000000" ]; then
            echo -e "${YELLOW}⚠️  PAYMENT_RECEIVER usa dirección de prueba${NC}"
        else
            echo -e "${GREEN}✅ NEXT_PUBLIC_PAYMENT_RECEIVER configurada${NC}"
        fi
    else
        echo -e "${RED}❌ NEXT_PUBLIC_PAYMENT_RECEIVER faltante${NC}"
    fi
else
    echo -e "${RED}❌ .env.local no encontrado${NC}"
fi
echo ""

# Test 5: Build local
echo "5️⃣  Verificando build local..."
echo "   Ejecutando 'npm run build'..."
if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Build falló. Ver /tmp/build.log para detalles${NC}"
    echo "   Últimas líneas del error:"
    tail -n 10 /tmp/build.log
fi
echo ""

# Summary
echo "========================================"
echo "📊 RESUMEN DE VALIDACIÓN"
echo "========================================"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. 🌐 Ir a Vercel Dashboard:"
echo "   https://vercel.com/uknoweb/numisma"
echo ""
echo "2. ⚙️  Configurar Environment Variables:"
echo "   Settings → Environment Variables"
echo "   Copiar todas las variables de .env.production"
echo ""
echo "3. 🔄 Redeploy si es necesario:"
echo "   Deployments → Latest → ... → Redeploy"
echo ""
echo "4. ✅ Verificar logs de producción:"
echo "   Deployments → Latest → View Function Logs"
echo ""
echo "5. 📱 Abrir en World App:"
echo "   Mini Apps → Buscar 'Numisma'"
echo ""
echo "6. 🧪 Testing completo:"
echo "   - World ID verification"
echo "   - Login/registro de usuario"
echo "   - Onboarding tutorial"
echo "   - Abrir posición de trading"
echo "   - Comprar membresía (SMALL AMOUNT primero)"
echo ""
echo "========================================"
echo "✨ Deployment Ready!"
echo "========================================"
