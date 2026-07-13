import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const SPRING_BOOT_URL = "http://localhost:8080";
  const LOCAL_DB_PATH = path.join(process.cwd(), "local_db.json");

  // Express parser middlewares
  app.use(express.json());

  // Helper functions to read and write our local JSON database file
  async function readLocalDb() {
    try {
      const data = await fs.readFile(LOCAL_DB_PATH, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading local db file, returning empty state:", err);
      return { users: [], assets: [], logs: [] };
    }
  }

  async function writeLocalDb(data) {
    try {
      await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing local db file:", err);
    }
  }

  // ==========================================
  // SPRING BOOT TRANSPARENT PROXY MIDDLEWARE
  // ==========================================
  let isSpringBootOnline = null;

  app.use("/api", async (req, res, next) => {
    // Let the health endpoint run locally or serve as a status checker
    if (req.path === "/health") {
      return res.json({ 
        status: "ok", 
        service: "ElectroRent Express Gateway",
        springBootOnline: isSpringBootOnline === true
      });
    }

    // If we've already detected that the Spring Boot server is offline, bypass fetch immediately
    if (isSpringBootOnline === false) {
      return next();
    }

    const targetUrl = `${SPRING_BOOT_URL}/api${req.path}`;
    const headers = { ...req.headers };
    delete headers.host; // Remove host to avoid connection issues on proxy
    delete headers["content-length"]; // Prevent Content-Length mismatches after JSON.stringify

    try {
      // Direct Native Node fetch with short timeout to fall back quickly if offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      isSpringBootOnline = true; // Set flag to true since fetch succeeded

      const contentType = response.headers.get("content-type") || "";
      res.status(response.status);

      // Set response headers back to client
      response.headers.forEach((value, name) => {
        res.setHeader(name, value);
      });

      if (contentType.includes("application/json")) {
        const json = await response.json();
        return res.json(json);
      } else {
        const text = await response.text();
        return res.send(text);
      }
    } catch (error) {
      // Cache that Spring Boot is offline so we don't attempt expensive fetches on every call
      isSpringBootOnline = false;
      console.info("[Express API Gateway] Spring Boot integration inactive. Defaulting to local high-fidelity database fallback.");
      return next();
    }
  });

  // ==========================================
  // LOCAL EXPRESS API FALLBACK ENDPOINTS
  // ==========================================

  // 1. Auth Endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const db = await readLocalDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (user && user.password === password) {
      return res.json({
        status: "success",
        role: user.role,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      });
    }

    // Default built-in credential fallback if db is cleared
    if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
      return res.json({
        status: "success",
        role: "Admin",
        fullName: "Admin Overseer",
        username: "admin",
        email: "admin@electrorent.com"
      });
    }

    return res.status(401).json({ message: "Authentication failed: invalid username or password" });
  });

  // 2. Register Operator
  app.post("/api/auth/register", async (req, res) => {
    const newUser = req.body;
    if (!newUser.username || !newUser.password) {
      return res.status(400).json({ message: "Operator username and password are required" });
    }

    const db = await readLocalDb();
    if (db.users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      return res.status(400).json({ message: "Operator username already exists" });
    }

    db.users.push({
      username: newUser.username,
      password: newUser.password,
      role: newUser.role || "User",
      fullName: newUser.fullName || "Field Operator",
      email: newUser.email || "",
      phone: newUser.phone || ""
    });

    await writeLocalDb(db);
    return res.status(210).json(newUser);
  });

  // 2.3 Update Operator / Profile details
  app.put("/api/users/:username", async (req, res) => {
    const username = req.params.username.toLowerCase();
    const { fullName, password, email, phone, role } = req.body;
    
    const db = await readLocalDb();
    const userIndex = db.users.findIndex(u => u.username.toLowerCase() === username);
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const original = db.users[userIndex];
    db.users[userIndex] = {
      ...original,
      fullName: fullName !== undefined ? fullName : original.fullName,
      password: password !== undefined ? password : original.password,
      email: email !== undefined ? email : original.email,
      phone: phone !== undefined ? phone : original.phone,
      role: role !== undefined ? role : original.role
    };

    await writeLocalDb(db);
    return res.json(db.users[userIndex]);
  });

  // 2.5 Get Operators List
  app.get("/api/users", async (req, res) => {
    const db = await readLocalDb();
    res.json(db.users);
  });

  // 2.6 Delete Operator
  app.delete("/api/users/:username", async (req, res) => {
    const username = req.params.username.toLowerCase();
    if (username === 'admin') {
      return res.status(400).json({ message: "Cannot delete master System Administrator" });
    }
    const db = await readLocalDb();
    const index = db.users.findIndex(u => u.username.toLowerCase() === username);
    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }
    db.users.splice(index, 1);
    await writeLocalDb(db);
    res.json({ message: `User ${username} successfully deleted.` });
  });

  // 3. Get Assets
  app.get("/api/assets", async (req, res) => {
    const db = await readLocalDb();
    res.json(db.assets);
  });

  // 4. Get Asset by ID
  app.get("/api/assets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const db = await readLocalDb();
    const asset = db.assets.find(a => a.id === id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.json(asset);
  });

  // 5. Get Asset by Barcode
  app.get("/api/assets/barcode/:barcode", async (req, res) => {
    const barcode = req.params.barcode;
    const db = await readLocalDb();
    const asset = db.assets.find(a => a.barcode.toUpperCase() === barcode.toUpperCase());
    if (!asset) {
      return res.status(404).json({ message: "Asset barcode not found" });
    }
    res.json(asset);
  });

  // 6. Create / Register Asset (Admin Only)
  app.post("/api/assets", async (req, res) => {
    const role = req.headers["x-operator-role"] || "User";
    if (role !== "Admin") {
      return res.status(403).json({ message: "Access Denied: Standard operators cannot register assets." });
    }

    const newAsset = req.body;
    if (!newAsset.name || !newAsset.barcode || !newAsset.category) {
      return res.status(400).json({ message: "Asset name, category and barcode are required" });
    }

    const db = await readLocalDb();
    if (db.assets.some(a => a.barcode.toUpperCase() === newAsset.barcode.toUpperCase())) {
      return res.status(400).json({ message: `The barcode '${newAsset.barcode}' is already registered.` });
    }

    const nextId = db.assets.length > 0 ? Math.max(...db.assets.map(a => a.id)) + 1 : 1001;
    const qty = parseInt(newAsset.quantity) || 1;
    const createdAsset = {
      id: nextId,
      name: newAsset.name,
      category: newAsset.category,
      barcode: newAsset.barcode,
      model: newAsset.model || "",
      brand: newAsset.brand || "",
      purchaseDate: newAsset.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: parseFloat(newAsset.purchaseCost) || 0,
      quantity: qty,
      availableQuantity: qty,
      vendor: newAsset.vendor || "",
      location: newAsset.location || "",
      toolCondition: newAsset.toolCondition || "Excellent",
      status: newAsset.status || "Available",
      notes: newAsset.notes || ""
    };

    db.assets.unshift(createdAsset);
    await writeLocalDb(db);
    res.status(201).json(createdAsset);
  });

  // 7. Update Asset (Admin Only)
  app.put("/api/assets/:id", async (req, res) => {
    const role = req.headers["x-operator-role"] || "User";
    if (role !== "Admin") {
      return res.status(403).json({ message: "Access Denied: Only administrators can modify asset entries." });
    }

    const id = parseInt(req.params.id);
    const updatedFields = req.body;

    const db = await readLocalDb();
    const assetIndex = db.assets.findIndex(a => a.id === id);
    if (assetIndex === -1) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const existingAsset = db.assets[assetIndex];
    const qtyDiff = parseInt(updatedFields.quantity || existingAsset.quantity) - existingAsset.quantity;
    const newAvailable = Math.max(0, existingAsset.availableQuantity + qtyDiff);

    const updatedAsset = {
      ...existingAsset,
      ...updatedFields,
      quantity: parseInt(updatedFields.quantity ?? existingAsset.quantity),
      purchaseCost: parseFloat(updatedFields.purchaseCost ?? existingAsset.purchaseCost),
      availableQuantity: newAvailable
    };

    db.assets[assetIndex] = updatedAsset;
    await writeLocalDb(db);
    res.json(updatedAsset);
  });

  // 8. Delete Asset (Admin Only)
  app.delete("/api/assets/:id", async (req, res) => {
    const role = req.headers["x-operator-role"] || "User";
    if (role !== "Admin") {
      return res.status(403).json({ message: "Access Denied: Only administrators can delete assets." });
    }

    const id = parseInt(req.params.id);
    const db = await readLocalDb();
    const index = db.assets.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Asset not found" });
    }

    db.assets.splice(index, 1);
    await writeLocalDb(db);
    res.json({ message: `Asset ID ${id} successfully purged from local database.` });
  });

  // 9. Get Logs
  app.get("/api/logs", async (req, res) => {
    const db = await readLocalDb();
    res.json(db.logs);
  });

  // 10. Checkout Dispatch Transaction
  app.post("/api/logs/checkout", async (req, res) => {
    const { assetId, client, employee, projectSite, quantity, remarks, issuedBy, contactPhone, contactEmail, expectedReturnDate } = req.body;

    const db = await readLocalDb();
    const assetIndex = db.assets.findIndex(a => a.id === parseInt(assetId));
    if (assetIndex === -1) {
      return res.status(404).json({ message: "Target asset not found in inventory register." });
    }

    const asset = db.assets[assetIndex];
    const qtyToCheckout = parseInt(quantity || 1);

    if (asset.availableQuantity < qtyToCheckout) {
      return res.status(400).json({ message: `Insufficient available stock. Available: ${asset.availableQuantity}` });
    }

    // Deduct stock
    asset.availableQuantity -= qtyToCheckout;
    if (asset.availableQuantity === 0) {
      asset.status = "Issued";
    }

    const logId = db.logs.length > 0 ? Math.max(...db.logs.map(l => parseInt(l.id) || l.id)) + 1 : 1;
    const logCode = `LOG-${500 + logId}`;
    const now = new Date();

    const newLog = {
      id: logId,
      logCode: logCode,
      assetId: asset.id,
      assetName: asset.name,
      barcode: asset.barcode,
      client: client,
      employee: employee,
      projectSite: projectSite || "Depot Site",
      quantity: qtyToCheckout,
      toolCondition: asset.toolCondition,
      checkoutDate: now.toISOString().split("T")[0],
      checkoutTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkinDate: null,
      checkinTime: null,
      returnedBy: null,
      receivedBy: null,
      issuedBy: issuedBy || "Operations Terminal",
      daysUsed: null,
      status: "Active",
      remarks: remarks || `Issued to client ${client}.`,
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      expectedReturnDate: expectedReturnDate || ""
    };

    db.logs.unshift(newLog);
    await writeLocalDb(db);
    res.status(201).json(newLog);
  });

  // 11. Checkin Return Transaction
  app.post("/api/logs/checkin/:id", async (req, res) => {
    const logId = parseInt(req.params.id);
    const { returnedBy, receivedBy, toolCondition, remarks, maintenanceRequired, returnPhone, returnEmail } = req.body;

    const db = await readLocalDb();
    const logIndex = db.logs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
      return res.status(404).json({ message: "Lease record ID not found." });
    }

    const log = db.logs[logIndex];
    if (log.status === "Returned") {
      return res.status(400).json({ message: "This tool lease record is already marked as Returned." });
    }

    const assetIndex = db.assets.findIndex(a => a.id === log.assetId);
    if (assetIndex !== -1) {
      const asset = db.assets[assetIndex];
      asset.availableQuantity = Math.min(asset.quantity, asset.availableQuantity + log.quantity);
      
      if (maintenanceRequired === "Yes" || toolCondition === "Needs Repair") {
        asset.status = "Under Maintenance";
        asset.toolCondition = "Needs Repair";
      } else {
        asset.status = "Available";
        asset.toolCondition = toolCondition || log.toolCondition;
      }
    }

    // Complete the transaction
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const checkoutDateObj = new Date(log.checkoutDate);
    const diffTime = Math.abs(now - checkoutDateObj);
    const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    log.checkinDate = todayStr;
    log.checkinTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    log.returnedBy = returnedBy || log.employee;
    log.receivedBy = receivedBy || "Operations Desk";
    log.toolCondition = toolCondition || log.toolCondition;
    log.status = "Returned";
    log.daysUsed = calculatedDays;
    log.remarks = log.remarks + " | Return Notes: " + (remarks || "No additional comments.");
    log.returnPhone = returnPhone || "";
    log.returnEmail = returnEmail || "";

    await writeLocalDb(db);
    res.json(log);
  });

  // 12. Scanner Rapid Processing API (Supports instant camera check-in / check-out operations)
  app.post("/api/scanner/process", async (req, res) => {
    const { barcode } = req.body;
    if (!barcode) {
      return res.status(400).json({ message: "Barcode string is required for processing." });
    }

    const db = await readLocalDb();
    
    // Find asset
    const asset = db.assets.find(a => a.barcode.toUpperCase() === barcode.trim().toUpperCase());
    if (!asset) {
      return res.status(404).json({ 
        message: `Barcode '${barcode}' not found in the inventory database.`,
        unregistered: true 
      });
    }

    // Look for active logs (issued logs not checked in)
    const activeLog = db.logs.find(l => l.barcode.toUpperCase() === barcode.trim().toUpperCase() && l.status === "Active");

    if (activeLog) {
      return res.json({
        status: "success",
        suggestedAction: "checkin",
        asset,
        activeLog,
        message: `Asset '${asset.name}' is currently dispatched to ${activeLog.client}. Ready for return check-in.`
      });
    } else {
      return res.json({
        status: "success",
        suggestedAction: "checkout",
        asset,
        message: `Asset '${asset.name}' is available in fleet stock. Ready for deployment dispatch.`
      });
    }
  });

  // ==========================================
  // VITE SERVICE MOUNT
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
