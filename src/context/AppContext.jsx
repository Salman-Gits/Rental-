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

// Initial Realistic Dummy Data
const initialAssets = [
  {
    id: 1001,
    barcode: "TL-1001",
    name: "Heavy-Duty Rotary Hammer Drill",
    category: "Power Tools",
    model: "DCH273B",
    brand: "DeWalt",
    purchaseDate: "2025-01-15",
    purchaseCost: 299.00,
    quantity: 8,
    availableQuantity: 5,
    condition: "Excellent",
    status: "Available",
    location: "Warehouse A - Rack 3",
    vendor: "Industrial Supply Group",
    notes: "Requires SDS-Plus bits. Calibrated on 2026-02-10."
  },
  {
    id: 1002,
    barcode: "TL-1002",
    name: "18V Cordless 1/2 in. Impact Wrench",
    category: "Power Tools",
    model: "2863-20",
    brand: "Milwaukee",
    purchaseDate: "2025-02-10",
    purchaseCost: 249.00,
    quantity: 12,
    availableQuantity: 9,
    condition: "Good",
    status: "Available",
    location: "Warehouse A - Rack 4",
    vendor: "Milwaukee Direct",
    notes: "High torque tool. Check socket ring during check-in."
  },
  {
    id: 1003,
    barcode: "TL-1003",
    name: "Fluke 87V Industrial Multimeter",
    category: "Testing Equipment",
    model: "87-5",
    brand: "Fluke",
    purchaseDate: "2024-11-05",
    purchaseCost: 485.00,
    quantity: 5,
    availableQuantity: 2,
    condition: "Excellent",
    status: "Available",
    location: "Lab Shelf B",
    vendor: "Test Instrument Distributors",
    notes: "Annual certification required. Next due Nov 2026."
  },
  {
    id: 1004,
    barcode: "TL-1004",
    name: "Industrial Air Compressor 200 PSI",
    category: "Pneumatic Tools",
    model: "AC-200XP",
    brand: "Campbell Hausfeld",
    purchaseDate: "2024-08-20",
    purchaseCost: 899.00,
    quantity: 2,
    availableQuantity: 0,
    condition: "Good",
    status: "Issued",
    location: "Warehouse B - Floor",
    vendor: "Air Tech Solutions",
    notes: "Perform daily oil checks. Currently at Site B."
  },
  {
    id: 1005,
    barcode: "TL-1005",
    name: "Fiber Optic Fusion Splicer",
    category: "Testing Equipment",
    model: "Q102-M12",
    brand: "Sumitomo",
    purchaseDate: "2025-03-01",
    purchaseCost: 4500.00,
    quantity: 3,
    availableQuantity: 2,
    condition: "Excellent",
    status: "Available",
    location: "Safe Locker 1",
    vendor: "Optic Supply Corp",
    notes: "Extremely sensitive device. Always transport in a hard case."
  },
  {
    id: 1006,
    barcode: "TL-1006",
    name: "Self-Leveling Rotary Laser Level",
    category: "Testing Equipment",
    model: "GRL4000-40CH",
    brand: "Bosch",
    purchaseDate: "2024-05-18",
    purchaseCost: 650.00,
    quantity: 6,
    availableQuantity: 3,
    condition: "Fair",
    status: "Available",
    location: "Warehouse A - Shelf 2",
    vendor: "Bosch Pro Partner",
    notes: "Requires tripod and receiver. Minor scratches on shell."
  },
  {
    id: 1007,
    barcode: "TL-1007",
    name: "Hydraulic Cable Cutter",
    category: "Hand Tools",
    model: "HCC-85",
    brand: "Greenlee",
    purchaseDate: "2024-09-12",
    purchaseCost: 1100.00,
    quantity: 4,
    availableQuantity: 3,
    condition: "Good",
    status: "Available",
    location: "Warehouse A - Rack 5",
    vendor: "Greenlee Industrial",
    notes: "Cuts up to 3-inch copper and aluminum cable."
  },
  {
    id: 1008,
    barcode: "TL-1008",
    name: "Professional Gas Leak Detector",
    category: "Testing Equipment",
    model: "CD100A",
    brand: "UEi Test Instruments",
    purchaseDate: "2025-04-10",
    purchaseCost: 180.00,
    quantity: 10,
    availableQuantity: 10,
    condition: "Excellent",
    status: "Available",
    location: "Lab Shelf C",
    vendor: "Apex Calibration Lab",
    notes: "Fresh batteries installed. Calibrated prior to storage."
  },
  {
    id: 1009,
    barcode: "TL-1009",
    name: "Heavy Duty Demolition Jackhammer",
    category: "Power Tools",
    model: "HM1812",
    brand: "Makita",
    purchaseDate: "2024-02-14",
    purchaseCost: 1450.00,
    quantity: 3,
    availableQuantity: 0,
    condition: "Under Maintenance",
    status: "Under Maintenance",
    location: "Repair Bay 2",
    vendor: "Makita Direct Wholesale",
    notes: "Leaking hydraulic fluid. Waiting for seal kit replacement."
  },
  {
    id: 1010,
    barcode: "TL-1010",
    name: "Portable Gas Generator 7500W",
    category: "Generators",
    model: "XP7500EH",
    brand: "DuroMax",
    purchaseDate: "2024-07-01",
    purchaseCost: 999.00,
    quantity: 5,
    availableQuantity: 4,
    condition: "Fair",
    status: "Available",
    location: "Warehouse B - Section 2",
    vendor: "Power Generator Outlet",
    notes: "Dual fuel (Gas/Propane). Clean spark plugs during service."
  },
  {
    id: 1011,
    barcode: "TL-1011",
    name: "Confined Space Gas Monitor",
    category: "Safety Gear",
    model: "MX4-Ventis",
    brand: "Industrial Scientific",
    purchaseDate: "2024-12-05",
    purchaseCost: 750.00,
    quantity: 15,
    availableQuantity: 15,
    condition: "Lost",
    status: "Lost",
    location: "Unknown",
    vendor: "Safety Supplies Unlimited",
    notes: "Unit serial #928374 reported lost at Substation C project site."
  }
];

const initialLogs = [
  {
    id: "LOG-501",
    assetId: 1001,
    assetName: "Heavy-Duty Rotary Hammer Drill",
    barcode: "TL-1001",
    client: "Apex Builders Inc.",
    employee: "Sarah Connor",
    projectSite: "Downtown Office Tower - Phase 2",
    quantity: 1,
    toolCondition: "Good",
    checkoutDate: "2026-06-15",
    checkoutTime: "08:15 AM",
    checkinDate: "2026-06-28",
    checkinTime: "04:30 PM",
    returnedBy: "Sarah Connor",
    receivedBy: "John Doe (Admin)",
    issuedBy: "Operations Terminal",
    daysUsed: 13,
    status: "Completed",
    remarks: "Returned in perfect working condition. Cleaned."
  },
  {
    id: "LOG-502",
    assetId: 1003,
    assetName: "Fluke 87V Industrial Multimeter",
    barcode: "TL-1003",
    client: "Matrix Infra",
    employee: "Alex Rivera",
    projectSite: "Substation Expansion Site D",
    quantity: 1,
    toolCondition: "Excellent",
    checkoutDate: "2026-06-20",
    checkoutTime: "10:00 AM",
    checkinDate: "2026-06-25",
    checkinTime: "03:15 PM",
    returnedBy: "Alex Rivera",
    receivedBy: "John Doe (Admin)",
    issuedBy: "Operations Terminal",
    daysUsed: 5,
    status: "Completed",
    remarks: "No issues reported during testing."
  },
  {
    id: "LOG-503",
    assetId: 1004,
    assetName: "Industrial Air Compressor 200 PSI",
    barcode: "TL-1004",
    client: "Vertex Energy Ltd.",
    employee: "Michael Scott",
    projectSite: "Wind Farm Project B",
    quantity: 1,
    toolCondition: "Good",
    checkoutDate: "2026-06-26",
    checkoutTime: "09:30 AM",
    checkinDate: null,
    checkinTime: null,
    returnedBy: null,
    receivedBy: null,
    issuedBy: "Operations Terminal",
    daysUsed: null,
    status: "Active",
    remarks: "Expected return on 2026-07-15. Essential for pneumatic framing."
  },
  {
    id: "LOG-504",
    assetId: 1002,
    assetName: "18V Cordless 1/2 in. Impact Wrench",
    barcode: "TL-1002",
    client: "Summit Partners",
    employee: "Sarah Connor",
    projectSite: "Bridge Restoration Area 4",
    quantity: 1,
    toolCondition: "Good",
    checkoutDate: "2026-07-01",
    checkoutTime: "07:45 AM",
    checkinDate: null,
    checkinTime: null,
    returnedBy: null,
    receivedBy: null,
    issuedBy: "Operations Terminal",
    daysUsed: null,
    status: "Active",
    remarks: "Requires fully charged batteries and standard sockets."
  }
];

export const AppProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [role, setRole] = useState('User');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Global Search results state for navigation search
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch initial data from API
  const fetchData = async () => {
    try {
      const [assetsRes, logsRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/logs')
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
      }
    } catch (err) {
      console.error("Failed to load assets/logs from backend API gateway:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle user roles for frontend testing
  const toggleRole = () => {
    setRole(prev => {
      const next = prev === 'Admin' ? 'User' : 'Admin';
      toast.info(`Switched interface mode to: ${next.toUpperCase()}`);
      return next;
    });
  };

  // Add Asset (Admin Only)
  const addAsset = async (newAsset) => {
    try {
      const qty = parseInt(newAsset.quantity) || 1;
      const payload = {
        ...newAsset,
        quantity: qty,
        availableQuantity: parseInt(newAsset.availableQuantity) || qty,
        purchaseCost: parseFloat(newAsset.purchaseCost) || 0.0,
        toolCondition: newAsset.condition || newAsset.toolCondition || 'Excellent'
      };

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Operator-Role': role
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Failed to register asset.");
        return null;
      }

      const savedAsset = await response.json();
      const mappedSaved = {
        ...savedAsset,
        condition: savedAsset.condition || savedAsset.toolCondition
      };
      setAssets(prev => [mappedSaved, ...prev]);
      toast.success(`Asset "${mappedSaved.name}" successfully registered (ID: ${mappedSaved.id})`);
      return mappedSaved;
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to register asset on server.");
      return null;
    }
  };

  // Update Asset (Admin Only)
  const updateAsset = async (id, updatedFields) => {
    try {
      const qty = parseInt(updatedFields.quantity) || 1;
      const payload = {
        ...updatedFields,
        quantity: qty,
        availableQuantity: parseInt(updatedFields.availableQuantity) || qty,
        purchaseCost: parseFloat(updatedFields.purchaseCost) || 0.0,
        toolCondition: updatedFields.condition || updatedFields.toolCondition || 'Excellent'
      };

      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Operator-Role': role
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Failed to update asset.");
        return false;
      }

      const updatedAsset = await response.json();
      const mappedUpdated = {
        ...updatedAsset,
        condition: updatedAsset.condition || updatedAsset.toolCondition
      };
      setAssets(prev => prev.map(a => a.id === id ? mappedUpdated : a));
      toast.success("Asset details updated successfully");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to update asset on server.");
      return false;
    }
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

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Failed to delete asset.");
        return false;
      }

      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success(`Asset was removed from database`);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to delete asset on server.");
      return false;
    }
  };

  // Checkout Asset (Available to Admin & User)
  const checkoutAsset = async (checkoutData) => {
    const { barcode, client, employee, projectSite, quantity, toolCondition, expectedReturnDate, remarks } = checkoutData;
    
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
          issuedBy: currentUser ? currentUser.fullName : (role === 'Admin' ? 'Administrator' : 'Standard Operator')
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Failed to checkout tool.");
        return false;
      }

      const newLog = await response.json();

      setLogs(prev => [newLog, ...prev]);
      
      // Update local asset availability
      setAssets(prev => prev.map(a => {
        if (a.id === asset.id) {
          const nextQty = a.availableQuantity - qtyToCheckout;
          return {
            ...a,
            availableQuantity: nextQty,
            status: nextQty === 0 ? "Issued" : a.status
          };
        }
        return a;
      }));

      toast.success(`Successfully checked out ${qtyToCheckout}x ${asset.name}!`);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to process checkout dispatch on server.");
      return false;
    }
  };

  // Check-In Asset (Available to Admin & User)
  const checkinAsset = async (checkinData) => {
    const { barcode, returnedBy, receivedBy, toolCondition, maintenanceRequired, remarks } = checkinData;

    // Find active log for this barcode
    const log = logs.find(l => l.barcode.toUpperCase() === barcode.toUpperCase() && l.status === "Active");
    if (!log) {
      toast.error("No active check-out record found for this barcode.");
      return false;
    }

    try {
      const response = await fetch(`/api/logs/checkin/${log.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnedBy,
          receivedBy: receivedBy || (currentUser ? currentUser.fullName : (role === 'Admin' ? 'Administrator' : 'Standard Operator')),
          toolCondition,
          maintenanceRequired,
          remarks
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Check-in returned record failed.");
        return false;
      }

      const updatedLog = await response.json();

      // Update log locally
      setLogs(prev => prev.map(l => l.id === log.id ? updatedLog : l));

      // Update asset status locally
      setAssets(prev => prev.map(a => {
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
      }));

      toast.success(`Successfully checked in "${log.assetName}". Return duration: ${updatedLog.daysUsed} day(s).`);
      return {
        success: true,
        assetName: log.assetName,
        daysUsed: updatedLog.daysUsed
      };
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to process check-in return on server.");
      return false;
    }
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
        toggleRole,
        globalSearch,
        setGlobalSearch,
        addAsset,
        updateAsset,
        deleteAsset,
        checkoutAsset,
        checkinAsset,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
