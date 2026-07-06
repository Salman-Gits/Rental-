import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Barcode, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Activity,
  UserCheck,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export default function CheckInPage() {
  const { logs, checkinAsset, role } = useApp();
  const navigate = useNavigate();

  // Find all barcode options currently checked out (Active status)
  const activeLogs = logs.filter(l => l.status === "Active");

  // Local Form state
  const [formData, setFormData] = useState({
    barcode: '',
    returnedBy: '',
    receivedBy: '',
    toolCondition: 'Excellent',
    maintenanceRequired: 'No',
    remarks: ''
  });

  const [activeLog, setActiveLog] = useState(null);
  const [daysUsed, setDaysUsed] = useState(null);
  const [errors, setErrors] = useState({});

  // Success Dialog State
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    assetName: '',
    daysUsed: 0,
    condition: '',
    logId: ''
  });

  // Autocomplete when barcode selection changes
  useEffect(() => {
    if (formData.barcode) {
      const log = activeLogs.find(l => l.barcode === formData.barcode);
      if (log) {
        setActiveLog(log);
        setFormData(prev => ({
          ...prev,
          returnedBy: log.employee || log.client || ''
        }));

        // Calculate days used
        const start = new Date(log.checkoutDate);
        const end = new Date();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysUsed(diffDays);
      } else {
        setActiveLog(null);
        setDaysUsed(null);
      }
    } else {
      setActiveLog(null);
      setDaysUsed(null);
    }
  }, [formData.barcode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.barcode) {
      newErrors.barcode = "Please select or scan an issued tool barcode";
    }
    if (!formData.returnedBy.trim()) {
      newErrors.returnedBy = "Please specify who is returning the tool";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Form validation failed. Please review your entries.");
      return;
    }

    const result = checkinAsset({
      ...formData,
      receivedBy: role === 'Admin' ? 'John Doe (Admin)' : 'Standard Operator'
    });

    if (result && result.success) {
      // Trigger confirmation dialog
      setSuccessDetails({
        assetName: result.assetName,
        daysUsed: result.daysUsed,
        condition: formData.toolCondition,
        logId: activeLog.id
      });
      setSuccessDialogOpen(true);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessDialogOpen(false);
    navigate('/history'); // Redirect to Logs
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Check-In Return Desk</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Decommission tools, calculate return metrics, and audit conditions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Check-In Return Ledger</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Examine tool conditions and close current deployment vouchers</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Barcode Lookup Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Select Active Outbound Barcode *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.barcode ? 'border-red-300' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
                >
                  <option value="">-- Choose Deployed Barcode --</option>
                  {activeLogs.map(log => (
                    <option key={log.id} value={log.barcode}>
                      {log.barcode} - {log.assetName} ({log.client})
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Barcode className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    name="barcode"
                    placeholder="Or type/scan Barcode..."
                    value={formData.barcode}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border ${errors.barcode ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                  />
                </div>
              </div>
              {errors.barcode && <p className="text-[10px] font-bold text-red-500">{errors.barcode}</p>}
            </div>

            {/* Active Checkout Voucher Details */}
            {activeLog && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex gap-4 items-start">
                <div className="p-2.5 bg-slate-900 text-blue-500 rounded-xl shrink-0 border border-slate-800">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600">Active Deployment Context</h4>
                  <p className="text-xs font-extrabold text-slate-800 leading-none">{activeLog.assetName}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold">
                    <div>CLIENT: <span className="text-slate-700 font-extrabold">{activeLog.client}</span></div>
                    <div>EMPLOYEE: <span className="text-slate-700 font-extrabold">{activeLog.employee || 'N/A'}</span></div>
                    <div>CHECKOUT DATE: <span className="text-slate-700 font-bold">{activeLog.checkoutDate}</span></div>
                    <div>DEPLOYED SITE: <span className="text-slate-700 font-bold">{activeLog.projectSite || 'N/A'}</span></div>
                  </div>

                  {daysUsed !== null && (
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 mt-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-200" />
                      Auto-Calculated Duration: {daysUsed} Day(s) Used
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Returned By & Tool Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Returned By *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    name="returnedBy"
                    placeholder="Who brought it back?"
                    value={formData.returnedBy}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border ${errors.returnedBy ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                  />
                </div>
                {errors.returnedBy && <p className="text-[10px] font-bold text-red-500">{errors.returnedBy}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Returned Tool Condition</label>
                <select
                  name="toolCondition"
                  value={formData.toolCondition}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="Excellent">Excellent (Like New)</option>
                  <option value="Good">Good (Working fine)</option>
                  <option value="Fair">Fair (Shows signs of wear)</option>
                  <option value="Needs Repair">Needs Repair (Broken / Damaged)</option>
                </select>
              </div>
            </div>

            {/* Maintenance Required Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Maintenance / Repair Required? *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex-1 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="radio" 
                    name="maintenanceRequired" 
                    value="No" 
                    checked={formData.maintenanceRequired === 'No'} 
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  <span>No (Direct back to Fleet)</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex-1 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="radio" 
                    name="maintenanceRequired" 
                    value="Yes" 
                    checked={formData.maintenanceRequired === 'Yes'} 
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  <span className="text-amber-600 flex items-center gap-1">Yes (Flag to Repair Bay)</span>
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Check-In Notes / Remarks</label>
              <textarea
                name="remarks"
                rows="2"
                placeholder="List any observations, missing accessory parts, or cleaning requirements..."
                value={formData.remarks}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Auto-filled metadata */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <div>RETURN DATE: <span className="text-slate-600 font-bold">{new Date().toLocaleDateString()}</span></div>
              <div>RECEIVED BY: <span className="text-blue-600 font-extrabold">{role === 'Admin' ? 'John Doe (Admin)' : 'Standard Operator'}</span></div>
              <div>STATION STATUS: <span className="text-emerald-600 font-black">Live & Connected</span></div>
            </div>
          </div>
        </form>

        {/* Info Helper column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Return Guidelines</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold text-[11px]">1</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">Barcode Validation</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">Select from the active dropdown or type/scan the physical barcode label on the unit casing.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold text-[11px]">2</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">Physical Inspection</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">Confirm all standard attachments, chargers, and cases are present. Evaluate the tool body condition.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold text-[11px]">3</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">Service Status</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">If the tool has any faults, select "Maintenance Required: Yes" to lock the asset from further deployments.</p>
                </div>
              </div>
            </div>

            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={!activeLog}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-6 shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              Confirm Tool Check-In
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Success Dialog Modal */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-6 bg-slate-900 text-white space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Check-In Successful!</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">Transaction Closeout Ticket Complete</DialogDescription>
            </DialogHeader>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5 text-xs font-bold text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black">Closeout ID</span>
              <span className="text-white">{successDetails.logId}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black shrink-0">Asset Item</span>
              <span className="text-white text-right font-extrabold leading-tight">{successDetails.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black">Days Deployed</span>
              <span className="text-emerald-400 font-extrabold">{successDetails.daysUsed} Day(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black">Final Condition</span>
              <span className="text-blue-400">{successDetails.condition}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium">The asset has been successfully processed. Real-time fleet metrics have been synchronized.</p>

          <div className="flex gap-3 justify-end pt-2">
            <Button 
              type="button" 
              onClick={handleCloseSuccess}
              className="w-full rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest py-5"
            >
              Close and Open Logs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
