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
          <h1 className="text-2xl font-black text-slate-900 uppercase italic">Manajemen <span className="text-blue-600">Staff</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola akses admin kantor</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Tambah Admin
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama / Username</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-slate-900">{u.name || "N/A"}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.username}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'OWNER' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                   {u.isActive ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => { setEditingUser(u); setFormData({ ...u, password: "" }); setModalOpen(true); }}
                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => { if(confirm("Hapus user ini?")) { await deleteUser(u.id); loadUsers(); } }}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 space-y-6 animate-in zoom-in-95 duration-300">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                   <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase italic">
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
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-bold text-sm"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                   <input 
                     required
                     type="text" 
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-bold text-sm"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password {editingUser && "(Kosongkan jika tidak ganti)"}</label>
                   <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-bold text-sm pr-14"
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
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Batal</button>
                   <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">Simpan</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
