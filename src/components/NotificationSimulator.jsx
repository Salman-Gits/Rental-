import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Smartphone, 
  Mail, 
  Bell, 
  Wifi, 
  Battery, 
  ArrowLeft, 
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Volume2
} from 'lucide-react';

export default function NotificationSimulator() {
  const { activeNotification, setActiveNotification } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeeped, setHasBeeped] = useState(false);

  // Play a modern subtle notification double-beep sound using standard Web Audio API (completely native, no external audio files required!)
  useEffect(() => {
    if (activeNotification) {
      setIsOpen(true);
      setHasBeeped(false);
      
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          
          // First beep
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
          gain1.gain.setValueAtTime(0.08, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.15);
          
          // Second beep after short delay
          setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, ctx.currentTime); // High pitch response
            gain2.gain.setValueAtTime(0.08, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.2);
            setHasBeeped(true);
          }, 120);
        }
      } catch (err) {
        console.warn("Web Audio API blocked or unsupported in this sandboxed layout. Sound bypassed.");
      }
    } else {
      setIsOpen(false);
    }
  }, [activeNotification]);

  if (!activeNotification || !isOpen) return null;

  const { type, recipient, title, body, channel, timestamp } = activeNotification;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-md mx-auto"
      >
        {/* Device Wrapper */}
        <div className="bg-slate-950 rounded-[48px] p-4 shadow-2xl border-4 border-slate-800 ring-12 ring-slate-900/50 relative overflow-hidden">
          
          {/* Top Notch Area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800"></div>
            <div className="w-12 h-1 bg-slate-900 rounded-full ml-3"></div>
          </div>

          {/* Quick Sound/Bell banner */}
          <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center text-[10px] font-black text-slate-500 tracking-wider uppercase z-10">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-slate-400">Dispatch Hub</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              <Volume2 className="h-3 w-3" />
              <span>Simulated Alert</span>
            </div>
          </div>

          {/* Core Screen */}
          <div className="bg-slate-900 rounded-[36px] overflow-hidden border border-slate-800/80 min-h-[500px] flex flex-col relative text-slate-100 pt-8">
            
            {/* Phone Status Bar */}
            <div className="px-6 pt-2 pb-3 flex justify-between items-center text-[10px] font-bold font-mono text-slate-400">
              <span>{timestamp}</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-slate-400" />
                <span className="text-[9px]">5G</span>
                <Battery className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {channel === 'SMS' ? (
              /* ================= PHONE SMS VIEW ================= */
              <div className="flex-1 flex flex-col bg-slate-950 font-sans">
                {/* Chat Header */}
                <div className="bg-slate-900 p-4 border-b border-slate-800/80 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                    ER
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide">ElectroRent Dispatch</h4>
                    <p className="text-[9px] text-slate-400 truncate font-mono">{recipient}</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Message Body */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col justify-end">
                  <div className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider my-2">
                    Today {timestamp} &bull; SMS Gateway
                  </div>

                  {/* Incoming bubble */}
                  <div className="self-start max-w-[85%] bg-slate-900 border border-slate-800 text-slate-200 p-3.5 rounded-2xl rounded-tl-none text-xs font-medium leading-relaxed shadow-lg">
                    <div className="text-[9px] font-black uppercase text-blue-400 tracking-wider mb-1">
                      {title}
                    </div>
                    {body}
                  </div>

                  {/* Small delivery flag */}
                  <div className="self-start text-[8px] text-green-400 font-bold flex items-center gap-1 ml-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Delivered via Simulated Twilio Protocol</span>
                  </div>
                </div>

                {/* Keyboard placeholder input */}
                <div className="p-3 bg-slate-900 border-t border-slate-800/60 flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-[10px] text-slate-500 font-medium">
                    Simulated recipient loopback...
                  </div>
                  <div className="p-2 bg-slate-800 text-slate-400 rounded-full shrink-0">
                    <Send className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ) : (
              /* ================= EMAIL CLIENT VIEW ================= */
              <div className="flex-1 flex flex-col bg-slate-950 font-sans">
                {/* Mail App Header */}
                <div className="bg-slate-900 p-4 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">System Mailroom</span>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Email content */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="border-b border-slate-800/60 pb-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">FROM:</span>
                        <span className="text-blue-400 font-mono">dispatch@electrorent.corp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">TO:</span>
                        <span className="text-slate-200 font-mono truncate max-w-[200px]">{recipient}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400 font-bold">SUBJECT:</span>
                        <span className="text-white font-extrabold">{title}</span>
                      </div>
                    </div>

                    <div className="pt-2 text-slate-300 leading-relaxed font-medium whitespace-pre-line text-[11px] bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 max-h-[180px] overflow-y-auto">
                      {body}
                    </div>

                    <div className="text-[9px] text-slate-500 font-semibold border-t border-slate-800/40 pt-2 flex items-center justify-between">
                      <span>Security: TLS Encrypted</span>
                      <span className="text-green-500 font-bold">Inbox Confirmed</span>
                    </div>
                  </div>

                  {/* Mail action footer info */}
                  <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 text-blue-400 text-[10px] font-bold flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="uppercase tracking-wider">Simulated SMTP Relay</p>
                      <p className="text-slate-400 font-semibold mt-0.5 normal-case">
                        In a production server context, this dispatches via standard mail service (NodeMailer / SendGrid SMTP) using variables specified in your secure environment panel.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Return to Dashboard */}
                <div className="p-4 bg-slate-900 border-t border-slate-800/60 text-center">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    Done Reviewing Alert
                  </button>
                </div>
              </div>
            )}

            {/* Bottom device bar */}
            <div className="py-3 bg-slate-900 flex justify-center items-center">
              <div className="w-28 h-1 bg-slate-700 rounded-full"></div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
