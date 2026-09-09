import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Search,
  Camera,
  Edit3,
  CheckCircle2,
  Clock,
  Building,
  User,
  Phone,
  ShieldAlert,
  AlertCircle,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Visit, Unit, Resident } from '../types';
import { checkOutVisit, formatIndonesianDate, calculateDuration } from '../utils/storage';
import CameraCaptureModal from './CameraCaptureModal';
import SignaturePadModal from './SignaturePadModal';
import QRScannerModal from './QRScannerModal';
import ProofModal from './ProofModal';

interface CheckOutFlowProps {
  visits: Visit[];
  units: Unit[];
  residents: Resident[];
  initialVisitNumber?: string;
  onSuccess: (updatedVisit: Visit) => void;
  onCancel: () => void;
}

export default function CheckOutFlow({
  visits,
  units,
  residents,
  initialVisitNumber,
  onSuccess,
  onCancel,
}: CheckOutFlowProps) {
  const [searchQuery, setSearchQuery] = useState(initialVisitNumber || '');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(() => {
    if (initialVisitNumber) {
      return visits.find(v => v.visit_number === initialVisitNumber && v.status === 'INSIDE') || null;
    }
    return null;
  });

  const [checkoutPhoto, setCheckoutPhoto] = useState<string | null>(null);
  const [checkoutSignature, setCheckoutSignature] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedVisit, setCompletedVisit] = useState<Visit | null>(null);

  // Active visits list for quick selection
  const activeVisits = useMemo(() => {
    return visits.filter(v => v.status === 'INSIDE');
  }, [visits]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return activeVisits.filter(v => {
      const u = units.find(unit => unit.id === v.unit_id);
      const r = residents.find(res => res.id === v.resident_id);
      return (
        v.visit_number.toLowerCase().includes(q) ||
        v.guest_name.toLowerCase().includes(q) ||
        v.phone_number.includes(q) ||
        (u && u.unit_number.toLowerCase().includes(q)) ||
        (r && r.resident_name.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeVisits, units, residents]);

  const handleSelectVisit = (visit: Visit) => {
    if (visit.status !== 'INSIDE') {
      setErrorMsg('Hanya tamu dengan status SEDANG BERADA yang dapat melakukan Check-Out.');
      return;
    }
    setSelectedVisit(visit);
    setCheckoutPhoto(null);
    setCheckoutSignature(null);
    setErrorMsg(null);
  };

  const handleQRScanned = (scannedVisitNumber: string) => {
    const found = visits.find(v => v.visit_number === scannedVisitNumber);
    if (!found) {
      setErrorMsg('QR Code tidak ditemukan atau sudah tidak berlaku.');
      return;
    }
    if (found.status !== 'INSIDE') {
      setErrorMsg(`Tamu ${found.guest_name} sudah berstatus ${found.status === 'CHECKED_OUT' ? 'SUDAH CHECK-OUT' : 'DIBATALKAN'}.`);
      return;
    }
    setSelectedVisit(found);
    setCheckoutPhoto(null);
    setCheckoutSignature(null);
    setErrorMsg(null);
  };

  const handleCompleteCheckOut = () => {
    if (!selectedVisit) return;
    if (!checkoutPhoto) {
      setErrorMsg('Foto Check-Out tamu wajib diambil sebelum menyelesaikan.');
      return;
    }
    if (!checkoutSignature) {
      setErrorMsg('Tanda tangan Check-Out tamu wajib dibubuhkan.');
      return;
    }

    try {
      const updated = checkOutVisit(selectedVisit.id, checkoutPhoto, checkoutSignature);
      if (updated) {
        setCompletedVisit(updated);
        onSuccess(updated);
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses Check-Out.');
    }
  };

  const selectedUnit = selectedVisit ? units.find(u => u.id === selectedVisit.unit_id) : undefined;
  const selectedResident = selectedVisit ? residents.find(r => r.id === selectedVisit.resident_id) : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Proses Kepulangan Tamu</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Check-Out Tamu</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan QR Code kunjungan atau cari berdasarkan nama / nomor kunjungan tamu
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              Scan QR Code
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SEARCH / SELECTION SCREEN */}
      {!selectedVisit && (
        <div className="space-y-5">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Cari Data Kunjungan yang Sedang Berada
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ketik Nomor Kunjungan (GRM-...), Nama Tamu, atau No. Telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Search Results */}
            {searchQuery.trim() && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Hasil Pencarian ({searchResults.length}):
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Tidak ditemukan tamu aktif dengan kata kunci "{searchQuery}".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.map(v => {
                      const unit = units.find(u => u.id === v.unit_id);
                      return (
                        <div
                          key={v.id}
                          onClick={() => handleSelectVisit(v)}
                          className="flex items-center p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition"
                        >
                          <img
                            src={v.checkin_photo}
                            alt={v.guest_name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 mr-3 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{v.guest_name}</h4>
                            <p className="text-xs text-slate-500 font-mono">{v.visit_number}</p>
                            <p className="text-xs text-blue-700 font-medium">
                              Unit {unit?.unit_number} (Lt. {unit?.floor})
                            </p>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0"
                          >
                            Pilih
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Active Guests Grid */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse"></span>
                Daftar Tamu yang Sedang Berada di Gedung ({activeVisits.length})
              </h2>
            </div>

            {activeVisits.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada tamu yang sedang berada di dalam gedung saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeVisits.map(v => {
                  const unit = units.find(u => u.id === v.unit_id);
                  const resident = residents.find(r => r.id === v.resident_id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVisit(v)}
                      className="group p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex flex-col justify-between"
                    >
                      <div className="flex items-start space-x-3 mb-2">
                        <img
                          src={v.checkin_photo}
                          alt={v.guest_name}
                          className="w-12 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200 shadow-2xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 truncate">
                            {v.guest_name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 block truncate">
                            {v.visit_number}
                          </span>
                          <span className="text-xs font-semibold text-blue-900 block mt-0.5">
                            Unit {unit?.unit_number} (Lt. {unit?.floor})
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">Tujuan: {resident?.resident_name || '-'}</span>
                        <span className="font-semibold text-blue-600 group-hover:underline">Check-Out &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELECTED VISIT DETAIL & CHECK-OUT ACTION */}
      {selectedVisit && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition mr-1"
                title="Pilih Tamu Lain"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Konfirmasi Check-Out Tamu</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedVisit.guest_name}</h2>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                🟢 SEDANG BERADA
              </span>
              <p className="text-xs font-mono font-bold text-blue-900 mt-1">{selectedVisit.visit_number}</p>
            </div>
          </div>

          {/* Guest Information Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="flex flex-col items-center">
              <img
                src={selectedVisit.checkin_photo}
                alt={selectedVisit.guest_name}
                className="w-20 h-24 rounded-lg object-cover border border-slate-300 shadow-xs"
              />
              <span className="text-[11px] font-semibold text-slate-500 mt-1">Foto Check-In</span>
            </div>

            <div className="sm:col-span-3 space-y-2 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">No. Telepon</span>
                  <span className="font-mono font-medium text-slate-900">{selectedVisit.phone_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unit Dituju</span>
                  <span className="font-bold text-slate-900">Unit {selectedUnit?.unit_number} (Lt. {selectedUnit?.floor})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Penghuni</span>
                  <span className="font-semibold text-slate-900">{selectedResident?.resident_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Check-In</span>
                  <span className="font-mono text-slate-800">{formatIndonesianDate(selectedVisit.checkin_datetime)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Identitas Dititipkan</span>
                  <span className="font-semibold text-slate-900">
                    {selectedVisit.deposited_identity} {selectedVisit.deposited_identity_note ? `(${selectedVisit.deposited_identity_note})` : ''}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 text-[11px]">Keperluan: </span>
                <span className="italic text-slate-800">"{selectedVisit.purpose}"</span>
              </div>
            </div>
          </div>

          {/* Durasi berjalan */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Durasi Berada di Gedung Saat Ini:</span>
            </div>
            <span className="font-bold text-sm text-blue-900">
              {calculateDuration(selectedVisit.checkin_datetime, new Date().toISOString())}
            </span>
          </div>

          {/* TWO REQUIRED ACTIONS: FOTO CHECK-OUT & TANDA TANGAN CHECK-OUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Action 1: Foto Check-Out */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center">
                  <Camera className="w-4 h-4 mr-1.5 text-blue-600" />
                  1. Foto Tamu Saat Check-Out <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Ambil foto tamu saat bersiap meninggalkan gedung.
                </p>

                {checkoutPhoto ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={checkoutPhoto}
                      alt="Checkout Photo"
                      className="w-36 h-28 rounded-lg object-cover border-2 border-white shadow-sm"
                    />
                    <span className="text-xs font-semibold text-emerald-700 flex items-center mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Foto Terambil
                    </span>
                  </div>
                ) : (
                  <div className="h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-7 h-7 mb-1" />
                    <span className="text-xs">Foto belum diambil</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                {checkoutPhoto ? 'Ambil Ulang Foto Check-Out' : 'Ambil Foto Check-Out'}
              </button>
            </div>

            {/* Action 2: Tanda Tangan Check-Out */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center">
                  <Edit3 className="w-4 h-4 mr-1.5 text-blue-600" />
                  2. Tanda Tangan Check-Out <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Tanda tangan tamu untuk bukti serah terima identitas titipan & kepulangan.
                </p>

                {checkoutSignature ? (
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 w-full h-28 flex items-center justify-center">
                      <img
                        src={checkoutSignature}
                        alt="Checkout Signature"
                        className="max-h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Tanda Tangan Terverifikasi
                    </span>
                  </div>
                ) : (
                  <div className="h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <Edit3 className="w-7 h-7 mb-1" />
                    <span className="text-xs">Tanda tangan belum ada</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSignatureOpen(true)}
                className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                {checkoutSignature ? 'Tanda Tangani Ulang' : 'Buka Pad Tanda Tangan'}
              </button>
            </div>
          </div>

          {/* Identitas reminder */}
          {selectedVisit.deposited_identity !== 'Tidak Ada' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pemberitahuan Resepsionis:</strong> Pastikan identitas fisik ({selectedVisit.deposited_identity} - {selectedVisit.deposited_identity_note || 'Titipan'}) telah dikembalikan kepada tamu sebelum menyelesaikan Check-Out.
              </span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Kembali ke Pencarian
            </button>

            <button
              type="button"
              disabled={!checkoutPhoto || !checkoutSignature}
              onClick={handleCompleteCheckOut}
              className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition tracking-wide"
            >
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
              SELESAIKAN CHECK-OUT
            </button>
          </div>
        </div>
      )}

      {/* Completed Proof Modal */}
      {completedVisit && (
        <ProofModal
          visit={completedVisit}
          unit={units.find(u => u.id === completedVisit.unit_id)}
          resident={residents.find(r => r.id === completedVisit.resident_id)}
          onClose={onCancel}
          onBackToDashboard={onCancel}
        />
      )}

      {/* Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(photo) => {
          setCheckoutPhoto(photo);
          setIsCameraOpen(false);
          setErrorMsg(null);
        }}
        title="Foto Tamu Saat Check-Out"
        visitIdentifier={selectedVisit?.visit_number || 'GRM-OUT'}
      />

      {/* Signature Modal */}
      <SignaturePadModal
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSaveSignature={(sig) => {
          setCheckoutSignature(sig);
          setIsSignatureOpen(false);
          setErrorMsg(null);
        }}
        title="Tanda Tangan Digital Check-Out"
        subtitle="Tamu menandatangani konfirmasi kepulangan dan penerimaan kartu titipan"
        requireAgreement={false}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title="Scan QR Code Bukti Kunjungan"
      />
    </div>
  );
}
