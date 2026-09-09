import { X, Printer, Download, Clock, Building, User, Phone, ShieldCheck, ArrowDown } from 'lucide-react';
import { Visit, Unit, Resident } from '../types';
import { formatIndonesianDate, calculateDuration } from '../utils/storage';

interface VisitDetailModalProps {
  visit: Visit;
  unit?: Unit;
  resident?: Resident;
  onClose: () => void;
  onPrint?: () => void;
}

export default function VisitDetailModal({
  visit,
  unit,
  resident,
  onClose,
  onPrint,
}: VisitDetailModalProps) {
  const duration = calculateDuration(visit.checkin_datetime, visit.checkout_datetime);
  const isCheckedOut = visit.status === 'CHECKED_OUT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-700 font-mono">{visit.visit_number}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                visit.status === 'INSIDE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : visit.status === 'CHECKED_OUT'
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {visit.status === 'INSIDE' ? '🟢 Sedang Berada' : visit.status === 'CHECKED_OUT' ? '⚫ Sudah Check-Out' : '🔴 Dibatalkan'}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mt-0.5">Detail Lengkap Kunjungan Tamu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Timeline Structure */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* TIMELINE STEP 1: CHECK-IN */}
          <div className="relative pl-6 border-l-2 border-blue-500 pb-2">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  CHECK-IN
                </h4>
                <span className="text-xs font-mono font-semibold text-slate-600 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  {formatIndonesianDate(visit.checkin_datetime)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Foto Tamu Saat Masuk:</span>
                  <img
                    src={visit.checkin_photo}
                    alt="Foto Check-In"
                    className="w-32 h-24 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Tanda Tangan Check-In:</span>
                  <div className="p-1 bg-white rounded-lg border border-slate-200 inline-block">
                    <img
                      src={visit.checkin_signature}
                      alt="Tanda Tangan Check-In"
                      className="h-16 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE STEP 2: KUNJUNGAN */}
          <div className="relative pl-6 border-l-2 border-slate-300 pb-2">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-slate-400 ring-4 ring-slate-100"></div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                INFORMASI KUNJUNGAN
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Tamu:</span>
                  <span className="font-bold text-slate-900 text-sm">{visit.guest_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">No. Telepon:</span>
                  <span className="font-mono text-slate-800">{visit.phone_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unit Dituju:</span>
                  <span className="font-semibold text-slate-900">
                    Unit {unit?.unit_number || visit.unit_id} (Lantai {unit?.floor || '-'}, {unit?.building || '-'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Penghuni Dikunjungi:</span>
                  <span className="font-semibold text-slate-900">{resident?.resident_name || 'Penghuni'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Identitas Fisik Dititipkan:</span>
                  <span className="font-semibold text-slate-900">{visit.deposited_identity}</span>
                  {visit.deposited_identity_note && (
                    <span className="text-slate-500 italic ml-1">({visit.deposited_identity_note})</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Petugas Resepsionis:</span>
                  <span className="font-medium text-slate-800">{visit.receptionist_name || 'Resepsionis'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block text-[11px] mb-0.5">Keperluan:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-800 italic">
                  "{visit.purpose}"
                </p>
              </div>
            </div>
          </div>

          {/* TIMELINE STEP 3: CHECK-OUT */}
          <div className="relative pl-6">
            <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
              isCheckedOut ? 'bg-slate-800 ring-4 ring-slate-100' : 'bg-slate-300 ring-4 ring-slate-100'
            }`}></div>
            <div className={`p-4 rounded-xl border ${
              isCheckedOut ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  CHECK-OUT
                </h4>
                {isCheckedOut && visit.checkout_datetime ? (
                  <span className="text-xs font-mono font-semibold text-slate-600 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    {formatIndonesianDate(visit.checkout_datetime)}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    Belum Check-Out (Masih Berada)
                  </span>
                )}
              </div>

              {isCheckedOut ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Foto Tamu Saat Keluar:</span>
                    {visit.checkout_photo ? (
                      <img
                        src={visit.checkout_photo}
                        alt="Foto Check-Out"
                        className="w-32 h-24 rounded-lg object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Tanda Tangan Check-Out:</span>
                    {visit.checkout_signature ? (
                      <div className="p-1 bg-white rounded-lg border border-slate-200 inline-block">
                        <img
                          src={visit.checkout_signature}
                          alt="Tanda Tangan Check-Out"
                          className="h-16 object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Tamu masih berada di dalam gedung. Foto dan tanda tangan kepulangan akan dicatat saat proses Check-Out.
                </p>
              )}
            </div>
          </div>

          {/* DURATION HIGHLIGHT */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 text-white flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs text-blue-200 uppercase font-semibold">
                {isCheckedOut ? 'Total Durasi Kunjungan' : 'Durasi Kunjungan Berjalan'}
              </span>
              <p className="text-lg sm:text-xl font-extrabold mt-0.5">
                Durasi: {duration}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="w-6 h-6 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Tutup
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Buka / Cetak Bukti Kunjungan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
