import { motion } from 'motion/react';
import { X, Download, Printer } from 'lucide-react';
import { Transaction } from '../data/store';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const InvoiceModal = ({ isOpen, onClose, transaction }: InvoiceModalProps) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
    toast.success('Printing invoice...');
  };

  const handleDownload = () => {
    // Create a simple text invoice
    const invoiceText = `
SARVAM SUPER MARKET
Smart Billing System
================================

Invoice #: ${transaction.id}
Date: ${format(transaction.timestamp, 'dd/MM/yyyy hh:mm a')}

Customer Details:
Name: ${transaction.customerName}
Phone: ${transaction.customerPhone}

================================
ITEMS
================================

${transaction.items.map(item => 
  `${item.name}
 ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}`
).join('\n\n')}

================================
Subtotal: ₹${transaction.subtotal}
Discount: -₹${transaction.discount}
Points Redeemed: -₹${transaction.pointsRedeemed}
================================
TOTAL: ₹${transaction.total}
================================

Payment Method: ${transaction.paymentMethod.toUpperCase()}
Points Earned: ${transaction.pointsEarned}

Agent ID: ${transaction.agentId}

Thank you for shopping with us!
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-t-3xl flex items-center justify-between print:hidden">
          <h2 className="text-2xl text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8" id="invoice-content">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              SARVAM SUPER MARKET
            </h1>
            <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Smart Billing System
            </p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-semibold text-gray-900">#{transaction.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">
                {format(transaction.timestamp, 'dd/MM/yyyy hh:mm a')}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">Customer Details</p>
            <p className="font-semibold text-gray-900">{transaction.customerName}</p>
            <p className="text-gray-700">{transaction.customerPhone}</p>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-gray-700">Item</th>
                  <th className="text-center py-3 text-gray-700">Qty</th>
                  <th className="text-right py-3 text-gray-700">Price</th>
                  <th className="text-right py-3 text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 text-gray-900">{item.name}</td>
                    <td className="text-center py-3 text-gray-700">{item.quantity}</td>
                    <td className="text-right py-3 text-gray-700">₹{item.price}</td>
                    <td className="text-right py-3 text-gray-900 font-semibold">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>₹{transaction.subtotal}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{transaction.discount}</span>
              </div>
            )}
            {transaction.pointsRedeemed > 0 && (
              <div className="flex justify-between text-yellow-600">
                <span>Loyalty Points Redeemed</span>
                <span>-₹{transaction.pointsRedeemed}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>TOTAL</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>₹{transaction.total}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 p-4 bg-green-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Payment Method</span>
              <span className="font-semibold text-gray-900 uppercase">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Loyalty Points Earned</span>
              <span className="font-semibold text-yellow-600">+{transaction.pointsEarned} points</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Agent ID: {transaction.agentId}</p>
            <p className="mt-2">Thank you for shopping with us!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-4 print:hidden">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </motion.button>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};
