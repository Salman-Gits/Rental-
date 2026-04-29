import { Card, CardContent } from './ui/card';
import { Activity, CopyPlus } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { useState } from 'react';

export function ProductCard({ product }) {
  const isRented = product.status === 'rented';
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async () => {
    const newBarcode = prompt("Enter unique barcode for the new unit:", `${product.barcode}-copy`);
    if (!newBarcode) return;

    setIsCloning(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        id: undefined, // Let Firestore generate new ID
        barcode: newBarcode,
        qrCode: newBarcode,
        status: 'available',
        currentRentalId: null,
        createdAt: new Date().toISOString()
      });
      toast.success("Unit duplicated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-500 group bg-white flex flex-col">
      <div className="relative h-36 overflow-hidden bg-slate-100">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <button 
            onClick={handleClone}
            disabled={isCloning}
            className="bg-white/90 backdrop-blur-sm text-slate-600 p-1.5 rounded-lg shadow-sm hover:text-blue-600 transition-colors border border-slate-200"
            title="Duplicate Asset"
          >
            <CopyPlus className={`h-4 w-4 ${isCloning ? 'animate-pulse' : ''}`} />
          </button>
          {isRented ? (
            <span className="bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm">
              IN USE
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm">
              READY
            </span>
          )}
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
           <span className="text-blue-600 text-[10px] font-black uppercase tracking-tighter mb-1 block">{product.category}</span>
           <h3 className="text-slate-800 font-bold tracking-tight text-sm line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-[11px] text-slate-400 font-medium line-clamp-1 leading-relaxed mb-3 flex-1">
          {product.description}
        </p>

        {/* Technical Info for Testing */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Product Barcode</span>
            <code className="text-[10px] font-black text-blue-600 bg-blue-50 px-1 rounded select-all cursor-pointer" title="Click to copy">{product.barcode}</code>
          </div>
          <p className="text-[7px] text-slate-300 mt-2 uppercase tracking-tighter text-center">Scan or enter ID to track</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
           <div className="flex flex-col">
             <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Asset Status</span>
             <span className={`text-[10px] font-black uppercase tracking-widest ${isRented ? 'text-amber-600' : 'text-emerald-600'}`}>
               {isRented ? 'Deployed' : 'Ready'}
             </span>
           </div>
           <div className="flex gap-2">
             <div title="Relational Sync Enabled" className="w-6 h-6 rounded bg-slate-50 text-slate-300 border border-slate-100 flex items-center justify-center">
                <Activity className="h-3 w-3" />
             </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
