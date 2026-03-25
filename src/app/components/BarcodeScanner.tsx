import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Keyboard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, isOpen, onClose }: BarcodeScannerProps) => {
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  useEffect(() => {
    if (isOpen && !manualMode && !cameraPermissionDenied) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, manualMode, cameraPermissionDenied]);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText);
          playBeep();
          stopScanner();
        },
        () => {
          // Error callback - ignore scanning errors
        }
      );
      setScanning(true);
      setCameraPermissionDenied(false);
    } catch (err) {
      // Silently handle camera errors without logging
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Check if it's a permission error
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        setError('Camera access denied. Please enable camera permissions or use manual entry.');
        setCameraPermissionDenied(true);
        setManualMode(true);
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No camera found. Using manual entry mode.');
        setCameraPermissionDenied(true);
        setManualMode(true);
      } else if (errorMessage.includes('NotReadableError')) {
        setError('Camera is already in use. Using manual entry mode.');
        setCameraPermissionDenied(true);
        setManualMode(true);
      } else {
        setError('Unable to access camera. Using manual entry mode.');
        setManualMode(true);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode);
      setManualBarcode('');
      onClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
    setManualMode(false);
    setError(null);
    setCameraPermissionDenied(false);
  };

  const toggleMode = () => {
    setError(null);
    if (manualMode) {
      // Switching to camera mode
      setCameraPermissionDenied(false);
    }
    setManualMode(!manualMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Scanner Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-3xl p-6 relative"
              style={{
                background: 'rgba(20, 20, 40, 0.95)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Title */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl text-white flex items-center gap-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Camera className="w-6 h-6" />
                  Scan Product
                </h2>
                <button
                  onClick={toggleMode}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  <Keyboard className="w-4 h-4" />
                  {manualMode ? 'Camera' : 'Manual'}
                </button>
              </div>

              {/* Scanner Area or Manual Input */}
              {manualMode ? (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode manually"
                    autoFocus
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors text-center text-2xl tracking-wider"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  
                  {/* Sample Barcodes */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-white/70 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      💡 Sample Barcodes:
                    </p>
                    <div className="space-y-1 text-xs text-white/50">
                      <p>8901234567890 - Organic Honey</p>
                      <p>8901234567891 - Basmati Rice</p>
                      <p>8901234567892 - Special Coffee</p>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Add Product
                  </motion.button>
                </form>
              ) : (
                <div className="relative">
                  <div
                    id="qr-reader"
                    className="rounded-2xl overflow-hidden"
                    style={{ minHeight: '300px' }}
                  />
                  {scanning && (
                    <motion.div
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 border-4 border-blue-400 rounded-2xl pointer-events-none"
                    />
                  )}
                </div>
              )}

              {/* Instructions */}
              <p className="text-white/50 text-center mt-4 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {manualMode ? 'Type the barcode and press Enter' : 'Position the barcode within the frame'}
              </p>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-center mt-4 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <AlertCircle className="w-4 h-4 inline-block mr-1" />
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};