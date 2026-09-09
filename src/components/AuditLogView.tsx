import { useState, useMemo } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../types';
import { getAuditLogs, formatIndonesianDate } from '../utils/storage';

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.activity.toLowerCase().includes(searchTerm.toLowerCase());
      const matchActivity = !activityFilter || log.activity === activityFilter;
      return matchSearch && matchActivity;
    });
  }, [logs, searchTerm, activityFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Keamanan & Kepatuhan</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Audit Trail & Log Aktivitas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mencatat setiap aksi Check-In, Check-Out, modifikasi data, login, dan pencetakan bukti kunjungan
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLogs(getAuditLogs())}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Muat Ulang Log
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari aktivitas, petugas, atau keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="CHECK_IN">CHECK-IN</option>
            <option value="CHECK_OUT">CHECK-OUT</option>
            <option value="PRINT_PROOF">CETAK BUKTI</option>
            <option value="CREATE_RESIDENT">TAMBAH PENGHUNI</option>
            <option value="CREATE_UNIT">TAMBAH UNIT</option>
            <option value="EDIT_DATA">EDIT DATA</option>
            <option value="DELETE_DATA">HAPUS DATA</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Belum ada rekam log aktivitas yang sesuai dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu Aksi</th>
                  <th className="py-3 px-4">Petugas</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Jenis Aksi</th>
                  <th className="py-3 px-4">Detail Aktivitas</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatIndonesianDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        log.activity === 'CHECK_IN'
                          ? 'bg-blue-100 text-blue-800'
                          : log.activity === 'CHECK_OUT'
                          ? 'bg-slate-800 text-white'
                          : log.activity === 'DELETE_DATA'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.activity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
