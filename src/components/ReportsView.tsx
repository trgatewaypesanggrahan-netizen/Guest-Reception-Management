import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  Building,
  Users,
  TrendingUp,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Visit, Unit, Resident } from '../types';
import { formatIndonesianDate, calculateDuration, exportVisitsToCSV } from '../utils/storage';

interface ReportsViewProps {
  visits: Visit[];
  units: Unit[];
  residents: Resident[];
}

export default function ReportsView({ visits, units, residents }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('DAILY');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  // Filtered visits based on report type
  const reportVisits = useMemo(() => {
    const now = new Date();

    if (reportType === 'DAILY') {
      return visits.filter(v => v.created_at.startsWith(selectedDate));
    } else if (reportType === 'WEEKLY') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      return visits.filter(v => new Date(v.created_at) >= past7);
    } else if (reportType === 'MONTHLY') {
      const currentYM = selectedDate.slice(0, 7); // YYYY-MM
      return visits.filter(v => v.created_at.startsWith(currentYM));
    } else {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return visits.filter(v => {
        const d = new Date(v.created_at);
        return d >= start && d <= end;
      });
    }
  }, [visits, reportType, selectedDate, customStart, customEnd]);

  // Statistics
  const totalReportGuests = reportVisits.length;
  const completedVisits = reportVisits.filter(v => v.status === 'CHECKED_OUT');
  const insideVisits = reportVisits.filter(v => v.status === 'INSIDE');

  // Top units visited
  const unitVisitCounts = useMemo(() => {
    const map: Record<string, number> = {};
    reportVisits.forEach(v => {
      map[v.unit_id] = (map[v.unit_id] || 0) + 1;
    });
    return Object.entries(map)
      .map(([unitId, count]) => {
        const u = units.find(unit => unit.id === unitId);
        return {
          unitNumber: u ? `Unit ${u.unit_number}` : unitId,
          building: u?.building || '',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reportVisits, units]);

  // Top residents visited
  const residentVisitCounts = useMemo(() => {
    const map: Record<string, number> = {};
    reportVisits.forEach(v => {
      map[v.resident_id] = (map[v.resident_id] || 0) + 1;
    });
    return Object.entries(map)
      .map(([resId, count]) => {
        const r = residents.find(res => res.id === resId);
        return {
          name: r?.resident_name || 'Penghuni',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reportVisits, residents]);

  const handleExportCSV = () => {
    const csvContent = exportVisitsToCSV(reportVisits, units, residents);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Kunjungan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Laporan & Rekapitulasi</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Laporan Penerimaan Tamu</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis data kunjungan, rekapitulasi unit tujuan, dan ekspor laporan resmi
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
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReportType('DAILY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              reportType === 'DAILY'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Harian
          </button>
          <button
            type="button"
            onClick={() => setReportType('WEEKLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              reportType === 'WEEKLY'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan 7 Hari (Mingguan)
          </button>
          <button
            type="button"
            onClick={() => setReportType('MONTHLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              reportType === 'MONTHLY'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Bulanan
          </button>
          <button
            type="button"
            onClick={() => setReportType('CUSTOM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              reportType === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Rentang Tanggal Khusus
          </button>
        </div>

        {/* Date Inputs */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
          {reportType === 'DAILY' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-medium">Pilih Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          {reportType === 'MONTHLY' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-medium">Pilih Bulan:</span>
              <input
                type="month"
                value={selectedDate.slice(0, 7)}
                onChange={(e) => setSelectedDate(e.target.value + '-01')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          {reportType === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 font-medium">Dari:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">Total Tamu Masuk (Periode Ini)</span>
          <span className="text-3xl font-black text-slate-900">{totalReportGuests}</span>
          <span className="text-xs text-blue-600 block mt-1 font-semibold">Tamu terdaftar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">Selesai Check-Out</span>
          <span className="text-3xl font-black text-slate-800">{completedVisits.length}</span>
          <span className="text-xs text-slate-500 block mt-1 font-medium">
            {totalReportGuests ? Math.round((completedVisits.length / totalReportGuests) * 100) : 0}% telah pulang
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs text-emerald-800 font-medium block mb-1">Masih Berada di Gedung</span>
          <span className="text-3xl font-black text-emerald-800">{insideVisits.length}</span>
          <span className="text-xs text-emerald-600 block mt-1 font-semibold">🟢 Aktif di dalam</span>
        </div>
      </div>

      {/* Top 5 Unit & Top 5 Penghuni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <Building className="w-4 h-4 mr-2 text-blue-600" />
            Unit Paling Sering Dikunjungi
          </h2>
          {unitVisitCounts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Tidak ada data untuk periode ini.</p>
          ) : (
            <div className="space-y-2.5">
              {unitVisitCounts.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-800">{u.unitNumber} ({u.building})</span>
                  <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    {u.count} kunjungan
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2 text-blue-600" />
            Penghuni yang Paling Banyak Menerima Tamu
          </h2>
          {residentVisitCounts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Tidak ada data untuk periode ini.</p>
          ) : (
            <div className="space-y-2.5">
              {residentVisitCounts.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-800">{r.name}</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {r.count} kunjungan
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Daftar Lengkap Kunjungan ({reportVisits.length})
          </h3>
        </div>

        {reportVisits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada transaksi kunjungan pada rentang waktu yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">No. Kunjungan</th>
                  <th className="py-2.5 px-4">Nama Tamu</th>
                  <th className="py-2.5 px-4">No. Telepon</th>
                  <th className="py-2.5 px-4">Unit Dituju</th>
                  <th className="py-2.5 px-4">Penghuni</th>
                  <th className="py-2.5 px-4">Keperluan</th>
                  <th className="py-2.5 px-4">Check-In</th>
                  <th className="py-2.5 px-4">Check-Out</th>
                  <th className="py-2.5 px-4">Durasi</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportVisits.map(v => {
                  const unit = units.find(u => u.id === v.unit_id);
                  const resident = residents.find(r => r.id === v.resident_id);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-900">{v.visit_number}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{v.guest_name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{v.phone_number}</td>
                      <td className="py-2.5 px-4">Unit {unit?.unit_number}</td>
                      <td className="py-2.5 px-4">{resident?.resident_name || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-600 truncate max-w-[140px]">{v.purpose}</td>
                      <td className="py-2.5 px-4 font-mono">{formatIndonesianDate(v.checkin_datetime)}</td>
                      <td className="py-2.5 px-4 font-mono">
                        {v.checkout_datetime ? formatIndonesianDate(v.checkout_datetime) : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">
                        {calculateDuration(v.checkin_datetime, v.checkout_datetime)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'INSIDE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'CHECKED_OUT'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
