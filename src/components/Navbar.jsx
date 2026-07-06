import React from 'react';
import { useApp } from '../context/AppContext';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Wrench, 
  User, 
  ShieldCheck, 
  LogOut, 
  ClipboardCheck, 
  ClipboardList, 
  History, 
  Plus, 
  Compass,
  Laptop
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function Navbar() {
  const { globalSearch, setGlobalSearch, role, setRole, currentUser, setCurrentUser } = useApp();
  const navigate = useNavigate();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Upper Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Logo & Home Icon */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/15">
              <Laptop className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm sm:text-base font-black tracking-widest text-white uppercase">
              ELECTRO<span className="text-blue-500">RENT</span>
            </span>
          </Link>

          {/* Home Icon on the Left side as requested */}
          <Link 
            to="/" 
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 hover:bg-slate-700 transition-all shadow-sm"
            title="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Global search by Asset, Barcode, Client, Employee..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 transition-all"
          />
        </div>

        {/* Right Side: Role Switcher, Home Button & Operator Badge */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Active Role Switcher / Authentication Flow */}
          {role === 'Admin' ? (
            <button
              onClick={() => {
                setRole('User');
                setCurrentUser(null);
                toast.info("Logged out from Admin Console. Interface restricted to Operator mode.");
                navigate('/');
              }}
              className="px-2.5 py-1.5 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              title="Click to logout from Admin Console"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Admin (Logout)</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              title="Click to login as Administrator"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Login</span>
            </button>
          )}

          {/* Home Button on the Top-Right as requested */}
          <button 
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-600 text-white rounded-lg hover:bg-slate-700 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all hidden sm:block"
          >
            Home Console
          </button>

          {/* Operator Badge (Replaces any photo URLs / Unwanted Image) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black">
              OP
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[10px] font-black text-slate-200 leading-none">
                {currentUser ? currentUser.fullName : "Guest Operator"}
              </p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{role} Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Sub-Nav Bar (Clean & Responsive links across all modules) */}
      <div className="bg-slate-950/50 border-t border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2.5">
            {/* Nav Links */}
            <div className="flex gap-1 sm:gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/inventory" 
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Assets Fleet
              </NavLink>

              <NavLink 
                to="/register" 
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Register Tool
              </NavLink>

              <NavLink 
                to="/checkout" 
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Checkout
              </NavLink>

              <NavLink 
                to="/checkin" 
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Check-In
              </NavLink>

              <NavLink 
                to="/history" 
                className={({ isActive }) => isActive 
                  ? "bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/5" 
                  : "hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all"}
              >
                Logs Ledger
              </NavLink>
            </div>

            {/* Mobile-only compact search indicator or toggle */}
            <div className="flex items-center md:hidden w-full max-w-[140px] relative">
              <Search className="h-3 w-3 text-slate-500 absolute left-2" />
              <input
                type="text"
                placeholder="Find..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-[10px] font-bold text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
