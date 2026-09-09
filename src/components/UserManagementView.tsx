import React, { useState } from 'react';
import { Shield, UserPlus, KeyRound, Check, X, AlertTriangle, User, Mail } from 'lucide-react';
import { User as AppUser, UserRole } from '../types';
import { getUsers, saveUser, deleteUser, addAuditLog } from '../utils/storage';

interface UserManagementViewProps {
  currentUserName: string;
  showToast: (title: string, msg: string, type: 'success' | 'error') => void;
}

export default function UserManagementView({
  currentUserName,
  showToast,
}: UserManagementViewProps) {
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('RECEPTIONIST');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formError, setFormError] = useState<string | null>(null);

  const reloadUsers = () => {
    setUsers(getUsers());
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('RECEPTIONIST');
    setStatus('Aktif');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setStatus(user.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }
    if (!editingUser && (!password.trim() || password.length < 6)) {
      setFormError('Password minimal 6 karakter.');
      return;
    }

    const payload: AppUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password_hash: password.trim() ? password.trim() : (editingUser?.password_hash || 'admin123'),
      role: role,
      status: status,
      created_at: editingUser ? editingUser.created_at : new Date().toISOString(),
    };

    saveUser(payload);
    addAuditLog({
      activity: editingUser ? 'EDIT_DATA' : 'CREATE_USER',
      target_id: payload.id,
      details: `${editingUser ? 'Update' : 'Tambah'} akun user: ${payload.username} (${payload.role})`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });

    showToast('Berhasil', `Akun ${payload.username} berhasil disimpan.`, 'success');
    setIsFormOpen(false);
    reloadUsers();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim() || newPassword.length < 6) {
      showToast('Gagal', 'Password baru minimal 6 karakter.', 'error');
      return;
    }

    const updated: AppUser = {
      ...resettingUser,
      password_hash: newPassword.trim(),
    };

    saveUser(updated);
    addAuditLog({
      activity: 'EDIT_DATA',
      target_id: resettingUser.id,
      details: `Reset password untuk akun: ${resettingUser.username}`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });

    showToast('Password Berhasil Direset', `Password akun ${resettingUser.username} telah diperbarui.`, 'success');
    setResettingUser(null);
    setNewPassword('');
    reloadUsers();
  };

  const toggleStatus = (user: AppUser) => {
    const nextStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated: AppUser = { ...user, status: nextStatus };
    saveUser(updated);
    addAuditLog({
      activity: 'EDIT_DATA',
      target_id: user.id,
      details: `Ubah status akun ${user.username} menjadi ${nextStatus}`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });
    showToast('Status Diubah', `Akun ${user.username} sekarang ${nextStatus}.`, 'success');
    reloadUsers();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Hak Akses & Keamanan</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Manajemen Pengguna (Users)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun petugas resepsionis, administrator gedung, dan tamu (Total: {users.length})
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          + Tambah User Baru
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{u.username}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'RECEPTIONIST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                        u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title="Klik untuk mengubah status aktif/nonaktif"
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResettingUser(u);
                          setNewPassword('');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah Resepsionis"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="sarah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@apartemen.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Password Awal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Role Hak Akses
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RECEPTIONIST">RECEPTIONIST (Resepsionis)</option>
                    <option value="ADMIN">ADMIN (Administrator)</option>
                    <option value="GUEST">GUEST (Tamu)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Status Akun
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Reset Password Pengguna</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan password baru untuk akun <strong>{resettingUser.username}</strong> ({resettingUser.name}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
