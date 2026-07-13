import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Initial Realistic Dummy Data (Start Fresh & Empty)
const initialAssets = [];
const initialLogs = [];

export const AppProvider = ({ children }) => {
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('electrorent_assets');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('electrorent_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('electrorent_role') || 'User';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('electrorent_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('electrorent_users');
    if (saved) return JSON.parse(saved);
    const defaults = [
      {
        id: "usr-001",
        username: "admin",
        fullName: "System Administrator",
        password: "admin",
        role: "Admin"
      }
    ];
    localStorage.setItem('electrorent_users', JSON.stringify(defaults));
    return defaults;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Global Search results state for navigation search
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch initial data from API with instant local fallback
  const fetchData = async () => {
    try {
      const [assetsRes, logsRes, usersRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/logs'),
        fetch('/api/users').catch(() => null)
      ]);
      if (assetsRes.ok && logsRes.ok) {
        const assetsData = await assetsRes.json();
        const logsData = await logsRes.json();
        const mappedAssets = assetsData.map(asset => ({
          ...asset,
          condition: asset.condition || asset.toolCondition
        }));
        setAssets(mappedAssets);
        setLogs(logsData);
        localStorage.setItem('electrorent_assets', JSON.stringify(mappedAssets));
        localStorage.setItem('electrorent_logs', JSON.stringify(logsData));
      } else {
        // Fallback to existing local storage, or initial dummy lists if empty
        if (assets.length === 0) {
          const savedAssets = localStorage.getItem('electrorent_assets');
          const savedLogs = localStorage.getItem('electrorent_logs');
          setAssets(savedAssets ? JSON.parse(savedAssets) : initialAssets);
          setLogs(savedLogs ? JSON.parse(savedLogs) : initialLogs);
        }
      }

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
          localStorage.setItem('electrorent_users', JSON.stringify(usersData));
        }
      }
    } catch (err) {
      console.warn("Failed to load assets/logs from backend API gateway, using local cache:", err);
      const savedAssets = localStorage.getItem('electrorent_assets');
      const savedLogs = localStorage.getItem('electrorent_logs');
      if (savedAssets) {
        setAssets(JSON.parse(savedAssets));
      } else {
        setAssets(initialAssets);
        localStorage.setItem('electrorent_assets', JSON.stringify(initialAssets));
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs(initialLogs);
        localStorage.setItem('electrorent_logs', JSON.stringify(initialLogs));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync state modifications to LocalStorage in addition to local states
  const syncAssetsToLocal = (newAssets) => {
    localStorage.setItem('electrorent_assets', JSON.stringify(newAssets));
  };

  const syncLogsToLocal = (newLogs) => {
    localStorage.setItem('electrorent_logs', JSON.stringify(newLogs));
  };

  // Client-Side Security/Auth Engine
  const loginUser = async (username, password) => {
    const matched = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
    if (matched) {
      setRole(matched.role);
      setCurrentUser(matched);
      localStorage.setItem('electrorent_current_user', JSON.stringify(matched));
      localStorage.setItem('electrorent_role', matched.role);
      return { success: true, user: matched };
    }
    return { success: false, message: "Invalid username or password credentials." };
  };

  // Admin: Register a new Operator/User
  const addUser = async (newUser) => {
    const exists = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase().trim());
    if (exists) {
      toast.error(`Username "${newUser.username}" is already taken!`);
      return false;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          role: newUser.role || "User",
          fullName: newUser.fullName || "Field Operator",
          email: newUser.email || "",
          phone: newUser.phone || ""
        })
      });

      if (response.ok) {
        const created = {
          ...newUser,
          id: `usr-${Date.now()}`
        };
        const nextUsers = [...users, created];
        setUsers(nextUsers);
        localStorage.setItem('electrorent_users', JSON.stringify(nextUsers));
        toast.success(`User "${newUser.fullName}" added successfully!`);
        return true;
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.message || "Failed to register operator on server.");
        return false;
      }
    } catch (err) {
      console.warn("Server registration failed, creating user locally.", err);
      const created = {
        ...newUser,
        id: `usr-${Date.now()}`
      };
      const nextUsers = [...users, created];
      setUsers(nextUsers);
      localStorage.setItem('electrorent_users', JSON.stringify(nextUsers));
      toast.success(`User "${newUser.fullName}" added locally (Vercel Offline Mode)!`);
      return true;
    }
  };

  // Update Operator / Personal Profile Details
  const updateUser = async (username, updatedFields) => {
    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedFields)
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers(prev => {
          const next = prev.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, ...updated } : u);
          localStorage.setItem('electrorent_users', JSON.stringify(next));
          return next;
        });
        
        // If updating the currently logged-in user, sync current user state too
        if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
          const nextCurrentUser = { ...currentUser, ...updated };
          setCurrentUser(nextCurrentUser);
          localStorage.setItem('electrorent_current_user', JSON.stringify(nextCurrentUser));
        }
        
        toast.success("Profile updated successfully!");
        return true;
      }
    } catch (err) {
      console.warn("Backend unavailable. Updating user profile locally.", err);
    }

    // Client-side fallback
    setUsers(prev => {
      const next = prev.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, ...updatedFields } : u);
      localStorage.setItem('electrorent_users', JSON.stringify(next));
      return next;
    });

    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      const nextCurrentUser = { ...currentUser, ...updatedFields };
      setCurrentUser(nextCurrentUser);
      localStorage.setItem('electrorent_current_user', JSON.stringify(nextCurrentUser));
    }

    toast.success("Profile updated locally (Vercel Offline Mode)!");
    return true;
  };

  // Admin: Delete user
  const deleteUser = async (userId) => {
    if (userId === 'usr-001') {
      toast.error("Cannot delete the master System Administrator!");
      return false;
    }

    const targetUser = users.find(u => u.id === userId || u.username === userId);
    if (!targetUser) return false;

    try {
      const response = await fetch(`/api/users/${targetUser.username}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const nextUsers = users.filter(u => u.id !== userId);
        setUsers(nextUsers);
        localStorage.setItem('electrorent_users', JSON.stringify(nextUsers));
        toast.success(`User account "${targetUser.fullName}" was deleted.`);
        return true;
      }
    } catch (err) {
      console.warn("Backend user deletion failed, deleting locally.", err);
    }

    // Client-side fallback
    const nextUsers = users.filter(u => u.id !== userId);
    setUsers(nextUsers);
    localStorage.setItem('electrorent_users', JSON.stringify(nextUsers));
    toast.success(`User account "${targetUser.fullName}" deleted locally.`);
    return true;
  };

  // Toggle user roles for frontend testing
  const toggleRole = () => {
    setRole(prev => {
      const next = prev === 'Admin' ? 'User' : 'Admin';
      localStorage.setItem('electrorent_role', next);
      toast.info(`Switched interface mode to: ${next.toUpperCase()}`);
      return next;
    });
  };

  const [activeNotification, setActiveNotification] = useState(null);

  const triggerNotification = ({ type, recipient, title, body, channel }) => {
    setActiveNotification({
      type,
      recipient,
      title,
      body,
      channel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: `NOTIF-${Date.now()}`
    });
  };

  const resetSystemData = async () => {
    // Clear localStorage
    localStorage.removeItem('electrorent_assets');
    localStorage.removeItem('electrorent_logs');
    localStorage.removeItem('electrorent_users');
    localStorage.removeItem('electrorent_current_user');
    localStorage.removeItem('electrorent_role');

    // Reset to initial dummy lists
    setAssets(initialAssets);
    setLogs(initialLogs);

    const defaults = [
      {
        id: "usr-001",
        username: "admin",
        fullName: "System Administrator",
        password: "admin",
        role: "Admin"
      }
    ];
    setUsers(defaults);
    setRole('Admin');
    setCurrentUser(defaults[0]);

    localStorage.setItem('electrorent_current_user', JSON.stringify(defaults[0]));
    localStorage.setItem('electrorent_role', 'Admin');
    localStorage.setItem('electrorent_users', JSON.stringify(defaults));
    localStorage.setItem('electrorent_assets', JSON.stringify(initialAssets));
    localStorage.setItem('electrorent_logs', JSON.stringify(initialLogs));

    // Also call backend reset if we can trigger /api/reset
    try {
      await fetch('/api/reset', { method: 'POST' }).catch(() => {});
    } catch (e) {
      console.warn("Backend reset endpoint returned error or unavailable, reset local database.");
    }

    toast.success("System Restored! All logs, assets, and operator accounts have been returned to factory defaults.");
  };

  // Add Asset (Admin Only)
  const addAsset = async (newAsset) => {
    const qty = parseInt(newAsset.quantity) || 1;
    const payload = {
      ...newAsset,
      id: newAsset.id || Date.now(),
      quantity: qty,
      availableQuantity: parseInt(newAsset.availableQuantity) || qty,
      purchaseCost: parseFloat(newAsset.purchaseCost) || 0.0,
      condition: newAsset.condition || newAsset.toolCondition || 'Excellent',
      status: newAsset.status || 'Available'
    };

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Operator-Role': role
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const savedAsset = await response.json();
        const mappedSaved = {
          ...savedAsset,
          condition: savedAsset.condition || savedAsset.toolCondition
        };
        setAssets(prev => {
          const next = [mappedSaved, ...prev];
          syncAssetsToLocal(next);
          return next;
        });
        toast.success(`Asset "${mappedSaved.name}" successfully registered (ID: ${mappedSaved.id})`);
        return mappedSaved;
      }
    } catch (err) {
      console.warn("Backend unavailable. Registering locally.", err);
    }

    // Client-side fallback
    setAssets(prev => {
      const next = [payload, ...prev];
      syncAssetsToLocal(next);
      return next;
    });
    toast.success(`Asset "${payload.name}" registered locally (Vercel Offline Mode)`);
    return payload;
  };

  // Update Asset (Admin Only)
  const updateAsset = async (id, updatedFields) => {
    const qty = parseInt(updatedFields.quantity) || 1;
    const payload = {
      ...updatedFields,
      quantity: qty,
      availableQuantity: parseInt(updatedFields.availableQuantity) || qty,
      purchaseCost: parseFloat(updatedFields.purchaseCost) || 0.0,
      condition: updatedFields.condition || updatedFields.toolCondition || 'Excellent'
    };

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Operator-Role': role
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        const mappedUpdated = {
          ...updatedAsset,
          condition: updatedAsset.condition || updatedAsset.toolCondition
        };
        setAssets(prev => {
          const next = prev.map(a => a.id === id ? mappedUpdated : a);
          syncAssetsToLocal(next);
          return next;
        });
        toast.success("Asset details updated successfully");
        return true;
      }
    } catch (err) {
      console.warn("Backend unavailable. Updating locally.", err);
    }

    // Client-side fallback
    setAssets(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...payload } : a);
      syncAssetsToLocal(next);
      return next;
    });
    toast.success("Asset details updated (Vercel Offline Mode)");
    return true;
  };

  // Delete Asset (Admin Only)
  const deleteAsset = async (id) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Operator-Role': role
        }
      });

      if (response.ok) {
        setAssets(prev => {
          const next = prev.filter(a => a.id !== id);
          syncAssetsToLocal(next);
          return next;
        });
        toast.success(`Asset was removed from database`);
        return true;
      }
    } catch (err) {
      console.warn("Backend unavailable. Deleting locally.", err);
    }

    // Client-side fallback
    setAssets(prev => {
      const next = prev.filter(a => a.id !== id);
      syncAssetsToLocal(next);
      return next;
    });
    toast.success("Asset was removed from database (Vercel Offline Mode)");
    return true;
  };

  // Checkout Asset (Available to Admin & User)
  const checkoutAsset = async (checkoutData) => {
    const { barcode, client, employee, projectSite, quantity, toolCondition, expectedReturnDate, remarks, contactPhone, contactEmail } = checkoutData;
    
    // Find asset
    const asset = assets.find(a => a.barcode.toUpperCase() === barcode.toUpperCase());
    if (!asset) {
      toast.error("Asset barcode not found.");
      return false;
    }

    const qtyToCheckout = Number(quantity || 1);

    if (asset.availableQuantity < qtyToCheckout) {
      toast.error(`Insufficient stock. Only ${asset.availableQuantity} available.`);
      return false;
    }

    if (asset.status === 'Under Maintenance' || asset.status === 'Lost') {
      toast.error(`Asset is currently ${asset.status.toLowerCase()} and cannot be issued.`);
      return false;
    }

    const operatorName = checkoutData.issuedBy || (currentUser ? currentUser.fullName : (role === 'Admin' ? 'Administrator' : 'Standard Operator'));

    try {
      const response = await fetch('/api/logs/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: asset.id,
          client,
          employee,
          projectSite,
          quantity: qtyToCheckout,
          remarks: remarks || `Issued to client ${client}. Expected back by ${expectedReturnDate || 'N/A'}`,
          issuedBy: operatorName,
          contactPhone,
          contactEmail,
          expectedReturnDate
        })
      });

      if (response.ok) {
        const newLog = await response.json();

        setLogs(prev => {
          const nextLogs = [newLog, ...prev];
          syncLogsToLocal(nextLogs);
          return nextLogs;
        });
        
        // Update local asset availability
        setAssets(prev => {
          const nextAssets = prev.map(a => {
            if (a.id === asset.id) {
              const nextQty = a.availableQuantity - qtyToCheckout;
              return {
                ...a,
                availableQuantity: nextQty,
                status: nextQty === 0 ? "Issued" : a.status
              };
            }
            return a;
          });
          syncAssetsToLocal(nextAssets);
          return nextAssets;
        });

        toast.success(`Successfully checked out ${qtyToCheckout}x ${asset.name}!`);
        if (contactPhone) {
          triggerNotification({
            type: 'checkout',
            recipient: contactPhone,
            title: '🔒 ELECTRORENT DISPATCH',
            body: `Asset Dispatch: ${qtyToCheckout}x ${asset.name} (${asset.barcode}) has been checked out to client ${client} by ${operatorName}. Expected back: ${expectedReturnDate || 'N/A'}.`,
            channel: 'SMS'
          });
        } else if (contactEmail) {
          triggerNotification({
            type: 'checkout',
            recipient: contactEmail,
            title: '🔒 ElectroRent Asset Dispatch Notification',
            body: `Dear Operator,\n\nWe confirm the checkout of ${qtyToCheckout}x ${asset.name} (Barcode: ${asset.barcode}) to client ${client}.\n\nProject Destination: ${projectSite || 'N/A'}\nIssued By: ${operatorName}\nDate: ${new Date().toLocaleDateString()}\nExpected return: ${expectedReturnDate || 'N/A'}.\n\nThank you for using ElectroRent asset control portal.`,
            channel: 'Email'
          });
        }
        return true;
      }
    } catch (err) {
      console.warn("Backend unavailable. Processing checkout locally.", err);
    }

    // Client-side fallback
    const localLog = {
      id: `LOG-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      barcode: asset.barcode,
      client,
      employee,
      projectSite,
      quantity: qtyToCheckout,
      toolCondition: toolCondition || asset.condition,
      checkoutDate: new Date().toISOString().split('T')[0],
      checkoutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkinDate: null,
      checkinTime: null,
      returnedBy: null,
      receivedBy: null,
      issuedBy: operatorName,
      daysUsed: null,
      status: "Active",
      remarks: remarks || `Issued to client ${client}. Expected back by ${expectedReturnDate || 'N/A'}`,
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      expectedReturnDate: expectedReturnDate || ""
    };

    setLogs(prev => {
      const nextLogs = [localLog, ...prev];
      syncLogsToLocal(nextLogs);
      return nextLogs;
    });

    setAssets(prev => {
      const nextAssets = prev.map(a => {
        if (a.id === asset.id) {
          const nextQty = a.availableQuantity - qtyToCheckout;
          return {
            ...a,
            availableQuantity: nextQty,
            status: nextQty === 0 ? "Issued" : a.status
          };
        }
        return a;
      });
      syncAssetsToLocal(nextAssets);
      return nextAssets;
    });

    toast.success(`Checked out ${qtyToCheckout}x ${asset.name} (Vercel Offline Mode)`);
    if (contactPhone) {
      triggerNotification({
        type: 'checkout',
        recipient: contactPhone,
        title: '🔒 ELECTRORENT DISPATCH',
        body: `Asset Dispatch: ${qtyToCheckout}x ${asset.name} (${asset.barcode}) has been checked out to client ${client} by ${operatorName}. Expected back: ${expectedReturnDate || 'N/A'}.`,
        channel: 'SMS'
      });
    } else if (contactEmail) {
      triggerNotification({
        type: 'checkout',
        recipient: contactEmail,
        title: '🔒 ElectroRent Asset Dispatch Notification',
        body: `Dear Operator,\n\nWe confirm the checkout of ${qtyToCheckout}x ${asset.name} (Barcode: ${asset.barcode}) to client ${client}.\n\nProject Destination: ${projectSite || 'N/A'}\nIssued By: ${operatorName}\nDate: ${new Date().toLocaleDateString()}\nExpected return: ${expectedReturnDate || 'N/A'}.\n\nThank you for using ElectroRent asset control portal.`,
        channel: 'Email'
      });
    }
    return true;
  };

  // Check-In Asset (Available to Admin & User)
  const checkinAsset = async (checkinData) => {
    const { barcode, returnedBy, receivedBy, toolCondition, maintenanceRequired, remarks, returnPhone, returnEmail } = checkinData;

    // Find active log for this barcode
    const log = logs.find(l => l.barcode.toUpperCase() === barcode.toUpperCase() && l.status === "Active");
    if (!log) {
      toast.error("No active check-out record found for this barcode.");
      return false;
    }

    const operatorName = receivedBy || (currentUser ? currentUser.fullName : (role === 'Admin' ? 'Administrator' : 'Standard Operator'));

    try {
      const response = await fetch(`/api/logs/checkin/${log.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnedBy,
          receivedBy: operatorName,
          toolCondition,
          maintenanceRequired,
          remarks,
          returnPhone,
          returnEmail
        })
      });

      if (response.ok) {
        const updatedLog = await response.json();

        // Update log locally
        setLogs(prev => {
          const nextLogs = prev.map(l => l.id === log.id ? updatedLog : l);
          syncLogsToLocal(nextLogs);
          return nextLogs;
        });

        // Update asset status locally
        setAssets(prev => {
          const nextAssets = prev.map(a => {
            if (a.id === log.assetId) {
              const nextAvail = Math.min(a.quantity, a.availableQuantity + log.quantity);
              let nextStatus = "Available";
              let nextCondition = toolCondition;
              if (maintenanceRequired === "Yes" || toolCondition === "Needs Repair") {
                nextStatus = "Under Maintenance";
                nextCondition = "Needs Repair";
              }
              return {
                ...a,
                availableQuantity: nextAvail,
                status: nextStatus,
                toolCondition: nextCondition
              };
            }
            return a;
          });
          syncAssetsToLocal(nextAssets);
          return nextAssets;
        });

        toast.success(`Successfully checked in "${log.assetName}". Return duration: ${updatedLog.daysUsed} day(s).`);
        const phoneToNotify = returnPhone || log.contactPhone;
        const emailToNotify = returnEmail || log.contactEmail;

        if (phoneToNotify) {
          triggerNotification({
            type: 'checkin',
            recipient: phoneToNotify,
            title: '✅ ELECTRORENT CHECKIN',
            body: `Asset Received: "${log.assetName}" (${log.barcode}) has been successfully returned to inventory by ${returnedBy || log.employee}. Registered status: "${toolCondition}". Thank you!`,
            channel: 'SMS'
          });
        } else if (emailToNotify) {
          triggerNotification({
            type: 'checkin',
            recipient: emailToNotify,
            title: '✅ ElectroRent Asset Return Confirmed',
            body: `Dear Operator,\n\nWe have successfully processed the return of: \n\nAsset: ${log.assetName} (Barcode: ${log.barcode})\nCondition Checked: ${toolCondition}\nReturned By: ${returnedBy || log.employee}\nReceived By: ${operatorName}\nDate: ${new Date().toLocaleDateString()}\n\nThank you for ensuring proper inventory tracking.`,
            channel: 'Email'
          });
        }
        return {
          success: true,
          assetName: log.assetName,
          daysUsed: updatedLog.daysUsed
        };
      }
    } catch (err) {
      console.warn("Backend unavailable. Processing check-in locally.", err);
    }

    // Client-side fallback
    const daysUsedVal = Math.max(1, Math.ceil((new Date() - new Date(log.checkoutDate)) / (1000 * 60 * 60 * 24)));
    const updatedLogLocal = {
      ...log,
      status: "Completed",
      checkinDate: new Date().toISOString().split('T')[0],
      checkinTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      returnedBy: returnedBy || log.employee,
      receivedBy: operatorName,
      daysUsed: daysUsedVal,
      remarks: remarks || "Checked-in via offline portal",
      returnPhone: returnPhone || "",
      returnEmail: returnEmail || ""
    };

    setLogs(prev => {
      const nextLogs = prev.map(l => l.id === log.id ? updatedLogLocal : l);
      syncLogsToLocal(nextLogs);
      return nextLogs;
    });

    setAssets(prev => {
      const nextAssets = prev.map(a => {
        if (a.id === log.assetId) {
          const nextAvail = Math.min(a.quantity, a.availableQuantity + log.quantity);
          let nextStatus = "Available";
          let nextCondition = toolCondition;
          if (maintenanceRequired === "Yes" || toolCondition === "Needs Repair") {
            nextStatus = "Under Maintenance";
            nextCondition = "Needs Repair";
          }
          return {
            ...a,
            availableQuantity: nextAvail,
            status: nextStatus,
            condition: nextCondition,
            toolCondition: nextCondition
          };
        }
        return a;
      });
      syncAssetsToLocal(nextAssets);
      return nextAssets;
    });

    toast.success(`Checked in "${log.assetName}" (Offline Duration: ${daysUsedVal} days)`);
    const phoneToNotify = returnPhone || log.contactPhone;
    const emailToNotify = returnEmail || log.contactEmail;

    if (phoneToNotify) {
      triggerNotification({
        type: 'checkin',
        recipient: phoneToNotify,
        title: '✅ ELECTRORENT CHECKIN',
        body: `Asset Received: "${log.assetName}" (${log.barcode}) has been successfully returned to inventory by ${returnedBy || log.employee}. Registered status: "${toolCondition}". Thank you!`,
        channel: 'SMS'
      });
    } else if (emailToNotify) {
      triggerNotification({
        type: 'checkin',
        recipient: emailToNotify,
        title: '✅ ElectroRent Asset Return Confirmed',
        body: `Dear Operator,\n\nWe have successfully processed the return of: \n\nAsset: ${log.assetName} (Barcode: ${log.barcode})\nCondition Checked: ${toolCondition}\nReturned By: ${returnedBy || log.employee}\nReceived By: ${operatorName}\nDate: ${new Date().toLocaleDateString()}\n\nThank you for ensuring proper inventory tracking.`,
        channel: 'Email'
      });
    }
    return {
      success: true,
      assetName: log.assetName,
      daysUsed: daysUsedVal
    };
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        logs,
        role,
        setRole,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        loginUser,
        toggleRole,
        globalSearch,
        setGlobalSearch,
        addAsset,
        updateAsset,
        deleteAsset,
        checkoutAsset,
        checkinAsset,
        isLoading,
        activeNotification,
        setActiveNotification,
        triggerNotification,
        resetSystemData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
