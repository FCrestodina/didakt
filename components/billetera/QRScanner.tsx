"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onScan: (text: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let controls: { stop: () => void } | null = null;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current) return;

        setScanning(true);
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              onScan(result.getText());
            }
          }
        );
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "NotAllowedError") {
          setError("Necesitamos acceso a la cámara para leer el QR.");
        } else {
          setError("No se pudo iniciar la cámara.");
        }
      }
    }

    startScanner();

    return () => {
      controls?.stop();
    };
  }, [onScan]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black"
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-semibold">Escaneá el QR del producto</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar cámara"
            className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-white">
            <div>
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-6 rounded-2xl bg-white/20 px-6 py-3 text-white font-semibold hover:bg-white/30 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center relative">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-white rounded-3xl opacity-80 shadow-2xl" />
            </div>
            {scanning && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 rounded-full px-4 py-2">
                Apuntá al código QR...
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
