"use client";

import React, { useState, useEffect } from "react";
import { getUsers, saveUser, deleteUser } from "@/app/actions/users";
import { Users, Plus, Shield, Trash2, Edit2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ username: "", password: "", name: "", role: "ADMIN" });
  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if (res.success) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveUser({ ...formData, id: editingUser?.id });
    if (res.success) {
      setModalOpen(false);
      setEditingUser(null);
      setFormData({ username: "", password: "", name: "", role: "ADMIN" });
      loadUsers();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic">Manajemen <span className="text-blue-500">Staff</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola akses admin kantor</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Tambah Admin
        </button>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama / Username</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-white">{u.name || "N/A"}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.username}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'OWNER' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-300'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                   {u.isActive ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => { setEditingUser(u); setFormData({ ...u, password: "" }); setModalOpen(true); }}
                    className="p-2 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => { if(confirm("Hapus user ini?")) { await deleteUser(u.id); loadUsers(); } }}
                    className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/5 w-full max-w-md rounded-[40px] shadow-2xl p-10 space-y-6 animate-in zoom-in-95 duration-300">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                   <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-white uppercase italic">
                  {editingUser ? "Edit Admin" : "Tambah Admin"}
                </h2>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
                   <input 
                     required
                     type="text" 
                     value={formData.username}
                     onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                     className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-sm text-white"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                   <input 
                     required
                     type="text" 
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-sm text-white"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password {editingUser && "(Kosongkan jika tidak ganti)"}</label>
                   <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-sm pr-14 text-white"
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                     >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hak Akses (Role)</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                        className={`py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${formData.role === 'ADMIN' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 bg-slate-950 hover:border-white/10'}`}
                      >
                         <span className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'ADMIN' ? 'text-blue-400' : 'text-slate-400'}`}>Staff Admin</span>
                         <span className="text-[8px] text-slate-400 font-medium">Akses terbatas</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "OWNER" })}
                        className={`py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${formData.role === 'OWNER' ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 bg-slate-950 hover:border-white/10'}`}
                      >
                         <span className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'OWNER' ? 'text-indigo-400' : 'text-slate-400'}`}>Owner / Direksi</span>
                         <span className="text-[8px] text-slate-400 font-medium">Akses penuh</span>
                      </button>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-800 transition-all">Batal</button>
                   <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">Simpan</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
