import { useState, useMemo } from 'react';
import {
  UserPlus,
  LogOut,
  QrCode,
  Users,
  Clock,
  TrendingUp,
  Building,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Visit, Unit, Resident } from '../types';
import { formatIndonesianDate, calculateDuration } from '../utils/storage';

interface DashboardViewProps {
  visits: Visit[];
  units: Unit[];
  residents: Resident[];
  onStartCheckIn: () => void;
  onStartCheckOut: (visitNumber?: string) => void;
  onStartQRScan: () => void;
  onViewActiveGuests: () => void;
  onViewDetail: (visit: Visit) => void;
}

export default function DashboardView({
  visits,
  units,
  residents,
  onStartCheckIn,
  onStartCheckOut,
  onStartQRScan,
  onViewActiveGuests,
  onViewDetail,
}: DashboardViewProps) {
  const [tableSearch, setTableSearch] = useState('');

  // Current date metrics
  const today = new Date();
  const todayDateStr = today.toDateString();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Metric 1: Total Tamu Hari Ini (Distinct visits initiated today)
  const visitsToday = useMemo(() => {
    return visits.filter(v => new Date(v.created_at).toDateString() === todayDateStr);
  }, [visits, todayDateStr]);

  // Metric 2: Tamu Sedang Berada di Gedung (Status INSIDE)
  const insideGuests = useMemo(() => {
    return visits.filter(v => v.status === 'INSIDE');
  }, [visits]);

  // Metric 3: Total Check-In Hari Ini
  const checkinsTodayCount = visitsToday.length;

  // Metric 4: Total Check-Out Hari Ini
  const checkoutsToday = useMemo(() => {
    return visits.filter(v => {
      if (!v.checkout_datetime) return false;
      return new Date(v.checkout_datetime).toDateString() === todayDateStr;
    });
  }, [visits, todayDateStr]);

  // Metric 5: Tamu Belum Check-Out (all visits currently INSIDE)
  const pendingCheckoutCount = insideGuests.length;

  // Metric 6: Total Kunjungan Bulan Ini
  const visitsThisMonth = useMemo(() => {
    return visits.filter(v => {
      const d = new Date(v.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [visits, currentMonth, currentYear]);

  // Filtered inside guests table
  const filteredInsideGuests = useMemo(() => {
    if (!tableSearch.trim()) return insideGuests;
    const q = tableSearch.toLowerCase().trim();
    return insideGuests.filter(v => {
      const u = units.find(unit => unit.id === v.unit_id);
      const r = residents.find(res => res.id === v.resident_id);
      return (
        v.guest_name.toLowerCase().includes(q) ||
        v.phone_number.includes(q) ||
        v.visit_number.toLowerCase().includes(q) ||
        (u && u.unit_number.toLowerCase().includes(q)) ||
        (r && r.resident_name.toLowerCase().includes(q)) ||
        v.purpose.toLowerCase().includes(q)
      );
    });
  }, [insideGuests, tableSearch, units, residents]);

  // Daily visits chart data for last 7 days
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const dayCheckins = visits.filter(v => new Date(v.created_at).toDateString() === dateStr).length;
      const dayCheckouts = visits.filter(v => v.checkout_datetime && new Date(v.checkout_datetime).toDateString() === dateStr).length;

      days.push({ dayName, checkins: dayCheckins, checkouts: dayCheckouts });
    }
    return days;
  }, [visits]);

  // Max value for chart scaling
  const maxDayVal = Math.max(...last7DaysData.map(d => Math.max(d.checkins, d.checkouts)), 4);

  return (
    <div className="space-y-6">
      {/* 24. HALAMAN UTAMA RESEPSIONIS: TOMBOL AKSI CEPAT PROMINENT */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
              Sistem Resepsionis Aktif & Siap Menerima Tamu
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Guest Reception Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Penerimaan tamu apartemen & rusunami. Proses Check-In, foto identitas resmi, tanda tangan digital, dan Check-Out terpadu.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">Waktu Sistem Server</span>
            <span className="font-mono text-sm font-bold text-blue-200">
              {formatIndonesianDate(new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* 4 PROMINENT ACTION BUTTONS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. + CHECK-IN TAMU */}
          <button
            type="button"
            onClick={onStartCheckIn}
            className="group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-2.5 rounded-xl bg-white/15 mb-3 group-hover:scale-110 transition">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide">+ CHECK-IN TAMU</span>
            <span className="text-[11px] text-blue-100 mt-0.5 opacity-90">Daftarkan tamu baru</span>
          </button>

          {/* 2. CHECK-OUT TAMU */}
          <button
            type="button"
            onClick={() => onStartCheckOut()}
            className="group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-2.5 rounded-xl bg-white/10 mb-3 group-hover:scale-110 transition">
              <LogOut className="w-6 h-6 text-amber-400" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide">CHECK-OUT TAMU</span>
            <span className="text-[11px] text-slate-300 mt-0.5">Selesaikan kunjungan tamu</span>
          </button>

          {/* 3. SCAN QR */}
          <button
            type="button"
            onClick={onStartQRScan}
            className="group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-indigo-900/90 hover:bg-indigo-800 text-white border border-indigo-700 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-2.5 rounded-xl bg-white/10 mb-3 group-hover:scale-110 transition">
              <QrCode className="w-6 h-6 text-indigo-300" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide">SCAN QR CODE</span>
            <span className="text-[11px] text-indigo-200 mt-0.5">Cari tamu via barcode bukti</span>
          </button>

          {/* 4. TAMU DI GEDUNG */}
          <button
            type="button"
            onClick={onViewActiveGuests}
            className="group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-white border border-emerald-800 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-2.5 rounded-xl bg-white/10 mb-3 group-hover:scale-110 transition flex items-center justify-between w-full">
              <Users className="w-6 h-6 text-emerald-400" />
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-full">
                {insideGuests.length}
              </span>
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide">TAMU DI GEDUNG</span>
            <span className="text-[11px] text-emerald-200 mt-0.5">Monitoring tamu aktif</span>
          </button>
        </div>
      </div>

      {/* 4. DASHBOARD STATISTIC CARDS (6 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Tamu Hari Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tamu Hari Ini</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{visitsToday.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Kunjungan terdaftar</span>
          </div>
        </div>

        {/* 2. Tamu Sedang Berada di Gedung (🟢 Sedang Berada) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold">Sedang Berada</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-emerald-800">{insideGuests.length}</span>
              <span className="text-xs font-bold text-emerald-600">tamu</span>
            </div>
            <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">🟢 Di dalam gedung</span>
          </div>
        </div>

        {/* 3. Total Check-In Hari Ini (🔵 Check-In) */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-bold">Check-In Hari Ini</span>
            <UserPlus className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-blue-900">{checkinsTodayCount}</span>
            <span className="text-[11px] text-blue-700 block mt-0.5 font-medium">🔵 Tamu masuk</span>
          </div>
        </div>

        {/* 4. Total Check-Out Hari Ini (⚫ Check-Out) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold">Check-Out Hari Ini</span>
            <LogOut className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{checkoutsToday.length}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">⚫ Selesai kunjungan</span>
          </div>
        </div>

        {/* 5. Tamu Belum Check-Out (🟠 Belum Check-Out) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold">Belum Check-Out</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-amber-800">{pendingCheckoutCount}</span>
            <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">🟠 Menunggu kepulangan</span>
          </div>
        </div>

        {/* 6. Total Kunjungan Bulan Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Kunjungan Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-900">{visitsThisMonth.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Akumulasi bulanan</span>
          </div>
        </div>
      </div>

      {/* GRAFIK STATISTIK MONITORING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Grafik Kunjungan 7 Hari Terakhir */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Grafik Kunjungan Harian (7 Hari Terakhir)</h2>
              <p className="text-xs text-slate-500">Perbandingan volume tamu Check-In (🔵) vs Check-Out (⚫)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-blue-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5"></span> Check-In
              </span>
              <span className="flex items-center text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1.5"></span> Check-Out
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {last7DaysData.map((d, idx) => {
              const inHeightPct = Math.min(100, Math.round((d.checkins / maxDayVal) * 100));
              const outHeightPct = Math.min(100, Math.round((d.checkouts / maxDayVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex justify-center items-end gap-1 h-32">
                    {/* CheckIn bar */}
                    <div
                      style={{ height: `${Math.max(8, inHeightPct)}%` }}
                      className="w-3.5 sm:w-5 bg-blue-600 rounded-t-md transition-all group-hover:bg-blue-500 relative flex justify-center"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold text-blue-700 transition">
                        {d.checkins}
                      </span>
                    </div>

                    {/* CheckOut bar */}
                    <div
                      style={{ height: `${Math.max(8, outHeightPct)}%` }}
                      className="w-3.5 sm:w-5 bg-slate-800 rounded-t-md transition-all group-hover:bg-slate-700 relative flex justify-center"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold text-slate-800 transition">
                        {d.checkouts}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-medium truncate w-full text-center">
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Status Tamu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm mb-1">Status Kunjungan Hari Ini</h2>
            <p className="text-xs text-slate-500 mb-4">Distribusi status seluruh tamu terdaftar</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-emerald-800 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                    Sedang Berada di Gedung
                  </span>
                  <span className="font-bold text-slate-800">{insideGuests.length} ({visits.length ? Math.round((insideGuests.length / visits.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${visits.length ? (insideGuests.length / visits.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-800 mr-2"></span>
                    Sudah Check-Out Selesai
                  </span>
                  <span className="font-bold text-slate-800">
                    {visits.filter(v => v.status === 'CHECKED_OUT').length}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${visits.length ? (visits.filter(v => v.status === 'CHECKED_OUT').length / visits.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Kecepatan Pelayanan</span>
              <span className="font-bold text-blue-700">~ 2.4 mnt / Check-In</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
              <span>Identitas Fisik Tersimpan</span>
              <span className="font-bold text-slate-900">
                {insideGuests.filter(v => v.deposited_identity !== 'Tidak Ada').length} Kartu
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABEL: TAMU SEDANG BERADA DI GEDUNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Tamu Sedang Berada di Gedung ({insideGuests.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar tamu aktif yang belum melakukan proses Check-Out
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari tamu di gedung..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredInsideGuests.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Belum ada tamu yang sedang berada di gedung.
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              Gunakan tombol di bawah untuk mencatat tamu baru yang tiba di meja resepsionis.
            </p>
            <button
              type="button"
              onClick={onStartCheckIn}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              + Check-In Tamu
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Nama Tamu & No. Kunjungan</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Unit Tujuan</th>
                  <th className="py-3 px-4">Penghuni Dikunjungi</th>
                  <th className="py-3 px-4">Keperluan</th>
                  <th className="py-3 px-4">Waktu Check-In</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInsideGuests.map(v => {
                  const unit = units.find(u => u.id === v.unit_id);
                  const resident = residents.find(r => r.id === v.resident_id);

                  return (
                    <tr key={v.id} className="hover:bg-blue-50/30 transition">
                      {/* Foto */}
                      <td className="py-3 px-4">
                        <img
                          src={v.checkin_photo}
                          alt={v.guest_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                        />
                      </td>

                      {/* Nama & Visit Number */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.guest_name}</div>
                        <span className="font-mono text-[11px] text-blue-700 font-semibold">
                          {v.visit_number}
                        </span>
                      </td>

                      {/* Telepon */}
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {v.phone_number}
                      </td>

                      {/* Unit Tujuan */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        Unit {unit?.unit_number || v.unit_id}
                        <span className="block text-[11px] text-slate-400">
                          Lt. {unit?.floor} - {unit?.building}
                        </span>
                      </td>

                      {/* Penghuni Dikunjungi */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {resident?.resident_name || '-'}
                      </td>

                      {/* Keperluan */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={v.purpose}>
                        {v.purpose}
                      </td>

                      {/* Waktu Check-In & Duration */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800">
                          {formatIndonesianDate(v.checkin_datetime)}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          ({calculateDuration(v.checkin_datetime, new Date().toISOString())} lalu)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          🟢 Sedang Berada
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDetail(v)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartCheckOut(v.visit_number)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                          >
                            Check-Out
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
    </div>
  );
}
