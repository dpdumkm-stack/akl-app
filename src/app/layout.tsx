import { Providers } from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

import { ensureAdminAccounts } from "@/lib/init-admin";

export const metadata = {
  title: "Studio AKL - Office Suite",
  description: "Aplikasi Penawaran Terintegrasi PT. Apindo Karya Lestari",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Studio AKL",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Jalankan pengecekan akun admin di sisi server setiap kali layout di-render (opsional, tapi aman)
  // Atau lebih baik, ini akan dipanggil sekali saat modul ini di-load.
  await ensureAdminAccounts();
  
  return (
    <html lang="id">
      <body className="bg-slate-100 font-sans text-slate-800">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
