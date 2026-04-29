import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

export function Navbar({ user }) {
  return (
    <nav className="h-16 bg-white border-b border-slate-200 shrink-0 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rotate-45"></div>
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
            ELECTRO<span className="text-blue-600">RENT</span>
          </span>
        </Link>
  
        {user && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex gap-4 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
              <NavLink 
                to="/inventory" 
                className={({ isActive }) => isActive ? "text-blue-600 border-b-2 border-blue-600 py-1" : "hover:text-slate-800 transition-colors py-1"}
              >
                Inventory
              </NavLink>
              <NavLink 
                to="/history" 
                className={({ isActive }) => isActive ? "text-blue-600 border-b-2 border-blue-600 py-1" : "hover:text-slate-800 transition-colors py-1"}
              >
                Logs
              </NavLink>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-end mr-1 hidden md:flex">
                <span className="text-[11px] font-bold text-slate-800 tracking-tight">{user.displayName || user.email}</span>
                <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Admin Studio</span>
              </div>
              <div className="hidden sm:block w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                 {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200" />}
              </div>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => signOut(auth)}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
