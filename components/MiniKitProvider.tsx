"use client";

import { useEffect } from "react";
import { initMiniKit } from "@/lib/minikit";

export function MiniKitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar MiniKit cuando el componente se monta
    initMiniKit();
  }, []);

  return <>{children}</>;
}
