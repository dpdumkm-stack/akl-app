"use client";

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const isIOS = typeof window !== 'undefined' ? /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) : false;
  const isInstalled = typeof window !== 'undefined' ? ((window.navigator as any).standalone || document.referrer.includes('android-app://')) : false;

  useEffect(() => {
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    } else {
      console.log('User dismissed the PWA install');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  const iOSBanner = (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-gray-100 shadow-lg rounded-lg p-4 flex items-center space-x-3 z-50">
      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13l-1.41 1.41L12 13.83l-3.59 3.58L7 15l5-5 5 5z"/></svg>
      <span className="text-sm">Tambah ke Layar Utama untuk menginstal aplikasi.</span>
    </div>
  );

  if (isInstalled) return null;

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-800 text-gray-100 rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Instal aplikasi?</h3>
            <p className="text-sm text-gray-300 mb-4">Tambah Studio AKL ke layar utama untuk pengalaman lebih cepat.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-200 bg-gray-700 rounded">Nanti</button>
              <button onClick={handleInstall} className="px-4 py-2 text-sm text-white bg-blue-600 rounded">Instal</button>
            </div>
          </div>
        </div>
      )}
      {isIOS && !showPrompt && !isInstalled && iOSBanner}
    </>
  );
}
