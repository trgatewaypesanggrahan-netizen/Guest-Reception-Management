import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle, SwitchCamera, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (photoDataUrl: string) => void;
  title?: string;
  visitIdentifier?: string;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = 'Ambil Foto Tamu',
  visitIdentifier = 'GRM',
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setErrorMsg(null);
      return;
    }
    startCamera(cameraFacing);
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    setIsLoading(true);
    setErrorMsg(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses MediaDevices.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsLoading(false);
      setErrorMsg('Kamera tidak dapat diakses. Periksa izin kamera perangkat atau pilih foto dari file.');
    }
  };

  const toggleFacing = () => {
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    // Overlay Watermark automatically with ID and timestamp
    const now = new Date();
    const timestampStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Bottom banner bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, height - 44, width, 44);

    // Watermark text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ID: ${visitIdentifier}`, 16, height - 16);

    ctx.textAlign = 'right';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Waktu: ${timestampStr}`, width - 16, height - 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera(cameraFacing);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width || 600;
        canvas.height = img.height || 450;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const now = new Date();
          const timestampStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`ID: ${visitIdentifier} | Waktu: ${timestampStr}`, 14, canvas.height - 14);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedPhoto(dataUrl);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-slate-500">ID Kunjungan: <span className="font-mono font-medium">{visitIdentifier}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-4">
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured Guest"
                className="w-full h-full object-cover"
              />
            ) : errorMsg ? (
              <div className="p-6 text-center text-slate-300 flex flex-col items-center">
                <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
                <p className="text-sm font-medium text-amber-200 mb-2">{errorMsg}</p>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Anda tetap dapat mengunggah file foto atau menggunakan foto simulasi agar proses tetap lancar.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Pilih Foto dari Perangkat
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                  onLoadedMetadata={() => setIsLoading(false)}
                />
                {/* Viewfinder Target Guide Overlay */}
                <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-dashed border-white/50 rounded-2xl flex flex-col items-center justify-between p-3">
                  <div className="w-full flex justify-between">
                    <div className="w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
                    <div className="w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
                  </div>
                  <div className="text-center bg-black/40 backdrop-blur-xs text-white/90 text-xs px-3 py-1 rounded-full">
                    Posisikan wajah tamu di dalam bingkai
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
                    <div className="w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>
                  </div>
                </div>

                {/* Flip camera button */}
                <button
                  onClick={toggleFacing}
                  title="Putar Kamera Depan/Belakang"
                  className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition shadow"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={retakePhoto}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition"
              >
                <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
                Ambil Ulang
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
              >
                <Check className="w-4 h-4 mr-2" />
                Gunakan Foto
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isLoading || !!errorMsg}
                  onClick={takePhoto}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Ambil Foto
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
