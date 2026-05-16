"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Download, X, Sparkles } from "lucide-react";

const CURRENT_VERSION = "v3.1";

export default function AppUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showChangelog, setShowChangelog] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("appVersion") !== CURRENT_VERSION;
    }
    return false;
  });

  useEffect(() => {
    // 2. Setup Service Worker Update Listener
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // Jika SW baru sudah terinstall dan ada SW lama yang sedang aktif
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Dengarkan perubahan controller untuk reload halaman
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const closeChangelog = () => {
    localStorage.setItem("appVersion", CURRENT_VERSION);
    setShowChangelog(false);
  };

  return (
    <>
      {/* UPDATE BANNER */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
          <div className="bg-blue-600 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 border border-blue-400">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest leading-tight">Pembaruan Tersedia</p>
                <p className="text-[10px] text-blue-100 mt-0.5">Versi baru aplikasi sudah siap.</p>
              </div>
            </div>
            <button 
              onClick={updateServiceWorker}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm"
            >
              Perbarui
            </button>
          </div>
        </div>
      )}

      {/* CHANGELOG MODAL */}
      {showChangelog && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 max-w-sm w-full relative animate-in fade-in zoom-in-95">
            <button 
              onClick={closeChangelog}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
            
            <h3 className="text-white font-black text-xl mb-1 italic">Selamat Datang di v3.2!</h3>
            <p className="text-slate-400 text-xs font-medium mb-6">Sistem telah diperbarui untuk pengalaman yang lebih baik.</p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-emerald-400 mb-1">Fitur Baru</h4>
                <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4">
                  <li>Total Refactoring UI/UX Mobile-First pada sistem pengisian data.</li>
                  <li>Tombol aksi dan target sentuh diperbesar (44px) untuk kenyamanan jempol.</li>
                  <li>Layout form lebih lega, responsif, dan premium di layar HP.</li>
                  <li>Perbaikan masalah auto-zoom otomatis pada browser mobile.</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={closeChangelog} 
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
