"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Bell,
  Search
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Penawaran", href: "/quotations", icon: FileText },
  { name: "Invoice", href: "/invoice", icon: Receipt },
  { name: "Data Klien", href: "/clients", icon: Users },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Sembunyikan layout pada halaman login dan print
  const isAuthPage = pathname?.startsWith("/login");
  const isPrintPage = pathname?.startsWith("/print");
  
  if (isAuthPage || isPrintPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-['Outfit',sans-serif]">
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden lg:flex w-72 bg-slate-900 flex-col sticky top-0 h-screen border-r border-white/5 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Receipt className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-tighter italic">Studio AKL</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Admin Suite</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}

          {/* SCSA FIX: Tambah menu Manajemen Staff khusus Owner */}
          {(session?.user as any)?.role === "OWNER" && (
            <Link 
              href="/settings/users"
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                pathname === "/settings/users" 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <Users className={`w-5 h-5 ${pathname === "/settings/users" ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span className="text-sm font-black uppercase tracking-widest">Manajemen Staff</span>
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-white/5">
           <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-3xl border border-white/5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-slate-400">
                {session?.user?.name?.substring(0,2).toUpperCase() || "AD"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white uppercase truncate">{session?.user?.name || "Admin Studio"}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
              </div>
           </div>
           <button 
             onClick={() => signOut()}
             className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-red-400 transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
           >
             <LogOut className="w-4 h-4" /> Keluar Sistem
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER - TOP BAR */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
             <div className="flex items-center gap-4">
                {/* Logo for mobile */}
                <div className="lg:hidden flex items-center gap-2">
                   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Receipt className="text-white w-5 h-5" />
                   </div>
                   <h1 className="text-slate-900 font-black text-xs uppercase tracking-tighter italic">AKL</h1>
                </div>

                <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/50">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Cari Dokumen..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-400 w-48" />
                </div>
             </div>

             <div className="flex items-center gap-2 lg:gap-4">
                <button className="hidden sm:block p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                
                {/* Tombol Logout (Mobile) - Agar mudah ditemukan di HP */}
                <button 
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                      signOut();
                    }
                  }}
                  className="lg:hidden p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all flex items-center gap-2 border border-red-100"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Keluar</span>
                </button>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden lg:block"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-[10px] font-black text-slate-900 uppercase">{session?.user?.name || "Admin"}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Office Manager</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 font-black text-xs">
                    {session?.user?.name?.substring(0,2).toUpperCase() || "AD"}
                  </div>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-lg">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl transition-all ${
                isActive ? "text-blue-600" : "text-slate-400"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-blue-600/10" : ""}`}>
                <item.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
        
        {/* SCSA FIX: Tambah menu Manajemen Staff khusus Owner di Mobile */}
        {(session?.user as any)?.role === "OWNER" && (
           <Link 
            href="/settings/users"
            className={`flex flex-col items-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl transition-all ${
              pathname === "/settings/users" ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${pathname === "/settings/users" ? "bg-blue-600/10" : ""}`}>
              <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">Staff</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
