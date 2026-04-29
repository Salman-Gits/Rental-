import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ProductCard } from './ProductCard';
import { AdminInit } from './AdminInit';
import { Scanner } from './Scanner';
import { AddProductModal } from './AddProductModal';
import { toast } from 'sonner';
import { Package, Smartphone, Plus } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firebase';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('checkout');

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openScanner = (mode) => {
    setScannerMode(mode);
    setIsScannerOpen(true);
  };

  const handleScan = async (barcodeData) => {
    setIsScannerOpen(false);
    if (scannerMode === 'checkout') {
      await handleCheckout(barcodeData);
    } else {
      await handleCheckin(barcodeData);
    }
  };

  const handleCheckout = async (barcodeData) => {
    const product = products.find(p => p.barcode === barcodeData);
    if (!product) {
      toast.error("Invalid Barcode: Product not found");
      return;
    }
    if (product.status === 'rented') {
      toast.error("Product is already rented");
      return;
    }

    try {
      const rentalRef = await addDoc(collection(db, 'rentals'), {
        productId: product.id,
        productName: product.name,
        productCategory: product.category || 'Uncategorized',
        userId: auth.currentUser?.uid || 'anonymous',
        userEmail: auth.currentUser?.email || 'Anonymous Session',
        startTime: new Date().toISOString(),
        status: 'active'
      });

      await updateDoc(doc(db, 'products', product.id), {
        status: 'rented',
        currentRentalId: rentalRef.id
      });
      toast.success(`${product.name} checked out!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'checkout');
    }
  };

  const handleCheckin = async (barcodeData) => {
    const product = products.find(p => p.barcode === barcodeData);
    if (!product) {
      toast.error("Invalid Barcode: Product not found");
      return;
    }
    if (product.status === 'available') {
      toast.error("Product is already in inventory");
      return;
    }

    const rentalId = product.currentRentalId;
    if (!rentalId) {
      toast.error("No active rental record found");
      return;
    }

    try {
      const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
      if (!rentalDoc.exists()) throw new Error("Rental record missing");

      const rental = rentalDoc.data();
      const endTime = new Date();
      const startTime = new Date(rental.startTime);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));

      await updateDoc(doc(db, 'rentals', rentalId), {
        endTime: endTime.toISOString(),
        status: 'completed',
        totalDurationMinutes: durationMinutes
      });

      await updateDoc(doc(db, 'products', product.id), {
        status: 'available',
        currentRentalId: null
      });

      toast.success(`${product.name} returned!`);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'checkin');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
             <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter uppercase underline decoration-blue-500 decoration-4 underline-offset-8 shrink-0">Inventory</h2>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add Asset</span>
                  <span className="sm:hidden">Add</span>
                </button>
             </div>
             
             <div className="relative w-full">
                <input 
                  type="text"
                  placeholder="Search by name, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
             </div>
             {products.length === 0 && <AdminInit products={products} />}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400">
               <Package className="h-12 w-12 mb-4 opacity-10" />
               <p className="font-bold text-sm tracking-widest uppercase">{searchQuery ? 'No match found' : 'Inventory Data Empty'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center text-center border border-slate-800">
            <div className="hidden sm:flex w-32 h-32 bg-white p-3 rounded-xl mb-6 items-center justify-center relative shadow-inner">
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                <Smartphone className="h-8 w-8 text-slate-200 mb-1" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Gateway</p>
              </div>
            </div>
            
            <h3 className="text-white font-bold text-xl sm:text-2xl tracking-tighter mb-2">Operation Portal</h3>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-6">Dispatch & Returns</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 w-full">
              <button 
                onClick={() => openScanner('checkout')}
                className="bg-blue-600 text-white py-4 sm:py-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                Checkout
              </button>
              <button 
                onClick={() => openScanner('checkin')}
                className="bg-slate-800 text-white py-4 sm:py-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-700 hover:border-slate-600 active:scale-95 transition-all"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      </div>

      <Scanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan}
        mode={scannerMode}
      />

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
