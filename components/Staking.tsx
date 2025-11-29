"use client";

import { useState, useEffect } from "react";
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
  const addTransaction = useAppStore((state) => state.addTransaction);

  const [swapAmount, setSwapAmount] = useState("100");
  const [swapDirection, setSwapDirection] = useState<"NUMA_TO_WLD" | "WLD_TO_NUMA">("NUMA_TO_WLD");
  const [selectedMembership, setSelectedMembership] = useState<"plus" | "vip">("plus");
  const [pioneerAmount, setPioneerAmount] = useState("50");
  const [showMembershipSection, setShowMembershipSection] = useState(false);
  const [showPioneerSection, setShowPioneerSection] = useState(false);
  const [acceptedPioneerTerms, setAcceptedPioneerTerms] = useState(false);
  const [showPioneerConfirmation, setShowPioneerConfirmation] = useState(false);
  const [showWithdrawConfirmation, setShowWithdrawConfirmation] = useState(false);
  const [showMembershipConfirmation, setShowMembershipConfirmation] = useState(false);
  const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
  const [accumulatedReward, setAccumulatedReward] = useState(0);

  // Staking en tiempo real - acumular recompensas cada segundo
  useEffect(() => {
    if (!user || !canClaim()) return; // Solo acumular si puede reclamar
    
    const dailyReward = getCurrentDailyReward(user.membership.tier, user.createdAt);
    const rewardPerSecond = dailyReward / (24 * 60 * 60); // Dividir recompensa diaria entre segundos del día
    
    const interval = setInterval(() => {
      setAccumulatedReward(prev => prev + rewardPerSecond);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user?.membership.tier, user?.createdAt, canClaim, user]);

  if (!user) return null;

  const swapNum = parseFloat(swapAmount) || 0;
  const pioneerNum = parseFloat(pioneerAmount) || 0;
  
  // Cálculo de swap según dirección
  let swapResult: { wldReceived?: number; numaReceived?: number; fee: number } = { fee: 0 };
  if (swapDirection === "NUMA_TO_WLD") {
    swapResult = calculateSwapWithFee(swapNum);
  } else {
    // WLD → NUMA
    const numaGross = swapNum * 1000; // 1 WLD = 1000 NUMA
    const fee = numaGross * 0.03;
    swapResult = { numaReceived: numaGross - fee, fee };
  }
  
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
    const totalReward = dailyReward + accumulatedReward;
    updateBalance(user.balanceNuma + totalReward, user.balanceWld);
    addTransaction("staking_claim", `Recompensa diaria reclamada`, totalReward, "NUMA");
    setLastClaim(new Date());
    setAccumulatedReward(0);
    alert(`✅ Has reclamado ${formatNumber(totalReward, 2)} NUMA`);
  };

  const handleSwapClick = () => {
    if (swapNum <= 0) {
      alert("❌ Ingresa una cantidad válida");
      return;
    }
    
    if (swapDirection === "NUMA_TO_WLD" && swapNum > user.balanceNuma) {
      alert("❌ No tienes suficiente NUMA");
      return;
    }
    
    if (swapDirection === "WLD_TO_NUMA" && swapNum > user.balanceWld) {
      alert("❌ No tienes suficiente WLD");
      return;
    }
    
    setShowSwapConfirmation(true);
  };

  const confirmSwap = () => {
    if (swapDirection === "NUMA_TO_WLD") {
      const { wldReceived } = swapResult as { wldReceived: number; fee: number };
      updateBalance(user.balanceNuma - swapNum, user.balanceWld + wldReceived);
      addTransaction("swap", `Swap: ${formatNumber(swapNum, 0)} NUMA → ${formatNumber(wldReceived, 2)} WLD`, swapNum, "NUMA");
    } else {
      const { numaReceived } = swapResult as { numaReceived: number; fee: number };
      updateBalance(user.balanceNuma + numaReceived, user.balanceWld - swapNum);
      addTransaction("swap", `Swap: ${formatNumber(swapNum, 2)} WLD → ${formatNumber(numaReceived, 0)} NUMA`, swapNum, "WLD");
    }
    setSwapAmount("100");
    setShowSwapConfirmation(false);
  };

  const handleBuyMembershipClick = () => {
    // Calcular costo según membresía y año
    let cost = 0;
    const isFirstYear = !user.membership.monthsPaid || user.membership.monthsPaid < 12;
    
    if (selectedMembership === "plus") {
      cost = isFirstYear ? 5 : 10; // 5 WLD primer año, 10 WLD después
    } else {
      // VIP: 3 meses adelantados
      cost = isFirstYear ? 45 : 60; // 45 WLD primer año (15/mes), 60 WLD después (20/mes)
    }
    
    if (user.balanceWld < cost) {
      alert(`❌ Necesitas ${cost} WLD para comprar ${selectedMembership.toUpperCase()}`);
      return;
    }
    setShowMembershipConfirmation(true);
  };

  const confirmBuyMembership = () => {
    if (!user) return;
    
    // Calcular costo y duración según tipo de membresía y año
    const isFirstYear = !user.membership.monthsPaid || user.membership.monthsPaid < 12;
    let cost = 0;
    let duration = 0;
    
    if (selectedMembership === "plus") {
      cost = isFirstYear ? 5 : 10; // 5 WLD primer año, 10 WLD después
      duration = 1; // 1 mes
    } else {
      cost = isFirstYear ? 45 : 60; // 45 WLD primer año, 60 WLD después
      duration = 3; // 3 meses
    }
    
    // Verificar balance
    if (user.balanceWld < cost) {
      alert(`❌ Balance insuficiente. Necesitas ${cost} WLD`);
      return;
    }
    
    // Actualizar membresía
    updateMembership(selectedMembership, duration);
    
    // Descontar WLD
    updateBalance(user.balanceNuma, user.balanceWld - cost);
    
    // Registrar transacción
    const description = selectedMembership === "plus" 
      ? `Membresía Plus (1 mes) - ${cost} WLD` 
      : `Membresía VIP (3 meses) - ${cost} WLD`;
    addTransaction("membership", description, cost, "WLD");
    
    setShowMembershipConfirmation(false);
    alert(`✅ Membresía ${selectedMembership.toUpperCase()} activada por ${duration} ${duration === 1 ? 'mes' : 'meses'}`);
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

    // Mostrar confirmación con términos
    setShowPioneerConfirmation(true);
  };

  const confirmBecomePioneer = () => {
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
    addTransaction("pioneer_lock", `Capital bloqueado como Pionero #${newPioneer.rank}`, pioneerNum, "WLD");
    setPioneerAmount("50");
    setAcceptedPioneerTerms(false);
    setShowPioneerConfirmation(false);
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
    addTransaction("pioneer_add", `Capital agregado a sistema Pioneros`, pioneerNum, "WLD");
    setPioneerAmount("50");
    alert("✅ Capital agregado exitosamente");
  };

  const handleWithdrawPioneer = () => {
    setShowWithdrawConfirmation(true);
  };

  const confirmWithdrawPioneer = () => {
    if (!currentUserPioneer) return;
    
    const capitalLocked = (currentUserPioneer as any).capitalLocked;
    const penalty = capitalLocked * 0.20; // 20% penalización
    const amountToReturn = capitalLocked - penalty;

    // Remover de pioneros
    const updatedPioneers = pioneers
      .filter((p: any) => p.userId !== user.id)
      .sort((a: any, b: any) => b.capitalLocked - a.capitalLocked)
      .map((p: any, index: number) => ({ ...p, rank: index + 1 }));

    setPioneers(updatedPioneers);
    setCurrentUserPioneer(null);
    updateBalance(user.balanceNuma, user.balanceWld + amountToReturn);
    addTransaction("pioneer_withdraw", `Retiro de capital Pioneros (penalización 20%)`, amountToReturn, "WLD");
    setShowWithdrawConfirmation(false);
    
    alert(`⚠️ Has retirado tu capital con penalización del 20%\nRecibiste: ${formatNumber(amountToReturn, 2)} WLD\nPenalización: ${formatNumber(penalty, 2)} WLD`);
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

        {/* Daily Rewards con acumulación en tiempo real */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 font-medium">Recompensa Diaria</div>
              <div className="text-xs text-gray-400">{timeUntilNextClaim}</div>
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatNumber(dailyReward + accumulatedReward, 2)} NUMA
          </div>
          {accumulatedReward > 0 && (
            <div className="text-sm text-green-600 mb-4">
              +{formatNumber(accumulatedReward, 4)} NUMA generándose en tiempo real
            </div>
          )}
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

        {/* Swap NUMA ↔ WLD con dirección bidireccional */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 font-medium">Intercambiar Tokens</div>
              <div className="text-xs text-gray-400">Tasa: 1,000 NUMA = 1 WLD</div>
            </div>
          </div>
          
          {/* Selector de dirección */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setSwapDirection("NUMA_TO_WLD")}
              className={`py-3 rounded-xl font-bold transition-all ${
                swapDirection === "NUMA_TO_WLD"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              NUMA → WLD
            </button>
            <button
              onClick={() => setSwapDirection("WLD_TO_NUMA")}
              className={`py-3 rounded-xl font-bold transition-all ${
                swapDirection === "WLD_TO_NUMA"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              WLD → NUMA
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-2 block">
                Cantidad {swapDirection === "NUMA_TO_WLD" ? "NUMA" : "WLD"}
              </label>
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
                min="1"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recibirás:</span>
                <span className="font-bold text-gray-900">
                  {swapDirection === "NUMA_TO_WLD" 
                    ? `${formatNumber(swapResult.wldReceived || 0, 2)} WLD`
                    : `${formatNumber(swapResult.numaReceived || 0, 2)} NUMA`
                  }
                </span>
              </div>
            </div>
            <button
              onClick={handleSwapClick}
              className="w-full py-3 rounded-xl font-bold transition-all bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
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
                  <div className="text-sm text-gray-500 mb-1">200 NUMA/día</div>
                  <div className="text-xs text-gray-400 mb-2">Pago mensual</div>
                  <div className="text-xl font-bold text-blue-600">5 WLD/mes</div>
                  <div className="text-xs text-gray-500 mt-1">Primer año</div>
                  <div className="text-xs text-gray-400">Después: 10 WLD/mes</div>
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
                  <div className="text-sm text-gray-500 mb-1">500 NUMA/día</div>
                  <div className="text-xs text-gray-400 mb-2">3 meses adelantados</div>
                  <div className="text-xl font-bold text-purple-600">45 WLD</div>
                  <div className="text-xs text-gray-500 mt-1">(15 WLD/mes) Primer año</div>
                  <div className="text-xs text-gray-400">Después: 60 WLD/3 meses</div>
                </button>
              </div>
              <button
                onClick={handleBuyMembershipClick}
                className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-[0.98] transition-all"
              >
                Comprar {selectedMembership === "plus" ? "Plus (1 mes)" : "VIP (3 meses)"}
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
              
              {/* Información detallada del sistema de Pioneros */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  ¿Qué es ser un Pionero?
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  Los Pioneros son inversores elite que bloquean capital en WLD por 1 año para acceder a 
                  beneficios exclusivos y participar en el crecimiento de la plataforma.
                </p>

                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-yellow-100">
                    <div className="font-bold text-yellow-800 mb-2">✨ Beneficios Exclusivos:</div>
                    <ul className="space-y-1 text-gray-700 text-xs">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Créditos garantizados:</strong> Los Top 100 pueden solicitar préstamos hasta el 50% de su capital bloqueado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Participación en ganancias:</strong> Recibe pagos quincenales del 15% de las ganancias de la plataforma, distribuido según tu ranking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Ranking dinámico:</strong> Mayor capital bloqueado = mejor posición = mayores beneficios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Gobernanza:</strong> Voto en decisiones importantes de la plataforma</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-yellow-100">
                    <div className="font-bold text-gray-800 mb-2">📋 Requisitos:</div>
                    <ul className="space-y-1 text-gray-700 text-xs">
                      <li>• Bloquear mínimo <strong>50 WLD</strong> por 365 días</li>
                      <li>• El capital queda bloqueado y no puede retirarse sin penalización</li>
                      <li>• Puedes agregar más capital en cualquier momento (mínimo 10 WLD)</li>
                      <li>• El retiro anticipado tiene penalización del <strong>20%</strong></li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="font-bold text-blue-800 mb-2">💰 Sistema de Créditos (Top 100):</div>
                    <ul className="space-y-1 text-gray-700 text-xs">
                      <li>• Préstamos de hasta el <strong>50% de tu capital bloqueado</strong></li>
                      <li>• Sin verificación crediticia ni trámites complicados</li>
                      <li>• Tasas preferenciales para pioneros de alto ranking</li>
                      <li>• Pagos flexibles respaldados por tu capital bloqueado</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <div className="font-bold text-red-800 mb-2">⚠️ Importante:</div>
                    <ul className="space-y-1 text-gray-700 text-xs">
                      <li>• Tu capital estará <strong>bloqueado 1 año</strong> desde el depósito inicial</li>
                      <li>• Retirar antes de tiempo: <strong>penalización del 20%</strong></li>
                      <li>• No podrás volver a inscribirte como pionero si retiras</li>
                      <li>• Solo los Top 100 tienen acceso a créditos</li>
                    </ul>
                  </div>
                </div>
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

              {/* Botón de Retirar */}
              {currentUserPioneer && (
                <button
                  onClick={handleWithdrawPioneer}
                  className="w-full py-3 rounded-xl font-bold border-2 border-red-500 text-red-600 hover:bg-red-50 transition-all"
                >
                  Retirar Capital (20% penalización)
                </button>
              )}
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

      {/* Modal de Confirmación - Convertirse en Pionero */}
      {showPioneerConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900">⚠️ Términos y Condiciones del Sistema de Pioneros</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3 text-sm text-gray-700">
              <p><strong>Capital a bloquear:</strong> {formatNumber(pioneerNum, 2)} WLD</p>
              <p><strong>Período de bloqueo:</strong> 1 año (365 días)</p>
              <p><strong>Ranking inicial estimado:</strong> #{pioneers.length + 1}</p>
              
              <hr className="border-yellow-300" />
              
              <div className="space-y-2">
                <p className="font-bold text-gray-900">📋 Condiciones del sistema:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tu capital quedará bloqueado por 1 año completo</li>
                  <li>Acceso a créditos solo para Top 100 pioneros</li>
                  <li>Ranking basado en capital bloqueado (mayor = mejor)</li>
                  <li>Participación en el 5% de ganancias de la plataforma</li>
                  <li>Pagos cada 15 días si estás en Top 100</li>
                </ul>
              </div>

              <hr className="border-yellow-300" />
              
              <div className="space-y-2">
                <p className="font-bold text-red-600">⚠️ Penalizaciones:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Retiro anticipado: 20% de penalización</strong></li>
                  <li>Al retirar, pierdes acceso permanente a créditos</li>
                  <li>No podrás volver a inscribirte como pionero</li>
                  <li>Perderás tu posición en el ranking</li>
                </ul>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedPioneerTerms}
                onChange={(e) => setAcceptedPioneerTerms(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-700">
                He leído y acepto los términos y condiciones del Sistema de Pioneros
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowPioneerConfirmation(false);
                  setAcceptedPioneerTerms(false);
                }}
                className="py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBecomePioneer}
                disabled={!acceptedPioneerTerms}
                className={`py-3 rounded-xl font-bold transition-all ${
                  acceptedPioneerTerms
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirmar y Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - Retirar Capital */}
      {showWithdrawConfirmation && currentUserPioneer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-red-600">⚠️ Confirmación de Retiro</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 text-sm text-gray-700">
              <p className="font-bold text-gray-900">Estás a punto de retirar tu capital bloqueado:</p>
              
              <div className="space-y-2 bg-white rounded-lg p-3">
                <div className="flex justify-between">
                  <span>Capital bloqueado:</span>
                  <span className="font-bold">{formatNumber((currentUserPioneer as any).capitalLocked, 2)} WLD</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Penalización (20%):</span>
                  <span className="font-bold">-{formatNumber((currentUserPioneer as any).capitalLocked * 0.20, 2)} WLD</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Recibirás:</span>
                  <span className="font-bold text-green-600">
                    {formatNumber((currentUserPioneer as any).capitalLocked * 0.80, 2)} WLD
                  </span>
                </div>
              </div>

              <div className="bg-red-100 rounded-lg p-3 space-y-1 text-xs">
                <p className="font-bold text-red-800">❌ Perderás permanentemente:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Acceso al sistema de créditos</li>
                  <li>Tu posición #{currentUserPioneer.rank} en el ranking</li>
                  <li>Participación en ganancias de la plataforma</li>
                  <li>Posibilidad de volver a inscribirte como pionero</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowWithdrawConfirmation(false)}
                className="py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                Mantener Capital
              </button>
              <button
                onClick={confirmWithdrawPioneer}
                className="py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                Confirmar Retiro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - Membresía */}
      {showMembershipConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900">
              Confirmar Membresía {selectedMembership === "plus" ? "Plus" : "VIP"}
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              {selectedMembership === "plus" ? (
                <>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">Membresía Plus</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Recompensas diarias: <strong>200 NUMA</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Apalancamiento: <strong>hasta 30x</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Duración: <strong>1 mes</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Renovación: <strong>Manual (no automática)</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Costo (Primer año):</span>
                      <span className="text-xl font-bold text-blue-600">5 WLD</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      Después del año: 10 WLD/mes
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">Membresía VIP</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Recompensas diarias: <strong>500 NUMA</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Apalancamiento: <strong>hasta 500x</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Pago: <strong>3 meses adelantados obligatorio</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Siguiente pago: <strong>Otros 3 meses</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Después del 6to mes: <strong>Pago mensual (15 WLD)</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600">✓</span>
                        <span>Renovación: <strong>Manual (no automática)</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-bold text-purple-900 mb-2">🔓 Sistema de Líneas de Crédito VIP:</p>
                    <div className="text-xs text-purple-800 space-y-1">
                      <div>• <strong>3 meses consecutivos:</strong> 30 WLD disponibles</div>
                      <div>• <strong>6 meses consecutivos:</strong> 50 WLD disponibles</div>
                      <div>• <strong>1 año consecutivo:</strong> 70 WLD disponibles</div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-900 mb-1">⚠️ Advertencia Importante:</p>
                    <div className="text-xs text-red-800 space-y-1">
                      <p>• Si tomas un crédito, debes pagar en <strong>1 año máximo</strong></p>
                      <p>• En caso de incumplimiento: <strong>Wallet congelada</strong></p>
                      <p>• Después de 1 año sin pago: <strong>Fondos confiscados</strong></p>
                      <p>• Si pierdes consecutividad: <strong>Línea de crédito se reinicia</strong></p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Costo (3 meses - Primer año):</span>
                      <span className="text-xl font-bold text-purple-600">45 WLD</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      (15 WLD/mes) • Después del año: 60 WLD/3 meses (20 WLD/mes)
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-900 mb-1">💡 Nota:</p>
                    <p className="text-xs text-blue-800">
                      El crédito VIP es <strong>diferente</strong> al crédito de Pioneros. 
                      Cada sistema tiene sus propias reglas y condiciones.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowMembershipConfirmation(false)}
                className="py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBuyMembership}
                className={`py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all ${
                  selectedMembership === "plus" ? "bg-blue-600" : "bg-purple-600"
                }`}
              >
                Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - Swap */}
      {showSwapConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Confirmar Intercambio</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-sm text-gray-500 mb-1">Envías</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(swapNum, 2)} {swapDirection === "NUMA_TO_WLD" ? "NUMA" : "WLD"}
                  </div>
                </div>
                <div className="text-gray-400 px-4">
                  →
                </div>
                <div className="text-center flex-1">
                  <div className="text-sm text-gray-500 mb-1">Recibes</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {swapDirection === "NUMA_TO_WLD" 
                      ? `${formatNumber(swapResult.wldReceived || 0, 2)} WLD`
                      : `${formatNumber(swapResult.numaReceived || 0, 2)} NUMA`
                    }
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <p className="font-bold text-blue-900 mb-1">Tasa de cambio:</p>
                  <p>1 WLD = 1,000 NUMA</p>
                  <p className="text-xs text-gray-600 mt-1">Incluye comisión del 3% ya descontada</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSwapConfirmation(false)}
                className="py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSwap}
                className="py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Confirmar Swap
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
