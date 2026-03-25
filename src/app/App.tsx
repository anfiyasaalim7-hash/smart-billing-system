import { useState, useEffect } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { CustomerIntakeModal } from './components/CustomerIntakeModal';
import { BillingScreen } from './components/BillingScreen';
import { SellerDashboard } from './components/SellerDashboard';
import { SellerLogin } from './components/SellerLogin';
import { useSpeech } from './hooks/useSpeech';
import { store, Transaction } from './data/store';
import { Toaster } from 'sonner';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

type Screen = 'intro' | 'billing' | 'dashboard' | 'sellerLogin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
  const [customerIntakeOpen, setCustomerIntakeOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [agentInfo, setAgentInfo] = useState({ id: '', name: '' });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { speak } = useSpeech();

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const handleNewBilling = () => {
    setCustomerIntakeOpen(true);
  };

  const handleCustomerSubmit = (name: string, phone: string) => {
    // Upsert customer in store
    store.upsertCustomer(name, phone);
    
    setCustomerInfo({ name, phone });
    setCustomerIntakeOpen(false);
    setCurrentScreen('billing');
    speak(`Welcome ${name}`);
  };

  const handleBillingComplete = (transaction: Transaction) => {
    // Transaction already saved in BillingScreen
    
    // Reset and go back to intro
    setTimeout(() => {
      setCurrentScreen('intro');
      setCustomerInfo({ name: '', phone: '' });
    }, 500);
  };

  const handleSellerLoginRequest = () => {
    setCurrentScreen('sellerLogin');
  };

  const handleSellerLogin = (agentId: string, agentName: string) => {
    setAgentInfo({ id: agentId, name: agentName });
    setCurrentScreen('dashboard');
  };

  const handleBackToIntro = () => {
    setCurrentScreen('intro');
  };

  const backgroundStyle = theme === 'dark' 
    ? 'radial-gradient(circle at 50% 50%, #1a0b2e 0%, #0a0514 50%, #000000 100%)'
    : 'radial-gradient(circle at 50% 50%, #f0f0f5 0%, #e0e0eb 50%, #d0d0e0 100%)';

  return (
    <div
      className="min-h-screen relative transition-colors duration-500"
      style={{
        background: backgroundStyle,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Theme Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-full"
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)'
        }}
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-yellow-400" />
        ) : (
          <Moon className="w-6 h-6 text-purple-600" />
        )}
      </motion.button>

      {currentScreen === 'intro' && (
        <IntroScreen
          onNewBilling={handleNewBilling}
          onSellerLogin={handleSellerLoginRequest}
        />
      )}

      {currentScreen === 'sellerLogin' && (
        <SellerLogin
          onLogin={handleSellerLogin}
          onBack={handleBackToIntro}
        />
      )}

      {currentScreen === 'billing' && (
        <BillingScreen
          customerName={customerInfo.name}
          customerPhone={customerInfo.phone}
          onBack={handleBackToIntro}
          onComplete={handleBillingComplete}
          agentId={agentInfo.id || 'GUEST'}
        />
      )}

      {currentScreen === 'dashboard' && (
        <SellerDashboard
          onBack={handleBackToIntro}
          agentName={agentInfo.name}
          agentId={agentInfo.id}
        />
      )}

      <CustomerIntakeModal
        isOpen={customerIntakeOpen}
        onClose={() => setCustomerIntakeOpen(false)}
        onSubmit={handleCustomerSubmit}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        richColors 
        expand={true}
        theme={theme}
      />

      {/* Add theme-specific styles */}
      <style>{`
        :root.light {
          color-scheme: light;
        }
        
        :root {
          color-scheme: dark;
        }
        
        .light h1, .light h2, .light h3, .light p {
          color: #000 !important;
        }
        
        .light button {
          color: #000;
        }
      `}</style>
    </div>
  );
}
