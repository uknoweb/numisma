"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, TrendingUp, Trophy, Wallet, Gift } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  action?: string;
  highlight?: string; // Elemento a resaltar (selector CSS)
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "¡Bienvenido a Numisma! 🎉",
    description: "La plataforma educativa de trading con World ID. Aprende trading de futuros con capital virtual y verifica tu identidad única.",
    icon: Gift,
  },
  {
    id: 2,
    title: "Tu Balance Inicial",
    description: "Empiezas con 10,000 NUMA y 100 WLD virtuales. Usa estos fondos para practicar trading sin riesgo real.",
    icon: Wallet,
    highlight: ".balance-card",
  },
  {
    id: 3,
    title: "Abre tu Primera Posición",
    description: "Ve a la sección Trading y abre tu primera posición. Puedes operar NUMA/WLD o WLD/USDT con leverage hasta 10x (gratis).",
    icon: TrendingUp,
    action: "Go to Trading",
  },
  {
    id: 4,
    title: "Sistema de Pioneros",
    description: "Bloquea capital y conviértete en Pioneer. Los Top 100 obtienen créditos garantizados y recompensas exclusivas.",
    icon: Trophy,
    action: "Explore Pioneers",
  },
  {
    id: 5,
    title: "¡Bonus de Bienvenida!",
    description: "Como recompensa por completar el tutorial, recibes 100 NUMA adicionales. ¡Empieza a tradear ahora!",
    icon: Gift,
  },
];

export default function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const user = useAppStore((state) => state.user);
  const updateBalance = useAppStore((state) => state.updateBalance);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  useEffect(() => {
    // Verificar si el usuario ya completó el onboarding
    const completed = localStorage.getItem("onboarding_completed");
    
    if (!completed && user) {
      // Mostrar onboarding después de 1 segundo
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasCompletedOnboarding(true);
    }
  }, [user]);

  const handleNext = () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    // Ejecutar acción del step si existe
    if (step.action === "Go to Trading") {
      setCurrentView("trading");
    } else if (step.action === "Explore Pioneers") {
      setCurrentView("staking");
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (confirm("¿Seguro que quieres saltar el tutorial? Puedes verlo después en Configuración.")) {
      completeOnboarding(true);
    }
  };

  const completeOnboarding = (skipped = false) => {
    if (!skipped && user) {
      // Dar bonus de bienvenida (100 NUMA)
      updateBalance(user.balanceNuma + 100, user.balanceWld);
      
      // Registrar en analytics
      if (typeof window !== "undefined") {
        console.log("Onboarding completed - Bonus awarded: 100 NUMA");
      }
    }

    localStorage.setItem("onboarding_completed", "true");
    setHasCompletedOnboarding(true);
    setIsVisible(false);

    // Registrar evento en analytics (cuando se implemente)
    // trackEvent("onboarding_completed", { skipped });
  };

  if (!isVisible || hasCompletedOnboarding) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Saltar tutorial
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Icon className="w-10 h-10 text-indigo-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">
            {step.description}
          </p>

          {/* Bonus Badge (último step) */}
          {currentStep === ONBOARDING_STEPS.length - 1 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
              <div className="text-4xl font-bold text-yellow-600">
                +100 NUMA
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Bonus de bienvenida
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex items-center justify-between gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 transition-all font-medium"
            >
              Anterior
            </button>
          )}
          
          <button
            onClick={handleNext}
            className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              "Comenzar a Tradear"
            ) : step.action ? (
              <>
                {step.action}
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Highlight Overlay (opcional) */}
      {step.highlight && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/60" />
          {/* Aquí se podría añadir lógica para resaltar elementos específicos */}
        </div>
      )}

    </div>
  );
}
