import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  Calendar,
  Building,
  User,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Visit, Unit, Resident, VisitStatus } from '../types';
import { formatIndonesianDate, calculateDuration, exportVisitsToCSV } from '../utils/storage';

interface HistoryViewProps {
  visits: Visit[];
  units: Unit[];
  residents: Resident[];
  onViewDetail: (visit: Visit) => void;
  onPrintProof: (visit: Visit) => void;
}

export default function HistoryView({
  visits,
  units,
  residents,
  onViewDetail,
  onPrintProof,
}: HistoryViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('');
  const [selectedResidentFilter, setSelectedResidentFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sort & Pagination
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'NAME'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredVisits = useMemo(() => {
    let result = [...visits];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(v => {
        const u = units.find(unit => unit.id === v.unit_id);
        const r = residents.find(res => res.id === v.resident_id);
        return (
          v.guest_name.toLowerCase().includes(q) ||
          v.visit_number.toLowerCase().includes(q) ||
          v.phone_number.includes(q) ||
          v.purpose.toLowerCase().includes(q) ||
          (u && u.unit_number.toLowerCase().includes(q)) ||
          (r && r.resident_name.toLowerCase().includes(q))
        );
      });
    }

    // Unit Filter
    if (selectedUnitFilter) {
      result = result.filter(v => v.unit_id === selectedUnitFilter);
    }

    // Resident Filter
    if (selectedResidentFilter) {
      result = result.filter(v => v.resident_id === selectedResidentFilter);
    }

    // Status Filter
    if (selectedStatusFilter !== 'ALL') {
      result = result.filter(v => v.status === selectedStatusFilter);
    }

    // Date Filter
    const now = new Date();
    if (dateFilterMode === 'TODAY') {
      const todayStr = now.toDateString();
      result = result.filter(v => new Date(v.created_at).toDateString() === todayStr);
    } else if (dateFilterMode === 'WEEK') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      result = result.filter(v => new Date(v.created_at) >= weekAgo);
    } else if (dateFilterMode === 'MONTH') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      result = result.filter(v => new Date(v.created_at) >= monthAgo);
    } else if (dateFilterMode === 'CUSTOM') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        result = result.filter(v => new Date(v.created_at) >= start);
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(v => new Date(v.created_at) <= end);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'NEWEST') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortOrder === 'OLDEST') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return a.guest_name.localeCompare(b.guest_name);
      }
    });

    return result;
  }, [
    visits,
    searchTerm,
    selectedUnitFilter,
    selectedResidentFilter,
    selectedStatusFilter,
    dateFilterMode,
    customStartDate,
    customEndDate,
    sortOrder,
    units,
    residents,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage) || 1;
  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVisits.slice(start, start + itemsPerPage);
  }, [filteredVisits, currentPage]);

  const handleExportCSV = () => {
    const csvContent = exportVisitsToCSV(filteredVisits, units, residents);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Riwayat_Kunjungan_GRM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Export */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Rekam Jejak Kunjungan</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Riwayat Seluruh Kunjungan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan {filteredVisits.length} data kunjungan tamu gedung hunian
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Global Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, nomor kunjungan, telepon, unit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={selectedUnitFilter}
              onChange={(e) => {
                setSelectedUnitFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="INSIDE">🟢 Sedang Berada</option>
              <option value="CHECKED_OUT">⚫ Sudah Check-Out</option>
              <option value="CANCELLED">🔴 Dibatalkan</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilterMode}
              onChange={(e) => {
                setDateFilterMode(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">7 Hari Terakhir</option>
              <option value="MONTH">Bulan Ini</option>
              <option value="CUSTOM">Custom Tanggal...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Picker Range */}
        {dateFilterMode === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Rentang Tanggal:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}

        {/* Sorting and Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Menampilkan hasil filter: <strong>{filteredVisits.length}</strong> kunjungan</span>

          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Urutkan:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
            >
              <option value="NEWEST">Terbaru Masuk</option>
              <option value="OLDEST">Terlama Masuk</option>
              <option value="NAME">Nama Tamu (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginatedVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada riwayat kunjungan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Kunjungan</th>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Nama Tamu</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Unit & Lantai</th>
                  <th className="py-3 px-4">Penghuni</th>
                  <th className="py-3 px-4">Keperluan</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedVisits.map(v => {
                  const unit = units.find(u => u.id === v.unit_id);
                  const resident = residents.find(r => r.id === v.resident_id);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {v.visit_number}
                      </td>
                      <td className="py-3 px-4">
                        <img
                          src={v.checkin_photo}
                          alt={v.guest_name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {v.guest_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {v.phone_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        Unit {unit?.unit_number || v.unit_id} (Lt. {unit?.floor || '-'})
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {resident?.resident_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={v.purpose}>
                        {v.purpose}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatIndonesianDate(v.checkin_datetime)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {v.checkout_datetime ? formatIndonesianDate(v.checkout_datetime) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          v.status === 'INSIDE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'CHECKED_OUT'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {v.status === 'INSIDE' ? '🟢 Sedang Berada' : v.status === 'CHECKED_OUT' ? '⚫ Check-Out' : '🔴 Batal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onViewDetail(v)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Detail Lengkap Kunjungan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintProof(v)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Cetak Bukti Kunjungan"
                          >
                            <Printer className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {filteredVisits.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredVisits.length} data)
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
