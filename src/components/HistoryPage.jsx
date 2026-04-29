import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Clock, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firebase';

export default function HistoryPage() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch rentas
    const qRentals = query(collection(db, 'rentals'), orderBy('startTime', 'desc'));
    const unsubscribeRentals = onSnapshot(qRentals, (snapshot) => {
      setRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rentals');
    });

    // Fetch products for details
    const qProducts = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeRentals();
      unsubscribeProducts();
    };
  }, []);

  const activeRentals = rentals.filter(r => r.status === 'active').length;

  // Intelligence: Utilization Analysis
  const utilizationByCategory = rentals.reduce((acc, curr) => {
    const cat = curr.productCategory || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (curr.totalDurationMinutes || 0);
    return acc;
  }, {});

  const topCategory = Object.entries(utilizationByCategory).sort((a,b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tighter uppercase underline decoration-blue-500 decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8">Operations Ledger</h1>
          <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-xs sm:text-sm">Comprehensive audit trail of asset deployment.</p>
        </div>
        <div className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-200 self-start sm:self-auto">
          <Clock className="h-3 w-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Live Sync Enabled</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Demand Category</p>
            <p className="text-2xl font-black text-slate-800">{topCategory ? topCategory[0] : 'Scanning...'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sessions</p>
            <p className="text-2xl font-black text-slate-800">{activeRentals}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Availability</p>
            <p className="text-2xl font-black">99.9<span className="text-xs ml-1 text-slate-500">%</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
             Log Database Audit
           </h2>
           <span className="text-[10px] font-bold text-slate-300">DEMO SESSION ACTIVE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Check-Out (Out)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Total Duration</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Check-In (In)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentals.map((rental) => {
                const product = products.find(p => p.id === rental.productId);
                return (
                  <tr key={rental.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                          {new Date(rental.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          {new Date(rental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded overflow-hidden bg-slate-100 border border-slate-200">
                           <img src={product?.imageUrl} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-slate-800">{product?.name || 'Unknown Asset'}</span>
                           <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{rental.userEmail}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {rental.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                          Deployed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                          Recovered
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {rental.status === 'completed' 
                          ? `${rental.totalDurationMinutes} min` 
                          : formatDistanceToNow(new Date(rental.startTime), { addSuffix: true })
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-xs font-black text-slate-800">
                         {rental.endTime ? (
                           <div className="flex flex-col items-end">
                             <span className="text-[11px]">{new Date(rental.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                             <span className="text-[9px] text-slate-400">{new Date(rental.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                         ) : '--'}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rentals.length === 0 && (
          <div className="p-32 flex flex-col items-center justify-center text-slate-200">
             <Clock className="h-10 w-10 mb-2 opacity-10" />
             <p className="text-[10px] font-black uppercase tracking-widest">Empty Audit Log</p>
          </div>
        )}
      </div>
    </div>
  );
}
