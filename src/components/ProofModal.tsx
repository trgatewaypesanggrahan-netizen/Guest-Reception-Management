import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, ArrowLeft, CheckCircle2, Building, User, Clock, Phone, ShieldCheck, X } from 'lucide-react';
import { Visit, Unit, Resident } from '../types';
import { formatIndonesianDate, calculateDuration } from '../utils/storage';

interface ProofModalProps {
  visit: Visit;
  unit?: Unit;
  resident?: Resident;
  onClose: () => void;
  onBackToDashboard?: () => void;
}

export default function ProofModal({
  visit,
  unit,
  resident,
  onClose,
  onBackToDashboard,
}: ProofModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    QRCode.toDataURL(visit.visit_number, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [visit.visit_number]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    // We can save the badge or open print dialog
    window.print();
  };

  const isCheckedOut = visit.status === 'CHECKED_OUT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Top Header - Hidden on Print */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isCheckedOut ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-700'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isCheckedOut ? 'Bukti Kunjungan (Selesai Check-Out)' : 'Bukti Kunjungan Berhasil (Check-In)'}
              </h3>
              <p className="text-xs text-slate-500">Guest Reception Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Content */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[75vh]" ref={badgeRef}>
          <div className="print-card bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-slate-800">
            {/* Header / Building Logo */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                    GRM
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 tracking-tight">GUEST RECEPTION MANAGEMENT</h2>
                    <p className="text-xs text-slate-500">Apartemen & Rusunami Hunian Terpadu</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  visit.status === 'INSIDE'
                    ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20'
                    : visit.status === 'CHECKED_OUT'
                    ? 'bg-slate-100 text-slate-800 ring-1 ring-slate-400/20'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {visit.status === 'INSIDE' ? '🟢 SEDANG BERADA' : visit.status === 'CHECKED_OUT' ? '⚫ SUDAH CHECK-OUT' : '🔴 DIBATALKAN'}
                </span>
                <p className="font-mono text-xs font-bold text-blue-900 mt-1">{visit.visit_number}</p>
              </div>
            </div>

            {/* Photo & QR Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-5">
              {/* Photo Checkin */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-200">
                  <img
                    src={visit.checkin_photo}
                    alt={visit.guest_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-1">Foto Check-In</span>
              </div>

              {/* Guest Main Info */}
              <div className="flex flex-col justify-center sm:border-x sm:border-slate-200 sm:px-4 text-center sm:text-left">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">{visit.guest_name}</h3>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start mt-1">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {visit.phone_number}
                </p>
                <div className="mt-2 inline-flex items-center text-xs font-medium text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Titipan: <span className="font-semibold text-slate-900 ml-1">{visit.deposited_identity}</span>
                </div>
                {visit.deposited_identity_note && (
                  <span className="text-[11px] text-slate-500 italic mt-0.5">
                    ({visit.deposited_identity_note})
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                    <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-200 rounded-xl animate-pulse" />
                )}
                <span className="text-[10px] text-slate-400 font-mono mt-1">Scan untuk Check-Out</span>
              </div>
            </div>

            {/* Visit Details Table */}
            <div className="space-y-2.5 text-xs text-slate-700 mb-5">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Unit Tujuan:
                </span>
                <span className="font-bold text-slate-900">
                  Unit {unit?.unit_number || visit.unit_id} (Lantai {unit?.floor || '-'}, {unit?.building || '-'})
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Penghuni yang Dikunjungi:
                </span>
                <span className="font-bold text-slate-900">
                  {resident?.resident_name || 'Penghuni Terdaftar'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Waktu Check-In:
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatIndonesianDate(visit.checkin_datetime)}
                </span>
              </div>

              {isCheckedOut && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      Waktu Check-Out:
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndonesianDate(visit.checkout_datetime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Total Durasi Kunjungan:</span>
                    <span className="font-bold text-blue-900">
                      {calculateDuration(visit.checkin_datetime, visit.checkout_datetime)}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Keperluan Kunjungan:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-800 italic">
                  "{visit.purpose}"
                </p>
              </div>
            </div>

            {/* Signature Preview & Verification */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Tanda Tangan Tamu (Digital):</p>
                {visit.checkin_signature && (
                  <img
                    src={visit.checkin_signature}
                    alt="Signature"
                    className="h-10 object-contain mt-1"
                  />
                )}
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <p>Dicetak pada: {formatIndonesianDate(new Date().toISOString())}</p>
                <p>Petugas: {visit.receptionist_name || 'Resepsionis'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls - Hidden when Printing */}
        <div className="no-print px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Dashboard
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF / Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
