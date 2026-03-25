import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Smartphone, Check, RotateCcw, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { store } from '../data/store';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  loyaltyPoints: number;
  onComplete: (paymentMethod: 'cash' | 'upi', pointsRedeemed: number) => void;
}

export const PaymentModal = ({ isOpen, onClose, total, loyaltyPoints, onComplete }: PaymentModalProps) => {
  const [activeTab, setActiveTab] = useState<'cash' | 'upi'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const denominations = [2000, 500, 200, 100, 50, 20, 10];

  // Generate UPI QR Code when UPI tab is active
  useEffect(() => {
    if (activeTab === 'upi' && isOpen) {
      generateQRCode();
    }
  }, [activeTab, isOpen, total, pointsToRedeem]);

  const generateQRCode = async () => {
    const upiId = store.getUpiId();
    const finalAmount = total - pointsToRedeem;
    const upiString = `upi://pay?pa=${upiId}&pn=SARVAM SUPER MARKET&am=${finalAmount}&cu=INR`;
    
    try {
      const url = await QRCode.toDataURL(upiString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('QR Code generation failed:', err);
    }
  };

  const addDenomination = (amount: number) => {
    const current = parseFloat(cashReceived) || 0;
    setCashReceived((current + amount).toString());
  };

  const clearCash = () => {
    setCashReceived('');
    toast.info('Amount cleared');
  };

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    const finalTotal = total - pointsToRedeem;
    return received - finalTotal;
  };

  const handleRedeemToggle = () => {
    if (!redeemPoints) {
      // Calculate max points that can be redeemed (₹1 = 1 point)
      const maxRedeemable = Math.min(loyaltyPoints, total);
      setPointsToRedeem(maxRedeemable);
      setRedeemPoints(true);
      toast.success(`Redeeming ${maxRedeemable} points (₹${maxRedeemable})`);
    } else {
      setPointsToRedeem(0);
      setRedeemPoints(false);
      toast.info('Loyalty points removed');
    }
  };

  const handleCashPayment = () => {
    const received = parseFloat(cashReceived) || 0;
    const finalTotal = total - pointsToRedeem;
    
    if (received >= finalTotal) {
      setPaymentComplete(true);
      
      // Confetti effect
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Import confetti dynamically
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2
            }
          });
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2
            }
          });
        });
      }, 250);
      
      setTimeout(() => {
        clearInterval(interval);
        onComplete('cash', pointsToRedeem);
        setPaymentComplete(false);
        setCashReceived('');
        setRedeemPoints(false);
        setPointsToRedeem(0);
      }, 2000);
    }
  };

  const handleUPIPayment = () => {
    setPaymentComplete(true);
    setTimeout(() => {
      onComplete('upi', pointsToRedeem);
      setPaymentComplete(false);
      setRedeemPoints(false);
      setPointsToRedeem(0);
    }, 2000);
  };

  const finalTotal = total - pointsToRedeem;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-auto"
              style={{
                background: 'rgba(20, 20, 40, 0.95)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
              }}
            >
              {paymentComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2
                    className="text-3xl text-white mb-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Payment Successful!
                  </h2>
                  <p className="text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Thank you for your purchase
                  </p>
                  {pointsToRedeem > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-yellow-400 mt-2"
                    >
                      ✨ {pointsToRedeem} loyalty points redeemed!
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* Title */}
                  <h2
                    className="text-3xl mb-2 text-white"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Payment
                  </h2>
                  
                  {/* Total Display */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Original Amount:
                      </p>
                      <span className={`text-xl ${pointsToRedeem > 0 ? 'line-through text-white/50' : 'text-white font-semibold'}`}>
                        ₹{total}
                      </span>
                    </div>
                    {pointsToRedeem > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-yellow-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Loyalty Discount:
                        </p>
                        <span className="text-xl text-yellow-400">
                          -₹{pointsToRedeem}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                      <p className="text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Final Amount:
                      </p>
                      <span className="text-3xl text-white font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                        ₹{finalTotal}
                      </span>
                    </div>
                  </div>

                  {/* Loyalty Redemption Toggle */}
                  {loyaltyPoints > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 cursor-pointer"
                      onClick={handleRedeemToggle}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Gift className="w-6 h-6 text-yellow-400" />
                          <div>
                            <p className="text-white font-semibold">Redeem Loyalty Points</p>
                            <p className="text-white/60 text-sm">
                              Available: {loyaltyPoints} points (₹{loyaltyPoints})
                            </p>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-colors ${redeemPoints ? 'bg-green-500' : 'bg-white/20'}`}>
                          <motion.div
                            animate={{ x: redeemPoints ? 24 : 0 }}
                            className="w-6 h-6 rounded-full bg-white"
                          />
                        </div>
                      </div>
                      {redeemPoints && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-yellow-500/30"
                        >
                          <p className="text-green-400 text-sm">
                            ✅ Redeeming {pointsToRedeem} points = ₹{pointsToRedeem} discount
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Tabs */}
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => setActiveTab('cash')}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'cash'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Wallet className="w-5 h-5" />
                      Cash
                    </button>
                    <button
                      onClick={() => setActiveTab('upi')}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'upi'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Smartphone className="w-5 h-5" />
                      UPI
                    </button>
                  </div>

                  {/* Content */}
                  {activeTab === 'cash' ? (
                    <div className="space-y-6">
                      {/* Cash Received Input */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Cash Received
                          </label>
                          {cashReceived && (
                            <button
                              onClick={clearCash}
                              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-2xl text-center placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>

                      {/* Quick Denomination Buttons */}
                      <div>
                        <label className="block text-white/70 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Quick Add
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {denominations.map((denom) => (
                            <motion.button
                              key={denom}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => addDenomination(denom)}
                              className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              ₹{denom}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Change Calculation */}
                      {cashReceived && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl"
                          style={{
                            background: calculateChange() >= 0 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${calculateChange() >= 0 
                              ? 'rgba(34, 197, 94, 0.3)' 
                              : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Change to Return
                            </span>
                            <span 
                              className={`text-2xl ${calculateChange() >= 0 ? 'text-green-400' : 'text-red-400'}`}
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              ₹{Math.abs(calculateChange()).toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Complete Payment Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCashPayment}
                        disabled={calculateChange() < 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Complete Payment
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Dynamic UPI QR Code */}
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-64 h-64 mx-auto rounded-2xl overflow-hidden mb-4 bg-white p-4"
                        >
                          {qrCodeUrl ? (
                            <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              Generating QR Code...
                            </div>
                          )}
                        </motion.div>
                        <p className="text-white/70 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Scan to pay ₹{finalTotal}
                        </p>
                        <p className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          UPI ID: {store.getUpiId()}
                        </p>
                      </div>

                      {/* Mock Payment Confirmation */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUPIPayment}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Confirm Payment Received
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
