import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Package,
  Plus,
  Trash2,
  Edit,
  Save,
  UserPlus,
  Settings,
  Upload,
  History,
  BarChart3,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { store, Transaction, Agent } from '../data/store';
import { getAllProducts, addProduct, removeProduct, updateProduct, Product } from '../data/products';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface SellerDashboardProps {
  onBack: () => void;
  agentName: string;
  agentId: string;
}

type Tab = 'overview' | 'history' | 'products' | 'analytics' | 'settings' | 'agents';

export const SellerDashboard = ({ onBack, agentName, agentId }: SellerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newUpiId, setNewUpiId] = useState(store.getUpiId());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newAgent, setNewAgent] = useState({ id: '', password: '', name: '' });
  const [showAddAgent, setShowAddAgent] = useState(false);

  const transactions = store.getAllTransactions();
  const products = getAllProducts();

  // Calculate analytics
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalCustomers = new Set(transactions.map(t => t.customerPhone)).size;
  const totalItems = transactions.reduce((sum, t) => 
    sum + t.items.reduce((s, i) => s + i.quantity, 0), 0
  );
  const avgOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  // Peak hours heatmap data
  const hourlyData = Array(24).fill(0);
  transactions.forEach(t => {
    const hour = new Date(t.timestamp).getHours();
    hourlyData[hour] += t.total;
  });
  const maxHourly = Math.max(...hourlyData);

  // Product heatmap (most scanned)
  const productHeatmap = products
    .filter(p => p.scanCount && p.scanCount > 0)
    .sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0))
    .slice(0, 10);

  const handleSaveUpiId = () => {
    store.setUpiId(newUpiId);
    toast.success('UPI ID updated successfully!');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleAddProduct = () => {
    if (newProduct.barcode && newProduct.name && newProduct.price && newProduct.stock && newProduct.category) {
      addProduct(newProduct as Product);
      toast.success(`${newProduct.name} added successfully!`);
      setNewProduct({});
      setShowAddProduct(false);
      confetti({
        particleCount: 100,
        spread: 70
      });
    } else {
      toast.error('Please fill all fields');
    }
  };

  const handleRemoveProduct = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    removeProduct(barcode);
    toast.success(`${product?.name} removed`);
  };

  const handleUpdateProduct = () => {
    if (editingProduct) {
      updateProduct(editingProduct.barcode, editingProduct);
      toast.success('Product updated!');
      setEditingProduct(null);
    }
  };

  const handleAddAgent = () => {
    if (newAgent.id && newAgent.password && newAgent.name) {
      store.addAgent(newAgent as Agent);
      toast.success(`Agent ${newAgent.name} added successfully!`);
      setNewAgent({ id: '', password: '', name: '' });
      setShowAddAgent(false);
      confetti({
        particleCount: 100,
        spread: 70
      });
    } else {
      toast.error('Please fill all fields');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-white/70 text-sm mb-1">Total Revenue</h3>
                <p className="text-3xl text-white font-bold">₹{totalRevenue.toLocaleString()}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white/70 text-sm mb-1">Total Customers</h3>
                <p className="text-3xl text-white font-bold">{totalCustomers}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white/70 text-sm mb-1">Total Transactions</h3>
                <p className="text-3xl text-white font-bold">{transactions.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-white/70 text-sm mb-1">Items Sold</h3>
                <p className="text-3xl text-white font-bold">{totalItems}</p>
              </motion.div>
            </div>

            {/* Recent Transactions */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <h3 className="text-xl text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {transactions.slice(-5).reverse().map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{transaction.customerName}</p>
                      <p className="text-white/50 text-sm">
                        {format(transaction.timestamp, 'dd/MM/yyyy hh:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-semibold">₹{transaction.total}</p>
                      <p className="text-white/50 text-sm">{transaction.items.length} items</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-white/40 text-center py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <h3 className="text-2xl text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Transaction History
              </h3>
              <div className="space-y-4">
                {transactions.slice().reverse().map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                    onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{transaction.customerName}</p>
                          <p className="text-white/50 text-sm">{transaction.customerPhone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-2xl font-bold">₹{transaction.total}</p>
                        <p className="text-white/50 text-sm">
                          {format(transaction.timestamp, 'dd/MM/yy hh:mm a')}
                        </p>
                      </div>
                    </div>

                    {selectedTransaction?.id === transaction.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-2"
                      >
                        <p className="text-white/70 font-semibold mb-2">Items:</p>
                        {transaction.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-white/60 text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-white/50">Payment: </span>
                            <span className="text-white uppercase">{transaction.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Points Earned: </span>
                            <span className="text-yellow-400">+{transaction.pointsEarned}</span>
                          </div>
                          {transaction.pointsRedeemed > 0 && (
                            <div>
                              <span className="text-white/50">Points Redeemed: </span>
                              <span className="text-green-400">-{transaction.pointsRedeemed}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-white/50">Agent: </span>
                            <span className="text-white">{transaction.agentId}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-white/40 text-center py-12">No transaction history available</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Product Management
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </motion.button>
            </div>

            {showAddProduct && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <h4 className="text-white mb-4">New Product</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Barcode"
                    value={newProduct.barcode || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newProduct.stock || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newProduct.category || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddProduct}
                    className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.barcode}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    {editingProduct?.barcode === product.barcode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-white/10 text-white"
                        />
                        <input
                          type="number"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                          className="px-3 py-2 rounded-lg bg-white/10 text-white"
                        />
                        <input
                          type="number"
                          value={editingProduct.stock}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                          className="px-3 py-2 rounded-lg bg-white/10 text-white"
                        />
                        <input
                          type="text"
                          value={editingProduct.category}
                          onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-white/10 text-white"
                        />
                        <button
                          onClick={handleUpdateProduct}
                          className="px-4 py-2 rounded-lg bg-green-500 text-white flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold">{product.name}</p>
                          <p className="text-white/50 text-sm">
                            {product.barcode} • {product.category} • Stock: {product.stock}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-white text-xl">₹{product.price}</p>
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(product.barcode)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Peak Hours Heatmap */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <h3 className="text-2xl text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                📊 Peak Hours Heatmap
              </h3>
              <div className="space-y-2">
                {hourlyData.map((revenue, hour) => {
                  const intensity = maxHourly > 0 ? (revenue / maxHourly) * 100 : 0;
                  const color = intensity > 70 ? '#ef4444' : intensity > 40 ? '#f97316' : intensity > 10 ? '#eab308' : '#3b82f6';
                  
                  return (
                    <div key={hour} className="flex items-center gap-4">
                      <span className="text-white/70 w-20">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${intensity}%` }}
                          transition={{ duration: 0.5, delay: hour * 0.02 }}
                          className="h-full rounded-lg"
                          style={{
                            background: `linear-gradient(90deg, ${color}80, ${color})`,
                            boxShadow: `0 0 10px ${color}40`
                          }}
                        />
                      </div>
                      <span className="text-white/70 w-24 text-right">
                        ₹{revenue.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Heatmap */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <h3 className="text-2xl text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                🔥 Hot Selling Products
              </h3>
              <div className="space-y-3">
                {productHeatmap.map((product, index) => (
                  <motion.div
                    key={product.barcode}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#3b82f6'
                        }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{product.name}</p>
                        <p className="text-white/50 text-sm">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">{product.scanCount} scans</p>
                      <p className="text-white/50 text-sm">₹{product.price}</p>
                    </div>
                  </motion.div>
                ))}
                {productHeatmap.length === 0 && (
                  <p className="text-white/40 text-center py-8">No product data yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <h3 className="text-2xl text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                ⚙️ Settings
              </h3>

              <div className="space-y-6">
                {/* UPI ID Setting */}
                <div>
                  <label className="block text-white/70 mb-3">
                    UPI ID for QR Code Generation
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveUpiId}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save
                    </motion.button>
                  </div>
                  <p className="text-white/50 text-sm mt-2">
                    This UPI ID will be used to generate dynamic QR codes for payments
                  </p>
                </div>

                {/* Store Info */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-white font-semibold mb-4">Store Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-white/70 text-sm">
                    <div>
                      <span className="text-white/50">Total Products:</span>
                      <span className="ml-2 text-white">{products.length}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Total Revenue:</span>
                      <span className="ml-2 text-white">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Total Customers:</span>
                      <span className="ml-2 text-white">{totalCustomers}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Avg Order Value:</span>
                      <span className="ml-2 text-white">₹{avgOrderValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'agents':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                👥 Agent Management
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddAgent(!showAddAgent)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add Agent
              </motion.button>
            </div>

            {showAddAgent && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <h4 className="text-white mb-4">New Agent</h4>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Agent ID"
                    value={newAgent.id}
                    onChange={(e) => setNewAgent({ ...newAgent, id: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAgent.password}
                    onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAgent}
                    className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAddAgent(false)}
                    className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <div className="space-y-3">
                {store.getAllAgents().map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{agent.name}</p>
                        <p className="text-white/50 text-sm">Agent ID: {agent.id}</p>
                      </div>
                    </div>
                    {agent.id === agentId && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}
        >
          <div className="flex items-center justify-between">
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
                  Seller Dashboard
                </h1>
                <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Welcome, {agentName} (ID: {agentId})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'history', label: 'History', icon: History },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'agents', label: 'Agents', icon: Users }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};
