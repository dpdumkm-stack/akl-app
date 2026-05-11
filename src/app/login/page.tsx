"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Username atau password salah!");
                setIsLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white border border-slate-200 rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-slate-200/50">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">AKL STUDIO</h1>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">PT. Apindo Karya Lestari</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-300"
                                    placeholder="Username admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs font-bold py-3 px-4 rounded-xl text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#EE1D23] hover:bg-[#D11A1F] text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 group transition-all disabled:opacity-50"
                        >
                            {isLoading ? "Masuk..." : (
                                <>
                                    LOGIN KE SISTEM
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            &copy; 2026 PT. APINDO KARYA LESTARI
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
</div>
    );
}
