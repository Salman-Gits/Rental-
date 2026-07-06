import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Scanner } from './Scanner';
import { 
  ArrowLeft, 
  Barcode, 
  Building, 
  User, 
  MapPin, 
  ClipboardCheck, 
  Calendar, 
  Layers, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Camera
} from 'lucide-react';

export default function CheckoutPage() {
  const { assets, checkoutAsset, role } = useApp();
  const navigate = useNavigate();

  // Live Camera Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Local Form state
  const [formData, setFormData] = useState({
    barcode: '',
    client: '',
    employee: '',
    projectSite: '',
    quantity: '1',
    toolCondition: 'Excellent',
    expectedReturnDate: '',
    remarks: ''
  });

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [errors, setErrors] = useState({});

  // Auto-filled values for display
  const [autoFilled, setAutoFilled] = useState({
    date: '',
    time: '',
    issuedBy: ''
  });

  useEffect(() => {
    const now = new Date();
    setAutoFilled({
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      issuedBy: role === 'Admin' ? 'John Doe (Admin)' : 'Standard Operator'
    });
  }, [role]);

  // When barcode changes, find corresponding asset
  useEffect(() => {
    if (formData.barcode) {
      const found = assets.find(a => a.barcode === formData.barcode);
      setSelectedAsset(found || null);
    } else {
      setSelectedAsset(null);
    }
  }, [formData.barcode, assets]);

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
    if (!formData.barcode) newErrors.barcode = "Please select or enter an asset barcode";
    if (!formData.client.trim()) newErrors.client = "Client name is required";
    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Please enter a valid checkout quantity";
    } else if (selectedAsset && parseInt(formData.quantity) > selectedAsset.availableQuantity) {
      newErrors.quantity = `Insufficient stock. Only ${selectedAsset.availableQuantity} units available.`;
    }

    if (selectedAsset && (selectedAsset.status === 'Under Maintenance' || selectedAsset.status === 'Lost')) {
      newErrors.barcode = `Asset is currently ${selectedAsset.status.toLowerCase()} and cannot be issued`;
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

    const success = checkoutAsset(formData);
    if (success) {
      navigate('/history'); // Redirect to Logs
    }
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Checkout Terminal</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Deploy assets to client projects and site operators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Deployment Form</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requires correct barcodes and operator identification</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Asset Selection / Barcode Scan */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Asset Lookup & Barcode *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.barcode ? 'border-red-300' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
                >
                  <option value="">-- Choose Asset from Fleet --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.barcode} disabled={asset.availableQuantity === 0}>
                      {asset.barcode} - {asset.name} ({asset.availableQuantity}/{asset.quantity} Available)
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
                    placeholder="Or type Barcode manually..."
                    value={formData.barcode}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border ${errors.barcode ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-10 pr-12 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute inset-y-1 right-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                    title="Scan Barcode or QR Code with live camera"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {errors.barcode && <p className="text-[10px] font-bold text-red-500">{errors.barcode}</p>}

              {/* Reactive Asset Display Block */}
              {selectedAsset && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex gap-4 items-start mt-2">
                  <div className="p-2.5 bg-blue-500 rounded-xl text-white shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-snug">{selectedAsset.name}</h4>
                      <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded shrink-0">
                        {selectedAsset.brand} {selectedAsset.model}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold">
                      <div>AVAILABLE IN-STOCK: <span className="text-blue-600 font-extrabold">{selectedAsset.availableQuantity} / {selectedAsset.quantity}</span></div>
                      <div>BIN LOCATION: <span className="text-slate-700">{selectedAsset.location || 'N/A'}</span></div>
                      <div>TOOL CONDITION: <span className="text-slate-700">{selectedAsset.condition}</span></div>
                      <div>FLEET VALUE: <span className="text-slate-700">${selectedAsset.purchaseCost}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Client (Required) & Employee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Client / Contractor *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    name="client"
                    placeholder="e.g. Apex Builders Inc."
                    value={formData.client}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border ${errors.client ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                  />
                </div>
                {errors.client && <p className="text-[10px] font-bold text-red-500">{errors.client}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Employee Name / Recipient</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    name="employee"
                    placeholder="e.g. Sarah Connor"
                    value={formData.employee}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Project Site & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Project / Destination Site</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    name="projectSite"
                    placeholder="e.g. Downtown Office Tower"
                    value={formData.projectSite}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Deployment Quantity *</label>
                <input 
                  type="number"
                  name="quantity"
                  min="1"
                  max={selectedAsset ? selectedAsset.availableQuantity : 99}
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.quantity ? 'border-red-300' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
                />
                {errors.quantity && <p className="text-[10px] font-bold text-red-500">{errors.quantity}</p>}
              </div>
            </div>

            {/* Condition before use & Expected Return Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Tool Condition Before Use</label>
                <select
                  name="toolCondition"
                  value={formData.toolCondition}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Expected Return Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input 
                    type="date"
                    name="expectedReturnDate"
                    value={formData.expectedReturnDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Remarks / Special Instructions</label>
              <textarea
                name="remarks"
                rows="2"
                placeholder="Required battery chargers, specific couplers, warning reminders..."
                value={formData.remarks}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Auto-filled Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <div>AUTO-DATE: <span className="text-slate-600 font-bold">{autoFilled.date}</span></div>
              <div>AUTO-TIME: <span className="text-slate-600 font-bold">{autoFilled.time}</span></div>
              <div>AUTHORIZED BY: <span className="text-blue-600 font-extrabold">{autoFilled.issuedBy}</span></div>
            </div>
          </div>
        </form>

        {/* Checkout Summary Card Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800 space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-2xl"></div>
            
            <div className="border-b border-white/10 pb-4">
              <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-widest block w-max mb-1">
                Receipt Preview
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">Order Summary</h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Please verify the checkout manifest details prior to confirmation</p>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-300">
              {/* Asset Name summary */}
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-white/5">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Spec / Asset Item</p>
                  <p className="font-extrabold text-white text-sm leading-snug mt-1">
                    {selectedAsset ? selectedAsset.name : <span className="text-slate-500 italic">No asset selected</span>}
                  </p>
                  {selectedAsset && <p className="text-[10px] text-blue-400 mt-1">BARCODE: {selectedAsset.barcode}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Quantity</p>
                  <p className="text-xl font-black text-blue-400 mt-1">{formData.quantity}x</p>
                </div>
              </div>

              {/* Client & Recipient */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Client</p>
                  <p className="text-white mt-1 font-extrabold">
                    {formData.client.trim() ? formData.client : <span className="text-slate-500 italic">Required</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Recipient</p>
                  <p className="text-white mt-1">
                    {formData.employee.trim() ? formData.employee : <span className="text-slate-500 italic">Optional</span>}
                  </p>
                </div>
              </div>

              {/* Destination Site & Return */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Project Site</p>
                  <p className="text-white mt-1">
                    {formData.projectSite.trim() ? formData.projectSite : <span className="text-slate-500 italic">Standard Depot</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Expected Return</p>
                  <p className="text-white mt-1">
                    {formData.expectedReturnDate ? formData.expectedReturnDate : <span className="text-slate-500 italic">N/A (Indefinite)</span>}
                  </p>
                </div>
              </div>

              {/* Initial condition & Cost */}
              <div className="flex justify-between pb-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Outbound Condition</p>
                  <p className="text-white mt-1 font-bold">{formData.toolCondition}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Estimated Value</p>
                  <p className="text-white mt-1 font-bold">
                    {selectedAsset ? `$${(selectedAsset.purchaseCost * parseFloat(formData.quantity || 1)).toFixed(2)}` : '$0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning block if not configured */}
            {!selectedAsset && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-2xl flex items-start gap-2 text-[10px] leading-relaxed">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>You must select a valid asset barcode from the inventory database to generate a deployment voucher.</span>
              </div>
            )}

            {/* Big Action button inside summary container */}
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={!selectedAsset}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-6 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 group transition-all"
            >
              Issue Tools / Authorize Dispatch
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Live Camera Barcode/QR Scanner Modal */}
      <Scanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setFormData(prev => ({ ...prev, barcode: scannedCode }));
          setIsScannerOpen(false);
        }}
        mode="checkout"
      />
    </div>
  );
}
