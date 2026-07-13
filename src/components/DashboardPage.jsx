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
  HelpCircle,
  Bell,
  Mail,
  Smartphone,
  Send,
  RefreshCw,
  Check,
  ShieldAlert
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
  const { assets, logs, role, users, addUser, updateUser, deleteUser, currentUser, triggerNotification } = useApp();

  const [scanning, setScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState([]);
  const [hasScanned, setHasScanned] = React.useState(false);

  const [profileEmail, setProfileEmail] = React.useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = React.useState(currentUser?.phone || '');
  const [updatingProfile, setUpdatingProfile] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdatingProfile(true);
    await updateUser(currentUser.username, {
      email: profileEmail,
      phone: profilePhone
    });
    setUpdatingProfile(false);
  };

  const calculateAlertStatus = (log) => {
    if (!log.expectedReturnDate) {
      // Treat as standard 7-day lease if expectedReturnDate is blank
      const checkout = new Date(log.checkoutDate);
      const today = new Date();
      checkout.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const returnDate = new Date(checkout);
      returnDate.setDate(checkout.getDate() + 7);
      
      const diffTime = returnDate - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (remainingDays < 0) {
        return { status: 'Overdue', days: Math.abs(remainingDays) };
      } else if (remainingDays <= 2) {
        return { status: 'Nearing Completion', days: remainingDays };
      }
      return { status: 'Normal', days: remainingDays };
    }

    const expected = new Date(log.expectedReturnDate);
    const today = new Date();
    expected.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = expected - today;
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (remainingDays < 0) {
      return { status: 'Overdue', days: Math.abs(remainingDays) };
    } else if (remainingDays <= 3) {
      return { status: 'Nearing Completion', days: remainingDays };
    }
    return { status: 'Normal', days: remainingDays };
  };

  const runAlertsScan = () => {
    setScanning(true);
    setHasScanned(true);
    setTimeout(() => {
      const activeLeases = logs.filter(l => l.status === "Active");
      const analyzed = activeLeases.map(log => {
        const info = calculateAlertStatus(log);
        return {
          ...log,
          alertStatus: info.status,
          remainingDays: info.days
        };
      }).filter(l => l.alertStatus === 'Overdue' || l.alertStatus === 'Nearing Completion');
      
      setScanResult(analyzed);
      setScanning(false);
    }, 1000);
  };

  const handleSendAlert = (log, channel, overrideStatus = null) => {
    const info = calculateAlertStatus(log);
    const alertType = overrideStatus || info.status;
    const recipient = channel === 'SMS' 
      ? (log.contactPhone || '+1 (555) 928-1029') 
      : (log.contactEmail || `${log.employee?.toLowerCase().replace(/\s+/g, '') || 'operator'}@electrorent-partner.com`);

    const title = channel === 'SMS' 
      ? `🚨 ELECTRORENT DISPATCH ALERT` 
      : `🚨 ElectroRent Rental Expiring Notification`;

    const body = channel === 'SMS'
      ? `RENTAL STATUS ALERT: Your checkout of ${log.quantity}x ${log.assetName} (${log.barcode}) is ${alertType.toUpperCase()}. Please return it to avoid service delays.`
      : `Dear ${log.employee || 'Operator'},\n\nThis is an automated notification regarding your current equipment rental:\n\n• Asset Item: ${log.assetName}\n• Barcode ID: ${log.barcode}\n• Quantity Deployed: ${log.quantity}x\n• Client / Contractor: ${log.client}\n• Deployment Location: ${log.projectSite || 'Central Depot'}\n\nStatus Alert: ${alertType === 'Overdue' ? '🚨 OVERDUE' : '⚠️ NEARING COMPLETION'}\nExpected return: ${log.expectedReturnDate || '7-day standard cycle'}.\n\nPlease arrange return with the dispatch terminal to clear this voucher.\n\nThank you,\nElectroRent Operations Management`;

    triggerNotification({
      type: 'alert',
      recipient,
      title,
      body,
      channel
    });
  };

  const handleBulkNotify = () => {
    if (scanResult.length === 0) return;
    
    // Notify first one in simulated UI, then toast-notify the rest
    const first = scanResult[0];
    handleSendAlert(first, 'Email');
    
    // Toast others
    import('sonner').then(({ toast }) => {
      toast.success(`Successfully processed ${scanResult.length} automated alerts!`);
      scanResult.slice(1).forEach(log => {
        const channel = log.contactEmail ? 'Email' : 'SMS';
        const recipient = channel === 'Email' ? log.contactEmail : log.contactPhone;
        toast.info(`Dispatched alert to ${log.employee || 'Operator'} (${recipient || 'Default Contact'})`);
      });
    });
  };

  const [newUserName, setNewUserName] = React.useState('');
  const [newUserFullName, setNewUserFullName] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserPhone, setNewUserPhone] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState('User');
  const [isAddingUser, setIsAddingUser] = React.useState(false);

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!newUserFullName || !newUserName || !newUserPassword) {
      return;
    }
    const success = await addUser({
      username: newUserName,
      fullName: newUserFullName,
      password: newUserPassword,
      role: newUserRole,
      email: newUserEmail,
      phone: newUserPhone
    });
    if (success) {
      setNewUserName('');
      setNewUserFullName('');
      setNewUserPassword('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserRole('User');
      setIsAddingUser(false);
    }
  };

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

  const userLogs = role === 'Admin' 
    ? logs 
    : logs.filter(log => {
        const name = currentUser?.fullName?.toLowerCase();
        if (!name) return false;
        return (
          (log.employee && log.employee.toLowerCase() === name) ||
          (log.returnedBy && log.returnedBy.toLowerCase() === name) ||
          (log.issuedBy && log.issuedBy.toLowerCase() === name)
        );
      });

  const recentCheckouts = userLogs.filter(l => l.status === "Active");
  const recentCheckins = userLogs.filter(l => l.status === "Completed");

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
      {/* Top Banner & Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-center min-h-[220px]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block">
              Operations Console
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              {currentUser ? `Welcome back, ${currentUser.fullName}` : 'Asset Dispatch & Analytics'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl">
              {currentUser 
                ? `Logged in as ${currentUser.role}. Update your profile on the right with your phone number and email to receive real-time dispatch alerts and confirmation logs.` 
                : 'Real-time visual monitoring of high-end electronics, power tools, and industrial instrumentation fleet.'}
            </p>
          </div>
        </div>

        {/* My Notification & Contact Profile */}
        {currentUser && (
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-600" />
                My Dispatch Credentials
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                Used to dispatch real-time SMS and Email alerts during asset checkout/returns.
              </p>
            </div>

            <div className="space-y-3 flex-1 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">My Registered Email</label>
                <input 
                  type="email"
                  placeholder="No email registered yet"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">My Phone / SMS Number</label>
                <input 
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2831"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              {updatingProfile ? 'Saving Details...' : 'Save Contact Profile'}
            </button>
          </form>
        )}
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
              {recentCheckouts.slice(0, 5).map((log, idx) => {
                const info = calculateAlertStatus(log);
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      info.status === 'Overdue' ? 'bg-red-500 animate-pulse' :
                      info.status === 'Nearing Completion' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-slate-800 leading-none">{log.assetName}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {info.status === 'Overdue' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                              Overdue {info.days}d
                            </span>
                          )}
                          {info.status === 'Nearing Completion' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                              Expiring {info.days}d
                            </span>
                          )}
                          {info.status === 'Normal' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                              Active {info.days}d
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> {log.employee} ({log.client})</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> {log.projectSite}</span>
                        </div>
                        {role === 'Admin' && (
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-2xs">
                            <span className="text-[8px] text-slate-400 font-black uppercase mr-1">Alert:</span>
                            <button 
                              onClick={() => handleSendAlert(log, 'SMS')} 
                              className="p-1 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded transition-all cursor-pointer" 
                              title="Simulate SMS Alert"
                            >
                              <Smartphone className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => handleSendAlert(log, 'Email')} 
                              className="p-1 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded transition-all cursor-pointer" 
                              title="Simulate Email Alert"
                            >
                              <Mail className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Automated Rental Alerts & Notification Hub */}
      {role === 'Admin' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600 animate-bounce" />
              Automated Rental Alerts & Dispatch Notification Hub
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Identify nearing completion or overdue equipment leases and trigger automated client notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runAlertsScan}
              disabled={scanning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Active Leases'}
            </button>
            {scanResult.length > 0 && (
              <button
                onClick={handleBulkNotify}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Auto-Notify All ({scanResult.length})
              </button>
            )}
          </div>
        </div>

        {scanning ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Running System Registry Diagnostic...</p>
          </div>
        ) : hasScanned ? (
          scanResult.length === 0 ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center space-y-1.5 animate-fade-in">
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                Fleet Alert Registry Clean
              </p>
              <p className="text-xs text-slate-500 font-medium">
                No active leases are currently overdue or within their 3-day return buffer window. All operators are fully compliant.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl text-[11px] text-amber-800 font-bold flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-wider">Diagnostic Scan Completed</p>
                  <p className="text-slate-500 font-semibold mt-0.5">
                    Found <span className="text-amber-800 font-extrabold">{scanResult.length} critical rental records</span> requiring immediate operational dispatch alert. You can trigger SMS or Email reminders below.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-wider border-b border-slate-100 text-slate-400">
                      <th className="py-3 px-4">Lease Item</th>
                      <th className="py-3 px-4">Operator Contact</th>
                      <th className="py-3 px-4">Expected Return</th>
                      <th className="py-3 px-4">Severity / Buffer</th>
                      <th className="py-3 px-4 text-right">Dispatch Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {scanResult.map((log) => {
                      const isOverdue = log.alertStatus === 'Overdue';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-800 leading-none">{log.assetName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">Barcode: {log.barcode} &bull; {log.client}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-500">
                            <div>{log.employee}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              {log.contactEmail || `${log.employee?.toLowerCase().replace(/\s+/g, '') || 'operator'}@electrorent.corp`}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                            {log.expectedReturnDate || '7-day cycle'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              isOverdue ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {isOverdue ? `Overdue by ${log.remainingDays}d` : `Expiring in ${log.remainingDays}d`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSendAlert(log, 'SMS')}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Send SMS
                              </button>
                              <button
                                onClick={() => handleSendAlert(log, 'Email')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Send Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <Bell className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5] mb-2 animate-pulse" />
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Notification Sub-System Idle</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Click the button above to execute a real-time scan of current active tool leases.
            </p>
          </div>
        )}
      </div>
      )}

      {/* Admin Only: Staff & Operator Management */}
      {role === 'Admin' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Staff & Operator Credentials Management
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Register, authorize, and control credentials for platform operators
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 shrink-0 self-start sm:self-center cursor-pointer"
            >
              {isAddingUser ? "Hide Registration" : "+ Add Operator Account"}
            </button>
          </div>

          {/* Registration Form */}
          {isAddingUser && (
            <form onSubmit={handleRegisterUser} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Create New Operator
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Login Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alexr"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Login Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Assigned Access Level
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="User">User (Standard Operator)</option>
                    <option value="Admin">Admin (Full Console Access)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Contact Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. alex.rivera@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Contact Phone Number / SMS Target (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2831"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Create Identity Credentials
                </button>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-3.5 font-black uppercase tracking-widest text-slate-400 text-[10px]">Staff Operator</th>
                  <th className="p-3.5 font-black uppercase tracking-widest text-slate-400 text-[10px]">Username</th>
                  <th className="p-3.5 font-black uppercase tracking-widest text-slate-400 text-[10px]">Password</th>
                  <th className="p-3.5 font-black uppercase tracking-widest text-slate-400 text-[10px]">Access Level</th>
                  <th className="p-3.5 font-black uppercase tracking-widest text-slate-400 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users && users.map((u) => (
                  <tr key={u.id || u.username} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-3.5 font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px] shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-semibold flex flex-wrap gap-x-2">
                            {u.email && <span>📧 {u.email}</span>}
                            {u.phone && <span>📱 {u.phone}</span>}
                            {!u.email && !u.phone && <span className="italic font-normal">No contact info saved</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-500">{u.username}</td>
                    <td className="p-3.5 font-mono text-slate-400 tracking-wider">
                      {role === 'Admin' ? u.password : '••••••••'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                        u.role === 'Admin' 
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.id !== 'usr-001' && u.username !== 'admin' ? (
                        <button
                          type="button"
                          onClick={() => deleteUser(u.id || u.username)}
                          className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Revoke access and delete account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pr-2">
                          Protected System Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
