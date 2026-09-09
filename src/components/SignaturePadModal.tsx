import React, { useState, useRef, useEffect } from 'react';
import { Edit3, RotateCcw, Check, X, AlertCircle } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  title?: string;
  subtitle?: string;
  requireAgreement?: boolean;
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSaveSignature,
  title = 'Tanda Tangan Digital Tamu',
  subtitle = 'Bubuhkan tanda tangan menggunakan jari (touchscreen) atau kursor mouse',
  requireAgreement = true,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(!requireAgreement);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasDrawn(false);
      setErrorNotice(null);
      if (requireAgreement) setAgreementAccepted(false);
      // Wait for DOM layout
      setTimeout(initCanvas, 50);
    }
  }, [isOpen]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution matching display
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Slate-900 high contrast ink
    ctx.lineWidth = 2.5;

    // Fill white background so export has clear white backdrop
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw baseline guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 35);
    ctx.lineTo(rect.width - 30, rect.height - 35);
    ctx.stroke();

    // Reset stroke back to drawing
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setErrorNotice(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    initCanvas();
    setHasDrawn(false);
    setErrorNotice(null);
  };

  const handleSave = () => {
    if (!hasDrawn) {
      setErrorNotice('Silakan bubuhkan tanda tangan terlebih dahulu.');
      return;
    }
    if (requireAgreement && !agreementAccepted) {
      setErrorNotice('Silakan centang persetujuan data kunjungan sebelum melanjutkan.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="p-5">
          {errorNotice && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-amber-600" />
              <span>{errorNotice}</span>
            </div>
          )}

          <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner touch-none">
            <canvas
              ref={canvasRef}
              className="w-full h-48 sm:h-56 cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-slate-400 font-medium">
              Tanda Tangan Digital Resmi
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>Gunakan area di atas untuk menandatangani</span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear / Ulangi
            </button>
          </div>

          {requireAgreement && (
            <label className="mt-4 flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => {
                  setAgreementAccepted(e.target.checked);
                  if (e.target.checked && errorNotice?.includes('centang')) {
                    setErrorNotice(null);
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed select-none">
                Saya menyetujui data kunjungan yang telah saya isi dan bersedia mematuhi tata tertib apartemen/rusunami.
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Check className="w-4 h-4 mr-2" />
            Simpan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
}
