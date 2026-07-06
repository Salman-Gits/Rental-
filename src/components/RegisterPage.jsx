import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  PackagePlus, 
  ArrowLeft, 
  Barcode, 
  Calendar, 
  DollarSign, 
  Layers, 
  MapPin, 
  Tag, 
  FileText 
} from 'lucide-react';

export default function RegisterPage() {
  const { addAsset, assets, role } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Power Tools',
    barcode: '',
    model: '',
    brand: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    quantity: '1',
    vendor: '',
    location: '',
    condition: 'Excellent',
    status: 'Available',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Asset name is required";
    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barcode is required";
    } else {
      // Check for unique barcode
      const exists = assets.some(a => a.barcode.toLowerCase() === formData.barcode.trim().toLowerCase());
      if (exists) {
        newErrors.barcode = "This barcode already exists in database";
      }
    }
    if (!formData.purchaseDate) newErrors.purchaseDate = "Purchase date is required";
    if (!formData.purchaseCost || isNaN(formData.purchaseCost) || parseFloat(formData.purchaseCost) < 0) {
      newErrors.purchaseCost = "Please enter a valid purchase cost";
    }
    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
    }
    if (!formData.condition) newErrors.condition = "Tool condition is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role !== 'Admin') {
      toast.error("Access Denied: Standard operators cannot register assets. Please switch to Admin.");
      return;
    }

    if (!validate()) {
      toast.error("Validation failed. Please correct the highlighted errors.");
      return;
    }

    const added = await addAsset(formData);
    if (added) {
      navigate('/inventory');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-2 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Register New Asset</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Add a high-spec unit to the electronic tool fleet</p>
        </div>
      </div>

      {role !== 'Admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-center text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">
            <strong>Demonstration Notice:</strong> You are currently logged in as a <strong>Standard User</strong>. Only <strong>Admin</strong> users can submit this form. You can switch roles at the top-right role switcher for immediate access.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden">
        {/* Section Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Asset Specifications</h3>
            <p className="text-[10px] text-slate-400 font-medium">Specify telemetry, vendor and stock attributes</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Asset Name *</label>
              <div className="relative">
                <input 
                  type="text"
                  name="name"
                  placeholder="e.g. Cordless Rotary Drill"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                />
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="Power Tools">Power Tools</option>
                <option value="Hand Tools">Hand Tools</option>
                <option value="Testing Equipment">Testing Equipment</option>
                <option value="Pneumatic Tools">Pneumatic Tools</option>
                <option value="Safety Gear">Safety Gear</option>
                <option value="Generators">Generators</option>
                <option value="Office Equipment">Office Equipment</option>
              </select>
            </div>
          </div>

          {/* Row 2: Barcode & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Barcode *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <Barcode className="h-4 w-4" />
                </div>
                <input 
                  type="text"
                  name="barcode"
                  placeholder="e.g. TL-2041"
                  value={formData.barcode}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.barcode ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                />
              </div>
              {errors.barcode && <p className="text-[10px] font-bold text-red-500">{errors.barcode}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Brand</label>
              <input 
                type="text"
                name="brand"
                placeholder="e.g. Bosch / DeWalt"
                value={formData.brand}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Row 3: Model & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Model</label>
              <input 
                type="text"
                name="model"
                placeholder="e.g. GSB-18RE"
                value={formData.model}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Purchase Date *</label>
              <input 
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`w-full bg-slate-50 border ${errors.purchaseDate ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
              />
              {errors.purchaseDate && <p className="text-[10px] font-bold text-red-500">{errors.purchaseDate}</p>}
            </div>
          </div>

          {/* Row 4: Cost & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Purchase Cost (USD) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input 
                  type="number"
                  name="purchaseCost"
                  step="0.01"
                  placeholder="249.99"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border ${errors.purchaseCost ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all`}
                />
              </div>
              {errors.purchaseCost && <p className="text-[10px] font-bold text-red-500">{errors.purchaseCost}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Initial Fleet Quantity *</label>
              <input 
                type="number"
                name="quantity"
                min="1"
                placeholder="1"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full bg-slate-50 border ${errors.quantity ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
              />
              {errors.quantity && <p className="text-[10px] font-bold text-red-500">{errors.quantity}</p>}
            </div>
          </div>

          {/* Row 5: Vendor & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Vendor</label>
              <input 
                type="text"
                name="vendor"
                placeholder="e.g. General Wholesale Tools"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Storage / Bin Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input 
                  type="text"
                  name="location"
                  placeholder="e.g. Warehouse A - Rack 3"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Condition & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Asset Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Initial Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="Available">Available</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Notes Area */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Asset Log / Description / Notes</label>
            <textarea
              name="notes"
              rows="3"
              placeholder="Operational constraints, calibration history, etc..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-5 flex items-center justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={role !== 'Admin'}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 shadow-md shadow-blue-500/20"
          >
            Confirm Registration
          </Button>
        </div>
      </form>
    </div>
  );
}

// Inline fallback icon for validation notification if missing
function AlertTriangle(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
