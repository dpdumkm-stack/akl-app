// src/context/ToastContext.tsx

"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import i18n from "@/lib/i18n/id.json";

interface ToastState {
  msg: string;
  type: "success" | "error";
}

interface ToastContextValue {
  showToast: (msg: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast UI – identical to the one in page.tsx */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          <span>{toast.msg}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
