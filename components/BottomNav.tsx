"use client";

import { useAppStore } from "@/lib/store";
import { Home, CandlestickChart, Coins, Wallet } from "lucide-react";

export default function BottomNav() {
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const currentUserPioneer = useAppStore((state) => state.currentUserPioneer);

  const isPioneerTop100 = currentUserPioneer && currentUserPioneer.rank <= 100;

  const navItems = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "plataforma", label: "Trading", icon: CandlestickChart },
    { id: "staking", label: "Staking", icon: Coins },
  ];

  // Agregar Créditos solo si es top 100
  if (isPioneerTop100) {
    navItems.push({ id: "creditos", label: "Créditos", icon: Wallet });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#FFD700]/10 z-50 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
                isActive ? "text-[#FFD700]" : "text-gray-600"
              } active:scale-95`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "animate-pulse-gold" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
