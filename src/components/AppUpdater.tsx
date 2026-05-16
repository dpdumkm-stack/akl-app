"use client";

import { useEffect, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";

// ─── Ganti versi ini setiap kali ada perubahan besar yang ingin di-announce ───
const CURRENT_VERSION = "v3.2";

export default function AppUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Baca localStorage via lazy initializer — berjalan hanya di sisi klien, aman dari SSR mismatch.
   
  const [showChangelog, setShowChangelog] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("appVersion") !== CURRENT_VERSION;
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // ── 1. Registrasi SW + pasang semua listener DALAM SATU aliran ──────────
    //    Kita daftarkan SW di sini (bukan di PWARegistration terpisah) agar
    //    event `updatefound` tidak mungkin terlewat sebelum listener terpasang.
    const register = async () => {
      let reg: ServiceWorkerRegistration;

      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker terdaftar, scope:", reg.scope);
      } catch (err) {
        console.error("[PWA] Registrasi Service Worker gagal:", err);
        return;
      }

      // ── 2. Cek apakah sudah ada SW baru yang menunggu (halaman di-refresh
      //       SETELAH update ter-download) ─────────────────────────────────
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
        return;
      }

      // ── 3. Dengarkan SW baru yang mulai men-download di latar belakang ──
      const onUpdateFound = () => {
        const installingWorker = reg.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          // SW baru sudah selesai install DAN ada SW lama yang aktif (bukan fresh install)
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[PWA] Update tersedia! Menunggu konfirmasi user.");
            setWaitingWorker(installingWorker);
            setUpdateAvailable(true);
          }
        });
      };

      reg.addEventListener("updatefound", onUpdateFound);

      // ── 4. Periksa update di latar belakang setiap 60 menit ─────────────
      //    Ini memastikan user yang membuka app seharian tetap mendapat notif.
      const intervalId = setInterval(() => {
        reg.update().catch(() => {
          // Abaikan error jaringan (misal: user offline)
        });
      }, 60 * 60 * 1000);

      return () => {
        clearInterval(intervalId);
        reg.removeEventListener("updatefound", onUpdateFound);
      };
    };

    // ── 5. Listener controllerchange: dipicu SETELAH skipWaiting() berhasil.
    //       Ini yang benar-benar meng-reload halaman. ─────────────────────
    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const cleanup = register();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleanup.then((fn) => fn?.());
    };
  }, []);

  // ─── Dipanggil HANYA saat user klik "Perbarui Sekarang" ──────────────────
  const handleUpdate = () => {
    if (waitingWorker) {
      // Kirim sinyal ke sw.js agar memanggil self.skipWaiting()
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    // controllerchange listener di atas yang akan menangani reload
  };

  const closeChangelog = () => {
    localStorage.setItem("appVersion", CURRENT_VERSION);
    setShowChangelog(false);
  };

  return (
    <>
      {/* ── UPDATE BANNER ─────────────────────────────────────────────────── */}
      {updateAvailable && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-sm">
          <div className="bg-slate-900 border border-blue-500/40 text-white rounded-2xl shadow-2xl shadow-blue-900/30 p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 border border-blue-500/30 p-2 rounded-xl flex-shrink-0">
                <Download className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-white leading-tight">
                  Versi Baru Tersedia
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Tap untuk memuat ulang dengan versi terbaru.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/40"
              >
                Perbarui
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95"
                title="Tutup (perbarui nanti)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGELOG MODAL (muncul saat versi berubah) ────────────────────── */}
      {showChangelog && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
            <button
              onClick={closeChangelog}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>

            <h3 className="text-white font-black text-xl mb-1 italic">
              Selamat Datang di {CURRENT_VERSION}!
            </h3>
            <p className="text-slate-400 text-xs font-medium mb-6">
              Sistem telah diperbarui untuk pengalaman yang lebih baik.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-emerald-400 mb-2">Fitur Baru</h4>
                <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Visual polish premium pada Pop-up Text Editor Modal.</li>
                  <li>Animasi micro-interaction pada tombol formatting dan aksi.</li>
                  <li>Sistem notifikasi PWA update yang aman tanpa force-reload.</li>
                  <li>Fitur Instalasi PWA (Add to Home Screen) di Android & iOS.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={closeChangelog}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
