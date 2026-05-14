"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileText, CheckCircle2, Cpu, Zap, ShieldCheck } from "lucide-react";

interface PrintingProgressProps {
    isOpen: boolean;
    progress: number;
}

export default function PrintingProgress({ isOpen, progress }: PrintingProgressProps) {
    const [statusText, setStatusText] = useState("Menyiapkan Mesin Cetak...");

    useEffect(() => {
        if (progress < 20) setStatusText("Mengoptimalkan Layout A4...");
        else if (progress < 40) setStatusText("Menyiapkan Data & Aset...");
        else if (progress < 70) setStatusText("Proses Rendering Puppeteer...");
        else if (progress < 90) setStatusText("Finalisasi Dokumen PDF...");
        else if (progress < 100) setStatusText("Hampir Selesai...");
        else setStatusText("Selesai! Mengunduh Dokumen...");
    }, [progress]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 no-print">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" />
            
            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Decorative Header */}
                <div className="h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 flex justify-center items-center">
                        <Cpu className="w-40 h-40 text-white animate-[pulse_3s_infinite]" />
                    </div>
                    <div className="relative flex items-center gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">PDF Engine Active</h3>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Icon & Progress % */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            {progress < 100 ? (
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="44"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            className="text-blue-600 transition-all duration-150 ease-out"
                                            strokeDasharray={2 * Math.PI * 44}
                                            strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-slate-800 tracking-tighter">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-500">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{progress < 100 ? 'Sedang Diproses' : 'Proses Berhasil'}</p>
                            <h4 className="text-sm font-bold text-slate-500 min-h-[1.25rem] transition-all">{statusText}</h4>
                        </div>
                    </div>

                    {/* Progress Bar (Visual Confirmation) */}
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite] w-20" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server Side Rendering</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Safe Layout</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-center">
                        Dibuat dengan High-Performance Engine<br/>
                        <span className="text-slate-300 text-[8px]">PT. Apindo Karya Lestari - Official Quotation System</span>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    from { left: -100px; }
                    to { left: 100%; }
                }
            `}</style>
        </div>
    );
}
