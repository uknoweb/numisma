# 💎 Numisma - Plataforma Educativa de Trading

**Numisma** es una mini app de Worldcoin que combina educación financiera con gamificación, utilizando el token de utilidad **NUMA** para incentivar el aprendizaje de trading de futuros.

## 🎯 Características Principales

### 🔐 Verificación World ID
- Acceso exclusivo mediante verificación World ID (MiniKit)
- Garantía de usuarios únicos verificados por Orb
- Seguridad respaldada por Smart Contracts en World Chain

### 📊 Predictor (Trading Simulado)
- Trading educativo de futuros con posiciones LONG/SHORT
- Apalancamiento desde x2 hasta x500 (según membresía)
- Gráficos en tiempo real con múltiples timeframes
- PnL (Profit and Loss) actualizado en vivo
- Historial completo de posiciones abiertas y cerradas

### 💰 Sistema de Membresías
| Tier | Precio | Recompensa Diaria | Apalancamiento Máx. |
|------|--------|-------------------|---------------------|
| **Free** | Gratis | 50 → 10 NUMA* | x10 |
| **Plus** | 5 WLD/mes | 200 → 100 NUMA* | x30 |
| **VIP** | 15 WLD/6 meses | 500 → 250 NUMA* | x500 |

*Las recompensas se reducen después de 3 meses de membresía activa.

### 🏆 Club de los 100 Pioneros
Sistema de inversión de élite con beneficios premium:

#### Compromiso
- **Candado**: Capital bloqueado por 1 año
- **Recompensa**: 5% de las ganancias netas totales de la plataforma
- **Pagos**: Cada 15 días automáticamente

#### Créditos Garantizados
- Préstamos de hasta **90%** del capital bloqueado
- Tarifa fija del **5%** sobre el colateral total
- Margen de protección del **10%**

#### Penalizaciones
- Retiro anticipado: **20%** de penalización
- Impago de préstamo: Pérdida del margen (10%) + expulsión permanente

### 🔄 Swap NUMA → WLD
- Conversión directa con tasa fija: **1 NUMA = 0.001 WLD**
- Comisión del **3%** sobre cada swap
- Proceso instantáneo

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js >= 20.9.0 (actualmente usando v18, actualizar recomendado)
- npm o yarn

### Instalación

```bash
# Navegar al directorio
cd /Users/capote/Desktop/numisma

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Comandos Disponibles

```bash
npm run dev      # Modo desarrollo con hot-reload
npm run build    # Build para producción
npm run start    # Ejecutar build de producción
npm run lint     # Linter ESLint
```

## 📱 Navegación de la App

### 1. Verificación World ID
- Pantalla inicial con botón "Verificar con World ID"
- Simulación de 2 segundos (integración real pendiente)
- Una vez verificado, acceso al Dashboard

### 2. Dashboard Principal
Muestra:
- Balance de NUMA y WLD
- Ganancias/Pérdidas totales (en MXN u otra moneda local)
- Estado de membresía y tiempo restante
- Recompensa diaria actual
- 3 botones principales:
  - **Plataforma**: Trading y gráficos
  - **Staking**: Swap, membresías, pioneros, reclamos
  - **Créditos**: (Próximamente) Préstamos para Pioneros

### 3. Plataforma de Trading
- **Tutorial desplegable**: Explicación de LONG, SHORT, apalancamiento, PnL
- **Historial de posiciones**: Abiertas y cerradas
- **Botón "Abrir Gráfico"**: Modal fullscreen con:
  - Gráfico de velas simulado (BTC/USDT)
  - Selector de timeframe (1s, 1m, 5m, 10m, 30m)
  - Panel de configuración (cantidad NUMA, apalancamiento)
  - Botones LONG/SHORT para abrir posiciones
  - Actualización de PnL en tiempo real

### 4. Staking
- **Reclamo de Recompensas**: Botón para reclamar NUMA diario (1 vez cada 24h)
- **Swap NUMA → WLD**: Convertir tokens con preview de comisión del 3%
- **Compra de Membresías**: Tarjetas comparativas Free/Plus/VIP
- **Ranking de Pioneros**: Top 100 con capital bloqueado y próximo pago
- **Tutorial de Pioneros**: Desplegable con todas las reglas del sistema

## 🎨 Diseño

### Paleta de Colores
- **Primario**: Dorado (#FFD700) - Elegancia y valor
- **Secundario**: Negro profundo (#0a0a0a) - Sofisticación
- **Acentos**: 
  - Éxito: Verde (#10b981)
  - Error: Rojo (#ef4444)
  - Advertencia: Naranja (#f59e0b)

### Estilo Visual
- Minimalista y limpio (inspirado en Coinbase/Robinhood)
- Glassmorphism sutil en tarjetas
- Gradientes de dorado a negro
- Scrollbar personalizado (dorado)

## 📊 Stack Tecnológico

- **Next.js 16** (App Router) + React 19
- **TypeScript** para type safety
- **Tailwind CSS v4** para estilos
- **Zustand** para estado global
- **Recharts** para gráficos
- **Radix UI** para componentes accesibles
- **Lucide React** para iconografía

## ⚠️ Disclaimer

Esta es una plataforma **educativa**. Las operaciones de trading NO operan contra el mercado real, sino contra un Pool de Riesgo simulado. El objetivo es aprender trading de futuros sin riesgo financiero real.

---

**Hecho con 💛 para el ecosistema de Worldcoin**
