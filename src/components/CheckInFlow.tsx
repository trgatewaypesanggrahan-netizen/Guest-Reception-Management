import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  Building,
  User,
  Phone,
  FileText,
  ShieldAlert,
  Camera,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { Unit, Resident, Visit, DepositedIdentity } from '../types';
import { createVisit, generateNextVisitNumber } from '../utils/storage';
import CameraCaptureModal from './CameraCaptureModal';
import SignaturePadModal from './SignaturePadModal';
import ProofModal from './ProofModal';

interface CheckInFlowProps {
  units: Unit[];
  residents: Resident[];
  currentUserName: string;
  onSuccess: (visit: Visit) => void;
  onCancel: () => void;
}

export default function CheckInFlow({
  units,
  residents,
  currentUserName,
  onSuccess,
  onCancel,
}: CheckInFlowProps) {
  const [step, setStep] = useState<'FORM' | 'CAMERA' | 'SIGNATURE' | 'SUCCESS'>('FORM');

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [depositedIdentity, setDepositedIdentity] = useState<DepositedIdentity>('KTP');
  const [depositedIdentityNote, setDepositedIdentityNote] = useState('');

  // Media
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdVisit, setCreatedVisit] = useState<Visit | null>(null);

  // Predicted next visit number
  const predictedVisitNumber = useMemo(() => generateNextVisitNumber(), []);

  // Filter residents matching selected unit
  const filteredResidents = useMemo(() => {
    if (!selectedUnitId) return residents;
    return residents.filter(r => r.unit_id === selectedUnitId && r.status === 'Aktif');
  }, [selectedUnitId, residents]);

  // Handle unit change - auto selects resident if exactly one matches
  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const matching = residents.filter(r => r.unit_id === unitId && r.status === 'Aktif');
    if (matching.length === 1) {
      setSelectedResidentId(matching[0].id);
    } else if (matching.length === 0) {
      setSelectedResidentId('');
    } else {
      // If previously selected resident is not in matching, reset
      if (!matching.some(r => r.id === selectedResidentId)) {
        setSelectedResidentId('');
      }
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!guestName.trim() || guestName.trim().length < 2) {
      errs.guestName = 'Nama tamu wajib diisi (minimal 2 karakter).';
    }

    // Indonesian phone validation: usually 08xx or +62 / 62 and 9-15 digits
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'Nomor telepon tamu wajib diisi.';
    } else if (cleanedPhone.length < 9 || cleanedPhone.length > 15) {
      errs.phoneNumber = 'Format nomor telepon tidak valid (contoh: 081234567890).';
    }

    if (!selectedUnitId) {
      errs.unitId = 'Pilih unit hunian tujuan.';
    }

    if (!selectedResidentId) {
      errs.residentId = 'Pilih nama penghuni yang dikunjungi.';
    }

    if (!purpose.trim() || purpose.trim().length < 3) {
      errs.purpose = 'Keperluan kunjungan wajib diisi dengan jelas.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextFromForm = () => {
    if (validateForm()) {
      if (!photoDataUrl) {
        setIsCameraOpen(true);
      }
      setStep('CAMERA');
    }
  };

  const handlePhotoCaptured = (photo: string) => {
    setPhotoDataUrl(photo);
    setIsCameraOpen(false);
  };

  const handleNextToSignature = () => {
    if (!photoDataUrl) {
      setErrors({ photo: 'Foto tamu wajib diambil sebelum melanjutkan.' });
      return;
    }
    setStep('SIGNATURE');
    if (!signatureDataUrl) {
      setIsSignatureOpen(true);
    }
  };

  const handleSignatureSaved = (sig: string) => {
    setSignatureDataUrl(sig);
    setIsSignatureOpen(false);
  };

  const handleCompleteCheckIn = () => {
    if (!photoDataUrl) {
      setErrors({ general: 'Foto tamu belum tersedia.' });
      return;
    }
    if (!signatureDataUrl) {
      setErrors({ general: 'Tanda tangan tamu wajib dibubuhkan.' });
      return;
    }

    try {
      const newVisit = createVisit({
        guest_name: guestName.trim(),
        phone_number: phoneNumber.trim(),
        unit_id: selectedUnitId,
        resident_id: selectedResidentId,
        purpose: purpose.trim(),
        deposited_identity: depositedIdentity,
        deposited_identity_note: depositedIdentityNote.trim() || undefined,
        checkin_photo: photoDataUrl,
        checkin_signature: signatureDataUrl,
        checkin_datetime: new Date().toISOString(),
        receptionist_name: currentUserName,
      });

      setCreatedVisit(newVisit);
      setStep('SUCCESS');
      onSuccess(newVisit);

      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore if confetti unavailable
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Gagal menyimpan data Check-In.' });
    }
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedResident = residents.find(r => r.id === selectedResidentId);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Progress Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Proses Penerimaan Tamu</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Formulir Check-In Tamu</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Nomor Kunjungan Otomatis: <span className="font-mono font-bold text-blue-900">{predictedVisitNumber}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batalkan
            </button>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold transition ${
              step === 'FORM'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[11px] ${
              step === 'FORM' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </span>
            <span>1. Data Tamu</span>
          </div>

          <div
            className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold transition ${
              step === 'CAMERA'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : photoDataUrl
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[11px] ${
              photoDataUrl ? 'bg-emerald-600 text-white' : step === 'CAMERA' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              2
            </span>
            <span>2. Foto Tamu</span>
          </div>

          <div
            className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold transition ${
              step === 'SIGNATURE' || step === 'SUCCESS'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : signatureDataUrl
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[11px] ${
              signatureDataUrl ? 'bg-emerald-600 text-white' : step === 'SIGNATURE' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
            <span>3. Tanda Tangan</span>
          </div>
        </div>
      </div>

      {/* STEP 1: FORM DATA TAMU */}
      {step === 'FORM' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Tamu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Nama Lengkap Tamu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.guestName ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {errors.guestName && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.guestName}
                </p>
              )}
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                No. Telepon / WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.phoneNumber ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Unit Tujuan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Unit Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-white ${
                    errors.unitId ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">-- Pilih Unit Apartemen --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number} (Lt. {u.floor} - {u.building}) - Status: {u.status}
                    </option>
                  ))}
                </select>
              </div>
              {errors.unitId && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.unitId}
                </p>
              )}
            </div>

            {/* Penghuni yang Dikunjungi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Penghuni yang Dikunjungi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  disabled={!selectedUnitId}
                  className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-white disabled:bg-slate-100 disabled:text-slate-400 ${
                    errors.residentId ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">
                    {!selectedUnitId
                      ? '-- Pilih unit terlebih dahulu --'
                      : filteredResidents.length === 0
                      ? '-- Belum ada data penghuni aktif di unit ini --'
                      : '-- Pilih Nama Penghuni --'}
                  </option>
                  {filteredResidents.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.resident_name} ({r.phone_number})
                    </option>
                  ))}
                </select>
              </div>
              {errors.residentId && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.residentId}
                </p>
              )}
            </div>

            {/* Identitas yang Dititipkan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Identitas Fisik yang Dititipkan <span className="text-red-500">*</span>
              </label>
              <select
                value={depositedIdentity}
                onChange={(e) => setDepositedIdentity(e.target.value as DepositedIdentity)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="KTP">KTP Fisik</option>
                <option value="SIM">SIM Fisik</option>
                <option value="Kartu Identitas Lainnya">Kartu Identitas Lainnya (ID Karyawan/Mahasiswa/Paspor)</option>
                <option value="Tidak Ada">Tidak Ada Identitas Dititipkan</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Keterangan: Kartu fisik asli disimpan di rak deposit resepsionis selama kunjungan.
              </p>
            </div>

            {/* Catatan Identitas Titipan (BUKAN NIK) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                No. Slot Titipan / Kartu Akses Tamu (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Slot #14 / Kartu Akses Visitor 08"
                value={depositedIdentityNote}
                onChange={(e) => setDepositedIdentityNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Catatan internal nomor loker titipan atau kartu akses yang diberikan kepada tamu.
              </p>
            </div>
          </div>

          {/* Keperluan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Keperluan Kunjungan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                placeholder="Tuliskan keperluan kunjungan, contoh: Silaturahmi keluarga, pengiriman paket dokumen, perbaikan pipa/listrik..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border ${
                  errors.purpose ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            {errors.purpose && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.purpose}
              </p>
            )}
          </div>

          {/* Notice - Strictly NO NIK compliance */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2 text-xs text-blue-800">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Kepatuhan Privasi Data:</strong> Sistem ini tidak merekam Nomor Induk Kependudukan (NIK) maupun Kartu Keluarga demi keamanan data pribadi tamu gedung hunian.
            </span>
          </div>

          {/* Action */}
          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleNextFromForm}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <span>Lanjut ke Foto Tamu</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FOTO CHECK-IN */}
      {step === 'CAMERA' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">Foto Tamu Saat Check-In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ambil foto wajah tamu sebagai identifikasi visual resmi selama berada di area gedung.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
            {photoDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="relative w-64 h-48 sm:w-80 sm:h-60 rounded-xl overflow-hidden shadow-md border-2 border-white">
                  <img src={photoDataUrl} alt="Foto Tamu" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-full shadow">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl shadow-xs text-slate-700 transition"
                  >
                    <Camera className="w-4 h-4 mr-1.5 text-blue-600" />
                    Ambil Ulang Foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Kamera Belum Diaktifkan</p>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                  Klik tombol di bawah untuk membuka kamera perangkat dan mengambil foto tamu.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Buka Kamera
                </button>
              </div>
            )}
          </div>

          {errors.photo && (
            <p className="text-xs text-center text-red-600 font-medium">
              {errors.photo}
            </p>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('FORM')}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Data Tamu
            </button>

            <button
              type="button"
              disabled={!photoDataUrl}
              onClick={handleNextToSignature}
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition"
            >
              <span>Lanjut ke Tanda Tangan</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: TANDA TANGAN DIGITAL CHECK-IN */}
      {step === 'SIGNATURE' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">Tanda Tangan Digital Tamu</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tamu menandatangani persetujuan kunjungan pada layar touchscreen atau menggunakan mouse.
            </p>
          </div>

          {/* Summary Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Nama Tamu</span>
              <span className="font-bold text-slate-900">{guestName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">No. Telepon</span>
              <span className="font-mono text-slate-900">{phoneNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Unit Dituju</span>
              <span className="font-bold text-slate-900">Unit {selectedUnit?.unit_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Penghuni</span>
              <span className="font-bold text-slate-900">{selectedResident?.resident_name}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
            {signatureDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img src={signatureDataUrl} alt="Tanda Tangan Tamu" className="h-28 object-contain" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 flex items-center mt-2">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Tanda Tangan Berhasil Disimpan
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignatureOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl shadow-xs text-slate-700 transition"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 text-blue-600" />
                  Tanda Tangani Ulang
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Edit3 className="w-10 h-10" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Tanda Tangan Diperlukan</p>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                  Buka signature pad untuk membubuhkan tanda tangan digital tamu.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignatureOpen(true)}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Buka Area Tanda Tangan
                </button>
              </div>
            )}
          </div>

          {errors.general && (
            <p className="text-xs text-center text-red-600 font-medium">
              {errors.general}
            </p>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('CAMERA')}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Foto
            </button>

            <button
              type="button"
              disabled={!signatureDataUrl}
              onClick={handleCompleteCheckIn}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition tracking-wide"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              SELESAIKAN CHECK-IN
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CHECK-IN BERHASIL (BUKTI CHECK-IN) */}
      {step === 'SUCCESS' && createdVisit && (
        <ProofModal
          visit={createdVisit}
          unit={selectedUnit}
          resident={selectedResident}
          onClose={onCancel}
          onBackToDashboard={onCancel}
        />
      )}

      {/* Modals */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title="Foto Tamu Saat Check-In"
        visitIdentifier={predictedVisitNumber}
      />

      <SignaturePadModal
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSaveSignature={handleSignatureSaved}
        title="Tanda Tangan Digital Check-In"
        subtitle="Bubuhkan tanda tangan tamu di area pad digital"
        requireAgreement={true}
      />
    </div>
  );
}
