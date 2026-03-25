import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, Trash2, ArrowLeft, CreditCard, Search, Sparkles, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { PaymentModal } from './PaymentModal';
import { InvoiceModal } from './InvoiceModal';
import { ComputerVisionScanner } from './ComputerVisionScanner';
import { getProductByBarcode, Product, updateScanCount, getAllProducts } from '../data/products';
import { useSpeech } from '../hooks/useSpeech';
import { store, Transaction } from '../data/store';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';
import { toast } from 'sonner';

interface BillingItem extends Product {
  quantity: number;
  id: string;
}

interface BillingScreenProps {
  customerName: string;
  customerPhone: string;
  onBack: () => void;
  onComplete: (transaction: Transaction) => void;
  agentId: string;
}

export const BillingScreen = ({ customerName, customerPhone, onBack, onComplete, agentId }: BillingScreenProps) => {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const [multiScanMode, setMultiScanMode] = useState(false);
  const [autoOpenScan, setAutoOpenScan] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [cvScannerOpen, setCvScannerOpen] = useState(false);
  const { speak } = useSpeech();

  // Get customer loyalty info
  const customer = store.getCustomer(customerPhone);
  const loyaltyPoints = customer?.loyaltyPoints || 0;

  // Fuzzy search setup
  const fuse = new Fuse(getAllProducts(), {
    keys: ['name', 'barcode', 'category'],
    threshold: 0.3
  });

  const searchResults = searchQuery ? fuse.search(searchQuery).map(r => r.item).slice(0, 5) : [];

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9370DB']
    });
  };

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    
    if (product) {
      // Trigger scan flash effect
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 300);

      // Confetti effect
      triggerConfetti();

      // Update scan count for analytics
      updateScanCount(barcode);

      // Check if item already exists
      const existingIndex = items.findIndex(item => item.barcode === barcode);
      
      if (existingIndex >= 0) {
        const newItems = [...items];
        newItems[existingIndex].quantity += 1;
        setItems(newItems);
        toast.success(`${product.name} quantity increased!`, {
          description: `Now ${newItems[existingIndex].quantity} in cart`,
        });
      } else {
        const newItem: BillingItem = {
          ...product,
          quantity: 1,
          id: `${barcode}-${Date.now()}`
        };
        setItems([...items, newItem]);
        toast.success(`${product.name} added to cart!`, {
          description: `Price: ₹${product.price}`,
        });
      }

      // Announce product name
      speak(product.name);
      
      // Handle multi-scan mode
      if (multiScanMode) {
        // Keep scanner open for next scan
        toast.info('Multi-scan active - scan next item', { duration: 1500 });
      } else {
        setScannerOpen(false);
      }

      // Auto-open scan window if enabled
      if (autoOpenScan && !multiScanMode) {
        setTimeout(() => setScannerOpen(true), 500);
      }
    } else {
      speak('Product not found. Please try again.');
      toast.error('Product not found', {
        description: 'Barcode not recognized in database',
      });
    }
  };

  const handleSearchSelect = (product: Product) => {
    // Add product from search
    const existingIndex = items.findIndex(item => item.barcode === product.barcode);
    
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      const newItem: BillingItem = {
        ...product,
        quantity: 1,
        id: `${product.barcode}-${Date.now()}`
      };
      setItems([...items, newItem]);
    }

    triggerConfetti();
    speak(product.name);
    toast.success(`${product.name} added!`);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleCVDetection = (productName: string, confidence: number) => {
    // For detected loose items, create a mock product entry
    // In a real app, you'd prompt for weight/price or look up from a database
    const mockPrice = Math.floor(Math.random() * 100) + 50; // ₹50-150 mock price
    
    const mockProduct: BillingItem = {
      barcode: `CV-${Date.now()}`,
      name: productName,
      price: mockPrice,
      stock: 999,
      category: 'Loose Item',
      quantity: 1,
      id: `cv-${Date.now()}`
    };

    setItems([...items, mockProduct]);
    triggerConfetti();
    speak(`${productName} detected. Added at ${mockPrice} rupees`);
    toast.success(`${productName} added!`, {
      description: `AI Confidence: ${(confidence * 100).toFixed(1)}% • Price: ₹${mockPrice}`,
    });
  };

  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(items.filter(item => item.id !== id));
    if (item) {
      toast.info(`${item.name} removed from cart`);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePayment = () => {
    const total = calculateTotal();
    speak(`Grand total is ${total} rupees`);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = (paymentMethod: 'cash' | 'upi', pointsRedeemed: number) => {
    const subtotal = calculateTotal();
    const discount = 0;
    const total = subtotal - pointsRedeemed;
    const pointsEarned = Math.floor(total / 100);

    // Create transaction
    const transaction: Transaction = {
      id: `TXN${Date.now()}`,
      customerName,
      customerPhone,
      items: items.map(item => ({
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      discount,
      pointsRedeemed,
      total,
      paymentMethod,
      timestamp: Date.now(),
      agentId,
      pointsEarned
    };

    // Save transaction
    store.addTransaction(transaction);
    
    // Redeem loyalty points if used
    if (pointsRedeemed > 0) {
      store.redeemLoyaltyPoints(customerPhone, pointsRedeemed);
    }

    setCompletedTransaction(transaction);
    setPaymentOpen(false);
    setInvoiceOpen(true);

    // Celebration confetti
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 }
    });

    toast.success('Payment completed!', {
      description: `+${pointsEarned} loyalty points earned`,
    });
  };

  const handleInvoiceClose = () => {
    setInvoiceOpen(false);
    if (completedTransaction) {
      onComplete(completedTransaction);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Scan Flash Effect */}
      <AnimatePresence>
        {scanFlash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-400/30 pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white/70" />
              </button>
              <div>
                <h1
                  className="text-3xl text-white mb-1"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  SARVAM POS
                </h1>
                <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {customerName} • {customerPhone}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Fuzzy Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </motion.button>

              {/* Multi-Scan Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setMultiScanMode(!multiScanMode);
                  toast.info(multiScanMode ? 'Multi-scan disabled' : 'Multi-scan enabled!', {
                    description: multiScanMode ? '' : 'Scan multiple items continuously',
                  });
                }}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 ${
                  multiScanMode 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-white/10'
                } text-white`}
              >
                <Sparkles className="w-5 h-5" />
                Multi-Scan
              </motion.button>

              {/* AI Vision Scanner Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCvScannerOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                AI Vision
              </motion.button>

              {/* Scan Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScannerOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold flex items-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Scan className="w-5 h-5" />
                Scan Item
              </motion.button>
            </div>
          </div>

          {/* Settings Row */}
          <div className="mt-4 flex items-center gap-4 text-white/70 text-sm">
            <button
              onClick={() => setAutoOpenScan(!autoOpenScan)}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              {autoOpenScan ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
              Auto-open scan window
            </button>
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              💎 Loyalty Points: {loyaltyPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Fuzzy Search Panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto mb-6"
          >
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type product name, barcode, or category..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-lg"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map(product => (
                    <motion.button
                      key={product.barcode}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSearchSelect(product)}
                      className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all"
                    >
                      <div>
                        <p className="text-white font-semibold">{product.name}</p>
                        <p className="text-white/50 text-sm">{product.category} • {product.barcode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xl">₹{product.price}</p>
                        <p className="text-white/50 text-sm">Stock: {product.stock}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl p-6 min-h-96"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}
          >
            <h2
              className="text-xl text-white mb-4"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Cart Items
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Scan className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                  No items scanned yet. Click "Scan Item" to start.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="rounded-xl p-4 flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="flex-1">
                        <h3
                          className="text-white text-lg"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {item.name}
                        </h3>
                        <p className="text-white/50 text-sm">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <span className="text-white w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-24">
                          <p className="text-white text-xl">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>

                        {/* Delete */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-6 sticky top-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}
          >
            <h2
              className="text-xl text-white mb-6"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Bill Summary
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Tax (0%)</span>
                <span>₹0</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between text-white text-2xl">
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Total
                </span>
                <motion.span
                  key={calculateTotal()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundSize: '200% auto',
                    animation: 'shimmer 3s linear infinite'
                  }}
                >
                  ₹{calculateTotal()}
                </motion.span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={items.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Payment
            </motion.button>

            <div className="mt-6 p-4 rounded-xl bg-white/5">
              <p className="text-white/50 text-sm mb-2">
                Items: {items.length}
              </p>
              <p className="text-white/50 text-sm">
                Total Quantity: {items.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setMultiScanMode(false); // Disable multi-scan when closing
        }}
        onScan={handleScan}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={calculateTotal()}
        loyaltyPoints={loyaltyPoints}
        onComplete={handlePaymentComplete}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceOpen}
        onClose={handleInvoiceClose}
        transaction={completedTransaction}
      />

      {/* Computer Vision Scanner */}
      <ComputerVisionScanner
        isOpen={cvScannerOpen}
        onClose={() => setCvScannerOpen(false)}
        onDetect={handleCVDetection}
      />

      {/* Add shimmer animation to global styles */}
      <style>{`
        @keyframes shimmer {
          to {
            background-position: 200% center;
          }
        }
      `}</style>
    </div>
  );
};