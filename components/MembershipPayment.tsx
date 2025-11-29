"use client";

import { useState } from "react";
import { Crown, Zap, Shield, Check, Loader2, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { usePayment } from "@/hooks/usePayment";

type MembershipDuration = 1 | 3 | 6 | 12;

export default function MembershipPayment() {
  const user = useAppStore((state) => state.user);
  const [selectedTier, setSelectedTier] = useState<"plus" | "vip" | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<MembershipDuration>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { purchaseMembership, getPrice, getDiscount, isProcessing, error } = usePayment();

  if (!user) return null;

  const currentTier = user.membership.tier;
  const isActive = user.membership.expiresAt 
    ? new Date(user.membership.expiresAt) > new Date()
    : false;

  const handlePurchase = async () => {
    if (!selectedTier) return;

    const result = await purchaseMembership(selectedTier, selectedDuration);

    if (result.success) {
      setShowSuccess(true);
      setSelectedTier(null);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const tiers = [
    {
      id: "free" as const,
      name: "Gratis",
      icon: Shield,
      gradient: "from-gray-500 to-gray-600",
      maxLeverage: "10x",
      dailyRewards: "50 NUMA",
      features: [
        "Trading básico",
        "Leverage hasta 10x",
        "50 NUMA diarios",
        "Acceso a mercados NUMA/WLD",
      ],
    },
    {
      id: "plus" as const,
      name: "Plus",
      icon: Zap,
      gradient: "from-blue-500 to-blue-600",
      maxLeverage: "30x",
      dailyRewards: "200 NUMA",
      features: [
        "Trading avanzado",
        "Leverage hasta 30x",
        "200 NUMA diarios",
        "Acceso a todos los mercados",
        "Soporte prioritario",
      ],
      popular: true,
    },
    {
      id: "vip" as const,
      name: "VIP",
      icon: Crown,
      gradient: "from-purple-500 to-purple-600",
      maxLeverage: "500x",
      dailyRewards: "500 NUMA",
      features: [
        "Trading profesional",
        "Leverage hasta 500x",
        "500 NUMA diarios",
        "Líneas de crédito garantizadas",
        "Acceso a Pioneer Vault",
        "Soporte VIP 24/7",
      ],
    },
  ];

  const durationOptions: { months: MembershipDuration; label: string }[] = [
    { months: 1, label: "1 mes" },
    { months: 3, label: "3 meses" },
    { months: 6, label: "6 meses" },
    { months: 12, label: "1 año" },
  ];

  return (
    <div className="space-y-6">
      {/* Current Membership Status */}
      <div className="card-modern p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Tu Membresía Actual</h3>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
            currentTier === "vip" ? "from-purple-500 to-purple-600" :
            currentTier === "plus" ? "from-blue-500 to-blue-600" :
            "from-gray-500 to-gray-600"
          } flex items-center justify-center shadow-lg`}>
            {currentTier === "vip" ? (
              <Crown className="w-8 h-8 text-white" />
            ) : currentTier === "plus" ? (
              <Zap className="w-8 h-8 text-white" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-gray-900 capitalize">
              {currentTier === "free" ? "Gratis" : currentTier.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">
              {isActive && user.membership.expiresAt
                ? `Activa hasta ${new Date(user.membership.expiresAt).toLocaleDateString()}`
                : "Sin membresía activa"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Leverage máximo: {user.membership.maxLeverage}x
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-green-900">¡Pago exitoso!</h4>
            <p className="text-xs text-green-700 mt-1">
              Tu membresía ha sido activada correctamente
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">Error en el pago</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Membership Tiers */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Mejora tu Membresía
        </h3>
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`card-modern p-5 cursor-pointer transition-all ${
                selectedTier === tier.id
                  ? "ring-2 ring-indigo-500 shadow-lg"
                  : "hover:shadow-md"
              } ${tier.id === "free" ? "opacity-60" : ""}`}
              onClick={() => tier.id !== "free" && setSelectedTier(tier.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center flex-shrink-0`}>
                  <tier.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-gray-900">{tier.name}</h4>
                    {tier.popular && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        Popular
                      </span>
                    )}
                    {tier.id === currentTier && isActive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        Activa
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">{tier.maxLeverage}</span> leverage · {" "}
                    <span className="font-semibold">{tier.dailyRewards}</span> diarios
                  </div>
                  <ul className="space-y-1.5">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duration & Payment */}
      {selectedTier && (
        <div className="card-premium p-6 space-y-4">
          <h4 className="text-lg font-bold text-white mb-2">
            Selecciona Duración
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {durationOptions.map((option) => {
              const price = getPrice(selectedTier, option.months);
              const discount = getDiscount(option.months);
              
              return (
                <button
                  key={option.months}
                  onClick={() => setSelectedDuration(option.months)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDuration === option.months
                      ? "border-white bg-white/20"
                      : "border-white/30 hover:border-white/50"
                  }`}
                >
                  <div className="text-sm font-semibold text-white mb-1">
                    {option.label}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {price} WLD
                  </div>
                  {discount > 0 && (
                    <div className="text-xs text-green-300 mt-1">
                      Ahorra {discount}%
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="btn-gold w-full h-12 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Pagar {getPrice(selectedTier, selectedDuration)} WLD
              </>
            )}
          </button>

          <p className="text-xs text-white/70 text-center">
            Pago seguro a través de World App
          </p>
        </div>
      )}
    </div>
  );
}
