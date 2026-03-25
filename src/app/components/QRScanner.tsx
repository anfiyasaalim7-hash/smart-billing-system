import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { motion } from "motion/react";

interface QRScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
          scanner.stop();
        },
        (errorMessage) => {
          // Ignore continuous scan errors
        }
      )
      .catch((err) => {
        setError("Camera access denied or not available");
        console.error("Scanner error:", err);
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white">Scanning...</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {error ? (
        <div className="p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            Close
          </motion.button>
        </div>
      ) : (
        <div>
          <div 
            id="qr-reader" 
            className="rounded-xl overflow-hidden"
            style={{
              border: "2px solid rgba(102, 126, 234, 0.5)",
            }}
          />
          <p className="text-white/60 text-sm mt-4 text-center">
            Point camera at QR code or barcode
          </p>
        </div>
      )}
    </div>
  );
}
