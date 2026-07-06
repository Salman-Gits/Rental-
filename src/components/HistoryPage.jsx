import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Building, 
  Layers, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Button } from './ui/button';

export default function HistoryPage() {
  const { logs, assets, role } = useApp();

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAsset, setFilterAsset] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (role !== 'Admin') {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-12 text-center max-w-lg mx-auto my-12 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <History className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Admin Access Required</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Security Clearance Level Unauthorized</p>
        <p className="text-xs text-slate-400 font-semibold mt-4 leading-relaxed">
          The operations logs ledger contains sensitive deployment data and transaction records. 
          Please authenticate as an Administrator to view and download reports.
        </p>
      </div>
    );
  }

  // Derive unique dropdown filter options from logs
  const assetsInLogs = ['All', ...new Set(logs.map(l => l.assetName))];
  const clientsInLogs = ['All', ...new Set(logs.map(l => l.client))];
  const employeesInLogs = ['All', ...new Set(logs.map(l => l.employee).filter(Boolean))];

  // Filtering Logic
  const filteredLogs = logs.filter(log => {
    // Search query matches Log ID, Barcode, Asset Name, Client, Employee, Site, Handled By
    const matchesSearch = 
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.employee && log.employee.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.projectSite && log.projectSite.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.handledBy.toLowerCase().includes(searchQuery.toLowerCase());

    // Date matching (Checks if logs' checkout or checkin date starts with selected date)
    const matchesDate = !filterDate || 
      log.checkoutDate.includes(filterDate) || 
      (log.checkinDate && log.checkinDate.includes(filterDate));

    const matchesAsset = filterAsset === 'All' || log.assetName === filterAsset;
    const matchesClient = filterClient === 'All' || log.client === filterClient;
    const matchesEmployee = filterEmployee === 'All' || log.employee === filterEmployee;

    return matchesSearch && matchesDate && matchesAsset && matchesClient && matchesEmployee;
  });

  // Sorting Logic
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.checkoutDate);
    const dateB = new Date(b.checkoutDate);
    return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
  });

  // Pagination calculations
  const totalItems = sortedLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterAsset('All');
    setFilterClient('All');
    setFilterEmployee('All');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  // 1. CSV Report Export
  const handleExportCSV = () => {
    const headers = [
      'Voucher ID',
      'Barcode',
      'Asset Name',
      'Action Type',
      'Client / Contractor',
      'Employee Recipient',
      'Project Site',
      'Deployment Date',
      'Days Used',
      'Return Condition',
      'Issued By',
      'Received By',
      'Status'
    ];

    const rows = sortedLogs.map(log => [
      log.id,
      log.barcode,
      log.assetName,
      log.status === 'Active' ? 'Dispatch' : 'Check-In',
      log.client,
      log.employee || 'N/A',
      log.projectSite || 'Central Depot',
      log.checkoutDate,
      log.daysUsed !== null ? log.daysUsed : '-',
      log.returnedCondition || 'Active Deployment',
      log.handledBy || 'N/A',
      log.receivedBy || 'N/A',
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `electrorent_operations_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Excel Report Export (HTML layout trick for beautiful styles)
  const handleExportExcel = () => {
    let tableRows = sortedLogs.map(log => `
      <tr>
        <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace; font-size:11px;">${log.id}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.barcode}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; font-size:11px;">${log.assetName}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.status === 'Active' ? 'Dispatch' : 'Check-In'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.client}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.employee || 'N/A'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.projectSite || 'N/A'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.checkoutDate}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-size:11px;">${log.daysUsed !== null ? log.daysUsed : '-'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.returnedCondition || 'Active'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-size:11px;">${log.handledBy || 'N/A'}</td>
        <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; font-size:11px;">${log.status}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th { background-color: #0f172a; color: #ffffff; padding: 10px; text-align: left; font-size: 12px; }
          td { font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>ElectroRent Operations Audit Ledger - ${new Date().toLocaleDateString()}</h2>
        <p>Total Records: <strong>${sortedLogs.length}</strong> | Filter Profile: Asset: ${filterAsset} | Client: ${filterClient}</p>
        <table>
          <thead>
            <tr>
              <th>Voucher ID</th>
              <th>Barcode</th>
              <th>Asset Item</th>
              <th>Action</th>
              <th>Client / Contractor</th>
              <th>Employee Recipient</th>
              <th>Project Site</th>
              <th>Deployment Date</th>
              <th>Days Used</th>
              <th>Return Condition</th>
              <th>Issued By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `electrorent_operations_ledger_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. PDF Document Export (Browser-Print iframe approach)
  const handleExportPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    let tableRows = sortedLogs.map(log => `
      <tr>
        <td style="font-family: monospace; font-size: 9px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.id}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.barcode}</td>
        <td style="font-size: 9px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.assetName}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.status === 'Active' ? 'Dispatch' : 'Check-In'}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.client}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.employee || 'N/A'}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.projectSite || 'N/A'}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.checkoutDate}</td>
        <td style="font-size: 9px; text-align: center; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.daysUsed !== null ? log.daysUsed : '-'}</td>
        <td style="font-size: 9px; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.returnedCondition || 'Active'}</td>
        <td style="font-size: 9px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding: 6px 4px;">${log.status}</td>
      </tr>
    `).join('');

    doc.write(`
      <html>
      <head>
        <title>ElectroRent Operations Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 20px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-weight: 900; font-size: 18px; letter-spacing: 1px; color: #0f172a; }
          .title { text-transform: uppercase; font-size: 14px; font-weight: 800; color: #475569; }
          .meta { font-size: 11px; margin-bottom: 20px; color: #64748b; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 10px; }
          th { background-color: #0f172a; color: white; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 8px 4px; border: 1px solid #0f172a; }
          td { font-size: 9px; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9px; text-align: center; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ELECTRORENT OPERATIONS</div>
          <div class="title">Audit Ledger Report</div>
        </div>
        <div class="meta">
          <div>Report Date: <strong>${new Date().toLocaleDateString()}</strong></div>
          <div>Total Listed Entries: <strong>${sortedLogs.length}</strong></div>
          <div>Filter Profile: <strong>Asset: ${filterAsset} | Client: ${filterClient} | Employee: ${filterEmployee}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Voucher ID</th>
              <th>Barcode</th>
              <th>Asset Item</th>
              <th>Action</th>
              <th>Client</th>
              <th>Employee</th>
              <th>Project Site</th>
              <th>Date</th>
              <th>Days</th>
              <th>Condition</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          ElectroRent Rental Asset Management Systems &copy; ${new Date().getFullYear()} - Official Administration Document
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.frameElement.remove();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="space-y-6 px-2 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Operations Audit Logs</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Detailed lifecycle history and deployment trails</p>
        </div>

        {/* Exports Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleExportPDF}
            variant="outline" 
            size="sm"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-300"
            title="Download formatted PDF report"
          >
            <Download className="h-3.5 w-3.5 text-red-500" />
            PDF
          </Button>
          <Button 
            onClick={handleExportExcel}
            variant="outline" 
            size="sm"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-300"
            title="Download formatted Excel ledger"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Excel
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            size="sm"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-300"
            title="Download raw CSV dataset"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            CSV
          </Button>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* General Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Asset Select */}
          <div className="space-y-1">
            <select
              value={filterAsset}
              onChange={(e) => { setFilterAsset(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Assets</option>
              {assetsInLogs.filter(a => a !== 'All').map((asset, idx) => (
                <option key={idx} value={asset}>{asset}</option>
              ))}
            </select>
          </div>

          {/* Client Select */}
          <div className="space-y-1">
            <select
              value={filterClient}
              onChange={(e) => { setFilterClient(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Clients</option>
              {clientsInLogs.filter(c => c !== 'All').map((client, idx) => (
                <option key={idx} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Employee Select */}
          <div className="space-y-1">
            <select
              value={filterEmployee}
              onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Employees</option>
              {employeesInLogs.filter(e => e !== 'All').map((employee, idx) => (
                <option key={idx} value={employee}>{employee}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-50 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-3">
            <span>Filtered logs: <span className="text-slate-800">{sortedLogs.length}</span></span>
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Reset Filters
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort Timeline:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden">
        {sortedLogs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400">
            <History className="h-12 w-12 text-slate-300 mb-3 opacity-40 animate-spin" />
            <p className="font-extrabold text-sm uppercase tracking-widest text-slate-700">No Operations Logs Found</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Try expanding your filter parameters or selecting a different date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="py-4 px-5">Voucher ID</th>
                  <th className="py-4 px-4">Barcode</th>
                  <th className="py-4 px-4">Asset Item</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-4">Client / Contractor</th>
                  <th className="py-4 px-4">Employee Recipient</th>
                  <th className="py-4 px-4">Destination Project Site</th>
                  <th className="py-4 px-4">Deployment Date</th>
                  <th className="py-4 px-4 text-center">Days Used</th>
                  <th className="py-4 px-4">Return Condition</th>
                  <th className="py-4 px-4">Issued By</th>
                  <th className="py-4 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {paginatedLogs.map((log) => {
                  const isActive = log.status === 'Active';
                  return (
                    <tr 
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors duration-200"
                    >
                      {/* Log ID */}
                      <td className="py-4 px-5 font-extrabold text-slate-900 select-all font-mono text-[10px]">{log.id}</td>

                      {/* Barcode */}
                      <td className="py-4 px-4">
                        <code className="bg-slate-50 text-blue-600 px-1.5 py-0.5 rounded font-black text-[10px] border border-slate-100">
                          {log.barcode}
                        </code>
                      </td>

                      {/* Tool Name */}
                      <td className="py-4 px-4 font-extrabold text-slate-800 max-w-[180px] truncate" title={log.assetName}>
                        {log.assetName}
                      </td>

                      {/* Action Type */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isActive ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {isActive ? 'Dispatch' : 'Check-In'}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-4 font-semibold text-slate-800">{log.client}</td>

                      {/* Employee */}
                      <td className="py-4 px-4 font-semibold text-slate-500">{log.employee || 'N/A'}</td>

                      {/* Project Site */}
                      <td className="py-4 px-4 font-semibold text-slate-400 truncate max-w-[140px]" title={log.projectSite}>{log.projectSite || 'Central Store'}</td>

                      {/* Checkout Date */}
                      <td className="py-4 px-4 font-semibold text-slate-400">{log.checkoutDate}</td>

                      {/* Duration */}
                      <td className="py-4 px-4 text-center font-extrabold text-slate-700">
                        {log.daysUsed !== null ? `${log.daysUsed} d` : <span className="text-slate-300">-</span>}
                      </td>

                      {/* Return Condition */}
                      <td className="py-4 px-4">
                        {log.returnedCondition ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${log.returnedCondition === 'Needs Repair' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {log.returnedCondition}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium italic">Active Deployment</span>
                        )}
                      </td>

                      {/* Handled By */}
                      <td className="py-4 px-4 font-medium text-slate-500">{log.handledBy}</td>

                      {/* Status */}
                      <td className="py-4 px-5 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <div>
              Showing <span className="text-slate-700">{startIndex + 1}</span> to <span className="text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-slate-700">{totalItems}</span> logs
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
    </div>
  );
}
