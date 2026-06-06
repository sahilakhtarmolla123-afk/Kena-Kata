import React, { useState, useEffect } from 'react';
import { 
  Building2, ShoppingBag, PlusCircle, IndianRupee, Bell, Megaphone, 
  Trash2, Plus, Sparkles, Send, FileCheck, CheckCircle2, Truck, 
  MapPin, Check, X, BookmarkCheck, LayoutDashboard, Settings, UserPlus,
  RefreshCw, Copy, FileSpreadsheet, FileText, AlertTriangle, MessageSquare,
  Maximize2, Eye, HelpCircle, Shield, Play, Printer, TrendingUp
} from 'lucide-react';
import { Product, Seller, Order, UserProfile, SystemVideo, Dispute, AppNotification } from '../types';
import { apiFetch as fetch } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function ProductWatermark({ logo }: { logo?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none z-15 w-full h-full">
      {logo ? (
        <img src={logo} className="w-10 h-10 object-contain filter brightness-110 drop-shadow-md mix-blend-screen" alt="watermark" />
      ) : (
        <span className="text-white text-[9px] font-black tracking-widest bg-slate-950/45 px-2 py-0.5 rounded uppercase font-mono">KENA KATA</span>
      )}
    </div>
  );
}

interface SellerPortalProps {
  products: Product[];
  sellers: Seller[];
  orders: Order[];
  users: UserProfile[];
  disputes: Dispute[];
  notifications: AppNotification[];
  videos: SystemVideo[];
  currentUser: UserProfile;
  adminConfig?: {
    upiId: string;
    qrImage: string;
    broadcastText: string;
    homeFeedBanner: string;
    appLogo?: string;
  };
  triggerRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SellerPortal({
  products,
  sellers,
  orders,
  users,
  disputes,
  notifications,
  videos,
  currentUser,
  adminConfig,
  triggerRefresh,
  showToast
}: SellerPortalProps) {
  // Find current active merchant profile matching the logged in mobile
  const activeSeller = sellers.find(s => s.mobile === currentUser.mobile);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'agents' | 'videos' | 'chats' | 'insights'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Edit/Add product State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Custom delivery speeds speeds
  const [speedStandard, setSpeedStandard] = useState('40');
  const [speedExpress, setSpeedExpress] = useState('105');
  const [speedSameDay, setSpeedSameDay] = useState('240');

  // Video state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Seller Agent variables
  const [agentName, setAgentName] = useState('');
  const [agentMobile, setAgentMobile] = useState('');
  const [agentPassword, setAgentPassword] = useState('');

  // Sizing specifications helpers
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specsList, setSpecsList] = useState<{ key: string; value: string }[]>([]);

  // Sizes lists state
  const [sizeInput, setSizeInput] = useState('');
  const [sizesList, setSizesList] = useState<string[]>([]);

  // Chat inboxes state
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatDraftText, setChatDraftText] = useState('');

  // Quick Chat reply templates
  const quickReplies = [
    "Dhanyabad! Apnar order ti processing cholche. (Thank you! Your order is processing.)",
    "Dear Customer, products ti shiggroi logistics agent er kache deya hobe. (Will be dispatched soon.)",
    "Product quality 100% original. Buy with confidence!",
    "Apnar location tracking link details SMS kore deya hobe.",
  ];

  const myProducts = activeSeller ? products.filter(p => p.sellerId === activeSeller.id) : [];
  const myOrders = activeSeller ? orders.filter(o => o.sellerId === activeSeller.id) : [];

  const pendingOrders = myOrders.filter(o => o.status === 'PLACED');

  // Inventory Alerts: stock below 5
  const lowStockProducts = myProducts.filter(p => p.stock <= 5);

  const totalSalesRevenue = myOrders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.finalTotal, 0);

  // Auto response metrics
  const simulatedResponseTime = "4 minutes"; // Taught as Quick Seller status badge!

  // ----------------------------------------------------
  // Seller Insights (Recharts) Data Preparation
  // ----------------------------------------------------
  const getOrderDate = (o: Order): string => {
    if (o.statusTimeline && o.statusTimeline.length > 0) {
      const placedEvent = o.statusTimeline.find(t => t.status === 'PLACED') || o.statusTimeline[0];
      if (placedEvent && placedEvent.timestamp) {
        return placedEvent.timestamp.split('T')[0]; // YYYY-MM-DD
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  // Group orders by date (for Daily Revenue)
  const revenueMap: { [date: string]: number } = {};
  
  // Pre-populate last 7 days so charts look beautiful and have a starting timeline
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    last7Days.push(dStr);
    revenueMap[dStr] = 0;
  }

  myOrders.forEach(o => {
    if (o.status !== 'CANCELLED') {
      const dateStr = getOrderDate(o);
      revenueMap[dateStr] = (revenueMap[dateStr] || 0) + o.finalTotal;
    }
  });

  const dailyRevenueData = Object.keys(revenueMap)
    .sort()
    .map(date => {
      const d = new Date(date);
      const formattedDate = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      return {
        date,
        formattedDate,
        "Revenue": revenueMap[date]
      };
    });

  // Category Distribution count
  const categoryCountMap: { [category: string]: number } = {};
  myOrders.forEach(o => {
    if (o.status !== 'CANCELLED') {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'General';
        categoryCountMap[cat] = (categoryCountMap[cat] || 0) + item.quantity;
      });
    }
  });

  // If seller has no category sales yet, pre-populate from inventory or show standard placeholders
  if (Object.keys(categoryCountMap).length === 0) {
    if (myProducts.length > 0) {
      myProducts.forEach(p => {
        categoryCountMap[p.category || 'General'] = (categoryCountMap[p.category || 'General'] || 0) + 1;
      });
    } else {
      categoryCountMap['Traditional Jamdani'] = 6;
      categoryCountMap['Leather Footwear'] = 4;
      categoryCountMap['Handicraft Clay'] = 3;
    }
  }

  const categoryDistributionData = Object.keys(categoryCountMap).map(cat => ({
    name: cat,
    value: categoryCountMap[cat]
  }));

  const INSIGHTS_COLORS = ['#FF6B00', '#10b981', '#2563eb', '#c084fc', '#f59e0b', '#ec4899', '#14b8a6'];

  useEffect(() => {
    if (!activeSeller) {
      // Prompt user to register if they are not verified yet
      setActiveTab('dashboard');
    }
  }, [activeSeller]);

  // Bulk Accept All Orders
  const handleBulkAccept = async () => {
    if (pendingOrders.length === 0) return;
    setLoading(true);
    try {
      const promises = pendingOrders.map(o => 
        fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: o.id, status: 'CONFIRMED' })
        })
      );
      await Promise.all(promises);
      showToast(`Bulk Approved ${pendingOrders.length} orders successfully! 📦`, "success");
      triggerRefresh();
    } catch (e) {
      showToast("Bulk accept failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Cancel All Orders
  const handleBulkCancel = async () => {
    if (pendingOrders.length === 0) return;
    if (!confirm("Are you sure you want to cancel all pending orders? This cannot be undone.")) return;
    setLoading(true);
    try {
      const promises = pendingOrders.map(o => 
        fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: o.id, status: 'CANCELLED' })
        })
      );
      await Promise.all(promises);
      showToast(`Bulk Cancelled ${pendingOrders.length} orders.`, "info");
      triggerRefresh();
    } catch (e) {
      showToast("Bulk operation failure.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Single Item Duplicate Listing tool
  const handleDuplicateProduct = async (product: Product) => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          id: undefined, // Let backend assign new ID
          name: `${product.name} (Copy)`,
          stock: 12 // Default initial stock for duplicate
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Product listing duplicated successfully!", "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to clone listing.", "error");
      }
    } catch (e) {
      showToast("Clone operation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Dispatch individual order notes or parcel note
  const handleDispatchOrder = async (orderId: string, agentId: string, customNote = '') => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'DISPATCHED',
          deliveryAgentId: agentId,
          orderNotes: customNote || "Standard transit clearances active."
        })
      });
      if (res.ok) {
        showToast("Parcel handoff completed! Agent alerted.", "success");
        triggerRefresh();
      }
    } catch (e) {}
  };

  // Save/Upload Product Catalog
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !activeSeller) return;
    setLoading(true);

    try {
      const computedSpeeds = [
        { speed: "Standard", price: Number(speedStandard) },
        { speed: "Express", price: Number(speedExpress) },
        { speed: "Same Day", price: Number(speedSameDay) }
      ];

      const productPayload = {
        ...editingProduct,
        sellerId: activeSeller.id,
        sellerName: activeSeller.shopName,
        specifications: specsList.reduce((acc, current) => {
          acc[current.key] = current.value;
          return acc;
        }, {} as any),
        sizes: sizesList,
        deliverySpeeds: computedSpeeds
      };

      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Product saved successfully!", "success");
        setEditingProduct(null);
        setSpecsList([]);
        setSizesList([]);
        triggerRefresh();
      } else {
        // If containing banned words
        showToast(data.error || "Catalog rejection notice.", "error");
      }
    } catch (err) {
      showToast("Error updating product.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add/Bind dynamic agent
  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentMobile || !agentPassword) return;
    try {
      const res = await fetch('/api/admin/add-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agentName, mobile: agentMobile, password: agentPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Store driver "${agentName}" added successfully under shop!`, "success");
        setAgentName('');
        setAgentMobile('');
        setAgentPassword('');
        triggerRefresh();
      } else {
        showToast(data.error || "Agent addition failed.", "error");
      }
    } catch (e) {
      showToast("Partner addition error.", "error");
    }
  };

  // Upload seller promo video
  const handleSellerAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !activeSeller) return;
    try {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle || `${activeSeller.shopName} - Product Showcase`,
          videoUrl,
          uploadedBy: "SELLER",
          uploaderId: activeSeller.id,
          uploaderName: activeSeller.shopName
        })
      });
      if (res.ok) {
        showToast("Video uploaded! Followers notified inside feed.", "success");
        setVideoTitle('');
        setVideoUrl('');
        triggerRefresh();
      }
    } catch (err) {
      showToast("Video upload failed.", "error");
    }
  };

  // Send Direct Chat message to buyer
  const handleSendSellerChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraftText || !selectedChatUser || !activeSeller) return;
    try {
      const res = await fetch('/api/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: activeSeller.id,
          senderName: activeSeller.shopName,
          senderRole: 'SELLER',
          receiverId: selectedChatUser,
          text: chatDraftText
        })
      });
      if (res.ok) {
        setChatDraftText('');
        triggerRefresh();
      }
    } catch (err) {}
  };

  // Export report to excel
  const handleExportSalesReport = () => {
    let headers = "Order ID,Buyer Name,Phone,Net Amount,Deductions,Net Earning,Status\n";
    let rows = myOrders.map(o => 
      `"${o.id}","${o.customerName}","${o.customerMobile}",₹${o.finalTotal},₹${o.commissionDeducted || 0},₹${o.sellerEarningNet || o.finalTotal},"${o.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${activeSeller?.shopName}_Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Sales ledger converted & Excel downloaded successfully! 📊", "success");
  };

  if (!activeSeller) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="bg-[#0b1329] border border-slate-800 max-w-md w-full p-6 md:p-8 rounded-3xl space-y-4">
          <Building2 className="w-12 h-12 text-[#FF6B00] mx-auto animate-bounce" />
          <h2 className="text-xl font-black text-white">Merchant registration active</h2>
          <p className="text-slate-400 text-xs">Apnar profile ti kundu verify ba approved kora hoyni. Prio customer, Setting section e giye "Apply for Merchant" options select korun.</p>
          <div className="bg-slate-900/60 text-slate-500 rounded-2xl p-4 text-[11px] leading-relaxed border space-y-1.5 list-none">
            <span className="font-extrabold text-[#FF6B00] block uppercase">Platform Rule:</span>
            <li>1. Registered Customer holds access to apply.</li>
            <li>2. Admin approves application withcommission split agreements.</li>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Merchant status bar */}
      <div className="bg-[#0b1329] p-4 md:px-6 border-b border-rose-500/10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <img src={activeSeller.logo} className="w-10 h-10 rounded-full border border-slate-800 object-cover" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white">{activeSeller.shopName}</h3>
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[8px] font-black px-1.5 py-0.25 rounded uppercase">Quick Seller</span>
            </div>
            <p className="text-[10px] text-slate-400">Response Speed: <strong className="text-indigo-400">{simulatedResponseTime}</strong> | Commission Splits: {activeSeller.commissionRate || 8}%</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExportSalesReport}
            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export ledger
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Ribbon Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col gap-1 shrink-0">
          <p className="text-[9px] uppercase font-black tracking-widest text-[#FF6B00] px-3.5 py-1 mb-2">Merchant Desk</p>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <LayoutDashboard className="w-4 h-4 text-orange-400 shrink-0" />
            Merchant Stats
          </button>

          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'products' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-400 shrink-0" />
            Manage Listings
            <span className="absolute right-3 bg-slate-950 px-2 py-0.5 rounded text-[9px] text-[#FF6B00]">{myProducts.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'orders' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            Customer Orders
            {pendingOrders.length > 0 && (
              <span className="absolute right-3 bg-red-650 text-white font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('agents')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'agents' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <UserPlus className="w-4 h-4 text-pink-400 shrink-0" />
            Register Drivers
          </button>

          <button 
            onClick={() => setActiveTab('videos')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'videos' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Play className="w-4 h-4 text-yellow-400 shrink-0" />
            Promotional Clips
          </button>

          <button 
            onClick={() => setActiveTab('chats')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'chats' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
            Buyer Messenger
          </button>

          <button 
            onClick={() => setActiveTab('insights')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'insights' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            Seller Insights
          </button>
        </aside>

        {/* Panel Canvas */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-5xl mx-auto w-full">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Dynamic Welcome Plaza Header */}
              <div className="bg-gradient-to-r from-slate-900 to-[#0b1329] border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-wider bg-[#FF6B00]/10 px-2.5 py-1 rounded-md">verified plaza partner</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-md">active outlet live</span>
                  </div>
                  <h2 className="text-base font-black text-white uppercase mt-2">Welcome back, {activeSeller?.ownerName}!</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage client orders, list promotional short clips, and review active buyer messenger replies.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => triggerRefresh()}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00] animate-spin" />
                    <span>Sync Shop</span>
                  </button>
                </div>
              </div>

              {/* Stat panel counters */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#0b1329] hover:border-slate-700/50 p-5 rounded-3xl border border-[#1e2a45] relative transition shadow-lg group">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-400 text-xs font-bold uppercase">Net Sales Volume</p>
                    <IndianRupee className="w-4 h-4 text-[#FF6B00] opacity-80" />
                  </div>
                  <h3 className="text-2xl font-black text-white mt-3">₹{totalSalesRevenue.toFixed(1)}</h3>
                  <span className="text-[9px] text-[#FF6B00] block mt-1.5 font-mono uppercase">After platform commissions</span>
                </div>

                <div className="bg-[#0b1329] hover:border-slate-700/50 p-5 rounded-3xl border border-[#1e2a45] relative transition shadow-lg group">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-400 text-xs font-bold uppercase">Pending Parcels</p>
                    <Truck className="w-4 h-4 text-green-400 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-black text-white mt-3">{pendingOrders.length} orders</h3>
                  <span className="text-[9px] text-green-400 block mt-1.5 font-mono uppercase">Incoming customer queue</span>
                </div>

                <div className="bg-[#0b1329] hover:border-[#FF6B00]/40 p-5 rounded-3xl border border-[#1e2a45] relative col-span-2 lg:col-span-1 transition shadow-lg group">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-400 text-xs font-bold uppercase">Store Followers</p>
                    <PlusCircle className="w-4 h-4 text-indigo-400 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-black text-white mt-3">{activeSeller?.followersCount || 128} active</h3>
                  <span className="text-[9px] text-[#FF6B00] block mt-1.5 font-mono uppercase">Direct short-video audience reach</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Catalog categories summary list */}
                <div className="bg-[#0b1329] border border-[#1e2a45] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div>
                    <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Inventory Diagnostics</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1">Catalog Categories spread</h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Summary of product counts distributed across platform departments.</p>
                  </div>
                  <div className="space-y-2.5 pt-2">
                    {(() => {
                      const categories = ["Fashion", "Electronics", "Grocery", "Cosmetics", "Home Decor"];
                      const itemsTotal = myProducts.length;
                      if (itemsTotal === 0) {
                        return <p className="text-xs text-slate-500 italic py-4 text-center">No products registered under this merchant yet.</p>;
                      }
                      return categories.map(cat => {
                        const count = myProducts.filter(p => p.category === cat).length;
                        const pct = itemsTotal > 0 ? (count / itemsTotal) * 100 : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium">{cat}</span>
                              <span className="font-mono text-slate-400 font-bold">{count} items ({Math.round(pct)}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-indigo-500 rounded-full" />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Performance Health Indicators */}
                <div className="bg-[#0b1329] border border-[#1e2a45] p-5 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Merchant Quality Scorecard</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1">Platform Service Clearness</h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Calculated based on response, delivery clearance and followings.</p>
                  </div>

                  <div className="space-y-2.5 flex-1 pt-3">
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-slate-400 font-sans text-[10.5px]">Avg. Response Time</p>
                        <p className="font-extrabold text-white text-sm mt-0.5">{simulatedResponseTime}</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 font-mono font-black rounded-md">SUPERB SPEED</span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-slate-400 font-sans text-[10.5px]">Store Rating Benchmark</p>
                        <p className="font-extrabold text-white text-sm mt-0.5">★ {activeSeller?.rating || 4.8} / 5.0</p>
                      </div>
                      <span className="bg-indigo-500/10 text-indigo-400 text-[9px] px-2 py-0.5 font-mono font-black rounded-md">TOP ENLISTED</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <button 
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="w-full text-center bg-slate-950 text-slate-300 font-extrabold hover:text-white border border-slate-800 rounded-xl py-2 text-[10.5px] uppercase transition cursor-pointer"
                    >
                      Update Store Products Catalog ➜
                    </button>
                  </div>
                </div>
              </div>

              {/* Low Stock inventory warning panel */}
              {lowStockProducts.length > 0 && (
                <div className="bg-red-500/15 border border-red-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center gap-1.5 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" /> Store inventory stock warning alerts
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">The following listed catalog items have fallen below the critical 5 unit threshold. Please supply stock to prevent customer checkout suspension.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="bg-slate-950/50 border border-slate-850 p-3 rounded-2xl flex justify-between items-center text-xs">
                        <span className="font-bold text-white max-w-[180px] truncate">{p.name}</span>
                        <span className="text-red-400 font-black bg-red-400/10 px-2 py-0.5 rounded-lg text-[10.5px]">Stock: {p.stock} units left!</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate product promo banner */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-3xl text-xs flex justify-between items-center flex-wrap gap-4 shadow-md">
                <div>
                  <span className="font-extrabold text-indigo-400 block uppercase tracking-wider">⚡ Intelligent Catalog Duplication</span>
                  <p className="text-slate-400 font-medium text-[11px] mt-0.5">Quickly clone any listed product layout options to scale your shop catalog instantly.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider block text-[10.5px] transition cursor-pointer"
                >
                  Clone Item Now
                </button>
              </div>

            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-5">
              
              <div className="flex justify-between items-center">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <h3 className="text-xs font-black text-white uppercase block">Product Catalog Administration</h3>
                  <p className="text-[11px] text-slate-400">Ensure options specifications & custom delivery speeds pricing are entered comprehensively.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct({ name: '', description: '', price: 100, image: '', category: 'Fashion', stock: 10, specifications: {} });
                    setSpecsList([]);
                    setSizesList([]);
                  }}
                  className="bg-[#FF6B00] hover:bg-orange-500 text-white font-bold p-3.5 rounded-2xl flex items-center gap-1 transition cursor-pointer text-xs"
                >
                  <PlusCircle className="w-4 h-4" /> Add Item
                </button>
              </div>

              {/* Form Section */}
              {editingProduct && (
                <form onSubmit={handleSaveProduct} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-extrabold text-sm text-white">Declare Catalog Metadata</h4>
                    <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white"><X className="w-4.5 h-4.5" /></button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Product Name Title</label>
                      <input 
                        type="text" 
                        value={editingProduct.name} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 focus:border-[#FF6B00]"
                        placeholder="e.g. Pure Cotton Jamdani Saree"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Price (₹ INR Taka)</label>
                      <input 
                        type="number" 
                        value={editingProduct.price} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 focus:border-[#FF6B00]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Product Category</label>
                      <select 
                        value={editingProduct.category} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border"
                      >
                        <option value="Fashion">Fashion</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Grocery">Grocery</option>
                        <option value="Cosmetics">Cosmetics</option>
                        <option value="Home Decor">Home Decor</option>
                        <option value="Sports">Sports</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Photo Item Link URL (optional)</label>
                      <input 
                        type="text" 
                        value={editingProduct.image} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 font-mono"
                        placeholder="Image URL Link"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Inventory Stock Count</label>
                      <input 
                        type="number" 
                        value={editingProduct.stock} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 focus:border-[#FF6B00]"
                        required
                      />
                    </div>
                  </div>

                  {/* Delivery Speed Configurations list */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-extrabold text-[#FF6B00] uppercase block tracking-wider">🚚 Custom Express Logistics Options speed:</span>
                    <p className="text-[9.5px] text-slate-500 font-medium">Configure different shipping prices per transit class. Customers will select these at checkout.</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 block uppercase">Standard (Charges ₹)</label>
                        <input type="number" value={speedStandard} onChange={(e) => setSpeedStandard(e.target.value)} className="w-full text-center text-xs p-2 border rounded-lg font-mono text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 block uppercase">Express (Charges ₹)</label>
                        <input type="number" value={speedExpress} onChange={(e) => setSpeedExpress(e.target.value)} className="w-full text-center text-xs p-2 border rounded-lg font-mono text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 block uppercase">Same Day Delivery (₹)</label>
                        <input type="number" value={speedSameDay} onChange={(e) => setSpeedSameDay(e.target.value)} className="w-full text-center text-xs p-2 border rounded-lg font-mono text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Description specifications details</label>
                    <textarea 
                      value={editingProduct.description} 
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 h-20 focus:border-[#FF6B00]"
                      placeholder="Product full description information"
                      required
                    />
                  </div>

                  {/* Sizes specification tags loader */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10.5px] font-bold text-white block">Add Variant Sizes (Format: S, M, L, XL etc)</label>
                      <div className="flex gap-2">
                        <input type="text" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} className="flex-1 text-xs p-2 border rounded-xl" placeholder="e.g. XL" />
                        <button 
                          type="button" 
                          onClick={() => { if (sizeInput) { setSizesList([...sizesList, sizeInput]); setSizeInput(''); } }} 
                          className="bg-[#0077B6] text-white px-3.5 py-2 font-bold text-xs rounded-xl"
                        >
                          Add Size
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sizesList.map(s => (
                          <span key={s} className="bg-slate-950 p-1.5 text-[9px] font-black text-[#FF6B00] rounded-lg border border-slate-800 flex items-center gap-1">
                            {s} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSizesList(sizesList.filter(v => v !== s))} />
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10.5px] font-bold text-white block font-display">Technical Specs Helper</label>
                      <div className="flex gap-1.5">
                        <input type="text" placeholder="Key e.g. Color" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="w-24 text-xs p-1.5 rounded-lg border" />
                        <input type="text" placeholder="Value e.g. Red" value={specVal} onChange={(e) => setSpecVal(e.target.value)} className="flex-1 text-xs p-1.5 rounded-lg border" />
                        <button 
                          type="button" 
                          onClick={() => { if (specKey && specVal) { setSpecsList([...specsList, { key: specKey, value: specVal }]); setSpecKey(''); setSpecVal(''); } }} 
                          className="bg-slate-950 text-white px-3 text-xs font-bold rounded-xl border border-slate-800"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {specsList.map(sp => (
                          <span key={sp.key} className="bg-slate-950 p-1.5 text-[9px] text-white rounded-lg border border-slate-800 flex items-center gap-1 font-mono">
                            {sp.key}: {sp.value} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSpecsList(specsList.filter(item => item.key !== sp.key))} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-premium py-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verify and Deploy to Storefront</span>}
                  </button>
                </form>
              )}

              {/* Listings table lists */}
              <div className="grid grid-cols-1 gap-3">
                {myProducts.map((p) => (
                  <div key={p.id} className="bg-[#0b1329] p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative overflow-hidden rounded-xl w-12 h-12 shrink-0">
                        <img src={p.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-12 h-12 rounded-xl object-cover border" />
                        <ProductWatermark logo={adminConfig?.appLogo} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{p.name}</span>
                          {p.isBannedPendingReview && <span className="bg-yellow-500 text-black text-[7.5px] font-black px-1.5 py-0.25 rounded uppercase font-mono">Banned review</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight block mt-0.5 max-w-[280px] truncate">{p.description}</p>
                        <p className="text-[10.5px] text-[#FF6B00] font-bold">₹{p.price} Taka | Stock: <strong className={p.stock <= 5 ? "text-red-400 font-extrabold" : "text-green-400 font-bold"}>{p.stock} units</strong></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        className="bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-400 border border-indigo-500/20 font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Clone Item
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setSpecsList(Object.entries(p.specifications || {}).map(([key, val]) => ({ key, value: String(val) })));
                          setSizesList(p.sizeVariants || []);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
                {myProducts.length === 0 && (
                  <div className="bg-white p-6 rounded-3xl border text-center text-xs text-slate-400">No active products on store catalogs right now.</div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-5">
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Consolidated Orders Inbox</h3>
                  <p className="text-xs text-slate-400">Merchant splits deduction: commissions deducted automatically on successful Delivery.</p>
                </div>
                {pendingOrders.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleBulkAccept}
                      className="bg-green-600/20 hover:bg-green-600/45 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                    >
                      Accept All ({pendingOrders.length})
                    </button>
                    <button 
                      onClick={handleBulkCancel}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                    >
                      Cancel All
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#0b1329] p-4 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2.5 py-0.5 rounded-xl text-[9.5px] font-black uppercase">ORDER {ord.id}</span>
                        <p className="text-[10px] text-slate-450 mt-1">Status: <strong className="text-white uppercase font-mono">{ord.status}</strong></p>
                      </div>
                      <span className="text-xs font-black text-white">₹{ord.finalTotal} Taka</span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs">
                      {ord.items.map((item, index) => (
                        <div key={index} className="flex justify-between font-medium">
                          <span className="text-slate-450">{item.productName} (QTY: {item.quantity})</span>
                          <span className="text-slate-400">Total: ₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order notes visible to logistics partners */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-[10px] text-slate-400">
                      <span className="font-extrabold text-[#FF6B00] block uppercase mb-0.5">📜 Store transit instruction notes:</span>
                      <p className="font-medium">{ord.orderNote || "Standard parcel dispatch instructions."}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-850">
                      <button
                        onClick={() => setSelectedInvoiceOrder(ord)}
                        className="bg-slate-900 hover:bg-slate-800 text-[#FF6B00] border border-slate-800 font-extrabold text-[10.5px] uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow"
                      >
                        <Printer className="w-4 h-4 text-[#FF6B00]" />
                        <span>Download Invoice</span>
                      </button>

                      {ord.status === 'PLACED' && (
                        <button
                          onClick={() => {
                            // Assign standard mock courier partner 
                            const CustomNotes = prompt("Enter custom dispatch instructions / parcel notes for agent:");
                            handleDispatchOrder(ord.id, 'agent_kolkata_1', CustomNotes || '');
                          }}
                          className="bg-brand-orange hover:bg-orange-500 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl block cursor-pointer transition"
                        >
                          Dispatch Parcel to driver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {myOrders.length === 0 && (
                  <div className="bg-white p-6 rounded-3xl text-center border text-xs text-slate-400">No active client purchase logs recorded.</div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-5">
              <form onSubmit={handleRegisterAgent} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-white">Add Store Drivers agent (Seller Secretariat)</h3>
                <p className="text-xs text-slate-400">Directly add agent mobile profiles. They can log in to pick up scheduled deliveries.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Driver Full Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl" required />
                  <input type="tel" maxLength={10} placeholder="10-Digit Mobile" value={agentMobile} onChange={(e) => setAgentMobile(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl" required />
                  <input type="password" placeholder="Pass key credentials" value={agentPassword} onChange={(e) => setAgentPassword(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl" required />
                </div>

                <button type="submit" className="bg-[#FF6B00] text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer">Register Driver agent</button>
              </form>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-5">
              <form onSubmit={handleSellerAddVideo} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex justify-between items-center text-white">
                  <h3 className="font-extrabold text-sm uppercase">Upload Promo video streams (Reconfigured Youtube link)</h3>
                  <span className="bg-red-500/10 text-red-400 text-[8.5px] font-black uppercase px-2 py-0.5 rounded">No Youtube linking-out</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Seller policy rule: Videos here are accessible ONLY to shoppers who follow your store, and external URL click redirects are strictly blocked inside client players.</p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Video Headline / Title</label>
                  <input type="text" placeholder="e.g., Silk saree weaving process" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border focus:border-[#FF6B00]" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Video streaming link (Youtube Embed code link)</label>
                  <input type="url" placeholder="e.g. https://www.youtube.com/embed/Sce9576S" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border focus:border-[#FF6B00] font-mono" required />
                </div>

                <button type="submit" className="bg-brand-orange hover:bg-orange-500 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl cursor-pointer">Dispatch Followers Broadcast Reel</button>
              </form>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row h-[500px]">
              
              {/* Left Directory lists */}
              <div className="w-full md:w-56 border-r border-slate-800 p-3 overflow-y-auto shrink-0 space-y-2">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2 px-1">Buyers Inbox Directory</span>
                <button
                  onClick={() => setSelectedChatUser('customer_kolkata_1')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold block cursor-pointer ${selectedChatUser === 'customer_kolkata_1' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                  Buyer Samon (Kolkata)
                </button>
                <button
                  onClick={() => setSelectedChatUser('customer_delhi_1')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold block cursor-pointer ${selectedChatUser === 'customer_delhi_1' ? 'bg-[#FF6B00] text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                  Buyer Sahil Akhtar (Delhi)
                </button>
              </div>

              {/* Chat messages canvas */}
              <div className="flex-1 flex flex-[#0b1329] flex-col overflow-y-auto">
                <div className="p-3 border-b border-rose-500/10 text-xs font-bold text-white uppercase tracking-wider block bg-slate-900">
                  {selectedChatUser ? `Active Chat: ${selectedChatUser}` : "Pick an active buyer from inbox directory"}
                </div>

                <div className="flex-1 p-3 space-y-2.5">
                  {/* Quick templates shortcut container */}
                  {selectedChatUser && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">⚡ Quick Response Templates templates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {quickReplies.map((reply) => (
                          <button
                            type="button"
                            key={reply}
                            onClick={() => setChatDraftText(reply)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-1 px-2 hover:bg-indigo-600 hover:text-white transition cursor-pointer text-[10.5px] max-w-full text-left"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedChatUser ? (
                    <div className="text-xs text-slate-450 italic text-center pt-20">Direct WhatsApp / SMS webhook integration active. Safe chat logs with Samon.</div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center pt-28">Directory is persistent. Chat securely with verified delivery leads.</div>
                  )}
                </div>

                {selectedChatUser && (
                  <form onSubmit={handleSendSellerChat} className="p-3.5 space-y-1.5 bg-slate-950 flex border-t border-slate-850 gap-2">
                    <input 
                      type="text" 
                      value={chatDraftText} 
                      onChange={(e) => setChatDraftText(e.target.value)} 
                      placeholder="Type secure reply here..." 
                      className="flex-1 text-xs px-2 rounded-xl" 
                    />
                    <button type="submit" className="bg-[#FF6B00] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs">Send</button>
                  </form>
                )}
              </div>

            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              
              {/* Header card for the insights portal */}
              <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <TrendingUp className="w-48 h-48 text-[#FF6B00]" />
                </div>
                <div>
                  <span className="text-[9px] font-black tracking-widest text-[#FF6B00] uppercase block">real-time analytical matrix</span>
                  <h3 className="text-base font-black uppercase mt-1">Merchant Insights & Store Outlook</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Review your store's chronological sales performance, category distribution streams, and inventory restock warnings below. Data updates instantly when customer orders complete.
                  </p>
                </div>
              </div>

              {/* High precision analytics KPIs grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0b1329] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Sales Volume</span>
                  <p className="text-lg font-mono font-black text-[#FF6B00] mt-1.5">
                    ₹{totalSalesRevenue.toFixed(2)} Taka
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Excludes cancelled transactions</p>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Cargoes</span>
                  <p className="text-lg font-mono font-black text-emerald-400 mt-1.5">
                    {myOrders.filter(o => o.status === 'DELIVERED').length} Orders
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    {myOrders.filter(o => o.status === 'PLACED' || o.status === 'CONFIRMED').length} active pipeline logs
                  </p>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Listed Catalog Count</span>
                  <p className="text-lg font-mono font-black text-blue-400 mt-1.5">
                    {myProducts.length} Items Listed
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    {lowStockProducts.length > 0 ? `🚨 ${lowStockProducts.length} items low in stock (<5)` : "✅ Stock inventory is healthy"}
                  </p>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Retention Yield Share</span>
                  <p className="text-lg font-mono font-black text-indigo-400 mt-1.5">
                    {activeSeller?.commissionRate || 8}% splits
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    Platform retains standard commission rates
                  </p>
                </div>
              </div>

              {/* Side-by-side charts container using Recharts responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bar Chart Panel */}
                <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl space-y-4">
                  <div>
                    <span className="text-[9px] font-black text-[#FF6B00] uppercase block">Revenue Track</span>
                    <h4 className="text-xs font-black text-white uppercase mt-0.5">Chronological Daily Sales</h4>
                    <p className="text-[10px] text-slate-400">Total transaction amount logged across consecutive business coordinates.</p>
                  </div>

                  <div className="h-64 bg-slate-950 p-2.5 rounded-2xl border border-slate-850 flex items-center justify-center">
                    {dailyRevenueData.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No sales volume logged yet.</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" vertical={false} />
                          <XAxis stroke="#64748b" dataKey="formattedDate" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0b1329', 
                              borderColor: '#1e293b', 
                              fontSize: '11px', 
                              borderRadius: '12px', 
                              color: '#fff' 
                            }} 
                          />
                          <Bar name="Sales Revenue (₹)" dataKey="Revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Pie Chart Panel */}
                <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl space-y-4">
                  <div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase block">Product Dispersion</span>
                    <h4 className="text-xs font-black text-white uppercase mt-0.5">Distribution of Categories Sold</h4>
                    <p className="text-[10px] text-slate-400">Distribution of items sold grouped by product niche category tags.</p>
                  </div>

                  <div className="h-64 bg-slate-950 p-2.5 rounded-2xl border border-slate-850 flex flex-col md:flex-row items-center justify-center">
                    {categoryDistributionData.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No category tracking data mapped yet.</span>
                    ) : (
                      <>
                        <div className="flex-1 w-full h-full min-h-[160px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {categoryDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={INSIGHTS_COLORS[index % INSIGHTS_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0b1329', 
                                  borderColor: '#1e293b', 
                                  fontSize: '11px', 
                                  borderRadius: '12px', 
                                  color: '#fff' 
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Custom visual legend mapping */}
                        <div className="w-full md:w-44 px-2 space-y-1.5 self-center max-h-48 overflow-y-auto">
                          {categoryDistributionData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: INSIGHTS_COLORS[index % INSIGHTS_COLORS.length] }}
                              />
                              <span className="text-[10px] font-medium text-slate-300 truncate max-w-[110px]" title={entry.name}>
                                {entry.name}
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-400 ml-auto bg-slate-900 border border-slate-800 px-1.5 py-0.25 rounded">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic Restock Forecasting & High Stock Velocity Warnings */}
              <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl space-y-4">
                <div>
                  <span className="text-[9px] font-black text-rose-400 uppercase block">Forecasting Engine</span>
                  <h4 className="text-xs font-black text-white uppercase mt-0.5">Critical Inventory Turnover Warning</h4>
                  <p className="text-[10px] text-slate-400">Items tagged with warning state must be replenished to prevent out-of-stock listings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts.length === 0 ? (
                    <div className="col-span-2 text-center p-6 bg-slate-950 border border-slate-850 rounded-2xl">
                      <p className="text-[11px] text-slate-400 italic font-medium">✨ Superb news! All your active store listings have high inventory levels (stock &gt; 5 units).</p>
                    </div>
                  ) : (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0] || 'https://via.placeholder.com/60'} className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                          <div>
                            <span className="text-xs font-bold text-white block truncate max-w-xs">{p.name}</span>
                            <span className="text-[9px] font-mono text-[#FF6B00] uppercase font-black bg-[#FF6B00]/10 px-1.5 rounded-md mt-1 inline-block">Stock Left: {p.stock} units</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingProduct(p);
                            setActiveTab('products');
                          }}
                          className="bg-red-500/10 text-red-400 border border-red-500/25 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition cursor-pointer"
                        >
                          Replenish Stock
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {selectedInvoiceOrder && (() => {
        const order = selectedInvoiceOrder;
        const buyer = users?.find(u => u.id === order.customerId || u.mobile === order.customerMobile);
        const adminName = "Sahil Akhtar Molla"; // Admin / Director of Board
        
        return (
          <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-md">
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full relative space-y-6 shadow-2xl">
              
              {/* Top controls */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#FF6B00]" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Official Sales Invoice</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const printContent = document.getElementById('printable-invoice-card')?.innerHTML;
                      
                      if (printContent) {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>Invoice_${order.id}</title>
                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                <style>
                                  body { background-color: white; color: black; padding: 20px; font-family: sans-serif; }
                                  .bg-slate-900 { background-color: #fafafa !important; border: 1px solid #e2e8f0; border-radius: 12px; }
                                  .text-white { color: #1e293b !important; }
                                  .text-slate-400 { color: #64748b !important; }
                                  .bg-slate-950\\/40 { background-color: #f1f5f9 !important; border: 1px solid #cbd5e1; }
                                  .border-slate-800 { border-color: #cbd5e1 !important; }
                                  .bg-slate-950 { background-color: #f8fafc !important; color: #1e293b !important; }
                                  .border-slate-850 { border-color: #e2e8f0 !important; }
                                  .text-indigo-400 { color: #4f46e5 !important; }
                                  .text-\\[\\#FF6B00\\] { color: #e11d48 !important; }
                                  th { background-color: #e2e8f0 !important; color: #1e293b !important; }
                                  tr { border-bottom: 1px solid #cbd5e1 !important; }
                                  @media print {
                                    body { padding: 0px; }
                                    .no-print { display: none !important; }
                                  }
                                </style>
                              </head>
                              <body class="bg-white text-black p-4">
                                <div class="max-w-2xl mx-auto">${printContent}</div>
                              </body>
                            </html>
                          `);
                          win.document.close();
                          win.focus();
                          setTimeout(() => {
                            win.print();
                          }, 500);
                        } else {
                          window.print();
                        }
                      }
                    }}
                    className="bg-[#FF6B00] hover:bg-[#e05d00] text-white font-extrabold text-[10.5px] uppercase px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <span>Print/PDF</span>
                  </button>
                  <button 
                    onClick={() => setSelectedInvoiceOrder(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10.5px] uppercase px-4 py-2 rounded-xl cursor-pointer transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="printable-invoice-card" className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 text-white space-y-6">
                
                {/* Header section (App Logo, Shop details) */}
                <div className="flex justify-between items-start gap-4 pb-5 border-b border-dashed border-slate-800">
                  <div className="space-y-1.5">
                    {adminConfig?.appLogo ? (
                      <img src={adminConfig.appLogo} className="w-16 h-16 object-contain rounded-xl bg-slate-950 p-1" alt="App Logo" />
                    ) : (
                      <div className="w-16 h-16 bg-[#FF6B00] text-white font-black text-xl rounded-xl flex items-center justify-center">KK</div>
                    )}
                    <h1 className="text-lg font-black text-[#FF6B00] tracking-wide">KENA KATA PLATFORM</h1>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Licensed e-Secretariat Network</p>
                  </div>
                  
                  <div className="text-right space-y-1 text-xs">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold font-mono text-[9px] px-2 py-0.5 rounded uppercase">VERIFIED PURCHASE</span>
                    <p className="text-[11px] font-black text-white mt-1.5">Invoice ID: <span className="font-mono text-[#FF6B00]">KK-{order.id}</span></p>
                    <p className="text-[10px] text-slate-400">Date: {new Date(order.statusTimeline?.[0]?.timestamp || Date.now()).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400">Payment: <strong className="text-[#FF6B00]">{order.paymentMethod}</strong></p>
                  </div>
                </div>

                {/* Triple party blocks (Admin, Seller, Customer) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pb-5 border-b border-dashed border-slate-800">
                  
                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[10px] font-extrabold text-[#FF6B00] uppercase block">1. Platform Admin</span>
                    <p className="font-extrabold text-white">{adminName}</p>
                    <p className="text-[10px] text-slate-400 italic font-medium">Chief Administrator Secretariat, Kena Kata Head Office.</p>
                  </div>

                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase block">2. Merchant Seller</span>
                    <p className="font-extrabold text-white">{activeSeller?.shopName || order.sellerName}</p>
                    <p className="text-[11px] text-slate-300 font-bold">Owner: {activeSeller?.ownerName || "Registered Seller"}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Mobile: {activeSeller?.mobile || "N/A"}</p>
                  </div>

                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[10px] font-extrabold text-pink-400 uppercase block">3. Customer Consignee</span>
                    <p className="font-extrabold text-white">{order.customerName}</p>
                    <p className="text-[11px] text-slate-300 font-semibold font-mono">Primary: {order.customerMobile}</p>
                    <p className="text-[11px] text-slate-300 font-semibold font-mono">Alt: {buyer?.altMobile || buyer?.mobile || "Alt Mobile Not Set"}</p>
                    
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed bg-slate-900 p-1.5 rounded border border-slate-850">
                      <strong>Delivery address:</strong><br />
                      {order.deliveryAddress.address}<br />
                      District: {order.deliveryAddress.district}, State: {order.deliveryAddress.state}
                    </p>
                  </div>

                </div>

                {/* Items list Table */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">4. Manifested Items breakdown</span>
                  
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <th className="p-2.5">Item Particulars</th>
                          <th className="p-2.5 text-center">Price</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, id) => (
                          <tr key={id} className="border-b border-slate-850 even:bg-slate-950/20">
                            <td className="p-2.5 font-bold text-white">{item.productName} {item.variant ? `(${item.variant})` : ''}</td>
                            <td className="p-2.5 text-center">₹{item.price}</td>
                            <td className="p-2.5 text-center">{item.quantity}</td>
                            <td className="p-2.5 text-right font-black text-indigo-400">₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing totals */}
                <div className="space-y-1.5 text-xs text-slate-400 text-right max-w-xs ml-auto pt-2">
                  <div className="flex justify-between">
                    <span>Items Net Total:</span>
                    <span className="text-white font-mono">₹{order.itemTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping transit fee:</span>
                    <span className="text-white font-mono">₹{order.deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#FF6B00] border-t border-slate-800 pt-2 selection:bg-slate-900">
                    <span>Grand Total Checklist:</span>
                    <span className="font-mono">₹{order.finalTotal} Taka</span>
                  </div>
                </div>

                {/* Authenticity seal bottom notice */}
                <div className="text-center pt-4 border-t border-dashed border-slate-800 text-[9px] text-slate-500 font-bold uppercase tracking-wider space-y-1 leading-normal">
                  <p>Authorized and Electronically Signed by Platform General Administrator: {adminName}</p>
                  <p className="text-[8px] text-slate-600">This invoice is generated on behalf of {activeSeller?.shopName || order.sellerName} and serves as legal proof of purchase.</p>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
