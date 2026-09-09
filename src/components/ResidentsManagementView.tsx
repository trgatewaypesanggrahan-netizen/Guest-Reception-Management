import React, { useState, useMemo } from 'react';
import { UserPlus, Search, Edit2, Trash2, User, Phone, Building, Check, X, AlertTriangle } from 'lucide-react';
import { Resident, Unit } from '../types';
import { saveResident, deleteResident, addAuditLog } from '../utils/storage';

interface ResidentsManagementViewProps {
  residents: Resident[];
  units: Unit[];
  currentUserName: string;
  onDataChanged: () => void;
  showToast: (title: string, msg: string, type: 'success' | 'error') => void;
}

export default function ResidentsManagementView({
  residents,
  units,
  currentUserName,
  onDataChanged,
  showToast,
}: ResidentsManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deletingResident, setDeletingResident] = useState<Resident | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Tidak Aktif'>('Aktif');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchSearch =
        r.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone_number.includes(searchTerm);
      const matchUnit = !selectedUnitFilter || r.unit_id === selectedUnitFilter;
      return matchSearch && matchUnit;
    });
  }, [residents, searchTerm, selectedUnitFilter]);

  const openAddModal = () => {
    setEditingResident(null);
    setName('');
    setPhone('');
    setUnitId(units[0]?.id || '');
    setStatus('Aktif');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (resident: Resident) => {
    setEditingResident(resident);
    setName(resident.resident_name);
    setPhone(resident.phone_number);
    setUnitId(resident.unit_id);
    setStatus(resident.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setFormError('Nama penghuni wajib diisi (minimal 2 karakter).');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setFormError('Nomor telepon tidak valid.');
      return;
    }
    if (!unitId) {
      setFormError('Pilih unit apartemen.');
      return;
    }

    const payload: Resident = {
      id: editingResident ? editingResident.id : `r-${Date.now()}`,
      resident_name: name.trim(),
      phone_number: phone.trim(),
      unit_id: unitId,
      status: status,
      created_at: editingResident ? editingResident.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveResident(payload);
    addAuditLog({
      activity: editingResident ? 'EDIT_DATA' : 'CREATE_RESIDENT',
      target_id: payload.id,
      details: `${editingResident ? 'Update' : 'Tambah'} data penghuni: ${payload.resident_name}`,
      user_name: currentUserName,
      user_role: 'RECEPTIONIST',
      status: 'SUCCESS',
    });

    showToast(
      'Berhasil',
      `Data penghuni ${payload.resident_name} berhasil ${editingResident ? 'diperbarui' : 'ditambahkan'}.`,
      'success'
    );
    setIsFormOpen(false);
    onDataChanged();
  };

  const confirmDelete = () => {
    if (!deletingResident) return;
    deleteResident(deletingResident.id);
    addAuditLog({
      activity: 'DELETE_DATA',
      target_id: deletingResident.id,
      details: `Hapus data penghuni: ${deletingResident.resident_name}`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });

    showToast('Berhasil Dihapus', `Data penghuni ${deletingResident.resident_name} telah dihapus.`, 'success');
    setDeletingResident(null);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Database Master</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Data Penghuni Apartemen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar penghuni resmi unit hunian terpadu (Total: {residents.length})
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          + Tambah Penghuni
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama penghuni atau nomor telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Unit</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>Unit {u.unit_number} ({u.building})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredResidents.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Belum ada data penghuni yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Penghuni</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Unit Hunian</th>
                  <th className="py-3 px-4">Lantai & Gedung</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResidents.map(r => {
                  const unit = units.find(u => u.id === r.unit_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.resident_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {r.phone_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-900">
                        Unit {unit?.unit_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Lt. {unit?.floor || '-'} - {unit?.building || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Penghuni"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingResident(r)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Penghuni"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL (TAMBAH / EDIT) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingResident ? 'Edit Data Penghuni' : 'Tambah Penghuni Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Lengkap Penghuni <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  No. Telepon / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Unit Hunian <span className="text-red-500">*</span>
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Pilih Unit --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>Unit {u.unit_number} (Lt. {u.floor} - {u.building})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Status Penghuni
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Konfirmasi Hapus Penghuni</h3>
            <p className="text-xs text-slate-500 mb-5">
              Apakah Anda yakin ingin menghapus data penghuni <strong>{deletingResident.resident_name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setDeletingResident(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
