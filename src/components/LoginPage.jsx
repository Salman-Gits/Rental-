import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight,
  Info,
  Laptop
} from 'lucide-react';

export default function LoginPage() {
  const { setRole, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to original page or home console after login
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Authentication failed: invalid credentials.");
      } else {
        const userData = await response.json();
        setRole(userData.role);
        setCurrentUser(userData);
        toast.success(`Authentication successful! Welcome, ${userData.fullName}.`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error trying to connect to API gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-1">
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Upper Brand / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/15 mb-2">
            <Laptop className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            ADMIN CONSOLE
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Authorize to manage tool register and inventories
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Operator Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Console Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-6 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mt-2 transition-all"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Acknowledge Identity</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-extrabold uppercase tracking-widest transition-all"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
}
