"use client";

import { Home, TrendingUp, Trophy, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import analytics from "@/lib/analytics";

interface NavItem {
  id: "dashboard" | "trading" | "staking" | "profile";
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: Home, label: "Inicio" },
  { id: "trading", icon: TrendingUp, label: "Trading" },
  { id: "staking", icon: Trophy, label: "Pioneers" },
  { id: "profile", icon: User, label: "Perfil" },
];

export default function BottomNavigation() {
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  const handleNavClick = (id: "dashboard" | "trading" | "staking" | "profile") => {
    setCurrentView(id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-lg mx-auto px-4 safe-area-inset-bottom">
        <nav className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  flex flex-col items-center justify-center gap-1 
                  min-w-[60px] py-2 px-3 rounded-xl
                  transition-all duration-200 active:scale-95
                  ${isActive 
                    ? "text-white" 
                    : "text-gray-500 hover:text-gray-300"
                  }
                `}
              >
                <div className={`
                  relative p-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50" 
                    : "bg-transparent"
                  }
                `}>
                  <Icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? "scale-110" : ""
                    }`} 
                  />
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                  )}
                </div>
                <span className={`
                  text-xs font-medium transition-all duration-200
                  ${isActive ? "opacity-100" : "opacity-70"}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
