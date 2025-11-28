# 🛠️ Comandos Útiles - Numisma

Referencia rápida de comandos para desarrollo, testing y deployment.

---

## 📦 Gestión de Dependencias

```bash
# Instalar dependencias
npm install

# Instalar una nueva dependencia
npm install nombre-paquete

# Instalar dependencia de desarrollo
npm install -D nombre-paquete

# Actualizar todas las dependencias
npm update

# Ver dependencias desactualizadas
npm outdated

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Auditoría de seguridad
npm audit
npm audit fix
```

---

## 🚀 Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run dev

# Modo desarrollo en puerto personalizado
PORT=3001 npm run dev

# Modo desarrollo con turbo (más rápido)
npm run dev --turbo

# Build para producción
npm run build

# Ejecutar build de producción localmente
npm run start

# Linting
npm run lint

# Fix automático de linting
npm run lint -- --fix
```

---

## 🧪 Testing (Cuando se implemente)

```bash
# Instalar Jest + React Testing Library
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Ejecutar tests
npm test

# Tests en modo watch
npm test -- --watch

# Coverage
npm test -- --coverage

# Tests de un archivo específico
npm test -- Dashboard.test.tsx
```

---

## 🔍 TypeScript

```bash
# Verificar tipos sin compilar
npx tsc --noEmit

# Generar tipos de Prisma (cuando se implemente)
npx prisma generate

# Ver errores de tipos detallados
npx tsc --noEmit --pretty
```

---

## 🎨 Tailwind CSS

```bash
# Ver clases CSS generadas
npx tailwindcss -o output.css --watch

# Purge de clases no usadas (automático en build)
npm run build

# Ver tamaño del bundle CSS
npm run build && du -sh .next/static/css/*
```

---

## 🔗 Blockchain (Cuando se implemente)

```bash
# Instalar Hardhat
npm install -D hardhat @nomicfoundation/hardhat-toolbox

# Inicializar proyecto Hardhat
npx hardhat init

# Compilar contratos
npx hardhat compile

# Ejecutar tests de contratos
npx hardhat test

# Deploy a testnet
npx hardhat run scripts/deploy.ts --network worldchain-testnet

# Deploy a mainnet
npx hardhat run scripts/deploy.ts --network worldchain-mainnet

# Verificar contrato en explorer
npx hardhat verify --network worldchain-mainnet CONTRACT_ADDRESS "Constructor args"

# Interactuar con contrato
npx hardhat console --network worldchain-mainnet
```

---

## 🗄️ Base de Datos (Cuando se implemente)

```bash
# Instalar Prisma
npm install -D prisma
npm install @prisma/client

# Inicializar Prisma
npx prisma init

# Crear migración
npx prisma migrate dev --name init

# Aplicar migraciones en producción
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio (GUI de DB)
npx prisma studio

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset

# Seed de datos de prueba
npx prisma db seed
```

---

## 🐳 Docker (Opcional)

```bash
# Build de imagen Docker
docker build -t numisma .

# Ejecutar contenedor
docker run -p 3000:3000 numisma

# Docker Compose
docker-compose up
docker-compose down

# Ver logs
docker logs numisma-app
```

---

## 📊 Análisis de Bundle

```bash
# Instalar analyzer
npm install -D @next/bundle-analyzer

# Analizar bundle
ANALYZE=true npm run build

# Ver tamaño de páginas
npm run build && npx next build --profile
```

---

## 🔐 Variables de Entorno

```bash
# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_WORLD_APP_ID=your_app_id
NEXT_PUBLIC_WORLD_ACTION_ID=your_action_id
DATABASE_URL=postgresql://user:password@localhost:5432/numisma
EOF

# Ver variables en runtime
node -e "console.log(process.env)"
```

---

## 🚢 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -D vercel

# Login
npx vercel login

# Deploy a preview
npx vercel

# Deploy a producción
npx vercel --prod

# Ver logs
npx vercel logs

# Ver variables de entorno
npx vercel env ls
```

### Netlify

```bash
# Instalar Netlify CLI
npm install -D netlify-cli

# Login
npx netlify login

# Deploy
npx netlify deploy

# Deploy a producción
npx netlify deploy --prod
```

### Build Manual

```bash
# Build optimizado
npm run build

# Servir build
npm run start

# Build para exportar estático (si aplica)
next build && next export
```

---

## 🧹 Limpieza y Mantenimiento

```bash
# Limpiar caché de Next.js
rm -rf .next

# Limpiar caché de npm
npm cache clean --force

# Limpiar todo y reinstalar
rm -rf .next node_modules package-lock.json
npm install

# Ver espacio ocupado
du -sh .next node_modules

# Limpiar builds antiguos
rm -rf .next/cache
```

---

## 🔄 Git (Control de Versiones)

```bash
# Inicializar repo (ya hecho)
git init

# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Ver historial
git log --oneline

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Merge a main
git checkout main
git merge feature/nueva-funcionalidad

# Deshacer cambios
git reset --hard HEAD
```

---

## 📝 Generadores de Código

```bash
# Crear nuevo componente (script personalizado)
echo "export default function MiComponente() { return <div>Nuevo</div>; }" > components/MiComponente.tsx

# Crear nueva página Next.js
mkdir -p app/nueva-ruta
echo "export default function Page() { return <div>Nueva Ruta</div>; }" > app/nueva-ruta/page.tsx

# Crear API route
mkdir -p app/api/mi-endpoint
echo "export async function GET() { return Response.json({ message: 'Hola' }); }" > app/api/mi-endpoint/route.ts
```

---

## 🔍 Debugging

```bash
# Ejecutar con debugging de Node.js
NODE_OPTIONS='--inspect' npm run dev

# Ver en Chrome DevTools: chrome://inspect

# Logs detallados de Next.js
DEBUG=* npm run dev

# Solo logs de Next.js
DEBUG=next:* npm run dev

# Profiling de rendimiento
NODE_ENV=production npm run build -- --profile
```

---

## 📦 Optimización

```bash
# Minificar imágenes
npm install -D next-optimized-images imagemin

# Comprimir con Gzip
npm install -D compression

# Lazy loading de componentes
# En el código:
# const Component = dynamic(() => import('./Component'))

# Pre-carga de rutas
# En el código:
# import { prefetch } from 'next/navigation'
```

---

## 🌐 Internacionalización (i18n)

```bash
# Instalar next-intl
npm install next-intl

# Crear archivos de traducciones
mkdir -p locales/es locales/en
echo '{"welcome": "Bienvenido"}' > locales/es/common.json
echo '{"welcome": "Welcome"}' > locales/en/common.json
```

---

## 🔒 Seguridad

```bash
# Auditoría de seguridad
npm audit

# Fix automático de vulnerabilidades
npm audit fix

# Fix forzado (puede romper compatibilidad)
npm audit fix --force

# Ver dependencias con vulnerabilidades
npm audit --audit-level=moderate
```

---

## 📊 Performance Monitoring

```bash
# Lighthouse CI
npm install -D @lhci/cli
npx lhci autorun

# Web Vitals
# Ya incluido en Next.js:
# app/layout.tsx -> export { reportWebVitals }

# Sentry (Error tracking)
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 🎯 Atajos de Teclado en VS Code

```
Cmd + P          → Buscar archivo
Cmd + Shift + P  → Command palette
Cmd + B          → Toggle sidebar
Cmd + /          → Comentar línea
Opt + Shift + F  → Formatear documento
Cmd + D          → Seleccionar siguiente ocurrencia
F12              → Ir a definición
Cmd + .          → Quick fix
```

---

## 🚨 Solución de Problemas Comunes

```bash
# Error: Puerto en uso
lsof -ti:3000 | xargs kill -9
# o
killall -9 node

# Error: Module not found
rm -rf node_modules .next
npm install

# Error: Tailwind no funciona
npx tailwindcss -i ./app/globals.css -o ./output.css --watch

# Error: Types incorrectos
npx tsc --noEmit
rm -rf node_modules/@types
npm install

# Error: Build falla
rm -rf .next
npm run build -- --debug
```

---

## 📚 Recursos Útiles

```bash
# Documentación Next.js
open https://nextjs.org/docs

# Documentación Tailwind
open https://tailwindcss.com/docs

# Worldcoin Docs
open https://docs.worldcoin.org

# Ver este archivo en VS Code
code COMMANDS.md
```

---

**💡 Tip:** Agrega alias a tu `.bashrc` o `.zshrc`:

```bash
alias ndev="npm run dev"
alias nbuild="npm run build"
alias nstart="npm run start"
alias nclean="rm -rf .next node_modules package-lock.json && npm install"
```

Luego podrás usar `ndev` en lugar de `npm run dev`.
