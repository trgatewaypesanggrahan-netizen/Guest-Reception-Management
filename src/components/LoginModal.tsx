import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { User as AppUser, UserRole } from '../types';
import { getUsers, addAuditLog } from '../utils/storage';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: AppUser | null;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
}

export default function LoginModal({
  isOpen,
  currentUser,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const users = getUsers();
    const found = users.find(
      u =>
        (u.username.toLowerCase() === username.trim().toLowerCase() ||
          u.email.toLowerCase() === username.trim().toLowerCase()) &&
        u.password_hash === password.trim()
    );

    if (!found) {
      setErrorMsg('Username atau password tidak cocok. Silakan coba lagi.');
      return;
    }

    if (found.status === 'Nonaktif') {
      setErrorMsg('Akun pengguna ini dinonaktifkan oleh Administrator.');
      return;
    }

    addAuditLog({
      activity: 'LOGIN',
      target_id: found.id,
      details: `Login berhasil: ${found.name} (${found.role})`,
      user_name: found.name,
      user_role: found.role,
      status: 'SUCCESS',
    });

    onLoginSuccess(found);
    onClose();
  };

  const handleQuickLogin = (role: UserRole) => {
    const users = getUsers();
    const sample = users.find(u => u.role === role && u.status === 'Aktif') || users[0];
    if (sample) {
      addAuditLog({
        activity: 'LOGIN',
        target_id: sample.id,
        details: `Quick login mode: ${sample.name} (${sample.role})`,
        user_name: sample.name,
        user_role: sample.role,
        status: 'SUCCESS',
      });
      onLoginSuccess(sample);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-blue-950 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black">Masuk ke Sistem GRM</h2>
          <p className="text-xs text-slate-300 mt-1">
            Guest Reception Management • Apartemen & Rusunami
          </p>
        </div>

        {/* Quick Demo Role Picker */}
        <div className="p-5 bg-slate-50 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Akses Cepat Demo (Pilih Akun):
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('RECEPTIONIST')}
              className="px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-bold transition text-center"
            >
              🔵 Resepsionis
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="px-2.5 py-2 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-900 text-xs font-bold transition text-center"
            >
              🟣 Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('GUEST')}
              className="px-2.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition text-center"
            >
              🟢 Mode Tamu
            </button>
          </div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="receptionist / admin / guest"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center"
            >
              <span>MASUK SEKARANG</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
