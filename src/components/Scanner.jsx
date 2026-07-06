import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Barcode as BarcodeIcon, Keyboard, Camera, RefreshCw, AlertCircle, Sparkles, CheckCircle2, ChevronRight, Play, Square, Loader2, Info } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function Scanner({ isOpen, onClose, onScan, mode }) {
  const scannerRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Backend Real-time processing state
  const [backendStatus, setBackendStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sound generator using browser's AudioContext
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz clear beep
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Short beep
    } catch (err) {
      console.warn("Audio Context beep suppressed due to gesture block.", err);
    }
  };

  // Enumerate cameras on open
  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setBackendStatus(null);
      setCameraError(null);
      setIsInitializing(true);

      // Query standard browser Media Devices API to ask for permission and list cameras
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          setPermissionGranted(true);
          // Release initial stream immediately so html5-qrcode can capture it later
          stream.getTracks().forEach(track => track.stop());
          
          return Html5Qrcode.getCameras();
        })
        .then((devices) => {
          setIsInitializing(false);
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back/rear camera if available, otherwise first camera
            const backCam = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            const defaultId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(defaultId);
            startScanner(defaultId);
          } else {
            setCameraError("No video capture devices discovered.");
          }
        })
        .catch((err) => {
          setIsInitializing(false);
          setPermissionGranted(false);
          setCameraError("Camera access rejected. Please grant permissions or use simulator.");
          console.warn("Browser media device camera capture rejected:", err);
        });
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId) => {
    try {
      await stopScanner();
      
      const html5QrCode = new Html5Qrcode("reader-custom");
      scannerRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          }
        },
        async (decodedText) => {
          // Success Callback
          playBeep();
          setIsScanning(false);
          await stopScanner();
          handleScannedBarcode(decodedText);
        },
        (errorMessage) => {
          // continuous detection failures can be ignored
        }
      );
    } catch (err) {
      console.error("Scanner startup failure:", err);
      setCameraError(`Initialization error: ${err.message || err}`);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error("Error gracefully stopping camera stream:", e);
      }
    }
    setIsScanning(false);
  };

  const handleCameraChange = (e) => {
    const nextId = e.target.value;
    setSelectedCameraId(nextId);
    if (nextId) {
      startScanner(nextId);
    }
  };

  // Perform backend real-time lookup for scanned barcode
  const handleScannedBarcode = async (barcode) => {
    setManualCode(barcode);
    setIsProcessing(true);
    setBackendStatus(null);

    try {
      const response = await fetch('/api/scanner/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.toUpperCase().trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        setBackendStatus({
          error: true,
          message: errData.message || "Scanned barcode not found in registry."
        });
        toast.error(errData.message || "Scanned item is unregistered.");
      } else {
        const data = await response.json();
        setBackendStatus(data);
        toast.success(`Telemetry loaded for: ${data.asset.name}`);
      }
    } catch (err) {
      console.error("Scanner backend error:", err);
      setBackendStatus({
        error: true,
        message: "Failed to communicate with API gateway scanner service."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScannedBarcode(manualCode.trim().toUpperCase());
    }
  };

  const handleConfirmAction = () => {
    if (backendStatus && backendStatus.asset) {
      // Return decoded text to main transaction forms
      onScan(backendStatus.asset.barcode);
    } else if (manualCode.trim()) {
      onScan(manualCode.trim().toUpperCase());
    }
  };

  // Pre-configured test barcodes for simulation
  const mockBarcodes = [
    { code: "TL-1001", label: "DeWalt Rotary Drill" },
    { code: "TL-1002", label: "Milwaukee Impact Wrench" },
    { code: "TL-1003", label: "Fluke Multimeter" },
    { code: "TL-1004", label: "Air Compressor" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
        {/* Header Block */}
        <div className="p-6 sm:p-8 bg-slate-950 border-b border-slate-800 flex justify-between items-center relative">
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-black tracking-tighter uppercase text-blue-400">
                <BarcodeIcon className="h-6 w-6 text-blue-500 animate-pulse" />
                Live Camera Scanner
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-1 text-xs sm:text-sm">
                Powered by HTML5 Media Streams & Browser Media API
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Top Camera Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isScanning ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase hidden xxs:inline">
              {isScanning ? 'Streaming' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Scanner Viewport Section */}
        <div className="p-6 space-y-6">
          <div className="relative">
            {/* Viewfinder Container */}
            <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col items-center justify-center">
              
              {/* Media Stream Video Target Element */}
              <div id="reader-custom" className="w-full h-full absolute inset-0 z-0 bg-black"></div>

              {/* Viewfinder Decorative Framing Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
                  {/* Top corners */}
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md"></div>
                    <div className="w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md"></div>
                  </div>
                  
                  {/* Laser effect */}
                  <div className="w-full h-0.5 bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-[bounce_2s_infinite]"></div>

                  {/* Bottom corners */}
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md"></div>
                    <div className="w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md"></div>
                  </div>
                </div>
              )}

              {/* Loader overlay */}
              {isInitializing && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Initializing Media Stream...</p>
                </div>
              )}

              {/* Camera Error / Rejection Screen */}
              {cameraError && (
                <div className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">Stream Unavailable</h4>
                    <p className="text-[10px] text-slate-500 font-bold max-w-xs mt-1 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="xs" 
                      onClick={() => {
                        setCameraError(null);
                        if (selectedCameraId) startScanner(selectedCameraId);
                      }} 
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry Stream
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Camera Switcher */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
              <Camera className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Active Camera Input</p>
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none w-full"
                >
                  {cameras.map(cam => (
                    <option key={cam.id} value={cam.id} className="bg-slate-900 text-white">
                      {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quick Sandbox Simulation Block (For standard development environments & Iframe compliance) */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sandbox Code Simulation</h5>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-3">
              Webcam denied or testing in an iframe container? Simulate a high-speed camera scan instant-read by selecting a barcode card:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {mockBarcodes.map(item => (
                <button
                  key={item.code}
                  onClick={() => {
                    playBeep();
                    handleScannedBarcode(item.code);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left px-3 py-2 rounded-xl transition-all group shrink-0"
                >
                  <p className="text-[9px] text-slate-500 font-black group-hover:text-blue-400 uppercase tracking-wider">{item.code}</p>
                  <p className="text-xs font-bold text-slate-300 truncate">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Scanner Telemetry / Backend Output Panel */}
          {(isProcessing || backendStatus) && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  Real-time Database Telemetry
                </span>
                {isProcessing && <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />}
              </div>

              {backendStatus && !backendStatus.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight uppercase">{backendStatus.asset.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        Brand: {backendStatus.asset.brand} | Model: {backendStatus.asset.model}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shrink-0 ${
                      backendStatus.suggestedAction === 'checkin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {backendStatus.suggestedAction === 'checkin' ? 'LEASE ACTIVE' : 'AVAILABLE'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 font-semibold bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed italic">
                    {backendStatus.message}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-bold bg-slate-900/40 p-2 rounded-lg">
                    <div>LOCATION: <span className="text-slate-300">{backendStatus.asset.location || 'N/A'}</span></div>
                    <div>IN STOCK: <span className="text-slate-300">{backendStatus.asset.availableQuantity} units</span></div>
                    {backendStatus.activeLog && (
                      <>
                        <div className="col-span-2 text-slate-400 border-t border-slate-800/40 pt-1.5 mt-1">
                          Current Contractor: <span className="text-blue-400 font-extrabold">{backendStatus.activeLog.client}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {backendStatus && backendStatus.error && (
                <div className="flex gap-2.5 items-start text-red-400 bg-red-950/20 border border-red-900/40 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold uppercase leading-relaxed tracking-wide">{backendStatus.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Form & Actions */}
          <div className="space-y-4 pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <Keyboard className="h-4 w-4" />
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Type barcode ID manually (e.g. TL-1001)..."
                  className="rounded-xl border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus:ring-blue-500 font-mono text-xs uppercase tracking-tight pl-10"
                />
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl px-4 shrink-0 shadow-lg shadow-blue-500/15">
                  Fetch
                </Button>
              </form>
            </div>

            {/* Accept / Cancel Footer Buttons */}
            <div className="flex gap-2 border-t border-slate-800/60 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 rounded-xl border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-wider h-11"
              >
                Cancel
              </Button>
              <Button
                disabled={isProcessing || !manualCode.trim()}
                onClick={handleConfirmAction}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider h-11 shadow-lg shadow-blue-500/15 disabled:opacity-50"
              >
                {backendStatus?.asset ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Confirm Voucher Item
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    Apply Barcode <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
