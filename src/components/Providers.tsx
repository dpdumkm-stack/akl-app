"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/ToastContext";
import InstallPrompt from "@/components/InstallPrompt";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered"))
        .catch((err) => console.log("SW error", err));
    }
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>{children}<InstallPrompt /></ToastProvider>
    </SessionProvider>
  );
}
