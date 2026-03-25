import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { store } from '../data/store';
import { toast } from 'sonner';

interface SellerLoginProps {
  onLogin: (agentId: string, agentName: string) => void;
  onBack: () => void;
}

export const SellerLogin = ({ onLogin, onBack }: SellerLoginProps) => {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const agent = store.getAgent(agentId, password);
    
    if (agent) {
      toast.success(`Welcome back, ${agent.name}!`, {
        description: 'Login successful',
        duration: 2000,
      });
      onLogin(agent.id, agent.name);
    } else {
      toast.error('Invalid credentials', {
        description: 'Please check your Agent ID and Password',
        duration: 3000,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>
            <h1
              className="text-3xl text-white mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Seller Login
            </h1>
            <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
              Access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent ID */}
            <div>
              <label
                className="block text-white/80 mb-2 text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Agent ID
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter your Agent ID"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-white/80 mb-2 text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>Demo Credentials:</strong><br />
                Agent ID: 7777 | Password: 12345678
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </motion.button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 text-white/60 hover:text-white transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Back to Home
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
