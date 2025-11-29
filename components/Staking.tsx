"use client";

import { useState } from "react";
import { useAppStore, getCurrentDailyReward } from "@/lib/store";
import {
  ArrowLeft,
  Gift,
  Trophy,
  Crown,
  ArrowLeftRight,
  Info,
} from "lucide-react";
import {
  formatNumber,
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
  const updateMembership = useAppStore((state) => state.updateMembership);
  const pioneers = useAppStore((state) => state.pioneers);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);
  const setCurrentUserPioneer = useAppStore((state) => state.setCurrentUserPioneer);
  const setPioneers = useAppStore((state) => state.setPioneers);

  const [swapAmount, setSwapAmount] = useState("100");
  const [selectedMembership, setSelectedMembership] = useState<"plus" | "vip">("plus");
  const [pioneerAmount, setPioneerAmount] = useState("50");
  const [showMembershipSection, setShowMembershipSection] = useState(false);
  const [showPioneerSection, setShowPioneerSection] = useState(false);

  if (!user) return null;

  const swapNum = parseFloat(swapAmount) || 0;
  const pioneerNum = parseFloat(pioneerAmount) || 0;
  const { wldReceived, fee } = calculateSwapWithFee(swapNum);
  const canClaimReward = canClaim();
  const dailyReward = getCurrentDailyReward(user.membership.tier, user.createdAt);

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
    alert(`✅ Has reclamado ${dailyReward} NUMA`);
  };

  const handleSwap = () => {
    if (swapNum <= 0) {
      alert("❌ Ingresa una cantidad válida");
      return;
    }
    if (swapNum > user.balanceNuma) {
      alert("❌ No tienes suficiente NUMA");
      return;
    }
    updateBalance(user.balanceNuma - swapNum, user.balanceWld + wldReceived);
    setSwapAmount("100");
    alert(`✅ Swap exitoso: ${swapNum} NUMA → ${formatNumber(wldReceived, 2)} WLD`);
  };

  const handleBuyMembership = () => {
    const price = MEMBERSHIP_PRICES[selectedMembership];
    if (user.balanceWld < price) {
      alert(`❌ Necesitas ${price} WLD para comprar ${selectedMembership.toUpperCase()}`);
      return;
    }
    const expiresAtTimestamp = Date.now() + (365 * 24 * 60 * 60 * 1000);
    updateMembership(selectedMembership, expiresAtTimestamp);
    updateBalance(user.balanceNuma, user.balanceWld - price);
    alert(`✅ Membresía ${selectedMembership.toUpperCase()} activada por 1 año`);
  };

  const MIN_PIONEER_STAKE = 50;

  const handleBecomePioneer = () => {
    if (pioneerNum < MIN_PIONEER_STAKE) {
      alert(`❌ Mínimo ${MIN_PIONEER_STAKE} WLD para ser pionero`);
      return;
    }
    if (pioneerNum > user.balanceWld) {
      alert("❌ Balance insuficiente");
      return;
    }

    const newPioneer: any = {
      userId: user.id,
      walletAddress: "0x...",
      capitalLocked: pioneerNum,
      rank: pioneers.length + 1,
      earningsAccumulated: 0,
      nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      hasActiveLoan: false,
    };

    const updatedPioneers = [...pioneers, newPioneer]
      .sort((a: any, b: any) => b.capitalLocked - a.capitalLocked)
      .map((p: any, index: number) => ({ ...p, rank: index + 1 }));

    setPioneers(updatedPioneers);
    setCurrentUserPioneer(
      updatedPioneers.find((p: any) => p.userId === user.id) || null
    );
    updateBalance(user.balanceNuma, user.balanceWld - pioneerNum);
    setPioneerAmount("50");
    alert(`✅ Ahora eres pionero #${newPioneer.rank}`);
  };

  const handleAddToPioneer = () => {
    if (!currentUserPioneer) return;
    if (pioneerNum < 10) {
      alert("❌ Mínimo 10 WLD para agregar");
      return;
    }
    if (pioneerNum > user.balanceWld) {
      alert("❌ Balance insuficiente");
      return;
    }

    const updatedPioneers = pioneers
      .map((p: any) =>
        p.userId === user.id
          ? { ...p, capitalLocked: p.capitalLocked + pioneerNum }
          : p
      )
      .sort((a: any, b: any) => b.capitalLocked - a.capitalLocked)
      .map((p: any, index: number) => ({ ...p, rank: index + 1 }));

    setPioneers(updatedPioneers);
    setCurrentUserPioneer(
      updatedPioneers.find((p: any) => p.userId === user.id) || null
    );
    updateBalance(user.balanceNuma, user.balanceWld - pioneerNum);
    setPioneerAmount("50");
    alert("✅ Capital agregado exitosamente");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="w-12 h-12 rounded-xl card-modern flex items-center justify-center hover:shadow-md transition-all"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staking</h1>
            <p className="text-sm text-gray-500">Recompensas, intercambios y pioneros</p>
          </div>
        </div>

        {/* Daily Rewards */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Recompensa Diaria</div>
              <div className="text-xs text-gray-400">{timeUntilNextClaim}</div>
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-4">
            {dailyReward} NUMA
          </div>
          <button
            onClick={handleClaim}
            disabled={!canClaimReward}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              canClaimReward
                ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canClaimReward ? "Reclamar Ahora" : `Próximo en ${timeUntilNextClaim}`}
          </button>
        </div>

        {/* Swap NUMA → WLD */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Intercambiar NUMA por WLD</div>
              <div className="text-xs text-gray-400">Tasa: 1,000 NUMA = 1 WLD (fee 1%)</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-2 block">Cantidad NUMA</label>
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
                min="100"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recibirás:</span>
                <span className="font-bold text-gray-900">{formatNumber(wldReceived, 2)} WLD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Comisión (1%):</span>
                <span className="text-red-600 font-bold">-{formatNumber(fee, 2)} WLD</span>
              </div>
            </div>
            <button
              onClick={handleSwap}
              disabled={swapNum < 100 || swapNum > user.balanceNuma}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                swapNum >= 100 && swapNum <= user.balanceNuma
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Intercambiar
            </button>
          </div>
        </div>

        {/* Membresías */}
        <div className="card-modern p-6">
          <button
            onClick={() => setShowMembershipSection(!showMembershipSection)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-500 font-medium">Membresías Premium</div>
                <div className="text-xs text-gray-400">Aumenta tus recompensas diarias</div>
              </div>
            </div>
            <Info className="w-5 h-5 text-gray-400" />
          </button>

          {showMembershipSection && (
            <div className="space-y-4 mt-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedMembership("plus")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedMembership === "plus"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-lg font-bold text-gray-900 mb-1">Plus</div>
                  <div className="text-sm text-gray-500 mb-2">30 NUMA/día</div>
                  <div className="text-xl font-bold text-blue-600">{MEMBERSHIP_PRICES.plus} WLD</div>
                </button>
                <button
                  onClick={() => setSelectedMembership("vip")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedMembership === "vip"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-lg font-bold text-gray-900 mb-1">VIP</div>
                  <div className="text-sm text-gray-500 mb-2">50 NUMA/día</div>
                  <div className="text-xl font-bold text-purple-600">{MEMBERSHIP_PRICES.vip} WLD</div>
                </button>
              </div>
              <button
                onClick={handleBuyMembership}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Comprar {selectedMembership.toUpperCase()} por {MEMBERSHIP_PRICES[selectedMembership]} WLD
              </button>
            </div>
          )}
        </div>

        {/* Sistema de Pioneros */}
        <div className="card-modern p-6">
          <button
            onClick={() => setShowPioneerSection(!showPioneerSection)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-500 font-medium">Sistema de Pioneros</div>
                <div className="text-xs text-gray-400">
                  {currentUserPioneer
                    ? `Eres pionero #${currentUserPioneer.rank} con ${formatNumber((currentUserPioneer as any).capitalLocked, 0)} WLD`
                    : "Bloquea capital y accede a créditos"}
                </div>
              </div>
            </div>
            <Info className="w-5 h-5 text-gray-400" />
          </button>

          {showPioneerSection && (
            <div className="space-y-4 mt-4 border-t border-gray-200 pt-4">
              <div className="bg-yellow-50 rounded-xl p-4 text-sm text-gray-700">
                <strong>¿Cómo funciona?</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Bloquea mínimo 50 WLD por 1 año</li>
                  <li>• Los Top 100 pioneros acceden a créditos (hasta 50% del capital)</li>
                  <li>• Mayor capital bloqueado = mejor ranking</li>
                </ul>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 font-medium mb-2 block">
                  {currentUserPioneer ? "Agregar capital" : "Capital inicial (WLD)"}
                </label>
                <input
                  type="number"
                  value={pioneerAmount}
                  onChange={(e) => setPioneerAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={`Mínimo ${currentUserPioneer ? 10 : 50}`}
                  min={currentUserPioneer ? "10" : "50"}
                />
              </div>

              <button
                onClick={currentUserPioneer ? handleAddToPioneer : handleBecomePioneer}
                disabled={pioneerNum < (currentUserPioneer ? 10 : 50) || pioneerNum > user.balanceWld}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  pioneerNum >= (currentUserPioneer ? 10 : 50) && pioneerNum <= user.balanceWld
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90 active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentUserPioneer ? "Agregar Capital" : "Convertirme en Pionero"}
              </button>
            </div>
          )}
        </div>

        {/* Ranking Pioneros */}
        {pioneers.length > 0 && (
          <div className="card-modern p-6">
            <div className="text-sm text-gray-500 font-medium mb-4">
              🏆 Ranking de Pioneros (Top 10)
            </div>
            <div className="space-y-2">
              {pioneers.slice(0, 10).map((pioneer: any, index: number) => (
                <div
                  key={pioneer.userId}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    pioneer.userId === user.id
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-yellow-400 text-white" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                      index === 2 ? "bg-orange-400 text-white" :
                      "bg-gray-200 text-gray-600"
                    }`}>
                      {pioneer.rank}
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      Usuario #{pioneer.userId.slice(0, 6)}
                      {pioneer.userId === user.id && " (Tú)"}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatNumber(pioneer.capitalLocked, 0)} WLD
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
