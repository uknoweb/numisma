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
import { PIONEER_CONFIG, MEMBERSHIP_PRICES } from "@/lib/types";

export default function Staking() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const user = useAppStore((state) => state.user);
  const lastClaim = useAppStore((state) => state.lastClaim);
  const setLastClaim = useAppStore((state) => state.setLastClaim);
  const canClaim = useAppStore((state) => state.canClaim);
  const updateBalance = useAppStore((state) => state.updateBalance);
  const pioneers = useAppStore((state) => state.pioneers);

  const [showPioneerTutorial, setShowPioneerTutorial] = useState(false);
  const [swapAmount, setSwapAmount] = useState(100);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<"plus" | "vip">(
    "plus"
  );

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
    if (swapAmount > user.balanceNuma) return;
    updateBalance(user.balanceNuma - swapAmount, user.balanceWld + wldReceived);
    setSwapAmount(100);
  };

  const handlePurchaseMembership = () => {
    const price =
      selectedMembership === "plus"
        ? MEMBERSHIP_PRICES.plus
        : MEMBERSHIP_PRICES.vip;
    if (user.balanceWld < price) return;

    // Actualizar membresía (mock)
    setShowMembershipDialog(false);
    alert(
      `Membresía ${selectedMembership.toUpperCase()} activada. (Integración pendiente)`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--color-black] via-[--color-gray-900] to-[--color-gray-800] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentView("dashboard")}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Menú
          </Button>
          <h1 className="text-2xl font-bold text-[--color-gold]">Staking</h1>
          <div className="w-32" />
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
            <div className="bg-[--color-gray-800] rounded-lg p-4 border-2 border-gray-700">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-gray-400">Gratis</div>
                <div className="text-3xl font-bold text-white">$0</div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">50 → 10 NUMA/día</div>
                  <div className="text-gray-300">Apalancamiento x2-x10</div>
                </div>
                <Button disabled variant="ghost" className="w-full">
                  Actual
                </Button>
              </div>
            </div>

            {/* Plus */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg p-4 border-2 border-blue-500">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-blue-400">Plus</div>
                <div className="text-3xl font-bold text-white">
                  5 WLD<span className="text-sm text-gray-400">/mes</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">200 → 100 NUMA/día</div>
                  <div className="text-gray-300">Apalancamiento x2-x30</div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedMembership("plus");
                    setShowMembershipDialog(true);
                  }}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/20"
                >
                  Comprar
                </Button>
              </div>
            </div>

            {/* VIP */}
            <div className="bg-gradient-to-br from-[--color-gold]/20 to-[--color-gold-dark]/20 rounded-lg p-4 border-2 border-[--color-gold]">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-[--color-gold] flex items-center justify-center gap-1">
                  <Crown className="w-4 h-4" />
                  VIP
                </div>
                <div className="text-3xl font-bold text-white">
                  15 WLD<span className="text-sm text-gray-400">/6 meses</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">500 → 250 NUMA/día</div>
                  <div className="text-[--color-gold] font-semibold">
                    Apalancamiento x2-x500
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedMembership("vip");
                    setShowMembershipDialog(true);
                  }}
                  className="w-full"
                >
                  Comprar
                </Button>
              </div>
            </div>
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
              Los 100 usuarios con mayor capital bloqueado ganan 5% de las ganancias
              totales
            </CardDescription>
          </CardHeader>

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
              Confirma la compra de tu membresía premium
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[--color-gray-800] rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Precio</span>
                <span className="text-white font-semibold">
                  {selectedMembership === "plus"
                    ? `${MEMBERSHIP_PRICES.plus} WLD/mes`
                    : `${MEMBERSHIP_PRICES.vip} WLD/6 meses`}
                </span>
              </div>
              <div className="flex justify-between mb-2">
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
              Confirmar Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
