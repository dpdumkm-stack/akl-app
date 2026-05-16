"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/ToastContext";
import InstallPrompt from "@/components/InstallPrompt";
import AppUpdater from "@/components/AppUpdater";

export function Providers({ children }: { children: React.ReactNode }) {
  // Service Worker registration is now handled by AppUpdater
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <InstallPrompt />
        <AppUpdater />
      </ToastProvider>
    </SessionProvider>
  );
}
