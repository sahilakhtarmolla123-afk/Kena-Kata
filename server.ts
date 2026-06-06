import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Firestore } from "@google-cloud/firestore";
import { 
  Product, 
  Seller, 
  UserProfile, 
  Order, 
  OtpRequest, 
  ChatMessage, 
  Announcement, 
  ProductQA,
  Dispute,
  AppNotification,
  SystemVideo,
  AdminSettingsDetails
} from "./src/types";

// Database storage file path
const DB_FILE = path.join(process.cwd(), "db_store.json");

interface DeliveryAgent {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "BLOCKED";
  sellerId?: string; // Tying agent to a specific seller
}

interface ReferralLog {
  id: string;
  referrerId: string;
  referredMobile: string;
  bonusAmount: number;
  status: "PENDING" | "PAID";
  timestamp: string;
}

// Full Extended Database Model
let dbData = {
  products: [] as Product[],
  sellers: [] as Seller[],
  users: [] as UserProfile[],
  orders: [] as Order[],
  otpRequests: [] as OtpRequest[],
  chats: [] as ChatMessage[],
  announcements: [] as Announcement[],
  qas: [] as ProductQA[],
  disputes: [] as Dispute[],
  notifications: [] as AppNotification[],
  videos: [] as SystemVideo[],
  deliveryAgents: [] as DeliveryAgent[],
  referrals: [] as ReferralLog[],
  adminConfig: {
    upiId: "kenakata@ybl",
    qrImage: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60",
    autoRankEnabled: true,
    minOrdersForRank: 1,
    pinnedSellers: [] as string[],
    homeFeedBanner: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1200&auto=format&fit=crop&q=80",
    broadcastText: "⚡ Kena Kata Big Sale is LIVE! Get up to 50% flat discount on Fashion & Electronics today!",
    appLogo: "https://lh3.googleusercontent.com/d/19n78bQLG7UDNICpat0W-CcHI39Wu796f"
  },
  adminDetails: {
    name: "Molla Sahil Akhtar (Admin)",
    contactNumber: "9609495971",
    email: "admin@kenakata.shop",
    photoUrl: "https://lh3.googleusercontent.com/d/19n78bQLG7UDNICpat0W-CcHI39Wu796f",
    bio: "Head Administrator & Platform Supervisor. Contact me for priority disputes or registration fast-tracks.",
    bannedWords: ["scam", "cheat", "cheatword", "fake", "duplicate", "banneditem"]
  } as AdminSettingsDetails
};

// Seed initial mock data if anything is empty
function seedData() {
  if (dbData.sellers.length === 0) {
    dbData.sellers = [
      {
        id: "seller_1",
        shopName: "ElectroMart India",
        ownerName: "Amit Patel",
        mobile: "9876543210",
        password: "seller123",
        logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?w=1200&auto=format&fit=crop&q=80",
        rating: 4.8,
        totalSales: 142,
        followersCount: 55,
        isActive: true,
        isVerified: true,
        joinDate: "2026-01-10T12:00:00Z",
        deliveryCharges: {
          "West Bengal": { "Kolkata": 0, "Howrah": 30, "North 24 Parganas": 40 },
          "Delhi": { "New Delhi": 60, "Central Delhi": 65 },
          "Maharashtra": { "Mumbai": 80, "Pune": 90 }
        },
        commissionRate: 5,
        categoryCommissionRates: { "Electronics": 5, "Fashion": 8, "Grocery": 3 }
      },
      {
        id: "seller_2",
        shopName: "StyleVibe Boutique",
        ownerName: "Priya Sharma",
        mobile: "9543210987",
        password: "seller123",
        logo: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=1200&auto=format&fit=crop&q=80",
        rating: 4.5,
        totalSales: 98,
        followersCount: 120,
        isActive: true,
        isVerified: true,
        joinDate: "2026-02-15T10:30:00Z",
        deliveryCharges: {
          "West Bengal": { "Kolkata": 20, "Howrah": 40 },
          "Delhi": { "New Delhi": 30 },
          "Maharashtra": { "Mumbai": 40, "Pune": 50 }
        },
        commissionRate: 8,
        categoryCommissionRates: { "Fashion": 8, "Electronics": 6 }
      },
      {
        id: "seller_3",
        shopName: "Organic Basket & Groceries",
        ownerName: "Dipak Sen",
        mobile: "9123456789",
        password: "seller123",
        logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80",
        rating: 4.9,
        totalSales: 210,
        followersCount: 88,
        isActive: true,
        isVerified: false,
        joinDate: "2025-11-05T08:00:00Z",
        deliveryCharges: {
          "West Bengal": { "Kolkata": 10, "Howrah": 20, "North 24 Parganas": 25 },
          "Delhi": { "New Delhi": 40 }
        },
        commissionRate: 3,
        categoryCommissionRates: { "Grocery": 3 }
      }
    ];
  }

  // Ensure admin shop "Kena Kata" always exists in sellers list
  const hasAdminStore = dbData.sellers.some(s => s.id === "admin_store");
  if (!hasAdminStore) {
    dbData.sellers.push({
      id: "admin_store",
      shopName: "Kena Kata",
      ownerName: "Molla Sahil Akhtar",
      mobile: "9609495971",
      password: "admin",
      logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60",
      banner: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1200&auto=format&fit=crop&q=80",
      rating: 4.9,
      totalSales: 45,
      followersCount: 1500,
      isActive: true,
      isVerified: true,
      joinDate: "2026-03-01T12:00:00Z",
      deliveryCharges: {
        "West Bengal": { "Kolkata": 0, "Howrah": 0, "North 24 Parganas": 0 }
      },
      commissionRate: 0,
      categoryCommissionRates: { "Electronics": 0, "Fashion": 0, "Grocery": 0, "Cosmetics": 0 }
    });
  }

  // Seed standard delivery agents
  if (dbData.deliveryAgents.length === 0) {
    dbData.deliveryAgents = [
      { id: "agent_1", name: "Ramesh Kumar", mobile: "8888888888", password: "agent123", status: "ACTIVE" },
      { id: "agent_2", name: "Suresh Haldar", mobile: "7777777777", password: "agent123", status: "ACTIVE" }
    ];
  }

  if (dbData.products.length === 0) {
    dbData.products = [
      {
        id: "prod_1",
        sellerId: "seller_1",
        sellerName: "ElectroMart India",
        companyName: "Kata Electronics",
        name: "Kena Watch Ultra Smartwatch",
        description: "AMOLED 2.0 inch Display, Single Chip BT Calling, Spo2 and Heart Rate tracking, Premium Titanium Finish, 10 Days Battery Life.",
        category: "Electronics",
        mrp: 4999,
        price: 1999,
        stock: 12,
        minOrderQuantity: 1,
        images: [
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=600&auto=format&fit=crop&q=80"
        ],
        specifications: [
          { key: "Screen Size", value: "2.0 inch AMOLED" },
          { key: "Battery Life", value: "Up to 10 days" },
          { key: "Water Resistance", value: "IP68 Certified" },
          { key: "Strap Material", value: "Premium Silicon" }
        ],
        sizeVariants: ["44mm", "49mm"],
        colorVariants: ["Titanium Gray", "Ocean Orange", "Midnight Black"],
        rating: 4.6,
        reviewCount: 341,
        // Delivery speed pricing
        deliverySpeeds: {
          standard: { active: true, price: 40 },
          express: { active: true, price: 90 },
          sameday: { active: true, price: 180 }
        },
        liveViewers: 24,
        salesThisWeek: 82
      },
      {
        id: "prod_2",
        sellerId: "seller_1",
        sellerName: "ElectroMart India",
        companyName: "PureSound",
        name: "Kata Bass Pods Wireless Earbuds",
        description: "Active Noise Cancellation up to 40dB, 45 Hours playback, Super low latency game mode, IPX5 sweat-proof, Touch controls.",
        category: "Electronics",
        mrp: 3499,
        price: 1299,
        stock: 5,
        minOrderQuantity: 1,
        images: [
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=600&auto=format&fit=crop&q=80"
        ],
        specifications: [
          { key: "Playback Time", value: "45 Hours total with case" },
          { key: "ANC Support", value: "Yes, up to 40dB" },
          { key: "Charging", value: "Type-C Fast Charging" }
        ],
        rating: 4.3,
        reviewCount: 165,
        deliverySpeeds: {
          standard: { active: true, price: 30 },
          express: { active: true, price: 80 },
          sameday: { active: false, price: 150 }
        },
        liveViewers: 13,
        salesThisWeek: 210
      },
      {
        id: "prod_3",
        sellerId: "seller_2",
        sellerName: "StyleVibe Boutique",
        companyName: "Kena Threads",
        name: "Designer Floral Printed Kurti",
        description: "Premium pure cotton fabric designer kurti for festive and casual wear. Crafted by local artisans.",
        category: "Fashion",
        mrp: 1499,
        price: 599,
        stock: 35,
        minOrderQuantity: 1,
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"
        ],
        sizeGuideImage: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80",
        specifications: [
          { key: "Fabric", value: "100% Pure Premium Cotton" },
          { key: "Style", value: "A-Line, Floral Print" },
          { key: "Length", value: "Knee Length" }
        ],
        sizeVariants: ["M", "L", "XL", "XXL"],
        colorVariants: ["Indigo Blue", "Blossom Pink"],
        rating: 4.7,
        reviewCount: 88,
        deliverySpeeds: {
          standard: { active: true, price: 40 },
          express: { active: true, price: 60 },
          sameday: { active: true, price: 110 }
        },
        liveViewers: 32,
        salesThisWeek: 94
      }
    ];

    // Seed initial flash sales & bundles
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 12);
    dbData.products[0].flashSale = {
      discountPercent: 60,
      startTime: new Date().toISOString(),
      endTime: futureDate.toISOString(),
      approved: true
    };
  }

  // Seed default admin video broadcast
  if (dbData.videos.length === 0) {
    dbData.videos = [
      {
        id: "vid_1",
        title: "Kena Kata Premium Shopping Official App Trailer",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Youtube video embed URL
        uploadedBy: "ADMIN",
        uploaderId: "admin",
        uploaderName: "Admin Molla Sahil Akhtar",
        timestamp: new Date().toISOString()
      }
    ];
  }

  if (dbData.notifications.length === 0) {
    dbData.notifications = [
      {
        id: "not_1",
        userId: "all",
        title: "Welcome to Kena Kata E-Commerce Ecosystem!",
        message: "Enjoy real-time order tracking, dedicated seller portals, live dispatcher coordination, and full buyer protection.",
        timestamp: new Date().toISOString(),
        read: false,
        category: "system"
      }
    ];
  }
}

// Firebase initialization inside the server
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDb: any = null;
let isCloudSyncEnabled = true;

if (fs.existsSync(CONFIG_PATH)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    firestoreDb = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    });
    console.log("[Firebase] Successfully initialized Server-Side Firestore SDK on database ID:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("[Firebase] Initialization error:", err);
  }
}

// Sync from Firestore to in-memory dbData
async function syncFromFirestore() {
  if (!firestoreDb || !isCloudSyncEnabled) return false;
  console.log("[Firebase] Loading all data from Firestore...");
  const collections = [
    "products", "sellers", "users", "orders", "otpRequests",
    "chats", "announcements", "qas", "disputes", "notifications",
    "videos", "deliveryAgents", "referrals"
  ];

  let loadedSome = false;
  for (const colName of collections) {
    try {
      const querySnapshot = await firestoreDb.collection(colName).get();
      const items: any[] = [];
      querySnapshot.forEach((doc: any) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      if (items.length > 0) {
        (dbData as any)[colName] = items;
        loadedSome = true;
        console.log(`[Firebase] Loaded ${items.length} records for collection: ${colName}`);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[Firebase] Failed to load collection ${colName}:`, errMsg);
      if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("permissions") || errMsg.includes("insufficient")) {
        console.warn("[Firebase] Detected PERMISSION_DENIED. Gracefully switching to offline local storage (db_store.json) for standalone execution.");
        isCloudSyncEnabled = false;
        return false;
      }
    }
  }

  // Load single or custom fields from system
  try {
    const configDoc = await firestoreDb.collection("system").doc("config").get();
    if (configDoc.exists) {
      dbData.adminConfig = { ...dbData.adminConfig, ...configDoc.data() };
      loadedSome = true;
      console.log(`[Firebase] Loaded adminConfig successfully`);
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("[Firebase] Error loading adminConfig:", errMsg);
    if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("permissions") || errMsg.includes("insufficient")) {
      isCloudSyncEnabled = false;
      return false;
    }
  }

  try {
    const detailsDoc = await firestoreDb.collection("system").doc("details").get();
    if (detailsDoc.exists) {
      dbData.adminDetails = { ...dbData.adminDetails, ...detailsDoc.data() };
      loadedSome = true;
      console.log(`[Firebase] Loaded adminDetails successfully`);
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("[Firebase] Error loading adminDetails:", errMsg);
    if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("permissions") || errMsg.includes("insufficient")) {
      isCloudSyncEnabled = false;
      return false;
    }
  }

  return loadedSome;
}

// Sync from in-memory dbData to Firestore
async function syncToFirestore() {
  if (!firestoreDb || !isCloudSyncEnabled) return;
  console.log("[Firebase] Syncing current in-memory DB to Firestore...");
  const collections = [
    "products", "sellers", "users", "orders", "otpRequests",
    "chats", "announcements", "qas", "disputes", "notifications",
    "videos", "deliveryAgents", "referrals"
  ];

  for (const colName of collections) {
    const items = (dbData as any)[colName];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && item.id) {
          try {
            const { id, ...data } = item;
            // Clean undefined/null fields using stringify/parse to keep Firestore payloads clean
            const cleanData = JSON.parse(JSON.stringify(data));
            await firestoreDb.collection(colName).doc(id).set(cleanData);
          } catch (err) {
            console.error(`[Firebase] Error saving ${colName}/${item.id}:`, err);
          }
        }
      }
    }
  }

  try {
    const cleanConfig = JSON.parse(JSON.stringify(dbData.adminConfig));
    const cleanDetails = JSON.parse(JSON.stringify(dbData.adminDetails));
    await firestoreDb.collection("system").doc("config").set(cleanConfig);
    await firestoreDb.collection("system").doc("details").set(cleanDetails);
    console.log("[Firebase] Successfully synced adminConfig and adminDetails to cloud");
  } catch (err) {
    console.error("[Firebase] Error saving config/details to cloud:", err);
  }
}

// Load DB from file
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      dbData = { ...dbData, ...parsed };
    }
  } catch (error) {
    console.error("Error reading db_store.json, using in-memory:", error);
  }
  seedData();
}

// Save DB to file
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
    // Background cloud sync
    syncToFirestore().catch(err => {
      console.error("[Firebase] Background Firestore sync error:", err);
    });
  } catch (error) {
    console.error("Error saving db_store.json:", error);
  }
}

loadDB();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sync Cloud Firestore on startup
  try {
    const loaded = await syncFromFirestore();
    if (!loaded) {
      console.log("[Firebase] Online database is uninitialized. Bootstrapping initial database state...");
      await syncToFirestore();
    }
  } catch (err) {
    console.error("[Firebase] Online database sync failed:", err);
  }

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Allow CORS for APK / remote app requests
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Check / Init DB
  app.get("/api/db-state", (req, res) => {
    // Inject dynamic mock stats: Live active viewers and weekly sales
    dbData.products.forEach(p => {
      if (!p.liveViewers) p.liveViewers = Math.floor(10 + Math.random() * 45);
      if (!p.salesThisWeek) p.salesThisWeek = Math.floor(40 + Math.random() * 180);
      if (!p.deliverySpeeds) {
        p.deliverySpeeds = {
          standard: { active: true, price: 40 },
          express: { active: true, price: 80 },
          sameday: { active: false, price: 150 }
        };
      }
    });

    res.json({
      success: true,
      db: dbData
    });
  });

  // Reset API (re-seeding)
  app.post("/api/db-reset", (req, res) => {
    dbData.orders = [];
    dbData.otpRequests = [];
    dbData.chats = [];
    dbData.users = dbData.users.filter(u => u.id === "usr_simulated");
    dbData.disputes = [];
    dbData.notifications = [];
    dbData.videos = [];
    dbData.deliveryAgents = [];
    dbData.referrals = [];
    dbData.products = [];
    dbData.sellers = [];
    seedData();
    saveDB();
    res.json({ success: true, message: "Database re-seeded successfully." });
  });

  // ——————————————————————————————————————————————————————————
  // UNIFIED AUTHENTICATION ENGINE (Dynamic login across modules)
  // ——————————————————————————————————————————————————————————
  app.post("/api/auth/login", (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, error: "Mobile number and password are required." });
    }

    // 1. Check Admin Credentials (STRICTLY Verified Server-Side Supporting Dynamic Custom Reset)
    const isAdminPassValid = password === "New-Shopping-Application-9681" || (dbData.adminDetails.customPassword && dbData.adminDetails.customPassword === password);
    if (mobile === "9609495971" && isAdminPassValid) {
      return res.json({
        success: true,
        role: "ADMIN",
        user: {
          id: "admin",
          name: dbData.adminDetails.name,
          mobile: "9609495971",
          profilePhoto: dbData.adminDetails.photoUrl,
          address: "Admin Secretariat, New Delhi",
          state: "Delhi",
          district: "New Delhi",
          role: "ADMIN"
        }
      });
    }

    // 2. Check Sellers
    const seller = dbData.sellers.find(s => s.mobile === mobile);
    if (seller) {
      if (seller.isSuspended) {
        return res.status(403).json({ success: false, error: "Your seller account is under review or suspended due to excessive customer reports." });
      }
      if (seller.password === password) {
        return res.json({
          success: true,
          role: "SELLER",
          sellerId: seller.id,
          user: {
            id: seller.id,
            name: seller.ownerName,
            mobile: seller.mobile,
            profilePhoto: seller.logo,
            address: "Merchant Registered Store: " + seller.shopName,
            role: "SELLER"
          },
          seller
        });
      }
    }

    // 3. Check Delivery Agents
    const agent = dbData.deliveryAgents.find(a => a.mobile === mobile);
    if (agent && agent.password === password) {
      return res.json({
        success: true,
        role: "DELIVERY_AGENT",
        deliveryAgentId: agent.id,
        user: {
          id: agent.id,
          name: agent.name,
          mobile: agent.mobile,
          profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
          address: "Platform Delivery Partner Office",
          role: "DELIVERY_AGENT"
        }
      });
    }

    // 4. Check Regular Users (Customers)
    const user = dbData.users.find(u => u.mobile === mobile);
    if (user && user.password === password) {
      // Dynamic upgrade of role for backward compatibility
      user.role = user.role || "CUSTOMER";
      return res.json({
        success: true,
        role: "CUSTOMER",
        user
      });
    }

    return res.status(401).json({ success: false, error: "Incorrect mobile number or security password." });
  });

  // ——————————————————————————————————————————————————————————
  // FORGOT PASSWORD ENGINE WITH SECRET WORKSPACE CODES
  // ——————————————————————————————————————————————————————————
  app.post("/api/auth/forgot-password-request", (req, res) => {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, error: "Mobile number is required." });
    }

    // Check if the mobile belongs to any known entity in our database
    const isAdmin = mobile === "9609495971" || mobile === dbData.adminDetails.contactNumber;
    const isSeller = dbData.sellers.some(s => s.mobile === mobile);
    const isAgent = dbData.deliveryAgents.some(a => a.mobile === mobile);
    const isCustomer = dbData.users.some(u => u.mobile === mobile);

    if (!isAdmin && !isSeller && !isAgent && !isCustomer) {
      return res.status(404).json({ success: false, error: "Mobile number position not registered on Kena Kata." });
    }

    // Generate forgot password OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const request: OtpRequest = {
      id: "otp_" + Math.random().toString(36).substring(2, 9),
      mobile,
      otp,
      requestedAt: new Date().toISOString(),
      role: "FORGOT_PASSWORD",
      shopName: isAdmin ? "System Administrator Account" : isSeller ? "Merchant Account" : isAgent ? "Delivery Logistics Partner" : "Customer Portal Account"
    };

    dbData.otpRequests.unshift(request);
    saveDB();

    res.json({ success: true, message: "Verification OTP has been successfully routed to the Admin Secretariat queue.", simulatedOtp: otp });
  });

  app.post("/api/auth/forgot-password-verify", (req, res) => {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: "Mobile number, OTP, and New Password are required." });
    }

    // Find the OTP request in dbData.otpRequests
    const idx = dbData.otpRequests.findIndex(r => r.mobile === mobile && r.otp === otp && r.role === "FORGOT_PASSWORD");
    if (idx === -1) {
      return res.status(400).json({ success: false, error: "Incorrect or expired Admin verification OTP code." });
    }

    // Remove the OTP from queue
    dbData.otpRequests.splice(idx, 1);

    // Update the password for the matching entity
    let found = false;

    // 1. Check Admin
    if (mobile === "9609495971" || mobile === dbData.adminDetails.contactNumber) {
      dbData.adminDetails.customPassword = newPassword;
      found = true;
    }

    // 2. Check Sellers
    const seller = dbData.sellers.find(s => s.mobile === mobile);
    if (seller) {
      seller.password = newPassword;
      found = true;
    }

    // 3. Check Delivery Agents
    const agent = dbData.deliveryAgents.find(a => a.mobile === mobile);
    if (agent) {
      agent.password = newPassword;
      found = true;
    }

    // 4. Check Customers
    const user = dbData.users.find(u => u.mobile === mobile);
    if (user) {
      user.password = newPassword;
      found = true;
    }

    if (!found) {
      return res.status(404).json({ success: false, error: "Associated record could not be located to rewrite credentials." });
    }

    saveDB();
    res.json({ success: true, message: "Password reset completed successfully. Please login using your new password." });
  });

  // OTP Request for Signup (Generates pending state)
  app.post("/api/auth/otp-request-signup", (req, res) => {
    const { mobile, tempSignupData } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, error: "Mobile number is required for signup." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const request: OtpRequest = {
      id: "otp_" + Math.random().toString(36).substring(2, 9),
      mobile,
      otp,
      requestedAt: new Date().toISOString(),
      role: "OTP_SIGNUP",
      tempSignupData: tempSignupData ? JSON.stringify(tempSignupData) : undefined
    };

    dbData.otpRequests.unshift(request);
    saveDB();

    res.json({
      success: true,
      message: "Signup Verification Code generated on live dashboard.",
      simulatedOtp: otp
    });
  });

  // Verify Sign up and auto-save the customer profile
  app.post("/api/auth/otp-verify-signup", (req, res) => {
    const { mobile, otp } = req.body;
    const reqIndex = dbData.otpRequests.findIndex(r => r.mobile === mobile && r.otp === otp && r.role === "OTP_SIGNUP");
    
    if (reqIndex === -1) {
      return res.status(400).json({ success: false, error: "Mismatch or invalid signup OTP entered." });
    }

    const matchedReq = dbData.otpRequests[reqIndex];
    let details: any = {};
    if (matchedReq.tempSignupData) {
      try {
        details = JSON.parse(matchedReq.tempSignupData);
      } catch (e) {
        console.error("Error parsing temp data");
      }
    }

    // Register customer
    const userProfile: UserProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: details.name || "New Customer",
      mobile: mobile,
      altMobile: details.altMobile || "",
      profilePhoto: details.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
      address: details.address || "",
      state: details.state || "",
      district: details.district || "",
      password: details.password || "user123",
      followingSellers: [],
      interests: details.interests || [],
      reviewCount: 0,
      savedAddresses: details.savedAddresses || []
    };

    dbData.users.push(userProfile);
    
    // Clear request
    dbData.otpRequests.splice(reqIndex, 1);

    // If referred, register referral
    if (details.referredBySellerId) {
      dbData.referrals.push({
        id: "ref_" + Math.random().toString(36).substring(2, 7),
        referrerId: details.referredBySellerId,
        referredMobile: mobile,
        bonusAmount: 250, // 250 taka reward
        status: "PENDING",
        timestamp: new Date().toISOString()
      });
    }

    // Save notifications
    dbData.notifications.push({
      id: "not_" + Math.random().toString(36).substring(2, 7),
      userId: userProfile.id,
      title: "Profile Created Successfully! 🎉",
      message: "Welcome! Update your Onboarding Interests anytime under Settings for smarter shopping Recommendations.",
      timestamp: new Date().toISOString(),
      read: false,
      category: "system"
    });

    saveDB();

    res.json({
      success: true,
      user: userProfile
    });
  });

  // Apply as Seller from inside customer settings
  app.post("/api/auth/apply-for-seller", (req, res) => {
    const { customerId, shopName, ownerName, mobile, password, logo, banner, referredBy } = req.body;
    let existing = dbData.sellers.find(s => s.mobile === mobile);
    if (existing) {
      return res.status(400).json({ success: false, error: "A seller already loaded or registered under this credentials number." });
    }

    const finalSeller: Seller = {
      id: "seller_" + Math.random().toString(36).substring(2, 9),
      shopName,
      ownerName: ownerName || "Shop Partner",
      mobile,
      password: password || "seller123",
      logo: logo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60",
      banner: banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
      rating: 5.0,
      totalSales: 0,
      followersCount: 0,
      isActive: false, // Set to false, requires Admin approval
      isVerified: false,
      joinDate: new Date().toISOString(),
      deliveryCharges: {
        "West Bengal": { "Kolkata": 30 },
        "Delhi": { "New Delhi": 50 }
      },
      commissionRate: 8, // Admin will adjust
      categoryCommissionRates: { "Electronics": 8, "Fashion": 10, "Grocery": 5 },
      referredBy
    };

    dbData.sellers.push(finalSeller);
    saveDB();

    res.json({ success: true, seller: finalSeller });
  });

  // OPTIONAL: Legacy SMS notification code support
  app.post("/api/auth/otp-request", (req, res) => {
    const { mobile, role, shopName } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const request: OtpRequest = {
      id: "otp_" + Math.random().toString(36).substring(2, 9),
      mobile,
      otp,
      requestedAt: new Date().toISOString(),
      role: role || "CUSTOMER",
      shopName
    };
    dbData.otpRequests.unshift(request);
    saveDB();
    res.json({ success: true, simulatedOtp: otp });
  });

  app.post("/api/auth/otp-verify", (req, res) => {
    const { mobile, otp, role } = req.body;
    const idx = dbData.otpRequests.findIndex(r => r.mobile === mobile && r.otp === otp);
    if (idx === -1) {
      return res.status(400).json({ success: false, error: "Incorrect OTP Code." });
    }
    dbData.otpRequests.splice(idx, 1);
    saveDB();

    if (role === "CUSTOMER") {
      const user = dbData.users.find(u => u.mobile === mobile);
      return res.json({ success: true, isNew: !user, user, role: "CUSTOMER" });
    } else {
      const seller = dbData.sellers.find(s => s.mobile === mobile);
      return res.json({ success: true, isNew: !seller, seller, role: "SELLER" });
    }
  });

  // ——————————————————————————————————————————————————————————
  // PRODUCT SAVING WITH BANNED WORDS FILTER
  // ——————————————————————————————————————————————————————————
  app.post("/api/products/save", (req, res) => {
    const {
      id,
      sellerId,
      companyName,
      name,
      description,
      category,
      mrp,
      price,
      stock,
      minOrderQuantity,
      images,
      videoUrl,
      sizeGuideImage,
      specifications,
      sizeVariants,
      colorVariants,
      bundleDeal,
      flashSale,
      deliverySpeeds
    } = req.body;

    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, error: "Unauthorized: Seller profile not found." });
    }

    // Banned words check
    const contentToSearch = `${name} ${description}`.toLowerCase();
    const hitBannedWord = dbData.adminDetails.bannedWords.find(word => contentToSearch.includes(word.toLowerCase()));

    const isBanned = !!hitBannedWord;
    const bannedReason = hitBannedWord ? `Restricted terms found — Content contains the word "${hitBannedWord}"` : undefined;

    let targetProduct: Product;

    if (id) {
      const index = dbData.products.findIndex(p => p.id === id);
      if (index !== -1) {
        dbData.products[index] = {
          ...dbData.products[index],
          companyName,
          name,
          description,
          category,
          mrp: Number(mrp),
          price: Number(price),
          stock: Number(stock),
          minOrderQuantity: Number(minOrderQuantity) || 1,
          images: images || dbData.products[index].images,
          videoUrl,
          sizeGuideImage,
          specifications,
          sizeVariants,
          colorVariants,
          bundleDeal,
          flashSale,
          deliverySpeeds: deliverySpeeds || dbData.products[index].deliverySpeeds,
          isBannedPendingReview: isBanned,
          bannedReason: bannedReason
        };
        targetProduct = dbData.products[index];
      } else {
        return res.status(404).json({ success: false, error: "Product not found." });
      }
    } else {
      targetProduct = {
        id: "prod_" + Math.random().toString(36).substring(2, 9),
        sellerId,
        sellerName: seller.shopName,
        companyName,
        name,
        description,
        category,
        mrp: Number(mrp),
        price: Number(price),
        stock: Number(stock),
        minOrderQuantity: Number(minOrderQuantity) || 1,
        images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"],
        videoUrl,
        sizeGuideImage,
        specifications: specifications || [],
        sizeVariants: sizeVariants || [],
        colorVariants: colorVariants || [],
        bundleDeal,
        flashSale,
        deliverySpeeds: deliverySpeeds || {
          standard: { active: true, price: 40 },
          express: { active: true, price: 80 },
          sameday: { active: false, price: 150 }
        },
        liveViewers: Math.floor(12 + Math.random() * 32),
        salesThisWeek: 0,
        rating: 5.0,
        reviewCount: 0,
        isBannedPendingReview: isBanned,
        bannedReason: bannedReason
      };
      dbData.products.push(targetProduct);
    }

    saveDB();

    if (isBanned) {
      return res.json({
        success: false,
        rejected: true,
        error: `Product rejected — contains restricted word: "${hitBannedWord}". Saved under admin review.`,
        product: targetProduct
      });
    }

    res.json({ success: true, product: targetProduct });
  });

  // Admin approves a banned/flagged product
  app.post("/api/admin/approve-product", (req, res) => {
    const { id } = req.body;
    const prod = dbData.products.find(p => p.id === id);
    if (prod) {
      prod.isBannedPendingReview = false;
      prod.bannedReason = undefined;
      saveDB();
      return res.json({ success: true, product: prod });
    }
    res.status(404).json({ success: false, error: "Product not found." });
  });

  app.post("/api/products/delete", (req, res) => {
    const { id } = req.body;
    dbData.products = dbData.products.filter(p => p.id !== id);
    saveDB();
    res.json({ success: true });
  });

  // ——————————————————————————————————————————————————————————
  // REAL-TIME VIDEO PIPELINE (Admin broadcast to all vs Seller to followers)
  // ——————————————————————————————————————————————————————————
  app.post("/api/videos/upload", (req, res) => {
    const { title, videoUrl, uploadedBy, uploaderId, uploaderName } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ success: false, error: "Valid stream or iframe link required." });
    }

    const videoNode: SystemVideo = {
      id: "vid_" + Math.random().toString(36).substring(2, 9),
      title: title || "New Product Broadcast Reel",
      videoUrl,
      uploadedBy,
      uploaderId,
      uploaderName,
      timestamp: new Date().toISOString()
    };

    dbData.videos.unshift(videoNode);
    saveDB();

    // Generate notifications
    let notificationTitle = `New video upload: ${videoNode.title}`;
    let notificationMessage = `Uploaded by ${uploaderName}`;

    if (uploadedBy === "ADMIN") {
      // Broadcast to everyone
      dbData.notifications.push({
        id: "not_" + Math.random().toString(36).substring(2, 7),
        userId: "all",
        title: notificationTitle,
        message: notificationMessage,
        timestamp: new Date().toISOString(),
        read: false,
        category: "announcement"
      });
    } else {
      // Find followers
      const followers = dbData.users.filter(u => u.followingSellers.includes(uploaderId));
      followers.forEach(f => {
        dbData.notifications.push({
          id: "not_" + Math.random().toString(36).substring(2, 7),
          userId: f.id,
          title: `Broadcasting Live from ${uploaderName} 🎥`,
          message: `Your followed shop uploaded an exclusive video context for you: "${videoNode.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          category: "announcement"
        });
      });
    }

    saveDB();
    res.json({ success: true, video: videoNode });
  });

  app.get("/api/videos", (req, res) => {
    const { customerId } = req.query;
    if (!customerId) {
      // Return Admin videos
      return res.json({ success: true, videos: dbData.videos.filter(v => v.uploadedBy === "ADMIN") });
    }

    const user = dbData.users.find(u => u.id === customerId);
    if (!user) {
      return res.json({ success: true, videos: dbData.videos.filter(v => v.uploadedBy === "ADMIN") });
    }

    // Filter: Admin videos are seen by everyone. Seller videos are seen by followers.
    const visibleVideos = dbData.videos.filter(v => {
      if (v.uploadedBy === "ADMIN") return true;
      return user.followingSellers.includes(v.uploaderId);
    });

    res.json({ success: true, videos: visibleVideos });
  });

  // ——————————————————————————————————————————————————————————
  // SYSTEM REVENUE SPLIT & REVENUE RECOVERY COMMISSION ENGINE
  // ——————————————————————————————————————————————————————————
  app.post("/api/orders/create", (req, res) => {
    const {
      customerId,
      customerName,
      customerMobile,
      deliveryAddress,
      sellerId,
      items,
      paymentMethod,
      deliveryCharge,
      itemTotal,
      discountTotal,
      finalTotal,
      selectedDeliverySpeed,
      estimatedDeliveryDate,
      orderNote
    } = req.body;

    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, error: "Selected Merchant not found." });
    }

    // Double check stock and decrement
    for (const item of items) {
      const prod = dbData.products.find(p => p.id === item.productId);
      if (prod) {
        if (prod.stock < item.quantity) {
          return res.status(400).json({ success: false, error: `Product "${prod.name}" has insufficient stock in warehouse.` });
        }
        prod.stock -= item.quantity;
      }
    }

    // Compute commission rate applying to this specific products' categories or general seller commission rate
    let weightedCommissionRateSum = 0;
    let totalItemValue = 0;

    for (const item of items) {
      const prod = dbData.products.find(p => p.id === item.productId);
      const category = prod ? prod.category : "Fashion"; // fallback default category
      
      let itemRate = seller.commissionRate || 8; // fallback to seller rate
      if (seller.categoryCommissionRates && seller.categoryCommissionRates[category] !== undefined) {
        itemRate = Number(seller.categoryCommissionRates[category]);
      }
      
      const itemPriceSum = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      totalItemValue += itemPriceSum;
      weightedCommissionRateSum += itemRate * itemPriceSum;
    }

    let matchedRate = seller.commissionRate || 8;
    if (totalItemValue > 0) {
      matchedRate = Number((weightedCommissionRateSum / totalItemValue).toFixed(2));
    }

    // Deduct stock limits and apply commission values split
    const commissionDeducted = Number(((finalTotal * matchedRate) / 100).toFixed(2));
    const netEarning = Number((finalTotal - commissionDeducted).toFixed(2));

    const order: Order = {
      id: "KK-" + Math.floor(100000 + Math.random() * 900000),
      customerId,
      customerName,
      customerMobile,
      deliveryAddress,
      sellerId,
      sellerName: seller.shopName,
      items: items.map((i: any) => ({ ...i, status: "PLACED" })),
      paymentMethod,
      deliveryCharge: Number(deliveryCharge),
      itemTotal: Number(itemTotal),
      discountTotal: Number(discountTotal),
      finalTotal: Number(finalTotal),
      status: "PLACED",
      statusTimeline: [
        { status: "PLACED", timestamp: new Date().toISOString() }
      ],
      selectedDeliverySpeed: selectedDeliverySpeed || "standard",
      estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 5 * 86400000).toDateString(),
      orderNote,
      commissionRateApplied: matchedRate,
      commissionDeducted,
      sellerEarningNet: netEarning
    };

    dbData.orders.unshift(order);

    // Save notification
    dbData.notifications.push({
      id: "not_" + Math.random().toString(36).substring(2, 7),
      userId: customerId,
      title: "New E-Commerce Placement Order! 🛍️",
      message: `Your check out of KK-${order.id} is registered successfully using ${paymentMethod}.`,
      timestamp: new Date().toISOString(),
      read: false,
      category: "order"
    });

    saveDB();
    res.json({ success: true, order });
  });

  // Update order status with photo evidence support and live tracking toggling
  app.post("/api/orders/update-status", (req, res) => {
    const { orderId, status, deliveryAgentId, proofPhotoUrl, liveLocation } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order context not found." });
    }

    if (status === "DELIVERED" && !proofPhotoUrl && !order.proofPhotoUrl) {
      return res.status(400).json({ success: false, error: "Security Warning: Proof Photo is mandatory to confirm parcel dispatch at customer doorstep." });
    }

    order.status = status;
    if (deliveryAgentId) order.deliveryAgentId = deliveryAgentId;
    if (proofPhotoUrl) order.proofPhotoUrl = proofPhotoUrl;
    if (liveLocation) order.liveLocation = liveLocation;

    if (status === "CONFIRMED") {
      order.responseAcceptTime = new Date().toISOString();
    }

    if (status === "OUT_FOR_DELIVERY") {
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      order.deliveryOtp = deliveryOtp;
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 10);
      order.deliveryOtpExpiry = expiry.toISOString();
      // Initialize Agent live geo data
      order.liveLocation = {
        lat: 12.9716,
        lng: 77.5946,
        distanceKm: 2.3,
        lastUpdated: new Date().toISOString()
      };
    }

    order.statusTimeline.push({
      status,
      timestamp: new Date().toISOString()
    });

    // Notifications
    dbData.notifications.push({
      id: "not_" + Math.random().toString(36).substring(2, 7),
      userId: order.customerId,
      title: `Order Status Shifted: ${status} 📦`,
      message: `Your item cluster for order ${order.id} is now registered under status: ${status}.`,
      timestamp: new Date().toISOString(),
      read: false,
      category: "order"
    });

    saveDB();
    res.json({ success: true, order });
  });

  // GPS Emulator for Live tracking
  app.post("/api/orders/update-agent-location", (req, res) => {
    const { orderId, lat, lng, distanceKm } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (order) {
      order.liveLocation = {
        lat: Number(lat),
        lng: Number(lng),
        distanceKm: Number(distanceKm),
        lastUpdated: new Date().toISOString()
      };
      saveDB();
      return res.json({ success: true, order });
    }
    res.status(404).json({ success: false, error: "Order not found." });
  });

  // Verify delivery secure OTP with commissions and sales payouts logged
  app.post("/api/orders/verify-delivery-otp", (req, res) => {
    const { orderId, otp, proofPhotoUrl } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order context not found." });
    }

    if (!proofPhotoUrl && !order.proofPhotoUrl) {
      return res.status(400).json({ success: false, error: "Doorstep proof photo required to complete verification." });
    }

    if (!order.deliveryOtp || order.deliveryOtp !== otp) {
      return res.status(400).json({ success: false, error: "Incorrect 4-digit verification code. Confirm customer view OTP." });
    }

    order.status = "DELIVERED";
    order.items.forEach(i => i.status = "DELIVERED"); // mark all items
    if (proofPhotoUrl) order.proofPhotoUrl = proofPhotoUrl;
    order.deliveryOtp = undefined;
    order.deliveryOtpExpiry = undefined;

    order.statusTimeline.push({
      status: "DELIVERED",
      timestamp: new Date().toISOString()
    });

    const seller = dbData.sellers.find(s => s.id === order.sellerId);
    if (seller) {
      seller.totalSales = (seller.totalSales || 0) + 1;
    }

    // Save notification
    dbData.notifications.push({
      id: "not_" + Math.random().toString(36).substring(2, 7),
      userId: order.customerId,
      title: "Package Delivered Securely! ✅",
      message: `Your package with order ID ${order.id} has been verified and delivered. Touch logs for delivery proof.`,
      timestamp: new Date().toISOString(),
      read: false,
      category: "order"
    });

    saveDB();
    res.json({ success: true, order });
  });

  // Update specific item status for partial order support
  app.post("/api/orders/update-partial-item", (req, res) => {
    const { orderId, productId, status } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.productId === productId);
      if (item) {
        item.status = status;
        // If all items are delivered, set overall status to DELIVERED
        const allDelivered = order.items.every(i => i.status === "DELIVERED");
        if (allDelivered) {
          order.status = "DELIVERED";
        }
        order.statusTimeline.push({
          status: `Partially updated ${item.productName}: ${status}`,
          timestamp: new Date().toISOString()
        });
        saveDB();
        return res.json({ success: true, order });
      }
    }
    res.status(404).json({ success: false, error: "Order/item context not found." });
  });

  // ——————————————————————————————————————————————————————————
  // SELLER RATINGS & AUTO SUSPENSIONS ON REPORTS
  // ——————————————————————————————————————————————————————————
  app.post("/api/sellers/report", (req, res) => {
    const { sellerId, counts } = req.body;
    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (seller) {
      seller.reportCount = (seller.reportCount || 0) + (counts || 1);
      
      // Auto Suspension Trigger if reports exceed 5000
      if (seller.reportCount >= 5000) {
        seller.isSuspended = true;
        seller.isActive = false;
        seller.suspensionDate = new Date().toISOString();

        // Broadcast notification
        dbData.notifications.push({
          id: "not_" + Math.random().toString(36).substring(2, 7),
          userId: "all",
          title: "Merchant Flagged & Suspended!",
          message: `Notice: Shop ${seller.shopName} has been suspended internally for compliance inspection.`,
          timestamp: new Date().toISOString(),
          read: false,
          category: "system"
        });
      }
      saveDB();
      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false, error: "Seller profile not found." });
  });

  // Admin reinstate suspended seller
  app.post("/api/admin/reinstate-seller", (req, res) => {
    const { id, commissionRate } = req.body;
    const seller = dbData.sellers.find(s => s.id === id);
    if (seller) {
      seller.isSuspended = false;
      seller.isActive = true;
      seller.reportCount = 0;
      if (commissionRate !== undefined) {
        seller.commissionRate = Number(commissionRate);
      }
      saveDB();
      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false, error: "Seller not found." });
  });

  // Admin approves new seller and sets target commission
  app.post("/api/admin/approve-seller-with-commission", (req, res) => {
    const { id, commissionRate, categoryCommissionRates } = req.body;
    const seller = dbData.sellers.find(s => s.id === id);
    if (seller) {
      seller.isActive = true;
      seller.commissionRate = Number(commissionRate) || 8;
      if (categoryCommissionRates) {
        seller.categoryCommissionRates = categoryCommissionRates;
      }
      saveDB();

      // Notify seller
      dbData.notifications.push({
        id: "not_" + Math.random().toString(36).substring(2, 7),
        userId: seller.id,
        title: "Account Activated! 🚀",
        message: `Welcome to the platform! Admin set your platform commission profile to: ${seller.commissionRate}%. Go set product catalogs!`,
        timestamp: new Date().toISOString(),
        read: false,
        category: "system"
      });

      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false, error: "Seller profile not resolved." });
  });

  // Admin update commission anytime
  app.post("/api/admin/update-seller-commission", (req, res) => {
    const { id, commissionRate, categoryCommissionRates } = req.body;
    const seller = dbData.sellers.find(s => s.id === id);
    if (seller) {
      seller.commissionRate = Number(commissionRate);
      if (categoryCommissionRates) {
        seller.categoryCommissionRates = categoryCommissionRates;
      }
      
      // Notify seller
      dbData.notifications.push({
        id: "not_" + Math.random().toString(36).substring(2, 7),
        userId: seller.id,
        title: "Platform Terms Revised",
        message: `Your base e-commerce commission has been revised to: ${seller.commissionRate}%. Applied immediately on new checkouts.`,
        timestamp: new Date().toISOString(),
        read: false,
        category: "system"
      });

      saveDB();
      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false, error: "Seller not resolved." });
  });

  // ——————————————————————————————————————————————————————————
  // E-COMMERCE DISPUTE SYSTEM (Claims and manual reviews)
  // ——————————————————————————————————————————————————————————
  app.post("/api/disputes/create", (req, res) => {
    const { orderId, customerId, customerName, sellerId, sellerName, reason, description, customerEvidencePhoto } = req.body;
    const newDispute: Dispute = {
      id: "DISP-" + Math.floor(100 + Math.random() * 900),
      orderId,
      customerId,
      customerName,
      sellerId,
      sellerName,
      reason,
      description,
      status: "PENDING",
      customerEvidencePhoto,
      createdAt: new Date().toISOString()
    };
    dbData.disputes.unshift(newDispute);
    saveDB();
    res.json({ success: true, dispute: newDispute });
  });

  app.post("/api/disputes/submit-seller-evidence", (req, res) => {
    const { disputeId, sellerEvidencePhoto } = req.body;
    const disp = dbData.disputes.find(d => d.id === disputeId);
    if (disp) {
      disp.sellerEvidencePhoto = sellerEvidencePhoto;
      saveDB();
      return res.json({ success: true, dispute: disp });
    }
    res.status(404).json({ success: false, error: "Dispute case not found." });
  });

  app.post("/api/admin/resolve-dispute", (req, res) => {
    const { disputeId, status, resolutionReason } = req.body; // RESOLVED_CUSTOMER or RESOLVED_SELLER
    const disp = dbData.disputes.find(d => d.id === disputeId);
    if (disp) {
      disp.status = status;
      disp.resolutionReason = resolutionReason;

      const order = dbData.orders.find(o => o.id === disp.orderId);
      if (order && status === "RESOLVED_CUSTOMER") {
        // Automatic refund setup - cancel order status
        order.status = "RETURNED";
        order.statusTimeline.push({
          status: "CANCELLED_ADMIN_DISPUTE_REFUNDED",
          timestamp: new Date().toISOString()
        });
      }

      // Notify customer and seller
      dbData.notifications.push({
        id: "not_" + Math.random().toString(36).substring(2, 7),
        userId: disp.customerId,
        title: `Dispute ${disp.id} Resolved!`,
        message: `Admin finished reviewing documentation. Judgment status: ${status}. Reason: ${resolutionReason}`,
        timestamp: new Date().toISOString(),
        read: false,
        category: "order"
      });

      saveDB();
      return res.json({ success: true, dispute: disp });
    }
    res.status(404).json({ success: false, error: "Dispute resolve missing target." });
  });

  // ——————————————————————————————————————————————————————————
  // ADD ADMIN AGENT & GENERAL SELLER PROVISIONERS
  // ——————————————————————————————————————————————————————————
  app.post("/api/admin/add-agent", (req, res) => {
    const { name, mobile, password, sellerId } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, error: "All agent properties are mandatory." });
    }
    
    // Check mobile uniqueness across all agents
    const existsMobile = dbData.deliveryAgents.find(a => a.mobile === mobile);
    if (existsMobile) {
      return res.status(400).json({ success: false, error: "An agent is already registered with this mobile number." });
    }

    // Check password uniqueness across all agents
    const existsPassword = dbData.deliveryAgents.find(a => a.password === password);
    if (existsPassword) {
      return res.status(400).json({ success: false, error: "An agent is already registered with this secure password. Choose another." });
    }

    const node: DeliveryAgent = {
      id: "agent_" + Math.random().toString(36).substring(2, 7),
      name,
      mobile,
      password,
      status: "PENDING", // Defaults to PENDING for verification
      sellerId: sellerId || undefined
    };
    dbData.deliveryAgents.push(node);

    // Dynamic regular CUSTOMER user creation so they can login as customer first
    const customerExists = dbData.users.find(u => u.mobile === mobile);
    if (!customerExists) {
      dbData.users.push({
        id: "usr_" + Math.random().toString(36).substring(2, 7),
        name,
        mobile,
        password,
        address: "Registered Platform Delivery Partner",
        state: "West Bengal",
        district: "Kolkata",
        role: "CUSTOMER",
        followingSellers: [],
        profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60"
      });
    }

    saveDB();
    res.json({ success: true, agent: node });
  });

  // Edit / update agent details (Name, Password, Mobile)
  app.post("/api/seller/edit-agent", (req, res) => {
    const { agentId, name, mobile, password, status } = req.body;
    const agent = dbData.deliveryAgents.find(a => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent profile not found." });
    }

    if (mobile && mobile !== agent.mobile) {
      const existsMobile = dbData.deliveryAgents.find(a => a.mobile === mobile);
      if (existsMobile) {
        return res.status(400).json({ success: false, error: "Another agent already claims this mobile number." });
      }
    }

    if (password && password !== agent.password) {
      const existsPassword = dbData.deliveryAgents.find(a => a.password === password);
      if (existsPassword) {
        return res.status(400).json({ success: false, error: "Another agent already claims this password." });
      }
    }

    const oldMobile = agent.mobile;
    if (name) agent.name = name;
    if (mobile) agent.mobile = mobile;
    if (password) agent.password = password;
    if (status) agent.status = status;

    // Sync credentials to their corresponding Customer User profile to ensure seamless gateway login
    const matchingUser = dbData.users.find(u => u.mobile === oldMobile);
    if (matchingUser) {
      if (name) matchingUser.name = name;
      if (mobile) matchingUser.mobile = mobile;
      if (password) matchingUser.password = password;
    }

    saveDB();
    res.json({ success: true, agent });
  });

  // Delete agent
  app.post("/api/seller/delete-agent", (req, res) => {
    const { agentId } = req.body;
    const initialLen = dbData.deliveryAgents.length;
    dbData.deliveryAgents = dbData.deliveryAgents.filter(a => a.id !== agentId);
    if (dbData.deliveryAgents.length < initialLen) {
      saveDB();
      return res.json({ success: true, message: "Agent deleted successfully." });
    }
    res.status(404).json({ success: false, error: "Agent not found." });
  });

  // Seller approve, block or cancel agent statuses
  app.post("/api/seller/agent-status", (req, res) => {
    const { agentId, status } = req.body; // 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
    const agent = dbData.deliveryAgents.find(a => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found." });
    }
    agent.status = status;
    saveDB();
    res.json({ success: true, agent });
  });

  // Persist customer wishlist to the database
  app.post("/api/profile/wishlist", (req, res) => {
    const { userId, wishlist } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User identity required." });
    }
    const customer = dbData.users.find(u => u.id === userId);
    if (!customer) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }
    customer.wishlist = wishlist || [];
    saveDB();
    return res.json({ success: true, wishlist: customer.wishlist });
  });

  // Unified Profile setting updater so refresh doesn't wipe changes
  app.post("/api/profile/update", (req, res) => {
    const { userId, name, mobile, address, state, district, password, profilePhoto, altMobile, savedAddresses } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User identity required." });
    }

    // 1. If customer/general user
    const customer = dbData.users.find(u => u.id === userId);
    if (customer) {
      if (name) customer.name = name;
      if (mobile) customer.mobile = mobile;
      if (address) customer.address = address;
      if (state) customer.state = state;
      if (district) customer.district = district;
      if (password) customer.password = password;
      if (profilePhoto) customer.profilePhoto = profilePhoto;
      if (altMobile !== undefined) customer.altMobile = altMobile;
      if (savedAddresses !== undefined) customer.savedAddresses = savedAddresses;
      
      // Keep agent sync'd if they are also delivery partner
      const matchedAgent = dbData.deliveryAgents.find(a => a.mobile === customer.mobile || a.mobile === mobile);
      if (matchedAgent) {
        if (name) matchedAgent.name = name;
        if (mobile) matchedAgent.mobile = mobile;
        if (password) matchedAgent.password = password;
      }

      saveDB();
      return res.json({ success: true, user: customer });
    }

    // 2. If seller profile
    const seller = dbData.sellers.find(s => s.id === userId);
    if (seller) {
      if (name) {
        seller.ownerName = name;
        seller.shopName = name + "'s Mart";
      }
      if (mobile) seller.mobile = mobile;
      if (password) seller.password = password;
      if (profilePhoto) {
        seller.logo = profilePhoto;
      }
      saveDB();
      return res.json({ 
        success: true, 
        user: {
          id: seller.id,
          name: seller.ownerName,
          mobile: seller.mobile,
          profilePhoto: seller.logo,
          address: "Merchant Registered Store: " + seller.shopName,
          role: "SELLER"
        }
      });
    }

    // 3. If Admin profile
    if (userId === "admin") {
      if (name) dbData.adminDetails.name = name;
      if (mobile) dbData.adminDetails.contactNumber = mobile;
      if (profilePhoto) dbData.adminDetails.photoUrl = profilePhoto;
      saveDB();
      return res.json({
        success: true,
        user: {
          id: "admin",
          name: dbData.adminDetails.name,
          mobile: dbData.adminDetails.contactNumber,
          profilePhoto: dbData.adminDetails.photoUrl,
          address: "Admin Secretariat, New Delhi",
          state: "Delhi",
          district: "New Delhi",
          role: "ADMIN"
        }
      });
    }

    // 4. If delivery agent directly logging edits
    const agent = dbData.deliveryAgents.find(a => a.id === userId);
    if (agent) {
      if (name) agent.name = name;
      if (mobile) agent.mobile = mobile;
      if (password) agent.password = password;
      
      // Sync matching customer profile
      const matchedUser = dbData.users.find(u => u.mobile === agent.mobile);
      if (matchedUser) {
        if (name) matchedUser.name = name;
        if (mobile) matchedUser.mobile = mobile;
        if (password) matchedUser.password = password;
        if (profilePhoto) matchedUser.profilePhoto = profilePhoto;
      }
      saveDB();
      return res.json({
        success: true,
        user: {
          id: agent.id,
          name: agent.name,
          mobile: agent.mobile,
          profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
          address: "Platform Delivery Partner Office",
          role: "DELIVERY_AGENT"
        }
      });
    }

    res.status(404).json({ success: false, error: "Profile trace failed." });
  });

  // Admin save bio details
  app.post("/api/admin/save-details", (req, res) => {
    const { name, contactNumber, email, photoUrl, bio, bannedWords } = req.body;
    if (name) dbData.adminDetails.name = name;
    if (contactNumber) dbData.adminDetails.contactNumber = contactNumber;
    if (email) dbData.adminDetails.email = email;
    if (photoUrl) dbData.adminDetails.photoUrl = photoUrl;
    if (bio) dbData.adminDetails.bio = bio;
    if (bannedWords) dbData.adminDetails.bannedWords = bannedWords;
    saveDB();
    res.json({ success: true, details: dbData.adminDetails });
  });

  app.get("/api/admin/contacts", (req, res) => {
    res.json({
      success: true,
      admin: {
        name: dbData.adminDetails.name,
        contactNumber: dbData.adminDetails.contactNumber,
        email: dbData.adminDetails.email,
        photoUrl: dbData.adminDetails.photoUrl,
        bio: dbData.adminDetails.bio,
        bannedWords: dbData.adminDetails.bannedWords
      }
    });
  });

  // ——————————————————————————————————————————————————————————
  // NOTIFICATIONS SYSTEM (Read flags and logs)
  // ——————————————————————————————————————————————————————————
  app.get("/api/notifications", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ success: true, list: dbData.notifications });
    }
    // Return both broadcast 'all' and user-specific updates
    const list = dbData.notifications.filter(n => n.userId === "all" || n.userId === userId);
    res.json({ success: true, list });
  });

  app.post("/api/notifications/read-all", (req, res) => {
    const { userId } = req.body;
    dbData.notifications.forEach(n => {
      if (n.userId === "all" || n.userId === userId) {
        n.read = true;
      }
    });
    saveDB();
    res.json({ success: true });
  });

  // ——————————————————————————————————————————————————————————
  // LEGACY ENDPOINTS INTACT FOR ENTIRE COMPATIBILITY
  // ——————————————————————————————————————————————————————————
  app.post("/api/auth/register-customer", (req, res) => {
    const { name, mobile, address, state, district, password, profilePhoto } = req.body;
    let user = dbData.users.find(u => u.mobile === mobile);
    if (!user) {
      user = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name,
        mobile,
        profilePhoto: profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
        address,
        state,
        district,
        password,
        followingSellers: [],
        interests: []
      };
      dbData.users.push(user);
    } else {
      user.name = name;
      user.address = address;
      user.state = state;
      user.district = district;
      user.password = password || user.password;
    }
    saveDB();
    res.json({ success: true, user });
  });

  app.post("/api/auth/register-seller", (req, res) => {
    const { shopName, ownerName, mobile, logo, banner } = req.body;
    let seller = dbData.sellers.find(s => s.mobile === mobile);
    if (!seller) {
      seller = {
        id: "seller_" + Math.random().toString(36).substring(2, 9),
        shopName,
        ownerName,
        mobile,
        logo: logo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60",
        banner: banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
        rating: 5.0,
        totalSales: 0,
        followersCount: 0,
        isActive: false, 
        isVerified: false,
        joinDate: new Date().toISOString(),
        deliveryCharges: { "Delhi": { "New Delhi": 40 } }
      };
      dbData.sellers.push(seller);
    }
    saveDB();
    res.json({ success: true, seller, pendingApproval: true });
  });

  app.post("/api/seller/delivery-charge", (req, res) => {
    const { sellerId, charges } = req.body;
    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (seller) {
      seller.deliveryCharges = charges;
      saveDB();
      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false, error: "Seller profile not found." });
  });

  app.get("/api/auth/otp-list", (req, res) => {
    res.json({ success: true, list: dbData.otpRequests });
  });

  app.post("/api/auth/otp-mark-sent", (req, res) => {
    const { id } = req.body;
    const request = dbData.otpRequests.find(r => r.id === id);
    if (request) {
      request.sentAt = new Date().toISOString();
      saveDB();
      return res.json({ success: true, request });
    }
    res.status(404).json({ success: false, error: "OTP Request not found." });
  });

  app.post("/api/auth/otp-delete", (req, res) => {
    const { id } = req.body;
    dbData.otpRequests = dbData.otpRequests.filter(r => r.id !== id);
    saveDB();
    res.json({ success: true });
  });

  app.post("/api/sellers/follow-toggle", (req, res) => {
    const { customerId, sellerId } = req.body;
    const user = dbData.users.find(u => u.id === customerId);
    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (!user || !seller) {
      return res.status(404).json({ success: false });
    }
    const idx = user.followingSellers.indexOf(sellerId);
    let isFollowing = false;
    if (idx !== -1) {
      user.followingSellers.splice(idx, 1);
      seller.followersCount = Math.max(0, seller.followersCount - 1);
    } else {
      user.followingSellers.push(sellerId);
      seller.followersCount++;
      isFollowing = true;
    }
    saveDB();
    res.json({ success: true, isFollowing, followersCount: seller.followersCount });
  });

  app.post("/api/orders/payment-submit", (req, res) => {
    const { orderId, transactionId, screenshotUrl } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (order) {
      order.paymentDetails = { transactionId, screenshotUrl, verified: false };
      order.statusTimeline.push({ status: "PAYMENT_SUBMITTED", timestamp: new Date().toISOString() });
      saveDB();
      return res.json({ success: true, order });
    }
    res.status(404).json({ success: false });
  });

  app.post("/api/orders/payment-verify", (req, res) => {
    const { orderId, action, reason } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ success: false, error: "Ordered list not found" });

    if (order.paymentDetails) {
      if (action === "CONFIRM") {
        order.paymentDetails.verified = true;
        order.status = "CONFIRMED";
        order.statusTimeline.push({ status: "CONFIRMED", timestamp: new Date().toISOString() });
      } else {
        order.paymentDetails.verified = false;
        order.paymentDetails.verificationErrorReason = reason;
        order.status = "CANCELLED";
        order.statusTimeline.push({ status: "CANCELLED_PAYMENT_FAILED", timestamp: new Date().toISOString() });
        for (const item of order.items) {
          const prod = dbData.products.find(p => p.id === item.productId);
          if (prod) prod.stock += item.quantity;
        }
      }
      saveDB();
      return res.json({ success: true, order });
    }
    res.status(400).json({ success: false });
  });

  app.post("/api/orders/regenerate-delivery-otp", (req, res) => {
    const { orderId } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) return res.status(400).json({ success: false });
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = deliveryOtp;
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    order.deliveryOtpExpiry = expiry.toISOString();
    saveDB();
    res.json({ success: true, otp: deliveryOtp, expiry: order.deliveryOtpExpiry });
  });

  app.post("/api/orders/request-return", (req, res) => {
    const { orderId, reason, refundUpi } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ success: false });
    order.status = "RETURN_REQUESTED";
    order.returnDetails = { reason, refundUpi, refundCompleted: false };
    order.statusTimeline.push({ status: "RETURN_REQUESTED", timestamp: new Date().toISOString() });
    saveDB();
    res.json({ success: true, order });
  });

  app.post("/api/orders/confirm-return-refund", (req, res) => {
    const { orderId } = req.body;
    const order = dbData.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ success: false });
    order.status = "RETURNED";
    if (order.returnDetails) order.returnDetails.refundCompleted = true;
    order.statusTimeline.push({ status: "RETURNED", timestamp: new Date().toISOString() });
    for (const item of order.items) {
      const prod = dbData.products.find(p => p.id === item.productId);
      if (prod) prod.stock += item.quantity;
    }
    saveDB();
    res.json({ success: true, order });
  });

  app.post("/api/qa/ask", (req, res) => {
    const { productId, question, questionerName } = req.body;
    const qa: ProductQA = {
      id: "qa_" + Math.random().toString(36).substring(2, 9),
      productId,
      question,
      questionerName: questionerName || "Guest Customer",
      timestamp: new Date().toISOString(),
      answers: []
    };
    dbData.qas.unshift(qa);
    saveDB();
    res.json({ success: true, qa });
  });

  app.post("/api/qa/answer", (req, res) => {
    const { qaId, answer, answererName, isSeller, isBuyer } = req.body;
    const qa = dbData.qas.find(q => q.id === qaId);
    if (qa) {
      qa.answers.push({
        answererName,
        answer,
        isSeller: !!isSeller,
        isBuyer: !!isBuyer,
        timestamp: new Date().toISOString()
      });
      saveDB();
      return res.json({ success: true, qa });
    }
    res.status(404).json({ success: false });
  });

  app.post("/api/sellers/announce", (req, res) => {
    const { sellerId, text, image } = req.body;
    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (!seller) return res.status(404).json({ success: false });
    const ann: Announcement = {
      id: "ann_" + Math.random().toString(36).substring(2, 9),
      sellerId,
      sellerName: seller.shopName,
      sellerLogo: seller.logo,
      text,
      image,
      timestamp: new Date().toISOString(),
      likes: []
    };
    dbData.announcements.unshift(ann);
    saveDB();
    res.json({ success: true, announcement: ann });
  });

  app.delete("/api/admin/announcement/:id", (req, res) => {
    dbData.announcements = dbData.announcements.filter(a => a.id !== req.params.id);
    saveDB();
    res.json({ success: true });
  });

  app.post("/api/sellers/announce-like", (req, res) => {
    const { announcementId, customerId } = req.body;
    const ann = dbData.announcements.find(a => a.id === announcementId);
    if (ann) {
      const idx = ann.likes.indexOf(customerId);
      if (idx !== -1) {
        ann.likes.splice(idx, 1);
      } else {
        ann.likes.push(customerId);
      }
      saveDB();
      return res.json({ success: true, likesCount: ann.likes.length });
    }
    res.status(404).json({ success: false });
  });

  app.get("/api/chat", (req, res) => {
    res.json({ success: true, chats: dbData.chats });
  });

  app.post("/api/chat/send", (req, res) => {
    const { senderId, senderRole, senderName, message, productId, productName } = req.body;
    const msg: ChatMessage = {
      id: "chat_" + Math.random().toString(36).substring(2, 9),
      senderId,
      senderRole,
      senderName,
      message,
      timestamp: new Date().toISOString(),
      productId,
      productName
    };
    dbData.chats.push(msg);
    saveDB();
    res.json({ success: true, message: msg });
  });

  app.post("/api/admin/seller-status", (req, res) => {
    const { sellerId, active, verify } = req.body;
    const seller = dbData.sellers.find(s => s.id === sellerId);
    if (seller) {
      if (active !== undefined) seller.isActive = active;
      if (verify !== undefined) seller.isVerified = verify;
      saveDB();
      return res.json({ success: true, seller });
    }
    res.status(404).json({ success: false });
  });

  app.post("/api/admin/delete-seller", (req, res) => {
    const { sellerId, reason } = req.body;
    if (!sellerId) {
      return res.status(400).json({ success: false, error: "Seller ID is missing." });
    }
    const idx = dbData.sellers.findIndex(s => s.id === sellerId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Seller not found on record." });
    }
    const delSeller = dbData.sellers[idx];
    
    // Remove the seller
    dbData.sellers.splice(idx, 1);
    
    // Filter out their products
    dbData.products = dbData.products.filter(p => p.sellerId !== sellerId);
    
    // Add system notification for reasons
    const systemNotif = {
      id: "notif_" + Math.random().toString(36).substring(2, 9),
      userId: "all",
      title: "Merchant Outlet Removed",
      message: `Shop '${delSeller.shopName}' has been deleted. Reason: ${reason || "Violation of rules"}`,
      timestamp: new Date().toISOString(),
      read: false,
      category: "system" as const
    };
    dbData.notifications.push(systemNotif);
    
    saveDB();
    res.json({ success: true, message: "Seller deleted successfully." });
  });

  app.post("/api/admin/save-config", (req, res) => {
    const { upiId, qrImage, autoRankEnabled, minOrdersForRank, homeFeedBanner, broadcastText, appLogo } = req.body;
    if (upiId !== undefined) dbData.adminConfig.upiId = upiId;
    if (qrImage !== undefined) dbData.adminConfig.qrImage = qrImage;
    if (autoRankEnabled !== undefined) dbData.adminConfig.autoRankEnabled = autoRankEnabled;
    if (minOrdersForRank !== undefined) dbData.adminConfig.minOrdersForRank = Number(minOrdersForRank);
    if (homeFeedBanner !== undefined) dbData.adminConfig.homeFeedBanner = homeFeedBanner;
    if (broadcastText !== undefined) dbData.adminConfig.broadcastText = broadcastText;
    if (appLogo !== undefined) dbData.adminConfig.appLogo = appLogo;
    saveDB();
    res.json({ success: true, config: dbData.adminConfig });
  });

  // Vite development vs production configurations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KENA KATA] Express app server booted on port ${PORT}`);
  });
}

startServer();
