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
  Laptop,
  UserPlus,
  Phone,
  Mail,
  Users
} from 'lucide-react';

export default function LoginPage() {
  const { setRole, setCurrentUser, loginUser, users } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to original page or home console after login
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginUser(username, password);
      if (res.success) {
        toast.success(`Authentication successful! Welcome, ${res.user.fullName}.`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || "Authentication failed: invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Authentication failed: invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (u) => {
    setUsername(u.username);
    setPassword(u.password);
    toast.info(`Selected "${u.fullName}" demo credentials. Click 'Acknowledge Identity' to login.`);
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12 px-2 animate-fade-in space-y-6">
      
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Upper Brand / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/15 mb-2">
            <Laptop className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            GATEWAY SIGN IN
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-relaxed">
            Authorize to view assets, log check-outs, and see records
          </p>
        </div>

        {/* Sign In Form */}
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
                placeholder="Enter operator or admin username"
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
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-6 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer"
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

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-2.5 text-[11px] text-slate-500 leading-relaxed">
          <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-700 uppercase tracking-wide block mb-0.5">Staff Provisioning Notice</strong>
            New staff operator profiles must be provisioned and authorized by an Administrator in the Admin dashboard.
          </div>
        </div>

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

      {/* Demo Credentials Quick-Select Helper Section */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-slate-300 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400">
          <Users className="h-4 w-4" />
          <h4 className="text-xs font-black uppercase tracking-widest">Demo Portal Credentials Click-to-Fill</h4>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Select any verified operator identity below to automatically fill the sign in form. Helpful for Vercel offline reviews.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {users && users.map((u) => (
            <button
              key={u.id || u.username}
              type="button"
              onClick={() => selectDemoAccount(u)}
              className="p-3 bg-slate-800 hover:bg-slate-800/80 border border-slate-700/80 rounded-2xl text-left hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-100 group-hover:text-blue-400 transition-all">{u.fullName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${u.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'}`}>
                  {u.role}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-1 flex justify-between">
                <span>usr: <strong className="text-slate-300">{u.username}</strong></span>
                <span>pwd: <strong className="text-slate-300">{u.password}</strong></span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
