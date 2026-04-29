import { doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AdminInit({ products }) {
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      const initialProducts = [
        {
          id: 'mbp-16-001',
          name: 'MacBook Pro 16" M3 Max',
          category: 'Laptop',
          description: 'Ultrapowerful laptop for designers and developers.',
          imageUrl: 'https://picsum.photos/seed/laptop/800/600',
          pricePerHour: 25,
          status: 'available',
          barcode: 'BC-MBP16-001',
          qrCode: 'QR-MBP16-001'
        },
        {
          id: 'sony-a7iv-001',
          name: 'Sony A7 IV Mirrorless',
          category: 'Camera',
          description: 'A versatile hybrid camera for professionals.',
          imageUrl: 'https://picsum.photos/seed/camera/800/600',
          pricePerHour: 15,
          status: 'available',
          barcode: 'BC-SONY4-001',
          qrCode: 'QR-SONY4-001'
        },
        {
          id: 'dji-m3-001',
          name: 'DJI Mavic 3 Cine',
          category: 'Drone',
          description: 'Professional drone with Hasselblad camera.',
          imageUrl: 'https://picsum.photos/seed/drone/800/600',
          pricePerHour: 45,
          status: 'available',
          barcode: 'BC-DJIM3-001',
          qrCode: 'QR-DJIM3-001'
        }
      ];

      const batch = writeBatch(db);
      initialProducts.forEach(p => {
        const ref = doc(db, 'products', p.id);
        batch.set(ref, p);
      });

      await batch.commit();
      toast.success("Initial inventory seeded!");
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={seedData} 
      disabled={loading}
      className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 flex gap-2"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
      Initialize Core Data
    </Button>
  );
}
