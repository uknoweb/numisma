"use client";

import { useState } from "react";
import { useAppStore, getCurrentDailyReward } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowLeftRight,
  Crown,
  Trophy,
  Gift,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  formatNumber,
  formatCurrency,
  calculateSwapWithFee,
  formatTimeRemaining,
} from "@/lib/utils";
import { PIONEER_CONFIG, MEMBERSHIP_PRICES, VIP_LOAN_CONFIG } from "@/lib/types";

export default function Staking() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const user = useAppStore((state) => state.user);
  const lastClaim = useAppStore((state) => state.lastClaim);
  const setLastClaim = useAppStore((state) => state.setLastClaim);
  const canClaim = useAppStore((state) => state.canClaim);
  const updateBalance = useAppStore((state) => state.updateBalance);
  const updateMembership = useAppStore((state) => state.updateMembership);
  const pioneers = useAppStore((state) => state.pioneers);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);
  const setCurrentUserPioneer = useAppStore((state) => state.setCurrentUserPioneer);
  const setPioneers = useAppStore((state) => state.setPioneers);

  const [showPioneerTutorial, setShowPioneerTutorial] = useState(false);
  const [swapAmount, setSwapAmount] = useState(100);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<"plus" | "vip">(
    "plus"
  );
  const [showPioneerDialog, setShowPioneerDialog] = useState(false);
  const [pioneerAmount, setPioneerAmount] = useState(50);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!user) return null;

  // Cálculos
  const { wldReceived, fee } = calculateSwapWithFee(swapAmount);
  const canClaimReward = canClaim();
  const dailyReward = getCurrentDailyReward(
    user.membership.tier,
    user.createdAt
  );

  // Próximo reclamo
  const nextClaimTime = lastClaim
    ? new Date(new Date(lastClaim).getTime() + 24 * 60 * 60 * 1000)
    : new Date();
  const timeUntilNextClaim = canClaimReward
    ? "Disponible ahora"
    : formatTimeRemaining(nextClaimTime);

  const handleClaim = () => {
    if (!canClaimReward) return;
    updateBalance(user.balanceNuma + dailyReward, user.balanceWld);
    setLastClaim(new Date());
  };

  const handleSwap = () => {
    if (swapAmount <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }
    if (swapAmount > user.balanceNuma) {
      alert('No tienes suficiente NUMA');
      return;
    }
    updateBalance(user.balanceNuma - swapAmount, user.balanceWld + wldReceived);
    setSwapAmount(100);
  };

  const handlePurchaseMembership = () => {
    const price =
      selectedMembership === "plus"
        ? MEMBERSHIP_PRICES.plus
        : MEMBERSHIP_PRICES.vip;
    
    const duration = selectedMembership === "plus" ? 30 : 90; // Plus: 1 mes, VIP: 3 meses
    
    if (user.balanceWld < price) {
      alert(`❌ Balance insuficiente. Necesitas ${price} WLD`);
      return;
    }

    // Descontar del balance y activar membresía
    updateBalance(user.balanceNuma, user.balanceWld - price);
    updateMembership(selectedMembership, duration);
    setShowMembershipDialog(false);
    
    const message = selectedMembership === "vip"
      ? `✅ Membresía VIP activada por 3 meses!\n\n` +
        `💡 Después del 6to mes podrás pagar mensualmente (15 WLD/mes)\n` +
        `🎁 Al año de membresía: Acceso a préstamo de 60 WLD con tasa preferencial`
      : `✅ Membresía PLUS activada por 1 mes!`;
    
    alert(message);
  };

  // Validar y confirmar para convertirse en Pionero
  const handleConfirmPioneer = () => {
    if (!acceptedTerms) {
      alert('❌ Debes aceptar los términos y condiciones');
      return;
    }

    if (pioneerAmount < 50) {
      alert('❌ El mínimo es 50 WLD');
      return;
    }

    if (pioneerAmount > user.balanceWld) {
      alert(`❌ Balance insuficiente. Tienes ${user.balanceWld.toFixed(2)} WLD`);
      return;
    }

    // Crear 100 pioneros ficticios con capital variado
    const mockPioneers = [];
    for (let i = 1; i <= 100; i++) {
      mockPioneers.push({
        id: `pioneer_${i}`,
        userId: i === 1 ? user.id : `user_${i}`,
        walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        capitalLocked: i === 1 ? pioneerAmount : Math.random() * 200 + 50,
        lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        earningsAccumulated: 0,
        hasActiveLoan: false,
        rank: 0,
        joinedAt: new Date(),
        nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
    }

    mockPioneers.sort((a, b) => b.capitalLocked - a.capitalLocked);
    mockPioneers.forEach((p, idx) => { p.rank = idx + 1; });

    const userPioneer = mockPioneers.find(p => p.userId === user.id);
    
    if (userPioneer) {
      setPioneers(mockPioneers);
      setCurrentUserPioneer(userPioneer);
      updateBalance(user.balanceNuma, user.balanceWld - pioneerAmount);
      
      setShowPioneerDialog(false);
      setAcceptedTerms(false);
      setPioneerAmount(50);
      
      alert(
        `✅ ¡Bienvenido al Club de Pioneros!\n\n` +
        `Ranking: #${userPioneer.rank} de 100\n` +
        `Capital Bloqueado: ${pioneerAmount} WLD\n` +
        `Duración: 1 año\n\n` +
        `${userPioneer.rank <= 100 
          ? '🏆 ACCESO A CRÉDITOS ACTIVADO\n5% de ganancias totales cada 15 días' 
          : '⏳ Aumenta tu capital para acceder a Créditos (Top 100)'
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <Button
            onClick={() => setCurrentView("dashboard")}
            variant="ghost"
            className="text-[--color-gold] hover:text-[--color-gold]/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-[--color-gold]">💰 Staking</h1>
          <div className="w-20" />
        </div>

        {/* Reclamo de Recompensas */}
        <Card className="border-[--color-gold]/20 bg-gradient-to-r from-[--color-gray-900] to-[--color-gray-800]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[--color-gold]" />
              Reclamo de Recompensas Diarias
            </CardTitle>
            <CardDescription>
              Reclama tus {dailyReward} NUMA cada 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[--color-gray-900] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Recompensa Actual</div>
                <div className="text-2xl font-bold text-[--color-gold]">
                  {dailyReward} NUMA
                </div>
              </div>
              <div className="bg-[--color-gray-900] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Próximo Reclamo</div>
                <div className="text-lg font-semibold text-white">
                  {timeUntilNextClaim}
                </div>
              </div>
              <div className="bg-[--color-gray-900] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Plan</div>
                <div className="text-lg font-semibold text-[--color-gold]">
                  {user.membership.tier.toUpperCase()}
                </div>
              </div>
            </div>

            <Button
              onClick={handleClaim}
              disabled={!canClaimReward}
              size="lg"
              className="w-full gap-2"
            >
              <Gift className="w-5 h-5" />
              {canClaimReward ? "Reclamar Ahora" : "Ya Reclamado Hoy"}
            </Button>

            <div className="bg-[--color-gray-900] rounded-lg p-3 text-xs text-gray-400">
              <Info className="w-4 h-4 inline mr-1 text-[--color-gold]" />
              Las recompensas se reducen después de 3 meses de membresía activa.
            </div>
          </CardContent>
        </Card>

        {/* Swap NUMA → WLD */}
        <Card className="border-[--color-gold]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[--color-gold]" />
              Swap NUMA → WLD
            </CardTitle>
            <CardDescription>Convierte tus tokens con 3% de comisión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="swap-amount" className="text-sm text-gray-400 block mb-2">
                Cantidad de NUMA
              </label>
              <input
                id="swap-amount"
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(Number(e.target.value))}
                className="w-full bg-[--color-gray-900] border border-[--color-gray-700] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[--color-gold]"
                min={1}
                max={user.balanceNuma}
                aria-label="Cantidad de NUMA para swap"
              />
              <div className="text-xs text-gray-500 mt-1">
                Disponible: {formatNumber(user.balanceNuma, 0)} NUMA
              </div>
            </div>

            <div className="bg-[--color-gray-900] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tasa de Cambio</span>
                <span className="text-white">1 NUMA = 0.001 WLD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Comisión (3%)</span>
                <span className="text-[--color-warning]">
                  {formatNumber(fee, 4)} WLD
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-[--color-gray-700]">
                <span className="text-gray-300">Recibirás</span>
                <span className="text-[--color-gold]">
                  {formatNumber(wldReceived, 4)} WLD
                </span>
              </div>
            </div>

            <Button
              onClick={handleSwap}
              disabled={swapAmount > user.balanceNuma || swapAmount < 1}
              size="lg"
              className="w-full gap-2"
            >
              <ArrowLeftRight className="w-5 h-5" />
              Intercambiar
            </Button>
          </CardContent>
        </Card>

        {/* Membresías */}
        <Card className="border-[--color-gold]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[--color-gold]" />
              Membresías
            </CardTitle>
            <CardDescription>
              Desbloquea más recompensas y apalancamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {/* Free */}
            <div className={`bg-[--color-gray-800] rounded-lg p-4 border-2 ${user.membership.tier === 'free' ? 'border-gray-500' : 'border-gray-700'}`}>
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-gray-400">Gratis</div>
                <div className="text-3xl font-bold text-white">$0</div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">50 → 10 NUMA/día</div>
                  <div className="text-gray-300">Apalancamiento x2-x10</div>
                </div>
                <Button disabled variant="ghost" className="w-full">
                  {user.membership.tier === 'free' ? 'Actual' : 'Gratis'}
                </Button>
              </div>
            </div>

            {/* Plus */}
            <button
              onClick={() => {
                setSelectedMembership("plus");
                setShowMembershipDialog(true);
              }}
              className={`bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg p-4 border-2 transition-all ${
                selectedMembership === 'plus' 
                  ? 'border-blue-400 shadow-lg shadow-blue-500/20 scale-[1.02]' 
                  : 'border-blue-500 hover:border-blue-400'
              } ${user.membership.tier === 'plus' ? 'ring-2 ring-blue-400' : ''}`}
            >
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-blue-400">Plus</div>
                <div className="text-3xl font-bold text-white">
                  5 WLD<span className="text-sm text-gray-400">/mes</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">200 → 100 NUMA/día</div>
                  <div className="text-gray-300">Apalancamiento x2-x30</div>
                </div>
                <div className="w-full h-10 rounded-md bg-blue-500 text-white font-semibold flex items-center justify-center">
                  {user.membership.tier === 'plus' ? '✓ Activa' : 'Seleccionar'}
                </div>
              </div>
            </button>

            {/* VIP */}
            <button
              onClick={() => {
                setSelectedMembership("vip");
                setShowMembershipDialog(true);
              }}
              className={`bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 rounded-lg p-4 border-2 transition-all ${
                selectedMembership === 'vip' 
                  ? 'border-[#FFD700] shadow-lg shadow-[#FFD700]/20 scale-[1.02]' 
                  : 'border-[#FFD700]/50 hover:border-[#FFD700]'
              } ${user.membership.tier === 'vip' ? 'ring-2 ring-[#FFD700]' : ''}`}
            >
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-[#FFD700] flex items-center justify-center gap-1">
                  <Crown className="w-4 h-4" />
                  VIP
                </div>
                <div className="text-3xl font-bold text-white">
                  45 WLD<span className="text-sm text-gray-400">/3 meses</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">500 → 250 NUMA/día</div>
                  <div className="text-[#FFD700] font-semibold">
                    Apalancamiento x2-x500
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    💎 Pago mensual después del mes 6
                  </div>
                  <div className="text-xs text-green-400">
                    🎁 Préstamo 60 WLD tras 1 año
                  </div>
                </div>
                <div className="btn-gold w-full h-10 flex items-center justify-center text-sm">
                  {user.membership.tier === 'vip' ? '✓ Activa' : 'Seleccionar'}
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Ranking de Pioneros */}
        <Card className="border-[--color-gold]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[--color-gold]" />
                <CardTitle>Top 100 Pioneros</CardTitle>
              </div>
              <Button
                onClick={() => setShowPioneerTutorial(!showPioneerTutorial)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                {showPioneerTutorial ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {showPioneerTutorial ? "Ocultar" : "Ver"} Requisitos
              </Button>
            </div>
            <CardDescription>
              Los 100 usuarios con mayor capital bloqueado ganan 5% de las ganancias totales + acceso a Créditos
            </CardDescription>
          </CardHeader>

          {/* Estado del Usuario Pioneer */}
          {currentUserPioneer && (
            <CardContent className="border-t border-[--color-gray-700] pt-4 pb-4">
              <div className={`rounded-lg p-4 ${currentUserPioneer.rank <= 100 ? 'bg-gradient-to-r from-[#FFD700]/10 to-[#D4AF37]/10 border border-[#FFD700]/30' : 'bg-[--color-gray-800] border border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {currentUserPioneer.rank <= 100 ? (
                        <>
                          <Trophy className="w-4 h-4 text-[#FFD700]" />
                          🏆 Eres Pionero Elite
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 text-gray-500" />
                          ⏳ En Lista de Espera
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Ranking: #{currentUserPioneer.rank} • Capital: {formatNumber(currentUserPioneer.capitalLocked, 2)} WLD
                    </div>
                  </div>
                  {currentUserPioneer.rank <= 100 && (
                    <div className="text-right">
                      <div className="text-xs text-[#FFD700] font-semibold">✅ CRÉDITOS ACTIVOS</div>
                      <div className="text-xs text-gray-500">Puedes solicitar préstamos</div>
                    </div>
                  )}
                  {currentUserPioneer.rank > 100 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-semibold">🔒 CRÉDITOS BLOQUEADOS</div>
                      <div className="text-xs text-gray-600">Debes estar en Top 100</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}

          {showPioneerTutorial && (
            <CardContent className="space-y-4 border-t border-[--color-gray-700] pt-6">
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  El Club de los 100 Pioneros
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  El sistema de Pioneros es la columna vertebral de Numisma, diseñado
                  para asegurar una base de capital masiva y comprometida a largo
                  plazo.
                </p>
              </div>

              {/* Tabla de Compromiso y Recompensa */}
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] text-sm">
                  💰 Compromiso y Recompensa
                </h4>
                <table className="w-full text-sm">
                  <tbody className="space-y-2">
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Límite de Élite</td>
                      <td className="py-2 text-white text-right">
                        100 usuarios (compitiendo por el puesto)
                      </td>
                    </tr>
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Candado de Capital</td>
                      <td className="py-2 text-white text-right">
                        Bloqueado por <strong className="text-[--color-gold]">1 año</strong>
                      </td>
                    </tr>
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Recompensa por Asociación</td>
                      <td className="py-2 text-[--color-gold] text-right font-semibold">
                        5% de las ganancias netas totales
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-400">Pago de Ganancias</td>
                      <td className="py-2 text-white text-right">
                        Automático, cada <strong>15 días</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Penalización por Retiro Anticipado */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-red-400 text-sm">
                  🚨 Disciplina: Retiro Anticipado
                </h4>
                <p className="text-sm text-gray-300">
                  Si un Pionero intenta transferir, vender o retirar su capital base
                  antes de cumplir el año, se aplica una{" "}
                  <strong className="text-red-400">penalización del 20%</strong> de su
                  inversión total neta.
                </p>
                <ul className="text-xs text-gray-400 space-y-1 ml-4">
                  <li>
                    • <strong className="text-white">Penalización:</strong> 20% va al
                    Fondo de Respaldo del Creador
                  </li>
                  <li>
                    • <strong className="text-white">Retorno:</strong> 80% restante
                    devuelto al Pionero
                  </li>
                </ul>
              </div>

              {/* Modelo de Crédito Blindado */}
              <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[--color-gold] text-sm">
                  🏦 Modelo de Crédito Blindado
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Los Pioneros pueden solicitar préstamos contra su capital bloqueado
                  sin necesidad de venderlo.
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Préstamo Máximo</td>
                      <td className="py-2 text-white text-right">
                        <strong className="text-[--color-gold]">90%</strong> del
                        colateral
                      </td>
                    </tr>
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Margen de Protección</td>
                      <td className="py-2 text-white text-right">
                        10% (nunca se presta)
                      </td>
                    </tr>
                    <tr className="border-b border-[--color-gray-700]">
                      <td className="py-2 text-gray-400">Tarifa de Liberación</td>
                      <td className="py-2 text-[--color-warning] text-right font-semibold">
                        5% fijo del Colateral Total
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-400">Repago Total</td>
                      <td className="py-2 text-white text-right">
                        Monto Prestado + Tarifa
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ejemplo Práctico */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-green-400 text-sm">
                  💡 Ejemplo Práctico
                </h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>
                    <strong className="text-white">Colateral Bloqueado:</strong> 10,000
                    WLD
                  </div>
                  <div>
                    <strong className="text-white">Préstamo (90%):</strong> 9,000 WLD
                  </div>
                  <div>
                    <strong className="text-white">Tarifa (5%):</strong> 500 WLD
                  </div>
                  <div className="pt-2 border-t border-green-500/30">
                    <strong className="text-green-400">Repago Total:</strong> 9,500 WLD
                    para recuperar los 10,000 WLD bloqueados
                  </div>
                </div>
              </div>

              {/* Consecuencia de Impago */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-red-400 text-sm">
                  🛑 Consecuencia por Impago
                </h4>
                <p className="text-sm text-gray-300">
                  Si el Pionero no repaga el préstamo + tarifa en el plazo estipulado:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 ml-4">
                  <li>• El Pionero pierde el 10% de margen ($1,000 en el ejemplo)</li>
                  <li>
                    • Es expulsado permanentemente de la lista Top 100, sin poder
                    recuperar ese estatus
                  </li>
                  <li>
                    • El colateral pasa al Fondo de Respaldo del creador
                  </li>
                </ul>
              </div>
            </CardContent>
          )}

          <CardContent className="space-y-4">
            {/* Botón para Convertirse en Pionero */}
            {!currentUserPioneer && (
              <button
                onClick={() => setShowPioneerDialog(true)}
                className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/30 transition-all"
              >
                🏆 Convertirse en Pionero Elite
                <span className="text-xs opacity-80">Mín. 50 WLD</span>
              </button>
            )}
            
            {pioneers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  No hay pioneros registrados aún. ¡Sé el primero en bloquear
                  capital!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pioneers.slice(0, 10).map((pioneer, index) => (
                  <div
                    key={pioneer.userId}
                    className="bg-[--color-gray-800] rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-[--color-gold] text-[--color-black]"
                            : index === 1
                            ? "bg-gray-400 text-[--color-black]"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-[--color-gray-700] text-gray-400"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm text-white font-mono">
                          {pioneer.walletAddress.slice(0, 10)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          Próximo pago:{" "}
                          {formatTimeRemaining(pioneer.nextPaymentDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[--color-gold]">
                        {formatNumber(pioneer.capitalLocked, 2)} WLD
                      </div>
                      <div className="text-xs text-gray-500">
                        +{formatNumber(pioneer.earningsAccumulated, 2)} ganado
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Compra de Membresía */}
      <Dialog open={showMembershipDialog} onOpenChange={setShowMembershipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Comprar Membresía {selectedMembership.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {selectedMembership === "vip" 
                ? "Plan VIP con beneficios exclusivos y acceso a préstamos"
                : "Confirma la compra de tu membresía premium"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Precio Inicial</span>
                <span className="text-white font-semibold">
                  {selectedMembership === "plus"
                    ? `${MEMBERSHIP_PRICES.plus} WLD/mes`
                    : `${MEMBERSHIP_PRICES.vip} WLD (3 meses adelantados)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recompensa Diaria</span>
                <span className="text-[--color-gold] font-semibold">
                  {selectedMembership === "plus" ? "200 → 100" : "500 → 250"} NUMA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Apalancamiento Máx.</span>
                <span className="text-[--color-gold] font-semibold">
                  x{selectedMembership === "plus" ? "30" : "500"}
                </span>
              </div>
            </div>

            {selectedMembership === "vip" && (
              <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#D4AF37]/5 border border-[#FFD700]/30 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-[--color-gold] text-sm">🎁 Beneficios Exclusivos VIP</h4>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-start gap-2">
                    <div className="text-[--color-gold] mt-0.5">•</div>
                    <div>
                      <strong className="text-white">Mes 1-3:</strong> Pago adelantado de 45 WLD
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-blue-400 mt-0.5">•</div>
                    <div>
                      <strong className="text-white">Después del mes 6:</strong> Opción de pago mensual (15 WLD/mes)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-green-400 mt-0.5">•</div>
                    <div>
                      <strong className="text-white">Al cumplir 1 año:</strong> Acceso a préstamo de <strong className="text-green-400">60 WLD</strong> con tasa preferencial del 8%
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-amber-400 mt-0.5">•</div>
                    <div>
                      <strong className="text-white">Condiciones del préstamo:</strong> 30 días para pagar. Si no pagas, se congelará tu wallet hasta completar el pago total.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-400">
              Balance disponible: {formatNumber(user.balanceWld, 2)} WLD
            </div>
            <Button
              onClick={handlePurchaseMembership}
              disabled={
                user.balanceWld <
                (selectedMembership === "plus"
                  ? MEMBERSHIP_PRICES.plus
                  : MEMBERSHIP_PRICES.vip)
              }
              className="w-full"
              size="lg"
            >
              Confirmar Compra {selectedMembership === "vip" ? `- ${MEMBERSHIP_PRICES.vip} WLD` : `- ${MEMBERSHIP_PRICES.plus} WLD`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Convertirse en Pionero */}
      <Dialog open={showPioneerDialog} onOpenChange={setShowPioneerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[--color-gold] flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Convertirse en Pionero Elite
            </DialogTitle>
            <DialogDescription>
              Esta es una decisión ÚNICA e IRREVOCABLE. Lee cuidadosamente antes de continuar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Advertencia Crítica */}
            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-400 mb-2">DECISIÓN ÚNICA EN LA VIDA</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Solo puedes convertirte en Pionero <strong className="text-red-400">UNA VEZ</strong>. 
                    El capital quedará bloqueado por <strong className="text-red-400">1 AÑO COMPLETO</strong>. 
                    Asegúrate de estar 100% seguro de la cantidad que vas a comprometer.
                  </p>
                </div>
              </div>
            </div>

            {/* Input de cantidad */}
            <div className="bg-[--color-gray-800] rounded-lg p-4 space-y-3">
              <label className="text-sm font-semibold text-[--color-gold] block">
                Cantidad a Bloquear (Mínimo: 50 WLD)
              </label>
              <input
                type="number"
                value={pioneerAmount}
                onChange={(e) => setPioneerAmount(Number(e.target.value))}
                min={50}
                step={10}
                aria-label="Cantidad a bloquear en WLD"
                className="w-full bg-[--color-gray-900] border-2 border-[--color-gold]/30 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-[--color-gold]"
              />
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Disponible: {formatNumber(user.balanceWld, 2)} WLD</span>
                <span className={pioneerAmount >= 50 ? "text-green-400" : "text-red-400"}>
                  {pioneerAmount >= 50 ? "✓ Válido" : "✗ Mínimo 50 WLD"}
                </span>
              </div>
            </div>

            {/* Beneficios Garantizados */}
            <div className="bg-gradient-to-br from-[--color-gold]/10 to-[--color-gold]/5 border border-[--color-gold]/30 rounded-lg p-4">
              <h4 className="font-bold text-[--color-gold] mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Beneficios como Pionero Elite
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="text-[--color-gold]">✓</div>
                  <div>
                    <strong className="text-white">5% de ganancias totales</strong> de la plataforma distribuidas cada 15 días
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="text-[--color-gold]">✓</div>
                  <div>
                    <strong className="text-white">Acceso a Créditos</strong> si estás en Top 100 (hasta 90% de tu capital)
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="text-[--color-gold]">✓</div>
                  <div>
                    <strong className="text-white">Prioridad en governance</strong> y decisiones de la plataforma
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <div className="text-[--color-gold]">✓</div>
                  <div>
                    <strong className="text-white">Badge exclusivo</strong> de Pionero en tu perfil
                  </div>
                </div>
              </div>
            </div>

            {/* Penalizaciones */}
            <div className="bg-[--color-gray-800] rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-3">⚠️ Penalizaciones por Retiro Anticipado</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="text-red-400">•</div>
                  <div>
                    <strong className="text-white">20% de penalización</strong> si retiras antes de 1 año
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-red-400">•</div>
                  <div>
                    Expulsión permanente del club de Pioneros
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-red-400">•</div>
                  <div>
                    Pérdida de acceso a Créditos y beneficios
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox de aceptación */}
            <div className="bg-[--color-gray-900] border-2 border-[--color-gold]/50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[--color-gold]"
                  aria-label="Aceptar términos pionero"
                />
                <span className="text-sm text-gray-200 leading-relaxed">
                  <strong className="text-white">Confirmo que he leído y entendido</strong> todas las condiciones. 
                  Acepto que mi capital de <strong className="text-[--color-gold]">{pioneerAmount} WLD</strong> quedará 
                  bloqueado por 1 año completo. Entiendo que esta decisión es <strong className="text-red-400">única e irrevocable</strong>.
                </span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowPioneerDialog(false);
                  setAcceptedTerms(false);
                  setPioneerAmount(50);
                }}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmPioneer}
                disabled={!acceptedTerms || pioneerAmount < 50 || pioneerAmount > user.balanceWld}
                className="flex-1 bg-[--color-gold] text-black hover:bg-[--color-gold]/90 font-bold"
                size="lg"
              >
                Confirmar y Bloquear {pioneerAmount} WLD
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
