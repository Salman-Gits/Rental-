import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { PackagePlus, Loader2, Upload, Link, Image as ImageIcon, X, Sparkles } from 'lucide-react';

export function AddProductModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState('upload'); // 'upload' or 'url'
  const fileInputRef = useRef(null);
  
  const generateBarcode = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'ASSET';
    const random = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${random}`;
    setFormData(prev => ({ ...prev, barcode: code }));
    toast.info(`Smart ID Generated: ${code}`);
  };
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    barcode: '',
    pricePerHour: 0
  });
  const [quantity, setQuantity] = useState(1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Firestore doc size safety
        toast.error("Image too large. Please use a file under 1MB or a URL.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) {
      toast.error("Name and Barcode are required");
      return;
    }

    setLoading(true);
    try {
      if (quantity > 1) {
        // Batch Registration Logic
        const batchPromises = [];
        for (let i = 1; i <= quantity; i++) {
          const uniqueBarcode = `${formData.barcode}-${String(i).padStart(2, '0')}`;
          batchPromises.push(addDoc(collection(db, 'products'), {
            ...formData,
            barcode: uniqueBarcode,
            qrCode: uniqueBarcode,
            status: 'available',
            currentRentalId: null,
            createdAt: new Date().toISOString()
          }));
        }
        await Promise.all(batchPromises);
        toast.success(`Registered ${quantity} units with sequential IDs.`);
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          status: 'available',
          currentRentalId: null,
          qrCode: formData.barcode,
          createdAt: new Date().toISOString()
        });
        toast.success("New asset registered successfully");
      }
      
      onClose();
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      imageUrl: '',
      barcode: '',
      pricePerHour: 0
    });
    setQuantity(1);
    setImageSource('upload');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-2xl overflow-hidden p-0">
        <div className="bg-slate-900 p-8 text-white">
          <DialogHeader>
             <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
               <PackagePlus className="text-blue-500 h-6 w-6" />
               Register Asset
             </DialogTitle>
             <DialogDescription className="text-slate-400 font-medium mt-2 italic">
               Expanding physical inventory cluster...
             </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Visual</Label>
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button 
                  type="button"
                  onClick={() => setImageSource('upload')}
                  className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${imageSource === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Upload
                </button>
                <button 
                  type="button"
                  onClick={() => setImageSource('url')}
                  className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${imageSource === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Link
                </button>
              </div>
            </div>

            <div className="relative group">
              {formData.imageUrl ? (
                <div className="relative h-40 w-full rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, imageUrl: ''})}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => imageSource === 'upload' && fileInputRef.current?.click()}
                  className={`h-40 w-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all ${imageSource === 'upload' ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30' : 'bg-slate-50/50'}`}
                >
                  {imageSource === 'upload' ? (
                    <>
                      <Upload className="h-8 w-8 text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Select Image File</p>
                    </>
                  ) : (
                    <>
                      <Link className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter URL Below</p>
                    </>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            {imageSource === 'url' && (
              <Input 
                placeholder="https://image-provider.com/photo.jpg"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                className="rounded-lg border-slate-200 text-xs text-slate-400"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</Label>
              <Input 
                required
                placeholder="Device model..."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="rounded-lg border-slate-200"
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Barcode/SKU</Label>
                <button 
                  type="button" 
                  onClick={generateBarcode}
                  className="text-[8px] font-black uppercase text-blue-600 flex items-center gap-1 hover:text-blue-700"
                >
                  <Sparkles className="h-2 w-2" />
                  Auto-Gen
                </button>
              </div>
              <Input 
                required
                placeholder="e.g. MBP-2024"
                value={formData.barcode}
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                className="rounded-lg border-slate-200 font-mono text-sm uppercase tracking-tighter"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Quantity</Label>
                <Input 
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="rounded-lg border-slate-200 font-bold bg-blue-50 text-blue-700"
                />
              </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                <Input 
                  placeholder="Hardware..."
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="rounded-lg border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                <Input 
                  placeholder="Specs..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="rounded-lg border-slate-200"
                />
              </div>
          </div>

          <DialogFooter className="pt-4 gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest px-8 rounded-lg shadow-lg flex-1 h-12"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Register in Terminal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
