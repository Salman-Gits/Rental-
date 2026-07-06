import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  Info,
  MapPin,
  Calendar,
  Lock,
  X,
  FileEdit,
  DollarSign,
  AlertTriangle,
  History,
  Tag
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export default function InventoryPage() {
  const { assets, updateAsset, deleteAsset, role, globalSearch, setGlobalSearch } = useApp();
  const navigate = useNavigate();

  // State Management
  const [localSearch, setLocalSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('id-asc'); // id-asc, id-desc, name-asc, name-desc, qty-desc
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected asset for modals
  const [viewAsset, setViewAsset] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState(null);

  // Search logic: uses global search (navbar) OR local search
  const activeSearch = globalSearch || localSearch;

  // Unique categories, conditions, and statuses for filter dropdowns
  const categories = ['All', ...new Set(assets.map(a => a.category))];
  const conditions = ['All', 'Excellent', 'Good', 'Fair', 'Needs Repair'];
  const statuses = ['All', 'Available', 'Issued', 'Under Maintenance', 'Lost'];

  // 1. Filtering Logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.id.toString().includes(activeSearch) ||
      asset.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      asset.barcode.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (asset.model && asset.model.toLowerCase().includes(activeSearch.toLowerCase())) ||
      (asset.brand && asset.brand.toLowerCase().includes(activeSearch.toLowerCase())) ||
      (asset.location && asset.location.toLowerCase().includes(activeSearch.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || asset.category === filterCategory;
    const matchesCondition = filterCondition === 'All' || asset.condition === filterCondition;
    const matchesStatus = filterStatus === 'All' || asset.status === filterStatus;

    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });

  // 2. Sorting Logic (ensures Asset IDs can be ordered ascending/descending)
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const [field, order] = sortBy.split('-');
    const isAsc = order === 'asc';

    if (field === 'id') {
      return isAsc ? a.id - b.id : b.id - a.id;
    }
    if (field === 'name') {
      return isAsc 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    if (field === 'qty') {
      return isAsc ? a.quantity - b.quantity : b.quantity - a.quantity;
    }
    if (field === 'date') {
      return isAsc 
        ? new Date(a.purchaseDate) - new Date(b.purchaseDate)
        : new Date(b.purchaseDate) - new Date(a.purchaseDate);
    }
    return 0;
  });

  // 3. Pagination Logic
  const totalItems = sortedAssets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = sortedAssets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page when filters change
  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  // 4. Save Edit Action
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editAsset.name.trim()) {
      toast.error("Asset name cannot be empty");
      return;
    }
    updateAsset(editAsset.id, editAsset);
    setEditAsset(null);
  };

  // 5. Confirm Delete Action
  const handleDeleteConfirm = () => {
    if (confirmDeleteAsset) {
      deleteAsset(confirmDeleteAsset.id);
      setConfirmDeleteAsset(null);
      // Adjust current page if empty
      if (paginatedAssets.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  return (
    <div className="space-y-6 px-2 animate-fade-in">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Fleet Directory</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Comprehensive inventory and lifecycle telemetry of tools</p>
        </div>

        <Button
          onClick={() => navigate('/register')}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider py-5 px-5 self-start sm:self-auto shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Local search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 inset-y-0 text-[10px] text-blue-600 font-black uppercase hover:underline"
              >
                Clear Global
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-2 md:col-span-3">
            <div className="space-y-1">
              <select
                value={filterCategory}
                onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="" disabled>Category</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <select
                value={filterCondition}
                onChange={(e) => handleFilterChange(setFilterCondition, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="" disabled>Condition</option>
                {conditions.map((c, idx) => (
                  <option key={idx} value={c}>{c === 'All' ? 'All Conditions' : c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="" disabled>Status</option>
                {statuses.map((s, idx) => (
                  <option key={idx} value={s}>{s === 'All' ? 'All Statuses' : s === 'Under Maintenance' ? 'Maintenance' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sorting row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-50 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Showing <span className="text-slate-800">{sortedAssets.length}</span> results</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="id-asc">Asset ID (Lowest)</option>
              <option value="id-desc">Asset ID (Highest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="qty-desc">Quantity (Highest)</option>
              <option value="date-desc">Purchase Date (Newest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden">
        {sortedAssets.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400">
            <Wrench className="h-12 w-12 text-slate-300 mb-3 opacity-40 animate-bounce" />
            <p className="font-extrabold text-sm uppercase tracking-widest text-slate-700">No Asset Records Match</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Try modifying your filtering criteria or clearing the search text.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="py-4 px-5">Asset ID</th>
                  <th className="py-4 px-4">Barcode</th>
                  <th className="py-4 px-4">Tool Name</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Brand/Model</th>
                  <th className="py-4 px-4">Purchase Date</th>
                  <th className="py-4 px-4 text-center">Qty</th>
                  <th className="py-4 px-4 text-center">Available</th>
                  <th className="py-4 px-4">Condition</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {paginatedAssets.map((asset) => {
                  const isAvailable = asset.status === 'Available';
                  const isMaintenance = asset.status === 'Under Maintenance';
                  const isLost = asset.status === 'Lost';
                  const isIssued = asset.status === 'Issued';

                  // Styles for condition and status badges
                  let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (isMaintenance) statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                  if (isLost) statusColor = "bg-red-50 text-red-700 border-red-100";
                  if (isIssued) statusColor = "bg-blue-50 text-blue-700 border-blue-100";

                  let condColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                  if (asset.condition === 'Fair') condColor = "text-amber-600 bg-amber-50 border-amber-100";
                  if (asset.condition === 'Needs Repair') condColor = "text-red-600 bg-red-50 border-red-100";

                  return (
                    <tr 
                      key={asset.id}
                      className="hover:bg-slate-50/50 transition-colors duration-200"
                    >
                      {/* Asset ID (Ordered Proper Numerically) */}
                      <td className="py-4 px-5 text-slate-900 font-extrabold">{asset.id}</td>
                      
                      {/* Barcode */}
                      <td className="py-4 px-4">
                        <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded font-black text-[10px] border border-slate-200">
                          {asset.barcode}
                        </code>
                      </td>

                      {/* Tool Name */}
                      <td className="py-4 px-4 font-extrabold text-slate-800 max-w-[200px] truncate" title={asset.name}>
                        {asset.name}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="text-[10px] text-slate-500 uppercase tracking-tight">{asset.category}</span>
                      </td>

                      {/* Brand/Model */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-700 leading-none mb-1">{asset.brand}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{asset.model || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Purchase Date */}
                      <td className="py-4 px-4 font-semibold text-slate-400">{asset.purchaseDate}</td>

                      {/* Total Qty */}
                      <td className="py-4 px-4 text-center font-extrabold text-slate-800">{asset.quantity}</td>

                      {/* Available Qty */}
                      <td className="py-4 px-4 text-center">
                        <span className={`font-black ${asset.availableQuantity === 0 ? 'text-red-500' : 'text-blue-600'}`}>
                          {asset.availableQuantity}
                        </span>
                      </td>

                      {/* Condition */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-[10px] border font-bold ${condColor}`}>
                          {asset.condition}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-[10px] border font-black uppercase tracking-wider ${statusColor}`}>
                          {isMaintenance ? 'Service' : asset.status}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 font-semibold text-slate-500 truncate max-w-[120px]">{asset.location || 'Depot'}</td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewAsset(asset)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-100"
                            title="View Asset Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {role === 'Admin' ? (
                            <>
                              <button
                                onClick={() => setEditAsset(asset)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded-lg transition-colors border border-blue-100"
                                title="Edit Asset Specification"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteAsset(asset)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-colors border border-red-100"
                                title="Delete Asset"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="p-1.5 text-slate-300 rounded-lg border border-transparent" title="Admin access required to modify">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <div>
              Showing <span className="text-slate-700">{startIndex + 1}</span> to <span className="text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-slate-700">{totalItems}</span> assets
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-7 h-7 rounded-lg border text-xs font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS & POPUPS ================= */}

      {/* 1. VIEW ASSET DETAILS MODAL */}
      <Dialog open={!!viewAsset} onOpenChange={() => setViewAsset(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Asset Specs Sheet</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Asset ID: {viewAsset?.id}</p>
              </div>
            </div>
            <button onClick={() => setViewAsset(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {viewAsset && (
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{viewAsset.category}</span>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-1">{viewAsset.name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Barcode Value</span>
                  <p className="font-black text-slate-800 tracking-tight text-sm select-all">{viewAsset.barcode}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Brand & Model</span>
                  <p className="text-slate-800">{viewAsset.brand} - {viewAsset.model || 'Standard'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Procurement Cost</span>
                  <p className="text-slate-800 flex items-center gap-0.5 font-black"><DollarSign className="h-3.5 w-3.5 text-slate-400" />{viewAsset.purchaseCost}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Procurement Date</span>
                  <p className="text-slate-800 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{viewAsset.purchaseDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Bin Location</span>
                  <p className="text-slate-800 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{viewAsset.location || 'Depot'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Supplier/Vendor</span>
                  <p className="text-slate-800">{viewAsset.vendor || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Quantity Telemetry</span>
                <div className="flex gap-6 text-xs font-black uppercase">
                  <div>FLEET SIZE: <span className="text-slate-800 font-extrabold">{viewAsset.quantity}</span></div>
                  <div>AVAILABLE IN-HOUSE: <span className="text-blue-600 font-extrabold">{viewAsset.availableQuantity}</span></div>
                  <div>ACTIVE LEASE: <span className="text-amber-600 font-extrabold">{viewAsset.quantity - viewAsset.availableQuantity}</span></div>
                </div>
              </div>

              {viewAsset.notes && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Calibration & Operational Notes</span>
                  <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">{viewAsset.notes}</p>
                </div>
              )}

              {/* Action Modal footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100 gap-3">
                <Button 
                  onClick={() => setViewAsset(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-4 w-full"
                >
                  Close Specification Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. EDIT ASSET SPECIFICATION MODAL (ADMIN ONLY) */}
      <Dialog open={!!editAsset} onOpenChange={() => setEditAsset(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white">
                <FileEdit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Edit Asset Specs</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Updating Asset Record: #{editAsset?.id}</p>
              </div>
            </div>
            <button onClick={() => setEditAsset(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {editAsset && (
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Asset Name</label>
                <input
                  type="text"
                  value={editAsset.name}
                  onChange={(e) => setEditAsset({ ...editAsset, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</label>
                  <select
                    value={editAsset.category}
                    onChange={(e) => setEditAsset({ ...editAsset, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Power Tools">Power Tools</option>
                    <option value="Hand Tools">Hand Tools</option>
                    <option value="Testing Equipment">Testing Equipment</option>
                    <option value="Pneumatic Tools">Pneumatic Tools</option>
                    <option value="Safety Gear">Safety Gear</option>
                    <option value="Generators">Generators</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bin Location</label>
                  <input
                    type="text"
                    value={editAsset.location}
                    onChange={(e) => setEditAsset({ ...editAsset, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Brand</label>
                  <input
                    type="text"
                    value={editAsset.brand}
                    onChange={(e) => setEditAsset({ ...editAsset, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Model</label>
                  <input
                    type="text"
                    value={editAsset.model}
                    onChange={(e) => setEditAsset({ ...editAsset, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Purchase Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAsset.purchaseCost}
                    onChange={(e) => setEditAsset({ ...editAsset, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fleet Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editAsset.quantity}
                    onChange={(e) => setEditAsset({ ...editAsset, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Condition</label>
                  <select
                    value={editAsset.condition}
                    onChange={(e) => setEditAsset({ ...editAsset, condition: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</label>
                  <select
                    value={editAsset.status}
                    onChange={(e) => setEditAsset({ ...editAsset, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Calibration & Repair Notes</label>
                <textarea
                  value={editAsset.notes}
                  rows="2"
                  onChange={(e) => setEditAsset({ ...editAsset, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditAsset(null)}
                  className="rounded-xl border-slate-200 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-5"
                >
                  Save Specification Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. CONFIRM DELETE DIALOG (ADMIN ONLY) */}
      <Dialog open={!!confirmDeleteAsset} onOpenChange={() => setConfirmDeleteAsset(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-6 bg-slate-900 text-white space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">Remove Asset Permanently?</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">This operation is irreversible</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-300 font-bold">You are about to remove this asset from the database:</p>
            <p className="text-sm font-black text-white uppercase">{confirmDeleteAsset?.name}</p>
            <p className="text-[10px] text-red-400 font-bold tracking-wider">BARCODE: {confirmDeleteAsset?.barcode}</p>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">Removing this asset will discard all corresponding fleet count histories and calibration telemetry.</p>

          <div className="flex gap-3 justify-end pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDeleteAsset(null)}
              className="w-full rounded-xl border-slate-800 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteConfirm}
              className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-5"
            >
              Confirm Deletion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
