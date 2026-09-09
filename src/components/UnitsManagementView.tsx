import React, { useState, useMemo } from 'react';
import { Building, Plus, Search, Edit2, Trash2, Users, Check, X, AlertTriangle } from 'lucide-react';
import { Unit, Resident, UnitStatus } from '../types';
import { saveUnit, deleteUnit, addAuditLog } from '../utils/storage';

interface UnitsManagementViewProps {
  units: Unit[];
  residents: Resident[];
  currentUserName: string;
  onDataChanged: () => void;
  showToast: (title: string, msg: string, type: 'success' | 'error') => void;
}

export default function UnitsManagementView({
  units,
  residents,
  currentUserName,
  onDataChanged,
  showToast,
}: UnitsManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Form
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [building, setBuilding] = useState('Tower A');
  const [status, setStatus] = useState<UnitStatus>('Kosong');
  const [formError, setFormError] = useState<string | null>(null);

  // Unique floors and buildings
  const floors = useMemo(() => Array.from(new Set(units.map(u => u.floor))).sort(), [units]);
  const buildings = useMemo(() => Array.from(new Set(units.map(u => u.building))).sort(), [units]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchSearch =
        u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.building.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFloor = !floorFilter || u.floor === floorFilter;
      const matchBuilding = !buildingFilter || u.building === buildingFilter;
      return matchSearch && matchFloor && matchBuilding;
    });
  }, [units, searchTerm, floorFilter, buildingFilter]);

  const openAddModal = () => {
    setEditingUnit(null);
    setUnitNumber('');
    setFloor('1');
    setBuilding('Tower A');
    setStatus('Kosong');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitNumber(unit.unit_number);
    setFloor(unit.floor);
    setBuilding(unit.building);
    setStatus(unit.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setFormError('Nomor unit wajib diisi (contoh: A-101).');
      return;
    }

    const payload: Unit = {
      id: editingUnit ? editingUnit.id : `u-${Date.now()}`,
      unit_number: unitNumber.trim().toUpperCase(),
      floor: floor.trim(),
      building: building.trim(),
      status: status,
      created_at: editingUnit ? editingUnit.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveUnit(payload);
    addAuditLog({
      activity: editingUnit ? 'EDIT_DATA' : 'CREATE_UNIT',
      target_id: payload.id,
      details: `${editingUnit ? 'Update' : 'Tambah'} data unit: ${payload.unit_number}`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });

    showToast(
      'Berhasil',
      `Data unit ${payload.unit_number} berhasil ${editingUnit ? 'diperbarui' : 'ditambahkan'}.`,
      'success'
    );
    setIsFormOpen(false);
    onDataChanged();
  };

  const confirmDelete = () => {
    if (!deletingUnit) return;
    deleteUnit(deletingUnit.id);
    addAuditLog({
      activity: 'DELETE_DATA',
      target_id: deletingUnit.id,
      details: `Hapus unit: ${deletingUnit.unit_number}`,
      user_name: currentUserName,
      user_role: 'ADMIN',
      status: 'SUCCESS',
    });

    showToast('Berhasil Dihapus', `Unit ${deletingUnit.unit_number} telah dihapus.`, 'success');
    setDeletingUnit(null);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Database Master</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Data Unit Hunian</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data nomor unit, denah lantai, dan gedung hunian (Total: {units.length})
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + Tambah Unit
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nomor unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Lantai</option>
            {floors.map(fl => (
              <option key={fl} value={fl}>Lantai {fl}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Gedung/Tower</option>
            {buildings.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Unit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredUnits.map(unit => {
          const matchingResidents = residents.filter(r => r.unit_id === unit.id);

          return (
            <div
              key={unit.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {unit.unit_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    unit.status === 'Terisi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : unit.status === 'Kosong'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {unit.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {unit.building} • Lantai {unit.floor}
                </p>

                {/* Penghuni Info */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center text-[11px] font-semibold text-slate-500 mb-1">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Penghuni ({matchingResidents.length}):
                  </div>
                  {matchingResidents.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Belum ada penghuni terdaftar</p>
                  ) : (
                    <div className="space-y-1">
                      {matchingResidents.map(r => (
                        <div key={r.id} className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span className="truncate">{r.resident_name}</span>
                          <span className="text-[10px] font-mono text-slate-500 ml-1">{r.phone_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-1">
                <button
                  type="button"
                  onClick={() => openEditModal(unit)}
                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  title="Edit Unit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingUnit(unit)}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  title="Hapus Unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM MODAL (TAMBAH / EDIT UNIT) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUnit ? 'Edit Data Unit' : 'Tambah Unit Baru'}
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
                  Nomor Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: A-101 atau B-205"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Lantai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1, 2, 10"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Gedung / Tower <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tower A"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Status Unit
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Terisi">Terisi (Ada Penghuni)</option>
                  <option value="Kosong">Kosong (Siap Huni)</option>
                  <option value="Tidak Aktif">Tidak Aktif (Renovasi/Maintenance)</option>
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
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Konfirmasi Hapus Unit</h3>
            <p className="text-xs text-slate-500 mb-5">
              Apakah Anda yakin ingin menghapus unit <strong>{deletingUnit.unit_number}</strong>?
            </p>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setDeletingUnit(null)}
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
