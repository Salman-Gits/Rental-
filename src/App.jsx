import React from 'react';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import DashboardPage from './components/DashboardPage';
import InventoryPage from './components/InventoryPage';
import RegisterPage from './components/RegisterPage';
import CheckoutPage from './components/CheckoutPage';
import CheckInPage from './components/CheckInPage';
import HistoryPage from './components/HistoryPage';
import LoginPage from './components/LoginPage';
import NotificationSimulator from './components/NotificationSimulator';

function AppContent() {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          {/* Elegant Circular Spinner */}
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
              ElectroRent Gateway
            </p>
            <p className="text-sm font-medium text-slate-600">
              Synchronizing offline records and assets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col">
        {/* Global Header and Navigation */}
        <Navbar />
        
        {/* Main Application Core */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              {/* 1. Dashboard Landing Route */}
              <Route path="/" element={
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <DashboardPage />
                </motion.div>
              } />

              {/* 2. Inventory / Asset Management Route */}
              <Route path="/inventory" element={
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <InventoryPage />
                </motion.div>
              } />

              {/* 3. Register Asset Specification Form Route */}
              <Route path="/register" element={
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <RegisterPage />
                </motion.div>
              } />

              {/* 4. Checkout Dispatch Form Route */}
              <Route path="/checkout" element={
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <CheckoutPage />
                </motion.div>
              } />

              {/* 5. Check-In Return Desk Route */}
              <Route path="/checkin" element={
                <motion.div
                  key="checkin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <CheckInPage />
                </motion.div>
              } />

              {/* 6. Operations Audit History Log Route */}
              <Route path="/history" element={
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <HistoryPage />
                </motion.div>
              } />

              {/* 7. Admin Login Route */}
              <Route path="/login" element={
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <LoginPage />
                </motion.div>
              } />

              {/* Redirect any stray/invalid routes to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Compact visual footer credit (No margin clutter) */}
        <footer className="py-4 border-t border-slate-200/60 bg-slate-100/50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-12 shrink-0">
          ElectroRent Operations Panel &copy; {new Date().getFullYear()}
        </footer>

        {/* Interactive action notifications */}
        <NotificationSimulator />
        <Toaster position="bottom-right" richColors theme="light" />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
