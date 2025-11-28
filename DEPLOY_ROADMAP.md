# 🚀 Roadmap de Deployment - Numisma

**Objetivo:** Listar Numisma en la tienda oficial de World App

---

## 🎯 Fase 1: MVP sin Blockchain (3-5 días)

### Día 1: Configuración de Cuentas y Servicios

#### 1.1 Crear Cuenta de Desarrollador World
```bash
# Ir a: https://developer.worldcoin.org/
# 1. Sign up con GitHub
# 2. Crear nueva app "Numisma"
# 3. Copiar:
#    - App ID
#    - Action ID (para verificación)
```

**Guardar en `.env.local`:**
```env
NEXT_PUBLIC_WORLD_APP_ID=app_staging_xxxxx
NEXT_PUBLIC_WORLD_ACTION_ID=verify_human
```

#### 1.2 Setup Vercel
```bash
# Instalar Vercel CLI
npm install -D vercel

# Login
npx vercel login

# Deploy inicial (genera URL pública)
npx vercel
```

Esto te dará una URL tipo: `https://numisma-xxx.vercel.app`

#### 1.3 Configurar Base de Datos (Vercel Postgres)
```bash
# En dashboard de Vercel:
# 1. Ir a tu proyecto numisma
# 2. Storage → Create Database → Postgres
# 3. Copiar DATABASE_URL automáticamente
```

#### 1.4 Instalar Dependencias Backend
```bash
cd /Users/capote/Desktop/numisma

# MiniKit SDK
npm install @worldcoin/minikit-js

# Prisma (ORM para DB)
npm install @prisma/client
npm install -D prisma

# Crypto para JWT
npm install jose

# Inicializar Prisma
npx prisma init
```

---

### Día 2: Integración World ID Real

#### 2.1 Configurar Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String       @id @default(cuid())
  worldId           String       @unique // nullifier_hash de World ID
  walletAddress     String?      // Opcional
  balanceNuma       Float        @default(1000)
  balanceWld        Float        @default(10)
  membershipTier    MembershipTier @default(FREE)
  membershipExpires DateTime?
  lastClaimDate     DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
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
  currentPrice Float
  amount       Float
  leverage     Int
  pnl          Float    @default(0)
  pnlPercentage Float   @default(0)
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
  nextPaymentDate     DateTime
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

**Crear y aplicar migración:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 2.2 Actualizar WorldIdVerification.tsx
```typescript
// components/WorldIdVerification.tsx
"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export default function WorldIdVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const setWorldIdVerified = useAppStore((state) => state.setWorldIdVerified);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    // Inicializar MiniKit
    MiniKit.install(process.env.NEXT_PUBLIC_WORLD_APP_ID!);
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);

    try {
      // Verificar con World ID
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: process.env.NEXT_PUBLIC_WORLD_ACTION_ID!,
        verification_level: 'orb', // Solo usuarios verificados por Orb
      });

      if (finalPayload.status === 'success') {
        // Enviar proof al backend
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload),
        });

        const data = await res.json();

        if (data.verified) {
          setUser(data.user);
          setWorldIdVerified(true);
        } else {
          alert('Verificación fallida. Intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      alert('Error en la verificación. Asegúrate de estar en World App.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800]">
      <Card className="w-full max-w-md border-[--color-gold]/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[--color-gold] to-[--color-gold-dark] flex items-center justify-center">
            <Shield className="w-10 h-10 text-[--color-black]" />
          </div>
          <CardTitle className="text-3xl">Numisma</CardTitle>
          <CardDescription className="text-base">
            Plataforma educativa de trading con token NUMA
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[--color-gold]">
              Verificación Exclusiva
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              El acceso a Numisma es exclusivo para usuarios verificados con{" "}
              <span className="text-[--color-gold] font-semibold">World ID</span>{" "}
              a través de MiniKit.
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verificar con World ID
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Asegúrate de abrir esta app desde World App.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2.3 Crear API Route de Verificación
```typescript
// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MiniKit } from '@worldcoin/minikit-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    // Verificar el proof con Worldcoin
    const verifyRes = await MiniKit.verifyProof(body);
    
    if (!verifyRes.success) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const worldId = body.nullifier_hash; // ID único del usuario

    // Buscar o crear usuario en DB
    let user = await prisma.user.findUnique({
      where: { worldId },
      include: { positions: true, pioneerProfile: true }
    });

    if (!user) {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          worldId,
          balanceNuma: 1000,
          balanceWld: 10,
          membershipTier: 'FREE',
        },
        include: { positions: true, pioneerProfile: true }
      });
    }

    return NextResponse.json({ 
      verified: true,
      user: {
        id: user.id,
        worldId: user.worldId,
        balanceNuma: user.balanceNuma,
        balanceWld: user.balanceWld,
        membership: {
          tier: user.membershipTier.toLowerCase(),
          expiresAt: user.membershipExpires,
          dailyRewards: user.membershipTier === 'FREE' ? 50 : user.membershipTier === 'PLUS' ? 200 : 500,
          maxLeverage: user.membershipTier === 'FREE' ? 10 : user.membershipTier === 'PLUS' ? 30 : 500,
        },
        createdAt: user.createdAt,
        locale: 'es-MX',
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
```

---

### Día 3: APIs Críticas

#### 3.1 Crear APIs Necesarias

**Trading:**
```typescript
// app/api/trading/open/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { userId, symbol, type, amount, leverage, entryPrice } = await req.json();
  
  const position = await prisma.position.create({
    data: {
      userId,
      symbol,
      type,
      amount,
      leverage,
      entryPrice,
      currentPrice: entryPrice,
      status: 'OPEN',
    }
  });
  
  return NextResponse.json({ success: true, position });
}
```

**Staking:**
```typescript
// app/api/staking/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // Verificar si puede reclamar (24h)
  const now = new Date();
  if (user.lastClaimDate) {
    const hoursSince = (now.getTime() - user.lastClaimDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return NextResponse.json({ 
        canClaim: false, 
        nextClaimAt: new Date(user.lastClaimDate.getTime() + 24 * 60 * 60 * 1000)
      });
    }
  }
  
  // Calcular recompensa según tier
  const rewards = {
    FREE: 50,
    PLUS: 200,
    VIP: 500,
  };
  
  const reward = rewards[user.membershipTier];
  
  // Actualizar balance
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      balanceNuma: user.balanceNuma + reward,
      lastClaimDate: now,
    }
  });
  
  return NextResponse.json({ 
    success: true, 
    reward,
    newBalance: updatedUser.balanceNuma
  });
}
```

---

### Día 4-5: Testing y Submission

#### 4.1 Deploy a Producción
```bash
# Build local para verificar
npm run build

# Deploy a Vercel (producción)
npx vercel --prod
```

#### 4.2 Registrar Mini App en World
1. Ir a https://developer.worldcoin.org/
2. Crear nueva Mini App
3. Llenar formulario:
   - **Name:** Numisma
   - **Description:** Plataforma educativa de trading con token NUMA
   - **URL:** https://numisma.vercel.app (tu URL de Vercel)
   - **Category:** Finance & DeFi
   - **Icon:** Logo 512x512px
   - **Screenshots:** 3-5 capturas de pantalla

#### 4.3 Pruebas en World App
```bash
# Escanear QR desde World App
# O usar deep link:
https://worldcoin.org/mini-app?app_id=YOUR_APP_ID
```

---

## 🎯 Fase 2: Agregar Blockchain (Opcional, después del MVP)

### Cuándo agregar:
- ✅ Cuando tengas usuarios activos
- ✅ Cuando necesites verdadera descentralización
- ✅ Cuando quieras tokens reales (NUMA en blockchain)

### Qué agregar:
1. Smart Contracts en World Chain
2. Wallet connection con MiniKit
3. Transacciones on-chain para:
   - Compra de membresías
   - Sistema de Pioneros
   - Préstamos garantizados

**Tiempo:** +2-3 semanas de desarrollo

---

## 📊 Comparación de Rutas

| Aspecto | MVP sin Blockchain | Con Blockchain Completo |
|---------|-------------------|------------------------|
| **Tiempo** | 3-5 días | 3-4 semanas |
| **Complejidad** | Baja | Alta |
| **Costo** | $0 (Vercel gratis) | ~$50-200 (gas fees) |
| **Puede listar** | ✅ Sí | ✅ Sí |
| **Descentralizado** | ❌ No | ✅ Sí |
| **Escalable** | ✅ Sí | ✅ Sí |
| **Auditoria necesaria** | ❌ No | ✅ Sí ($3k-10k) |

---

## ✅ Checklist de Submission

Antes de enviar tu mini app a revisión:

### Técnico
- [ ] World ID verificación funciona
- [ ] App carga en < 3 segundos
- [ ] Funciona en móvil (responsive)
- [ ] Sin errores en consola
- [ ] HTTPS configurado (Vercel lo hace automático)
- [ ] Variables de entorno configuradas en Vercel

### Contenido
- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Descripción clara de la app
- [ ] Screenshots de calidad
- [ ] Icono 512x512px

### Legal
- [ ] Disclaimer de plataforma educativa
- [ ] Advertencia de riesgos
- [ ] Cumplimiento con regulaciones locales

---

## 🚀 Siguiente Paso Inmediato

**Acción 1:** Crear cuenta en https://developer.worldcoin.org/

**Acción 2:** Instalar dependencias backend:
```bash
cd /Users/capote/Desktop/numisma
npm install @worldcoin/minikit-js @prisma/client jose
npm install -D prisma
npx prisma init
```

**Acción 3:** Deploy inicial a Vercel:
```bash
npm install -D vercel
npx vercel login
npx vercel
```

---

## 📞 Recursos

- **World Developer Portal:** https://developer.worldcoin.org/
- **MiniKit Docs:** https://docs.worldcoin.org/minikit
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs

**¿Preguntas?** Lee los docs o pregunta en Discord de Worldcoin.
