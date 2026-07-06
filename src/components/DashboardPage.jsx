import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wrench, 
  CheckCircle, 
  ArrowUpRight, 
  AlertTriangle, 
  Wrench as MaintenanceIcon, 
  FileText, 
  Clock, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  User, 
  MapPin, 
  Calendar,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

export default function DashboardPage() {
  const { assets, logs } = useApp();

  // Metrics calculation
  const totalToolsCount = assets.reduce((sum, a) => sum + a.quantity, 0);
  const availableToolsCount = assets.reduce((sum, a) => sum + a.availableQuantity, 0);
  const issuedToolsCount = assets.reduce((sum, a) => sum + (a.quantity - a.availableQuantity), 0);
  
  const overdueCount = logs.filter(log => {
    if (log.status !== "Active") return false;
    const checkoutDateObj = new Date(log.checkoutDate);
    const diffDays = Math.ceil((new Date() - checkoutDateObj) / (1000 * 60 * 60 * 24));
    return diffDays > 5; // Simulating overdue as checked out for > 5 days
  }).length;

  const maintenanceCount = assets
    .filter(a => a.status === 'Under Maintenance')
    .reduce((sum, a) => sum + a.quantity, 0);

  const lostCount = assets
    .filter(a => a.status === 'Lost')
    .reduce((sum, a) => sum + a.quantity, 0);

  const recentCheckouts = logs.filter(l => l.status === "Active");
  const recentCheckins = logs.filter(l => l.status === "Completed");

  // Recharts: Asset Status Distribution Data
  const statusData = [
    { name: 'Available', value: availableToolsCount, color: '#10b981' },
    { name: 'Issued', value: issuedToolsCount, color: '#3b82f6' },
    { name: 'In Maintenance', value: maintenanceCount, color: '#f59e0b' },
    { name: 'Lost/Missing', value: lostCount, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Recharts: Monthly Check-In / Check-Out trends Data
  const monthlyData = [
    { name: 'Jan', CheckOuts: 18, CheckIns: 12 },
    { name: 'Feb', CheckOuts: 24, CheckIns: 19 },
    { name: 'Mar', CheckOuts: 32, CheckIns: 28 },
    { name: 'Apr', CheckOuts: 28, CheckIns: 30 },
    { name: 'May', CheckOuts: 45, CheckIns: 38 },
    { name: 'Jun', CheckOuts: 52, CheckIns: 41 },
    { name: 'Jul', CheckOuts: logs.length + 10, CheckIns: logs.filter(l => l.status === 'Completed').length + 8 },
  ];

  const cards = [
    {
      title: "Total Registered Tools",
      value: totalToolsCount,
      subtitle: "Full fleet inventory",
      icon: Wrench,
      color: "blue",
      themeClass: "from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100",
      indicatorClass: "bg-blue-600"
    },
    {
      title: "Available Tools",
      value: availableToolsCount,
      subtitle: "Ready in stock for issue",
      icon: CheckCircle,
      color: "emerald",
      themeClass: "from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100",
      indicatorClass: "bg-emerald-600"
    },
    {
      title: "Issued Tools",
      value: issuedToolsCount,
      subtitle: "Deplayed at client sites",
      icon: ArrowUpRight,
      color: "indigo",
      themeClass: "from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-100",
      indicatorClass: "bg-indigo-600"
    },
    {
      title: "Overdue Returns",
      value: overdueCount,
      subtitle: "Exceeded standard limits",
      icon: Clock,
      color: "amber",
      themeClass: "from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-100",
      indicatorClass: "bg-amber-600"
    },
    {
      title: "Under Maintenance",
      value: maintenanceCount,
      subtitle: "In service or repair bay",
      icon: MaintenanceIcon,
      color: "orange",
      themeClass: "from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-100",
      indicatorClass: "bg-orange-600"
    },
    {
      title: "Lost / Missing",
      value: lostCount,
      subtitle: "Flagged or reported lost",
      icon: HelpCircle,
      color: "red",
      themeClass: "from-red-500/10 to-red-600/5 text-red-600 border-red-100",
      indicatorClass: "bg-red-600"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in px-2">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Operations Console
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
            Asset Dispatch & Analytics
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl">
            Real-time visual monitoring of high-end electronics, power tools, and industrial instrumentation fleet.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={idx}
              className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.themeClass} border`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-4">
                <div className={`w-2 h-2 rounded-full ${card.indicatorClass}`} />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Activity Trends</h3>
              <p className="text-xs text-slate-400 font-semibold">Monthly check-in and check-out distribution</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" /> Check-Outs
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Check-Ins
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="CheckOuts" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="CheckIns" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fleet Composition</h3>
            <p className="text-xs text-slate-400 font-semibold mb-4">Proportion of current asset states</p>
          </div>
          <div className="h-52 w-full relative flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-slate-300 text-xs font-bold">No asset state data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-700">{totalToolsCount}</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Total units</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-600">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Dispatch Timeline / Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Checkouts */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Active Deployments ({recentCheckouts.length})
            </h3>
          </div>
          {recentCheckouts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active tools deployed currently.</p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {recentCheckouts.slice(0, 5).map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-black text-slate-800 leading-none">{log.assetName}</h4>
                      <span className="text-[9px] font-bold text-slate-400">{log.checkoutDate}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> {log.employee} ({log.client})</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> {log.projectSite}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Returns */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Recent Returns ({recentCheckins.length})
            </h3>
          </div>
          {recentCheckins.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No assets returned yet.</p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {recentCheckins.slice(0, 5).map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/50">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-black text-slate-800 leading-none">{log.assetName}</h4>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded font-black">{log.daysUsed} DAYS</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> Returned by {log.returnedBy}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> Check-in: {log.checkinDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
