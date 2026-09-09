import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { QrCode, X, Camera, AlertCircle, Search, SwitchCamera, Check } from 'lucide-react';
import { getVisits } from '../utils/storage';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  title?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan QR Code Kunjungan',
}: QRScannerModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setErrorMsg(null);
      return;
    }
    startCamera(cameraFacing);
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (facing: 'environment' | 'user') => {
    setErrorMsg(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
      requestAnimationFrame(tickScan);
    } catch (err: any) {
      console.warn('QR camera error:', err);
      setErrorMsg('Kamera tidak dapat diakses. Periksa izin kamera perangkat, atau masukkan nomor kunjungan secara manual.');
    }
  };

  const tickScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          const raw = code.data.trim();
          validateAndProceed(raw);
          return;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  const validateAndProceed = (codeData: string) => {
    // Check if visits has this visit number or ID
    const visits = getVisits();
    const found = visits.find(
      v => v.visit_number.toLowerCase() === codeData.toLowerCase() || v.id === codeData
    );

    if (found) {
      stopCamera();
      onScanSuccess(found.visit_number);
      onClose();
    } else {
      setErrorMsg('QR Code tidak ditemukan atau sudah tidak berlaku.');
      // allow retry after 2.5s
      setTimeout(() => {
        if (isOpen) setErrorMsg(null);
      }, 2500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    validateAndProceed(manualInput.trim());
  };

  // Quick active visits for fast 1-click test in demo
  const activeVisits = getVisits().filter(v => v.status === 'INSIDE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-slate-500">Arahkan kamera ke QR Code bukti kunjungan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner View */}
        <div className="p-4">
          {errorMsg && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="relative aspect-square w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle with Scanner Laser */}
            <div className="pointer-events-none absolute inset-10 border-2 border-blue-400/80 rounded-2xl flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <div className="w-full flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
              </div>
              {/* Laser line animated */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse shadow-[0_0_8px_#60a5fa]"></div>
              <div className="w-full flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>

            <button
              onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
              title="Ganti Kamera"
              className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>

          {/* Manual Input Fallback */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Atau masukkan Nomor Kunjungan secara manual:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: GRM-20260909-0001"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                Cari
              </button>
            </form>

            {/* Quick Select for Active Guests (Helpful for Receptionist) */}
            {activeVisits.length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 font-medium">Pilih cepat tamu di gedung:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto">
                  {activeVisits.slice(0, 4).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => validateAndProceed(v.visit_number)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg border border-slate-200 transition"
                    >
                      {v.visit_number} ({v.guest_name})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
