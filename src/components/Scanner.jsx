import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Barcode as BarcodeIcon, Keyboard } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function Scanner({ isOpen, onClose, onScan, mode }) {
  const scannerRef = useRef(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        
        scanner.render((data) => {
          scanner.clear().catch(e => console.error(e));
          onScan(data);
        }, (err) => {
          // ignore scan errors
        });
        
        scannerRef.current = scanner;
      }, 100);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [isOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50">
        <div className="p-6 sm:p-8 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-black tracking-tighter">
              <BarcodeIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${mode === 'checkout' ? 'text-blue-500' : 'text-emerald-500'}`} />
              {mode === 'checkout' ? 'Asset Deployment' : 'Identity Recovery'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium mt-1 sm:mt-2 text-xs sm:text-sm italic">
              Synchronizing with real-time barcode telemetry...
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6 bg-white">
          <div className="space-y-6">
            <div id="reader" className="w-full overflow-hidden rounded-xl border-2 border-slate-100 shadow-inner bg-slate-50"></div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white px-3 text-slate-300">OR ENTRY MANUALLY</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Product Barcode ID..."
                className="rounded-lg border-slate-200 focus:ring-blue-500 font-mono text-sm uppercase tracking-tighter"
              />
              <Button type="submit" size="icon" className="bg-slate-900 rounded-lg shrink-0">
                <Keyboard className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-between px-2">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Type</span>
               <span className="text-xs font-bold text-slate-800">Hardware Barcode</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-100"></div>
            <div className="flex flex-col items-end text-right">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Action</span>
               <span className="text-xs font-bold text-blue-600">{mode === 'checkout' ? 'Initialize Rental' : 'Terminate Session'}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
