# 🚀 Guía de Inicio Rápido - Numisma

## ⚠️ Requisito Importante: Actualizar Node.js

**Tu versión actual:** Node.js v18.20.8  
**Versión requerida:** Node.js >= 20.9.0

### Opción 1: Actualizar con Homebrew (Recomendado para macOS)

```bash
# Actualizar Homebrew
brew update

# Instalar Node.js LTS más reciente
brew install node@20

# Verificar la versión
node --version
```

### Opción 2: Usando nvm (Node Version Manager)

```bash
# Si no tienes nvm, instálalo primero:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Cerrar y reabrir la terminal, luego:
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version
```

### Opción 3: Descargar desde nodejs.org

1. Visita [https://nodejs.org](https://nodejs.org)
2. Descarga la versión **LTS (20.x)**
3. Instala el paquete
4. Reinicia la terminal
5. Verifica con `node --version`

---

## 🎯 Ejecutar la Aplicación

Una vez actualizado Node.js:

```bash
# 1. Navegar al proyecto
cd /Users/capote/Desktop/numisma

# 2. Instalar dependencias (si no lo has hecho)
npm install

# 3. Ejecutar en modo desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🧪 Prueba de Funcionalidades

### ✅ Checklist de Testing

1. **Verificación World ID**
   - [ ] Hacer clic en "Verificar con World ID"
   - [ ] Esperar 2 segundos (simulación)
   - [ ] Confirmar que redirige al Dashboard

2. **Dashboard**
   - [ ] Verificar que muestra balances (1000 NUMA, 10 WLD)
   - [ ] Confirmar que se muestran los 3 botones principales
   - [ ] Revisar que la membresía es "Gratis"

3. **Plataforma de Trading**
   - [ ] Hacer clic en "Plataforma"
   - [ ] Abrir tutorial desplegable
   - [ ] Hacer clic en "Abrir Gráfico de Trading"
   - [ ] Cambiar timeframes (1s, 1m, 5m, 10m, 30m)
   - [ ] Configurar cantidad y apalancamiento
   - [ ] Abrir una posición LONG
   - [ ] Abrir una posición SHORT
   - [ ] Verificar que el PnL se actualiza cada segundo
   - [ ] Cerrar el gráfico y volver al Dashboard

4. **Staking**
   - [ ] Hacer clic en "Staking"
   - [ ] Intentar reclamar recompensa diaria (50 NUMA)
   - [ ] Confirmar que aparece mensaje "Ya Reclamado Hoy"
   - [ ] Probar Swap NUMA → WLD (ej: 100 NUMA)
   - [ ] Verificar preview con comisión del 3%
   - [ ] Ejecutar swap y confirmar actualización de balances
   - [ ] Revisar tarjetas de membresías (Free, Plus, VIP)
   - [ ] Abrir tutorial de Pioneros y leer todas las secciones
   - [ ] Volver al Dashboard

5. **Navegación**
   - [ ] Confirmar que "Volver al Menú" funciona en todas las pantallas
   - [ ] Verificar que el estado se persiste (recargar página)

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module..."

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 is already in use"

```bash
# Opción 1: Cambiar puerto
PORT=3001 npm run dev

# Opción 2: Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error en Tailwind CSS

```bash
# Limpiar caché de Next.js
rm -rf .next
npm run dev
```

### Errores de TypeScript

```bash
# Verificar tipos
npx tsc --noEmit

# Si hay errores, revisar los archivos reportados
```

---

## 📦 Build para Producción

Cuando estés listo para desplegar:

```bash
# 1. Crear build optimizado
npm run build

# 2. Probar build localmente
npm run start
```

El build estará en `.next/` y listo para desplegar en Vercel, Netlify, o cualquier hosting compatible con Next.js.

---

## 🔧 Próximos Pasos de Desarrollo

### Backend (Prioridad Alta)
1. Integrar MiniKit SDK para World ID real
2. Desarrollar Smart Contracts en Solidity
3. Configurar conexión a World Chain (RPC de Alchemy)
4. Implementar API routes en Next.js

### Mejoras de UX (Prioridad Media)
1. Agregar animaciones con Framer Motion
2. Implementar modo claro/oscuro toggle
3. Añadir sonidos de notificación
4. Mejorar responsive mobile

### Features Adicionales (Backlog)
1. Sistema de notificaciones push
2. Historial de transacciones detallado
3. Estadísticas de usuario (win rate, ROI)
4. Sistema de referidos
5. Integración con billeteras externas (MetaMask, WalletConnect)

---

## 📞 Contacto

Si encuentras algún bug o tienes sugerencias:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

**¡Feliz trading educativo! 💎**
