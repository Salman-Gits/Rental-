import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InventoryPage from './components/InventoryPage';
import HistoryPage from './components/HistoryPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stable Demo Mode for the company showcase
    // This ensures no login errors while still providing a "User" context for the UI
    setUser({ 
      uid: 'demo_user_id', 
      email: 'guest@company.com', 
      displayName: 'Operations Guest', 
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo' 
    });
    setLoading(false);
  }, []);

  const login = () => {
    // Function kept but not needed for demo
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-300 font-black uppercase tracking-widest text-[10px]">
          Synchronizing Systems...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8">
          <AnimatePresence mode="wait">
            {!user ? (
              <Routes>
                <Route path="*" element={
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center justify-center pt-32"
                  >
                    <div className="text-center max-w-xl">
                      <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-200">
                          <div className="w-8 h-8 bg-white rotate-45"></div>
                        </div>
                      </div>
                      <h1 className="text-6xl font-extrabold tracking-tighter mb-6 text-slate-800 leading-tight">
                        ELECTRO<span className="text-blue-600 font-black">RENT</span>
                      </h1>
                      <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        High-end electronics terminal. Managed, secure, and balanced.
                      </p>
                      <Button 
                        onClick={login} 
                        size="lg" 
                        className="rounded-xl px-10 py-7 text-sm bg-slate-900 hover:bg-slate-800 transition-all font-bold tracking-widest uppercase shadow-2xl shadow-slate-200"
                      >
                        <LogIn className="mr-3 h-5 w-5" />
                        Admin Login
                      </Button>
                    </div>
                  </motion.div>
                } />
              </Routes>
            ) : (
              <Routes>
                <Route path="/inventory" element={
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <InventoryPage />
                  </motion.div>
                } />
                <Route path="/history" element={
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <HistoryPage />
                  </motion.div>
                } />
                <Route path="/" element={<Navigate to="/inventory" replace />} />
                <Route path="*" element={<Navigate to="/inventory" replace />} />
              </Routes>
            )}
          </AnimatePresence>
        </main>
        <Toaster position="bottom-right" richColors theme="light" />
      </div>
    </BrowserRouter>
  );
}
