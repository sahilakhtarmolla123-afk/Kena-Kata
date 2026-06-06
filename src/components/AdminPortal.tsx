import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCw, Smartphone, CheckSquare, XCircle, Trash2, 
  Users, ShoppingBag, IndianRupee, Bell, Megaphone, BarChart3, 
  Check, Image as ImageIcon, PlusCircle, HelpCircle, UserCheck, 
  MapPin, Clock, ArrowRight, Download, Eye, FileSpreadsheet, FileText, Send,
  Bike, Plus, Ban, AlertTriangle, Play, HelpCircle as QuestionIcon, Percent, Sliders, Settings
} from 'lucide-react';
import { Product, Seller, Order, OtpRequest, ChatMessage, Announcement, Dispute, SystemVideo, AppNotification } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import ImageSelector from './ImageSelector';
import { apiFetch as fetch } from '../utils/api';

interface AdminPortalProps {
  products: Product[];
  sellers: Seller[];
  orders: Order[];
  otpRequests: OtpRequest[];
  chats: ChatMessage[];
  announcements: Announcement[];
  disputes: Dispute[];
  notifications: AppNotification[];
  videos: SystemVideo[];
  deliveryAgents: any[];
  referrals: any[];
  adminConfig: {
    upiId: string;
    qrImage: string;
    autoRankEnabled: boolean;
    minOrdersForRank: number;
    homeFeedBanner: string;
    broadcastText: string;
    appLogo?: string;
  };
  triggerRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toggleBuyerMode?: () => void;
}

export default function AdminPortal({
  products,
  sellers,
  orders,
  otpRequests,
  chats,
  announcements,
  disputes,
  notifications,
  videos,
  deliveryAgents,
  referrals,
  adminConfig,
  triggerRefresh,
  showToast,
  toggleBuyerMode
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'otps' | 'sellers' | 'payments' | 'config' | 'announcements' | 'analytics' | 'disputes' | 'revenue' | 'videos' | 'agents' | 'commissions' | 'add-product' | 'place-order'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (sectionName: string) => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      showToast(`${sectionName} Feed synchronized live!`, 'success');
    } catch (err) {
      showToast('Live synchronization failed. Try again.', 'error');
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  // Form State for Config
  const [upiId, setUpiId] = useState(adminConfig.upiId);
  const [qrImage, setQrImage] = useState(adminConfig.qrImage);
  const [autoRank, setAutoRank] = useState(adminConfig.autoRankEnabled);
  const [minOrders, setMinOrders] = useState(adminConfig.minOrdersForRank);
  const [homeFeedBanner, setHomeFeedBanner] = useState(adminConfig.homeFeedBanner);
  const [broadcastText, setBroadcastText] = useState(adminConfig.broadcastText);
  const [appLogo, setAppLogo] = useState(adminConfig.appLogo || "");

  // Admin Profile Settings Detail Form state
  const [adminName, setAdminName] = useState('Molla Sahil Akhtar');
  const [adminBio, setAdminBio] = useState('Super Administrator & General Architect of Kena Kata system. Direct billing contact.');
  const [adminContact, setAdminContact] = useState('9609495971');
  const [adminEmail, setAdminEmail] = useState('secretariat@kenakata.shop');
  const [adminPhoto, setAdminPhoto] = useState('https://lh3.googleusercontent.com/d/19n78bQLG7UDNICpat0W-CcHI39Wu796f');
  
  // Banned Words State
  const [bannedWordsInput, setBannedWordsInput] = useState('scam, cheat, fake, fakeitem, junk, bannedgoods');

  // Admin Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Fashion');
  const [newProdMrp, setNewProdMrp] = useState<number>(399);
  const [newProdPrice, setNewProdPrice] = useState<number>(299);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdSellerId, setNewProdSellerId] = useState('admin_store'); // default to admin store "Kena Kata"
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [tempProductImage, setTempProductImage] = useState('');

  // Admin Manual Order Booking States
  const [orderCustId, setOrderCustId] = useState('');
  const [orderCustName, setOrderCustName] = useState('');
  const [orderCustMobile, setOrderCustMobile] = useState('');
  const [orderCustAddress, setOrderCustAddress] = useState('');
  const [orderCustDistrict, setOrderCustDistrict] = useState('Kolkata');
  const [orderCustState, setOrderCustState] = useState('West Bengal');
  const [orderSelectedProduct, setOrderSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderDeliverySpeed, setOrderDeliverySpeed] = useState('standard');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'ONLINE' | 'COD'>('COD');
  const [orderNote, setOrderNote] = useState('');

  // Admin-to-Seller dynamic interaction states
  const [activeAdminChatSellerId, setActiveAdminChatSellerId] = useState<string | null>(null);
  const [adminChatDraft, setAdminChatDraft] = useState('');
  const [adminChatPhoto, setAdminChatPhoto] = useState('');
  const [sellerToDeleteId, setSellerToDeleteId] = useState<string | null>(null);
  const [deleteSellerReason, setDeleteSellerReason] = useState('');
  const [detailsSellerToShow, setDetailsSellerToShow] = useState<Seller | null>(null);

  // Keep local config state in sync with latest database props from parent (e.g. after refresh/updates)
  useEffect(() => {
    setUpiId(adminConfig.upiId);
    setQrImage(adminConfig.qrImage);
    setAutoRank(adminConfig.autoRankEnabled);
    setMinOrders(adminConfig.minOrdersForRank);
    setHomeFeedBanner(adminConfig.homeFeedBanner);
    setBroadcastText(adminConfig.broadcastText);
    setAppLogo(adminConfig.appLogo || "");
  }, [adminConfig]);

  // Fetch admin profile details on load and also when adminConfig changes (from parent refreshing)
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const res = await fetch('/api/admin/contacts');
        const data = await res.json();
        if (res.ok && data.success && data.admin) {
          if (data.admin.name) setAdminName(data.admin.name);
          if (data.admin.contactNumber) setAdminContact(data.admin.contactNumber);
          if (data.admin.email) setAdminEmail(data.admin.email);
          if (data.admin.photoUrl) setAdminPhoto(data.admin.photoUrl);
          if (data.admin.bio) setAdminBio(data.admin.bio);
          if (data.admin.bannedWords) setBannedWordsInput(data.admin.bannedWords.join(', '));
        }
      } catch (err) {
        console.error("Failed to load admin profile details:", err);
      }
    };
    fetchAdminDetails();
  }, [adminConfig]);

  // Flash Sale creation form State
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashProduct, setFlashProduct] = useState('');
  const [flashDiscount, setFlashDiscount] = useState('50');
  const [flashHours, setFlashHours] = useState('12');

  // Commission Setup Modal
  const [selectedSellerForCommission, setSelectedSellerForCommission] = useState<Seller | null>(null);
  const [sellerCommissionRate, setSellerCommissionRate] = useState<number>(8);
  const [fashionCommission, setFashionCommission] = useState<number>(10);
  const [electronicsCommission, setElectronicsCommission] = useState<number>(5);
  const [groceryCommission, setGroceryCommission] = useState<number>(3);

  // PDF Report & Excel/CSV Export states
  const [showInvoiceReportModal, setShowInvoiceReportModal] = useState(false);
  const [reportMerchantFilter, setReportMerchantFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportDateFilter, setReportDateFilter] = useState('ALL');

  // States for Dedicated Commission Setup screen
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [editingBaseRate, setEditingBaseRate] = useState<number>(8);
  const [editingCategoryRates, setEditingCategoryRates] = useState<{ [category: string]: number }>({
    "Fashion": 10,
    "Electronics": 8,
    "Grocery": 5,
    "Cosmetics": 8,
    "Home Decor": 8
  });

  // New Video State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // New Delivery Agent State
  const [agentName, setAgentName] = useState('');
  const [agentMobile, setAgentMobile] = useState('');
  const [agentPassword, setAgentPassword] = useState('');

  // Live Interactive Dashboard upgraded states
  const [dashboardChartType, setDashboardChartType] = useState<'line' | 'bar'>('line');
  const [dashboardMetric, setDashboardMetric] = useState<'revenue' | 'categories' | 'orders'>('revenue');
  const [simSelectedSellerId, setSimSelectedSellerId] = useState<string>('');
  const [simOrderAmount, setSimOrderAmount] = useState<number>(5000);
  const [simCategory, setSimCategory] = useState<string>('Fashion');

  // Active simulation counter
  const activeUsersToday = 54;

  // Revenue math
  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.finalTotal, 0);

  // System commissions math
  const totalCommissionsEarned = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.commissionDeducted || 0), 0);

  const pendingPayments = orders.filter(o => o.paymentMethod === 'ONLINE' && o.paymentDetails && !o.paymentDetails.verified && o.status === 'PLACED');
  const pendingSellers = sellers.filter(s => !s.isActive);

  // Recharts Chart Data (Revenue / Commission)
  const revenueChartData = [
    { name: 'Week 1', Revenue: totalRevenue * 0.2, Commission: totalCommissionsEarned * 0.2 },
    { name: 'Week 2', Revenue: totalRevenue * 0.45, Commission: totalCommissionsEarned * 0.45 },
    { name: 'Week 3', Revenue: totalRevenue * 0.7, Commission: totalCommissionsEarned * 0.7 },
    { name: 'Week 4', Revenue: totalRevenue, Commission: totalCommissionsEarned }
  ];

  // Dispute resolution form state
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Reset entire state callback
  const performSystemReset = async () => {
    if (!confirm("Are you sure you want to reset all order history, pending state and reseed defaults?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/db-reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast("System database reset & successfully re-seeded!", "success");
        triggerRefresh();
      }
    } catch (e) {
      showToast("Reset failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // OTP deep link / simulate whatsapp send
  const openWhatsAppMock = (otpReq: OtpRequest) => {
    const text = `Your Kena Kata login OTP is: ${otpReq.otp}. Valid for 10 minutes. — Team Kena Kata`;
    const deepLinkUrl = `https://wa.me/91${otpReq.mobile}?text=${encodeURIComponent(text)}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text);
    showToast(`OTP Message copied to clipboard! Opening WhatsApp window: ${otpReq.otp}`, "success");
    
    fetch('/api/auth/otp-mark-sent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: otpReq.id })
    }).then(() => triggerRefresh());

    window.open(deepLinkUrl, '_blank');
  };

  const deleteOtpRequest = async (id: string) => {
    try {
      await fetch('/api/auth/otp-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      triggerRefresh();
      showToast("OTP cleared from active log.", "info");
    } catch (e) {}
  };

  // Action Seller Status: Approve and prompt Commission rates setup
  const handleApproveSellerClick = (seller: Seller) => {
    setSelectedSellerForCommission(seller);
    setSellerCommissionRate(seller.commissionRate || 8);
  };

  const submitSellerActivation = async () => {
    if (!selectedSellerForCommission) return;
    setLoading(true);
    try {
      const categoryRates = {
        "Electronics": electronicsCommission,
        "Fashion": fashionCommission,
        "Grocery": groceryCommission
      };
      const res = await fetch('/api/admin/approve-seller-with-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSellerForCommission.id,
          commissionRate: sellerCommissionRate,
          categoryCommissionRates: categoryRates
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Seller ${selectedSellerForCommission.shopName} activated successfully with ${sellerCommissionRate}% commission!`, "success");
        setSelectedSellerForCommission(null);
        triggerRefresh();
      } else {
        showToast("Activation failed.", "error");
      }
    } catch (err) {
      showToast("Error approving seller profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveCommissionSetting = async (sellerId: string, rate: number) => {
    try {
      const res = await fetch('/api/admin/update-seller-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sellerId, commissionRate: rate })
      });
      if (res.ok) {
        showToast("Merchant commission structure updated & Seller notified!", "success");
        triggerRefresh();
      }
    } catch (e) {
      showToast("Commission update failed.", "error");
    }
  };

  // Suspend/reinstate manual controls
  const toggleSuspendSeller = async (seller: Seller) => {
    const isSus = seller.isSuspended;
    try {
      const endpoint = isSus ? '/api/admin/reinstate-seller' : '/api/sellers/report';
      const body = isSus ? { id: seller.id, commissionRate: seller.commissionRate || 8 } : { sellerId: seller.id, counts: 5000 };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast(isSus ? "Seller reinstated successfully!" : "Seller suspended and hidden platform-wide!", "success");
        triggerRefresh();
      }
    } catch (e) {
      showToast("Failed to change suspension state.", "error");
    }
  };

  // Submit Admin-to-Seller Chat Message
  const handleSendAdminChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeAdminChatSellerId) return;
    if (!adminChatDraft.trim() && !adminChatPhoto.trim()) return;

    let finalMessage = adminChatDraft;
    if (adminChatPhoto.trim()) {
      finalMessage += ` [📷 Photo: ${adminChatPhoto.trim()}]`;
    }

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'admin_sahil',
          senderRole: 'ADMIN',
          senderName: adminName || 'Molla Sahil Akhtar',
          message: finalMessage,
          productId: activeAdminChatSellerId,
          productName: 'Seller Direct Chat'
        })
      });
      if (res.ok) {
        setAdminChatDraft('');
        setAdminChatPhoto('');
        triggerRefresh();
        showToast("Message and photo attachment sent in live chat!", "success");
      } else {
        showToast("Failed to transmit chat message.", "error");
      }
    } catch (err) {
      showToast("Network transmission failure.", "error");
    }
  };

  // Submit complete Seller deletion with reason
  const handleDeleteSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerToDeleteId) return;
    if (!deleteSellerReason.trim()) {
      showToast("Please state a clear reason for deleting this merchant.", "error");
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: sellerToDeleteId,
          reason: deleteSellerReason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Merchant outlet and active listings removed from platform.", "success");
        setSellerToDeleteId(null);
        setDeleteSellerReason('');
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to remove merchant outlet.", "error");
      }
    } catch (err) {
      showToast("Network deletion error.", "error");
    }
  };

  // Verify payments screenshot
  const handlePaymentVerify = async (orderId: string, action: 'CONFIRM' | 'CANCEL', rejectReason = '') => {
    try {
      const res = await fetch('/api/orders/payment-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, reason: rejectReason })
      });
      if (res.ok) {
        showToast(action === 'CONFIRM' ? "Payment approved! Order confirmed." : "Payment marked invalid.", "success");
        triggerRefresh();
      }
    } catch (e) {}
  };

  // Dispute resolution trigger
  const resolveOrderDispute = async (status: 'RESOLVED_CUSTOMER' | 'RESOLVED_SELLER') => {
    if (!selectedDispute || !disputeReason) {
      showToast("Dispute resolution explanation is required.", "error");
      return;
    }
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status,
          resolutionReason: disputeReason
        })
      });
      if (res.ok) {
        showToast(`Dispute resolved successfully as ${status.replace('_', ' ')}!`, "success");
        setSelectedDispute(null);
        setDisputeReason('');
        triggerRefresh();
      }
    } catch (err) {
      showToast("Failed to post resolution.", "error");
    }
  };

  // Upload broadcast video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    try {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle || "Administrative Broadcast Live Stream",
          videoUrl,
          uploadedBy: "ADMIN",
          uploaderId: "admin",
          uploaderName: "Admin Molla Sahil Akhtar"
        })
      });
      if (res.ok) {
        showToast("Stream broadcast uploaded & dispatched to all customers!", "success");
        setVideoTitle('');
        setVideoUrl('');
        triggerRefresh();
      }
    } catch (err) {
      showToast("Stream deployment failed.", "error");
    }
  };

  // Add Delivery agent
  const handleAddDeliveryAgent = async (e: React.FormEvent) => {
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
        showToast(`Logistics Agent "${agentName}" added successfully!`, "success");
        setAgentName('');
        setAgentMobile('');
        setAgentPassword('');
        triggerRefresh();
      } else {
        showToast(data.error || "Agent addition failed.", "error");
      }
    } catch (e) {
      showToast("Network failure.", "error");
    }
  };

  // Save Admin custom settings profile
  const saveAdminDetailsAndBannedWords = async () => {
    try {
      const words = bannedWordsInput.split(',').map(w => w.trim()).filter(Boolean);
      const res = await fetch('/api/admin/save-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          contactNumber: adminContact,
          email: adminEmail,
          photoUrl: adminPhoto,
          bio: adminBio,
          bannedWords: words
        })
      });
      if (res.ok) {
        showToast("Secretariat details & Banned Words saved safely!", "success");
        triggerRefresh();
      }
    } catch (err) {
      showToast("Save failed.", "error");
    }
  };

  const saveSystemConfig = async () => {
    try {
      const res = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId,
          qrImage,
          broadcastText,
          homeFeedBanner,
          appLogo
        })
      });
      if (res.ok) {
        showToast("Gateway configurations saved successfully!", "success");
        triggerRefresh();
      }
    } catch (err) {
      showToast("System config update failed.", "error");
    }
  };

  // Admin Add Product Submission
  const handleAdminAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast("Please enter product name.", "error");
      return;
    }
    if (!newProdPrice || newProdPrice <= 0) {
      showToast("Please enter a valid price.", "error");
      return;
    }
    if (newProdMrp < newProdPrice) {
      showToast("MRP cannot be lower than the Selling Price.", "error");
      return;
    }
    if (newProdImages.length === 0) {
      showToast("Please upload or add at least one product photo.", "error");
      return;
    }

    setLoading(true);
    try {
      const selectedSeller = sellers.find(s => s.id === newProdSellerId);
      const sellerName = selectedSeller ? selectedSeller.shopName : "Kena Kata";
      const companyName = selectedSeller ? selectedSeller.ownerName : adminName;

      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: newProdSellerId,
          sellerName,
          companyName,
          name: newProdName,
          description: newProdDescription || `${newProdName} premium catalog item with high durability and pristine finishing.`,
          category: newProdCategory,
          mrp: Number(newProdMrp),
          price: Number(newProdPrice),
          stock: Number(newProdStock),
          images: newProdImages,
          specifications: [],
          deliverySpeeds: [
            { speed: "Standard", price: 40 },
            { speed: "Express", price: 75 }
          ]
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Catalog item "${newProdName}" dispatched and published successfully!`, "success");
        // Reset states
        setNewProdName('');
        setNewProdDescription('');
        setNewProdMrp(399);
        setNewProdPrice(299);
        setNewProdStock(50);
        setNewProdImages([]);
        setTempProductImage('');
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to publish product listing.", "error");
      }
    } catch (err) {
      showToast("Network failure adding product.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Admin Manual Side Product Order Booking
  const handleAdminPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSelectedProduct) {
      showToast("Please choose a product to order.", "error");
      return;
    }
    if (!orderCustName.trim() || !orderCustMobile.trim() || !orderCustAddress.trim()) {
      showToast("Please fill in customer name, mobile, and address details.", "error");
      return;
    }
    if (orderQuantity <= 0) {
      showToast("Invalid product order quantity range selected.", "error");
      return;
    }
    if (orderSelectedProduct.stock < orderQuantity) {
      showToast(`Warning: Only ${orderSelectedProduct.stock} units are currently in stock.`, "error");
      return;
    }

    setLoading(true);
    try {
      // Find delivery charges based on selected speed
      let deliveryCharge = 40;
      if (orderDeliverySpeed === 'express') deliveryCharge = 75;
      if (orderDeliverySpeed === 'sameday') deliveryCharge = 150;

      const itemTotal = orderSelectedProduct.price * orderQuantity;
      const discountTotal = (orderSelectedProduct.mrp - orderSelectedProduct.price) * orderQuantity;
      const finalTotal = itemTotal + deliveryCharge;

      const estimatedDateObj = new Date();
      if (orderDeliverySpeed === 'standard') estimatedDateObj.setDate(estimatedDateObj.getDate() + 4);
      else if (orderDeliverySpeed === 'express') estimatedDateObj.setDate(estimatedDateObj.getDate() + 2);
      else estimatedDateObj.setDate(estimatedDateObj.getDate() + 1);

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: orderCustId || 'manual_cust_' + Math.floor(Math.random() * 1000000),
          customerName: orderCustName.trim(),
          customerMobile: orderCustMobile.trim(),
          deliveryAddress: {
            name: orderCustName.trim(),
            address: orderCustAddress.trim(),
            district: orderCustDistrict.trim(),
            state: orderCustState.trim()
          },
          sellerId: orderSelectedProduct.sellerId,
          items: [
            {
              productId: orderSelectedProduct.id,
              productName: orderSelectedProduct.name,
              price: orderSelectedProduct.price,
              quantity: orderQuantity,
              variant: "Standard SKU"
            }
          ],
          paymentMethod: orderPaymentMethod,
          deliveryCharge,
          itemTotal,
          discountTotal,
          finalTotal,
          selectedDeliverySpeed: orderDeliverySpeed.toUpperCase(),
          estimatedDeliveryDate: estimatedDateObj.toLocaleDateString(),
          orderNote: orderNote.trim() || "Manually placed through Admin Command Panel."
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Manual Product Order nested successfully on behalf of ${orderCustName}!`, "success");
        // Reset states
        setOrderCustId('');
        setOrderCustName('');
        setOrderCustMobile('');
        setOrderCustAddress('');
        setOrderCustDistrict('Kolkata');
        setOrderCustState('West Bengal');
        setOrderSelectedProduct(null);
        setOrderQuantity(1);
        setOrderDeliverySpeed('standard');
        setOrderPaymentMethod('COD');
        setOrderNote('');
        triggerRefresh();
        setActiveTab('dashboard'); // take them back to the active list
      } else {
        showToast(data.error || "Order insertion failed. Check state properties.", "error");
      }
    } catch (err) {
      showToast("Manual Order transmission error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const createFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashProduct) return;
    const prod = products.find(p => p.id === flashProduct);
    if (!prod) return;
    const future = new Date();
    future.setHours(future.getHours() + Number(flashHours));

    try {
      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prod,
          flashSale: {
            discountPercent: Number(flashDiscount),
            startTime: new Date().toISOString(),
            endTime: future.toISOString(),
            approved: true
          }
        })
      });
      if (res.ok) {
        showToast(`⚡ Flash sale launched successfully on ${prod.name}!`, "success");
        setShowFlashModal(false);
        triggerRefresh();
      }
    } catch (e) {
      showToast("Failed to create Flash sale", "error");
    }
  };

  // Excel Operational CSV Export
  const exportToExcelOfCommissions = () => {
    let headers = "Order ID,Merchant Shop,Category Total,Commission Rate Applied,Commission Earned (Taka),Date\n";
    let rows = orders.filter(o => o.status === 'DELIVERED').map(o => 
      `"${o.id}","${o.sellerName}",₹${o.finalTotal},"${o.commissionRateApplied}%",₹${o.commissionDeducted},"${o.statusTimeline[0]?.timestamp.split('T')[0]}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `KenaKata_Merchant_Commissions_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    showToast("Merchant Commissions Spreadsheets exported!", "success");
  };

  // Excel/CSV Export for All Platform Orders and Sales Data
  const exportOrdersToExcel = () => {
    let headers = "Order ID,Customer Mobile,Merchant Shop,Products Count,Items Purchased,Gross Total (Taka),Status,State,District,Shipping Address,Date Generated\n";
    let rows = orders.map(o => {
      const itemsList = o.items.map(item => `${item.productName} x${item.quantity}`).join(" | ");
      return `"${o.id}","${o.customerMobile}","${o.sellerName}",${o.items.length},"${itemsList.replace(/"/g, '""')}",₹${o.finalTotal},"${o.status}","${o.deliveryAddress.state}","${o.deliveryAddress.district}","${o.deliveryAddress.address.replace(/"/g, '""')}","${o.statusTimeline[0]?.timestamp?.split('T')[0] || ''}"`;
    }).join("\n");
    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `KenaKata_All_Orders_Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    showToast("Platform orders and sales ledger spreadsheet exported successfully!", "success");
  };

  // Filter and calculated metrics for dynamic PDF reporting
  const getFilteredReportOrders = () => {
    return orders.filter(o => {
      const matchMerchant = reportMerchantFilter === 'ALL' || o.sellerId === reportMerchantFilter;
      const matchStatus = reportStatusFilter === 'ALL' || o.status === reportStatusFilter;
      
      let matchDate = true;
      if (reportDateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        const ordDate = o.statusTimeline?.[0]?.timestamp?.split('T')[0];
        matchDate = ordDate === todayStr;
      } else if (reportDateFilter === 'WEEK') {
        const ordDate = new Date(o.statusTimeline?.[0]?.timestamp || "").getTime();
        const now = new Date().getTime();
        const diffDays = (now - ordDate) / (1000 * 60 * 60 * 24);
        matchDate = diffDays <= 7;
      }
      
      return matchMerchant && matchStatus && matchDate;
    });
  };

  const handlePrintInvoiceReport = () => {
    const reportOrdersList = getFilteredReportOrders();
    const reportTotalOrders = reportOrdersList.length;
    const reportGrossRevenue = reportOrdersList.reduce((sum, o) => sum + o.finalTotal, 0);
    const reportCommissions = reportOrdersList.reduce((sum, o) => sum + (o.status === "DELIVERED" ? (o.commissionDeducted || 0) : 0), 0);
    const reportAverageOrder = reportTotalOrders > 0 ? reportGrossRevenue / reportTotalOrders : 0;

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (!printWindow) {
      showToast("Please disable popup blockers to create the print file.", "error");
      return;
    }
    
    const ordersRowsHtml = reportOrdersList.map(o => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px 8px;">${o.id}</td>
        <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${o.sellerName}</td>
        <td style="padding: 10px 8px;">${o.customerMobile}</td>
        <td style="padding: 10px 8px; max-width: 280px; word-break: break-all;">${o.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}</td>
        <td style="padding: 10px 8px; font-weight: bold; text-align: right; color: #0f172a;">₹${o.finalTotal}</td>
        <td style="padding: 10px 8px; font-weight: bold; text-align: center;"><span style="background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-family: monospace;">${o.status}</span></td>
        <td style="padding: 10px 8px; text-align: right; color: #475569;">${o.statusTimeline[0]?.timestamp?.split('T')[0] || ''}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Kena Kata Commercial Sales Ledger Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 24px; line-height: 1.4; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .stat-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
            .stat-card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 12px; background: #fff; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; }
            .stat-value { font-size: 18px; font-weight: 955; margin-top: 4px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { border-bottom: 1px solid #0f172a; padding: 10px 8px; font-size: 9.5px; text-transform: uppercase; color: #64748b; font-weight: 800; }
            .sub-info { font-size: 11px; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; color: #64748b; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header-grid">
            <div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #FF6B00;">Kena Kata</h2>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: bold; color: #64748b;">Official Commercial Sales & Invoice Ledger Statement</p>
            </div>
            <div style="text-align: right; font-size: 11px; line-height: 1.5;">
              <div><strong>Generated Date:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>Administrator:</strong> ${adminName} (${adminContact})</div>
              <div><strong>Secretariat Contact:</strong> ${adminEmail}</div>
            </div>
          </div>

          <div class="stat-container">
            <div class="stat-card">
              <div class="stat-label">Total Selected Orders</div>
              <div class="stat-value">${reportTotalOrders}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gross GMV Amount</div>
              <div class="stat-value" style="color: #FF6B00;">₹${reportGrossRevenue.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Delivered Commissions</div>
              <div class="stat-value" style="color: #10b981;">₹${reportCommissions.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Order GMV</div>
              <div class="stat-value" style="color: #3b82f6;">₹${reportAverageOrder.toFixed(2)}</div>
            </div>
          </div>

          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; color: #0f172a;">Active Statement Ledger Listings</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Merchant Partner</th>
                <th>Customer Mobile</th>
                <th>Purchased Catalog Items</th>
                <th style="text-align: right;">Billing Total</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Generated Date</th>
              </tr>
            </thead>
            <tbody>
              ${ordersRowsHtml || `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">No active order entries match selected filters.</td></tr>`}
            </tbody>
          </table>

          <div class="sub-info">
            <div>
              <strong>Kena Kata Secretariat Signature:</strong><br/>
              <span style="font-weight: 900; color: #0f172a; font-size: 13px; font-family: Cambria, Georgia, serif; font-style: italic;">${adminName}</span><br/>
              <span>System General Architect & Clerk of Works</span>
            </div>
            <div style="text-align: right; line-height: 1.5;">
              <small>System Security Authenticated Document. No physical signature required.</small><br/>
              <small>© 2026 Kena Kata Commercial Network. All records archived.</small>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Admin sub-header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 md:px-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-white font-display uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF6B00]" /> Admin Secretariat Space
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold font-mono">Secured credentials verified dynamically. Pervasive tracking systems active.</p>
        </div>

        {toggleBuyerMode && (
          <button
            onClick={toggleBuyerMode}
            className="bg-[#FF6B00] hover:bg-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-orange-500/25 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Storefront like Customer</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col gap-1 shrink-0">
          <p className="text-[9px] uppercase font-black tracking-widest text-[#FF6B00] px-3.5 py-1 mb-2">Workspace Controls</p>
          
          {toggleBuyerMode && (
            <button 
              onClick={toggleBuyerMode}
              className="w-full text-left px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer bg-slate-950/80 border border-dashed border-[#FF6B00]/50 text-orange-400 hover:bg-slate-800 mb-2"
            >
              <ShoppingBag className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span>Browse Store/Cart View</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BarChart3 className="w-4 h-4 text-orange-400 shrink-0" />
            Live Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('otps')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'otps' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
            OTP Secretariat
            {otpRequests.length > 0 && (
              <span className="absolute right-3 top-3 bg-red-650 text-white font-black text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                {otpRequests.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('sellers')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'sellers' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            Sellers Approval
            {pendingSellers.length > 0 && (
              <span className="absolute right-3 top-3 bg-emerald-550 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                {pendingSellers.length} New
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('revenue')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'revenue' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <IndianRupee className="w-4 h-4 text-cyan-400 shrink-0" />
            Commission Split
          </button>

          <button 
            onClick={() => setActiveTab('commissions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'commissions' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Percent className="w-4 h-4 text-pink-400 shrink-0" />
            Commission Setup
          </button>

          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'payments' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <CheckSquare className="w-4 h-4 text-yellow-400 shrink-0" />
            Verify Payments
            {pendingPayments.length > 0 && (
              <span className="absolute right-3 top-3 bg-cyan-650 text-slate-900 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                {pendingPayments.length} Active
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('disputes')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${activeTab === 'disputes' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            Dispute Reviews
            {disputes.filter(d => d.status === 'PENDING').length > 0 && (
              <span className="absolute right-3 top-3 bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                {disputes.filter(d => d.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('videos')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'videos' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Play className="w-4 h-4 text-pink-400 shrink-0" />
            Upload Broadcasts
          </button>

          <button 
            onClick={() => setActiveTab('agents')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'agents' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Bike className="w-4 h-4 text-green-400 shrink-0" />
            Delivery Partners
          </button>

          <button 
            onClick={() => setActiveTab('config')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'config' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
            Admin Settings
          </button>

          <button 
            onClick={() => {
              setActiveTab('add-product');
              const approvedSellers = sellers.filter(s => s.isActive);
              if (approvedSellers.length > 0 && !newProdSellerId) {
                setNewProdSellerId(approvedSellers[0].id);
              }
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'add-product' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Plus className="w-4 h-4 text-[#FF6B00] shrink-0" />
            Add Products
          </button>

          <button 
            onClick={() => {
              setActiveTab('place-order');
              if (products.length > 0 && !orderSelectedProduct) {
                setOrderSelectedProduct(products[0]);
              }
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${activeTab === 'place-order' ? 'bg-[#FF6B00] text-white shadow' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ShoppingBag className="w-4 h-4 text-[#FF6B00] shrink-0" />
            Place Manual Order
          </button>
        </aside>

        {/* Dynamic Panel Canvas */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-5xl mx-auto w-full">
          
          {activeTab === 'dashboard' && (() => {
            // Pick default sim seller
            const approvedSellers = sellers.filter(s => s.isActive);
            const simSeller = approvedSellers.find(s => s.id === simSelectedSellerId) || approvedSellers[0];
            const activeRate = simSeller 
              ? (simSeller.categoryCommissionRates?.[simCategory] ?? simSeller.commissionRate ?? 8) 
              : 8;
            const simPlatformCut = (simOrderAmount * activeRate) / 100;
            const simSellerCut = simOrderAmount - simPlatformCut;

            // Category counts
            const categoryMap: { [key: string]: number } = {};
            products.forEach(p => {
              categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
            });
            const categoryChartData = Object.keys(categoryMap).map(cat => ({
              name: cat,
              "Product Count": categoryMap[cat]
            }));

            // Orders status counts
            const orderStatusMap: { [key: string]: number } = {};
            orders.forEach(o => {
              orderStatusMap[o.status] = (orderStatusMap[o.status] || 0) + 1;
            });
            const orderStatusChartData = Object.keys(orderStatusMap).map(status => ({
              name: status,
              "Orders": orderStatusMap[status]
            }));

            // Recent 3 orders
            const recentOrders = [...orders].sort((a,b) => {
              const timeA = new Date(a.statusTimeline?.[0]?.timestamp || 0).getTime();
              const timeB = new Date(b.statusTimeline?.[0]?.timestamp || 0).getTime();
              return timeB - timeA;
            }).slice(0, 3);

            return (
              <div className="space-y-6">
                
                {/* Dashboard Control Header */}
                <div className="bg-gradient-to-r from-slate-900 to-[#0b1329] border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9.5px] font-black text-[#FF6B00] uppercase tracking-wider bg-[#FF6B00]/10 px-2.5 py-1 rounded-md">Live Executive Console</span>
                    <h2 className="text-base font-black text-white uppercase mt-1">Mouchak Bazaar Central Analytics</h2>
                    <p className="text-xs text-slate-400 mt-1">Real-time indicators, dynamic revenue configurations, and platform commission ledger diagnostics.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={() => triggerRefresh()}
                      className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00] animate-spin" />
                      <span>Sync Ledger</span>
                    </button>
                  </div>
                </div>

                {/* 4 State Analytics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0b1329] hover:bg-slate-850 hover:border-slate-700/50 p-4 rounded-3xl border border-[#1e2a45] relative overflow-hidden flex flex-col justify-between transition group shadow-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Active Customers</p>
                      <Users className="w-4 h-4 text-[#FF6B00] opacity-80 group-hover:scale-110 transition" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{activeUsersToday}</h3>
                      <span className="text-[9.5px] text-emerald-400 font-mono mt-1.5 block font-bold">● High Session Traffic</span>
                    </div>
                  </div>

                  <div className="bg-[#0b1329] hover:bg-slate-850 hover:border-slate-700/50 p-4 rounded-3xl border border-[#1e2a45] relative overflow-hidden flex flex-col justify-between transition group shadow-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Sales (GMT)</p>
                      <ShoppingBag className="w-4 h-4 text-emerald-400 opacity-80 group-hover:scale-110 transition" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">₹{totalRevenue}</h3>
                      <span className="text-[9.5px] text-slate-400 font-mono mt-1.5 block font-bold">Gross trading volume</span>
                    </div>
                  </div>

                  <div className="bg-[#0b1329] hover:bg-slate-850 hover:border-[#FF6B00]/40 p-4 rounded-3xl border border-[#FF6B00]/20 relative overflow-hidden flex flex-col justify-between transition group shadow-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Admin Commission</p>
                      <IndianRupee className="w-4 h-4 text-[#FF6B00] opacity-80 group-hover:scale-110 transition" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-[#FF6B00]">₹{totalCommissionsEarned.toFixed(1)}</h3>
                      <span className="text-[9.5px] text-[#FF6B00] font-mono mt-1.5 block font-bold">Net platform treasury</span>
                    </div>
                  </div>

                  <div className="bg-[#0b1329] hover:bg-slate-850 hover:border-slate-700/50 p-4 rounded-3xl border border-[#1e2a45] relative overflow-hidden flex flex-col justify-between transition group shadow-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Queue Approvals</p>
                      <AlertTriangle className="w-4 h-4 text-yellow-400 opacity-80 group-hover:scale-110 transition" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{pendingSellers.length + pendingPayments.length} issues</h3>
                      <span className="text-[9.5px] text-yellow-500 font-mono mt-1.5 block font-bold">Pending priority checks</span>
                    </div>
                  </div>
                </div>

                {/* Upgraded Multi-metric Interactive Chart Block */}
                <div className="bg-[#0b1329] border border-[#1e2a45] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-wider text-white">Interactive Business Intelligence</h3>
                      <p className="text-[10.5px] text-slate-400 mt-1">Configure metric data & rendering representations on-the-fly.</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Metric Toggle */}
                      <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-800">
                        <button 
                          type="button"
                          onClick={() => setDashboardMetric('revenue')}
                          className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${dashboardMetric === 'revenue' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Revenue
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDashboardMetric('categories')}
                          className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${dashboardMetric === 'categories' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Categories
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDashboardMetric('orders')}
                          className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${dashboardMetric === 'orders' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Orders
                        </button>
                      </div>

                      {/* Display Mode Toggle */}
                      <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-800">
                        <button 
                          type="button"
                          onClick={() => setDashboardChartType('line')}
                          className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${dashboardChartType === 'line' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Line
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDashboardChartType('bar')}
                          className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${dashboardChartType === 'bar' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Bar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {dashboardMetric === 'revenue' ? (
                        dashboardChartType === 'line' ? (
                          <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line type="monotone" name="Platform Revenue (₹)" dataKey="Revenue" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                            <Line type="monotone" name="Retention Share (₹)" dataKey="Commission" stroke="#FF6B00" strokeWidth={3} activeDot={{ r: 6 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" vertical={false} />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Bar name="Platform Revenue (₹)" dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar name="Retention Share (₹)" dataKey="Commission" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )
                      ) : dashboardMetric === 'categories' ? (
                        dashboardChartType === 'line' ? (
                          <LineChart data={categoryChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Line type="monotone" name="Product Count" dataKey="Product Count" stroke="#a855f7" strokeWidth={3.5} activeDot={{ r: 6 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={categoryChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" vertical={false} />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Bar name="Product Count" dataKey="Product Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )
                      ) : (
                        dashboardChartType === 'line' ? (
                          <LineChart data={orderStatusChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Line type="monotone" name="Orders Volume" dataKey="Orders" stroke="#0ea5e9" strokeWidth={3.5} activeDot={{ r: 6 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={orderStatusChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c253c" vertical={false} />
                            <XAxis stroke="#64748b" dataKey="name" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', fontSize: '11px', borderRadius: '12px', color: '#fff' }} />
                            <Bar name="Orders Volume" dataKey="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Real-time Commission Structure Simulator */}
                  <div className="bg-[#0b1329] border border-[#1e2a45] p-5 rounded-3xl space-y-4 shadow-xl">
                    <div>
                      <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Dynamic Math Engine</span>
                      <h4 className="text-xs font-black text-white uppercase mt-1">Partner Commission Simulator</h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">Mock transactions instantly to audit automated revenue share computations.</p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Select Active Merchant Shop</label>
                        {approvedSellers.length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-2 bg-slate-950 rounded-xl border border-slate-850">No active approved sellers.</div>
                        ) : (
                          <select 
                            value={simSelectedSellerId} 
                            onChange={(e) => setSimSelectedSellerId(e.target.value)}
                            className="w-full text-xs font-semibold p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 outline-none"
                          >
                            <option value="">-- Choose Merchant Store --</option>
                            {approvedSellers.map(s => (
                              <option key={s.id} value={s.id}>{s.shopName} (Base {s.commissionRate || 8}%)</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Select Category</label>
                          <select 
                            value={simCategory} 
                            onChange={(e) => setSimCategory(e.target.value)}
                            className="w-full text-xs font-semibold p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 outline-none"
                          >
                            {["Fashion", "Electronics", "Grocery", "Cosmetics", "Home Decor"].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Order Value (₹)</label>
                          <input 
                            type="number"
                            min="100"
                            value={simOrderAmount}
                            onChange={(e) => setSimOrderAmount(Math.max(100, parseInt(e.target.value) || 0))}
                            className="w-full text-xs font-extrabold font-mono p-2 bg-slate-950 border border-slate-850 rounded-xl text-[#FF6B00] outline-none"
                          />
                        </div>
                      </div>

                      {simSeller ? (
                        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium font-sans">Active Commission Rate:</span>
                            <span className="font-mono bg-[#FF6B00]/10 text-[#FF6B00] font-black px-2 py-0.5 rounded-lg text-[10.5px]">
                              {activeRate}%
                            </span>
                          </div>

                          <div className="w-full bg-[#0f172a] h-2 rounded-full overflow-hidden flex">
                            <div style={{ width: `${100 - activeRate}%` }} className="h-full bg-emerald-500" title="Seller Payout" />
                            <div style={{ width: `${activeRate}%` }} className="h-full bg-[#FF6B00]" title="Platform Commission" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-900/60">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase font-bold">Partner Shop payout</span>
                              <span className="font-mono font-black text-emerald-400 mt-1 block">₹{simSellerCut.toFixed(1)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 block uppercase font-bold">Platform keep (Retained)</span>
                              <span className="font-mono font-black text-[#FF6B00] mt-1 block">₹{simPlatformCut.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic text-center pt-2 font-sans">Please select a merchant store to compute splits.</p>
                      )}
                    </div>
                  </div>

                  {/* Top-line Recent Order Ledger Overview */}
                  <div className="bg-[#0b1329] border border-[#1e2a45] p-5 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Dynamic Ledger Overview</span>
                      <h4 className="text-xs font-black text-white uppercase mt-1">Recent Transactions ledger</h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">Check status, clearances, and invoice values at a quick glance.</p>
                    </div>

                    <div className="space-y-2 flex-1 pt-2">
                      {recentOrders.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-8">No order items placed yet in system cache.</p>
                      ) : (
                        recentOrders.map((ord) => {
                          const orderPlacedDate = ord.statusTimeline?.[0]?.timestamp 
                            ? new Date(ord.statusTimeline[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : "N/A";
                          return (
                            <div key={ord.id} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between text-xs gap-3">
                              <div className="truncate">
                                <p className="font-black text-white truncate max-w-[150px]">{ord.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{ord.id.substring(0, 8)} | {orderPlacedDate}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-black font-mono text-[#FF6B00]">₹{ord.finalTotal}</p>
                                <span className={`text-[8.5px] font-mono px-1.5 py-0.25 rounded-md font-black uppercase mt-1 inline-block ${
                                  ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                                  ord.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-850">
                      <button 
                        type="button"
                        onClick={() => setActiveTab('otps')}
                        className="w-full text-center bg-slate-950 text-slate-300 font-extrabold hover:text-white border border-slate-800 rounded-xl py-2 text-[10.5px] uppercase transition cursor-pointer"
                      >
                        Inspect Full Ledger & Pipeline ➜
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {activeTab === 'otps' && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">Live SMS & WhatsApp Verification Feed</h3>
                  <p className="text-xs text-slate-400">Security monitoring dashboard view. Tutors/simulators may load codes manually.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRefresh("OTP Secretariat")}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05d00] disabled:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer max-w-max self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync {refreshing ? '...' : 'Live'}</span>
                </button>
              </div>

              {otpRequests.length === 0 ? (
                <div className="bg-white p-6 rounded-3xl text-center border text-xs text-slate-400">No active OTP verification logs on queue right now.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {otpRequests.map((req) => (
                    <div key={req.id} className="bg-slate-805 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="bg-orange-500/10 text-[#FF6B00] px-2 py-0.5 rounded text-[9px] font-mono tracking-widest block w-max uppercase mb-1">
                          {req.role} REQUEST
                        </span>
                        <p className="text-xs font-black text-white">{req.mobile}</p>
                        <p className="text-[10px] text-slate-400">Requested: {new Date(req.requestedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-black text-white px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
                          {req.otp}
                        </span>
                        <button
                          onClick={() => openWhatsAppMock(req)}
                          className="bg-[#0077B6] hover:bg-sky-600 text-white font-extrabold text-[10px] uppercase tracking-wide px-3 py-2 rounded-xl"
                        >
                          Send WhatsApp
                        </button>
                        <button
                          onClick={() => deleteOtpRequest(req.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sellers' && (
            <div className="space-y-5">
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">Merchant Outlets & Platform Clearances</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Review pending application, set base commission criteria, or handle suspensions instantly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRefresh("Sellers Approval")}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05d00] disabled:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer max-w-max self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync {refreshing ? '...' : 'Live'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {sellers.map((sel) => {
                  const pending = !sel.isActive;
                  const showChat = activeAdminChatSellerId === sel.id;
                  return (
                    <div key={sel.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={sel.logo} className="w-10 h-10 rounded-full border border-slate-800 object-cover" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{sel.shopName}</span>
                              {sel.isVerified && <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.25 rounded-md uppercase">Verified</span>}
                              {sel.isSuspended && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.25 rounded-md uppercase animate-pulse">Suspended</span>}
                            </div>
                            <p className="text-[10px] text-slate-400">Owner: {sel.ownerName} | Mobile: {sel.mobile}</p>
                            <p className="text-[10px] text-[#FF6B00] font-black">Commission: {sel.commissionRate || 8}% splits</p>
                            {sel.reportCount && sel.reportCount > 0 ? (
                              <p className="text-[10px] text-red-400 font-extrabold">🚨 Reports Count: {sel.reportCount} / 5000</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => setDetailsSellerToShow(sel)}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-xl cursor-pointer"
                          >
                            👁️ Details
                          </button>

                          <button
                            onClick={() => {
                              setActiveAdminChatSellerId(activeAdminChatSellerId === sel.id ? null : sel.id);
                            }}
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 ${activeAdminChatSellerId === sel.id ? 'bg-[#FF6B00] text-white' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-505/30 hover:bg-[#FF6B00]/10'}`}
                          >
                            💬 Chat {chats.filter(c => c.senderId === sel.id).length > 0 && <span className="bg-red-500 text-white text-[8px] px-1 rounded-full animate-bounce">!</span>}
                          </button>

                          {pending ? (
                            <button
                              onClick={() => handleApproveSellerClick(sel)}
                              className="bg-brand-orange hover:bg-orange-500 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              Set rates & Approve
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="number" 
                                placeholder="Comm %" 
                                defaultValue={sel.commissionRate || 8}
                                onBlur={(e) => saveCommissionSetting(sel.id, Number(e.target.value))}
                                className="w-14 bg-[#0f172a] text-xs p-1.5 rounded-lg border border-slate-800 text-center font-mono text-white"
                              />
                              <button
                                onClick={() => toggleSuspendSeller(sel)}
                                className={`font-black text-[10px] uppercase px-2.5 py-1.5 rounded-xl transition cursor-pointer ${sel.isSuspended ? 'bg-green-650/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'}`}
                              >
                                {sel.isSuspended ? "Reinstate" : "Block"}
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setSellerToDeleteId(sel.id);
                              setDeleteSellerReason('');
                            }}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-xl cursor-pointer transition border-dashed-2"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Active Seller-to-Admin Messaging Canvas inline */}
                      {showChat && (
                        <div className="w-full mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-fade-in text-white">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex flex-wrap items-center gap-2">
                              <span>💬 Live Admin Chat: {sel.shopName}</span>
                              <span className="bg-[#FF6B00]/20 text-[#FF6B00] text-[8.5px] font-mono px-2 py-0.5 rounded">Encrypted ID: {sel.id}</span>
                            </h4>
                            <button onClick={() => setActiveAdminChatSellerId(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">✕ Close Chat</button>
                          </div>

                          {/* Chat Timeline list */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {chats
                              .filter(c => (c.senderId === sel.id && c.senderRole === 'SELLER') || (c.senderId === 'admin_sahil' && c.productId === sel.id))
                              .map((chat) => (
                                <div key={chat.id} className={`p-2.5 rounded-xl max-w-[85%] text-xs space-y-1 ${chat.senderId === 'admin_sahil' ? 'bg-indigo-600/10 border border-indigo-500/20 text-white ml-auto' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                                  <div className="flex justify-between items-center text-[9px] text-slate-500 gap-4">
                                    <span className="font-extrabold text-[#FF6B00]">{chat.senderName}</span>
                                    <span>{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{chat.message}</p>
                                  {chat.message.includes('[📷 Photo:') && (() => {
                                    const match = chat.message.match(/\[📷 Photo:\s*([^\s\]]+)\]/);
                                    const imgUrl = match ? match[1] : null;
                                    if (imgUrl) {
                                      return (
                                        <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-800 max-w-xs">
                                          <img src={imgUrl} referrerPolicy="no-referrer" alt="Attached Attachment" className="max-h-36 object-cover" />
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              ))}
                            {chats.filter(c => (c.senderId === sel.id && c.senderRole === 'SELLER') || (c.senderId === 'admin_sahil' && c.productId === sel.id)).length === 0 && (
                              <div className="text-center p-6 text-[10.5px] text-slate-500 italic">No chat logged yet with this seller. Initiate conversation below!</div>
                            )}
                          </div>

                          {/* Inline messaging inputs to type text and attach photos */}
                          <form onSubmit={handleSendAdminChat} className="space-y-3 pt-2 border-t border-slate-850/50">
                            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-2 flex flex-col md:flex-row gap-2">
                              <input 
                                type="text"
                                placeholder="Type structural message to merchant..."
                                value={adminChatDraft}
                                onChange={(e) => setAdminChatDraft(e.target.value)}
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none p-1.5"
                              />
                              <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-2">
                                <input 
                                  type="text" 
                                  placeholder="Attach Photo URL..." 
                                  value={adminChatPhoto}
                                  onChange={(e) => setAdminChatPhoto(e.target.value)}
                                  className="bg-[#090d16] text-slate-300 border border-slate-800 rounded-lg p-1 px-2 text-[10.5px] focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl cursor-pointer"
                                >
                                  📨 Send
                                </button>
                              </div>
                            </div>
                            {adminChatPhoto && (
                              <div className="flex items-center gap-2 bg-indigo-900/10 border border-indigo-500/20 text-[10px] p-2 rounded-xl text-white">
                                <span className="text-slate-400 font-mono">📷 Preview Image Attachment:</span>
                                <img src={adminChatPhoto} className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                                <button type="button" onClick={() => setAdminChatPhoto('')} className="text-red-400 hover:underline ml-auto font-black cursor-pointer">Remove Photo</button>
                              </div>
                            )}
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Details modal render popup */}
              {detailsSellerToShow && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fade-in text-white">
                    <button onClick={() => setDetailsSellerToShow(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1">✕</button>
                    
                    <div className="text-center space-y-2">
                      <img src={detailsSellerToShow.logo} className="w-16 h-16 rounded-full border border-indigo-500/30 mx-auto object-cover" alt="Shop Brand Logo" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{detailsSellerToShow.shopName}</h3>
                      <p className="text-[10px] font-black uppercase text-indigo-400">Platform Registered Merchant Partner</p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 space-y-2.5 text-xs font-medium text-slate-300">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Shop ID:</span>
                        <span className="font-mono text-white text-[11px]">{detailsSellerToShow.id}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Owner Proprietory:</span>
                        <span className="text-white">{detailsSellerToShow.ownerName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Mobile Contact:</span>
                        <span className="font-mono text-white">{detailsSellerToShow.mobile}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Join Date:</span>
                        <span className="text-white">{detailsSellerToShow.joinDate || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Seller Rating:</span>
                        <span className="text-[#FF6B00] font-black">⭐ {detailsSellerToShow.rating || "5.0"} stars</span>
                      </div>
                      <div className="flex justify-[#000] border-b border-slate-800 pb-1.5 justify-between">
                        <span className="text-slate-450">Total Capital Sales:</span>
                        <span className="text-white font-mono">₹{detailsSellerToShow.totalSales || 0} Taka</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-450">Followers Count:</span>
                        <span className="text-white">{detailsSellerToShow.followersCount || 0} customers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450">Base Commission:</span>
                        <span className="text-emerald-400 font-extrabold">{detailsSellerToShow.commissionRate || 8}% base split</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setDetailsSellerToShow(null)}
                        className="bg-slate-800 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Dismiss Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mandatory Reason For Deletion Modal popup */}
              {sellerToDeleteId && (
                <div className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-xs flex items-center justify-center p-4">
                  <form onSubmit={handleDeleteSellerSubmit} className="bg-slate-900 rounded-3xl border border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-white">
                    <button type="button" onClick={() => setSellerToDeleteId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1">✕</button>
                    
                    <div>
                      <h3 className="text-sm font-black uppercase text-red-500 tracking-wider">⚠️ Confirm Shop Deletion</h3>
                      <p className="text-[10px] text-slate-400 mt-1">This action is permanent and irreversible. Deleting this seller will immediately remove all their catalogs, products, and active advertisements system-wide.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Reason for Deletion (Mandatory)</label>
                      <textarea
                        required
                        placeholder="State clear reasons (e.g., fraudulent listings, bad customer behavior, copyright violations)"
                        value={deleteSellerReason}
                        onChange={(e) => setDeleteSellerReason(e.target.value)}
                        className="w-full h-24 bg-[#0f172a] text-white border border-slate-800 rounded-xl p-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSellerToDeleteId(null)}
                        className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md transition"
                      >
                        Confirm Delete Shop
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-white">Merchant Commissions Ledger & Analytics</h3>
                  <p className="text-xs text-slate-400">Total Revenue Splits: <strong className="text-[#FF6B00]">₹{totalCommissionsEarned.toFixed(1)} Taka</strong> compiled.</p>
                </div>
                <button
                  onClick={exportToExcelOfCommissions}
                  className="bg-green-500 text-white font-extrabold text-[10px] uppercase px-3.5 py-2 rounded-xl flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Export Ledger
                </button>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase">Live Commission Ledger Stream</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase text-[9px] tracking-wider">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Merchant</th>
                        <th className="pb-2 text-right">Order Total</th>
                        <th className="pb-2 text-center">Applied rate</th>
                        <th className="pb-2 text-right">Our commission</th>
                        <th className="pb-2 text-right">Net Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.status === 'DELIVERED').map((o) => (
                        <tr key={o.id} className="border-b border-slate-100 py-2">
                          <td className="py-2.5 font-bold text-slate-800 font-mono">{o.id}</td>
                          <td className="py-2.5 text-slate-650">{o.sellerName}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700">₹{o.finalTotal}</td>
                          <td className="py-2.5 text-center font-bold text-[#FF6B00]">{o.commissionRateApplied}%</td>
                          <td className="py-2.5 text-right font-black text-green-400">₹{o.commissionDeducted}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-650">₹{o.sellerEarningNet}</td>
                        </tr>
                      ))}
                      {orders.filter(o => o.status === 'DELIVERED').length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-5 text-center text-slate-400">No completed transactions found inside logs to generate reports.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="space-y-6">
              {/* Top Banner / Description */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Commission Settings Matrix</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure specialized channel rates per seller and product catalog categories here. Changes are hot-reloaded and affect new orders immediately.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Base Fallback Rate</p>
                    <p className="text-lg font-black text-[#FF6B00]">8.0%</p>
                  </div>
                </div>
              </div>

              {/* Grid with Category Summaries & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Category Baselines</p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <span className="font-bold text-slate-300">Fashion</span>
                      <span className="text-[#FF6B00] font-black font-mono">10% Default</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <span className="font-bold text-slate-300">Electronics</span>
                      <span className="text-[#FF6B00] font-black font-mono">8% Default</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <span className="font-bold text-slate-300">Grocery</span>
                      <span className="text-[#FF6B00] font-black font-mono">5% Default</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Extended Baselines</p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <span className="font-bold text-slate-300">Cosmetics</span>
                      <span className="text-[#FF6B00] font-black font-mono">8% Default</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <span className="font-bold text-slate-300">Home Decor</span>
                      <span className="text-[#FF6B00] font-black font-mono">8% Default</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800/10">
                      <span className="font-bold text-slate-300">General</span>
                      <span className="text-slate-400 font-extrabold font-mono">8% Standard</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Override Status</p>
                    <p className="text-xs text-slate-400 leading-snug">
                      Merchants inherit global baselines until you customize their commissions in the catalog grid below.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/40 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Overridden Stores</span>
                    <span className="text-xs font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-lg border border-cyan-850 font-mono">
                      {sellers.filter(s => s.categoryCommissionRates && Object.keys(s.categoryCommissionRates).length > 0).length} Shops
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Sellers Override List */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Merchant Override Grid & Custom Rates</h4>
                  <p className="text-xs text-slate-400 mt-1">Configure separate percentages per store and category overrides below.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold">
                        <th className="pb-3 pl-2">Merchant Shop</th>
                        <th className="pb-3">Owner & Mobile</th>
                        <th className="pb-3 text-center">Base Commission</th>
                        <th className="pb-3 text-left">Category Rates Setup</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map((sel) => {
                        const isEditingThis = selectedSellerId === sel.id;
                        return (
                          <React.Fragment key={sel.id}>
                            <tr className={`border-b border-slate-800/80 hover:bg-slate-800/55 transition ${isEditingThis ? 'bg-slate-850 border-double border-b-2 border-orange-500/30' : ''}`}>
                              <td className="py-4 pl-2">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={sel.logo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150"} 
                                    className="w-8 h-8 rounded-full border border-slate-700 object-cover" 
                                  />
                                  <div>
                                    <p className="font-extrabold text-white flex items-center gap-1">
                                      {sel.shopName}
                                      {sel.isVerified && (
                                        <span className="bg-blue-900 border text-blue-400 border-blue-800 font-extrabold text-[8px] px-1 rounded-full uppercase scale-90">Ver</span>
                                      )}
                                    </p>
                                    <p className="text-[9.5px] text-slate-400">ID: {sel.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 text-slate-300">
                                <p className="font-semibold text-slate-200">{sel.ownerName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{sel.mobile}</p>
                              </td>
                              <td className="py-4 text-center">
                                <span className="bg-[#FF6B00]/10 text-[#FF6B00] font-black text-xs px-2.5 py-1 rounded-full border border-[#FF6B00]/20 font-mono font-bold">
                                  {sel.commissionRate || 8}%
                                </span>
                              </td>
                              <td className="py-4 font-bold">
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                  {sel.categoryCommissionRates ? (
                                    Object.entries(sel.categoryCommissionRates).map(([cat, val]) => (
                                      <span key={cat} className="text-[9.5px] bg-cyan-900/10 text-cyan-400 font-bold px-1.5 py-0.5 rounded-lg border border-cyan-500/10 font-mono">
                                        {cat}: <strong className="text-orange-400 font-black">{val}%</strong>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-450 font-medium italic">Inheriting default category fallbacks</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditingThis) {
                                      setSelectedSellerId('');
                                    } else {
                                      setSelectedSellerId(sel.id);
                                      setEditingBaseRate(sel.commissionRate || 8);
                                      setEditingCategoryRates({
                                        "Fashion": sel.categoryCommissionRates?.["Fashion"] ?? 10,
                                        "Electronics": sel.categoryCommissionRates?.["Electronics"] ?? 8,
                                        "Grocery": sel.categoryCommissionRates?.["Grocery"] ?? 5,
                                        "Cosmetics": sel.categoryCommissionRates?.["Cosmetics"] ?? 8,
                                        "Home Decor": sel.categoryCommissionRates?.["Home Decor"] ?? 8
                                      });
                                    }
                                  }}
                                  className="border border-[#FF6B00] hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white font-extrabold text-[10.5px] px-3 py-1.5 rounded-xl cursor-pointer transition shadow"
                                >
                                  {isEditingThis ? 'Close Details' : 'Configure Overrides'}
                                </button>
                              </td>
                            </tr>

                            {/* In-place Setup Form Section */}
                            {isEditingThis && (
                              <tr>
                                <td colSpan={5} className="bg-slate-950 p-5 border-b border-orange-500/20">
                                  <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                      <h5 className="text-[11.5px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-[#FF6B00]" /> Config Commission - <span className="text-[#FF6B00] font-black">{sel.shopName}</span>
                                      </h5>
                                      <span className="text-[9.5px] text-slate-450 italic">Overrides hot-saved instantly</span>
                                    </div>

                                    {/* Base Commission Field */}
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                          Global Store Standard Rate (%)
                                        </label>
                                        <span className="text-xs font-black text-[#FF6B00] font-mono">{editingBaseRate}% commission</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max="50" 
                                        step="0.5"
                                        value={editingBaseRate} 
                                        onChange={(e) => setEditingBaseRate(Number(e.target.value))} 
                                        className="w-full accent-[#FF6B00] h-1.5 rounded-lg cursor-pointer bg-slate-800" 
                                      />
                                      <p className="text-[9px] text-slate-400">Standard rate applies on any category that does not have an explicit percentage set below.</p>
                                    </div>

                                    {/* Per Category Rates Inputs */}
                                    <div className="space-y-3.5 pt-2 border-t border-slate-800">
                                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                        Category Specific Overrides (%)
                                      </label>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {["Fashion", "Electronics", "Grocery", "Cosmetics", "Home Decor"].map((cat) => {
                                          return (
                                            <div key={cat} className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                              <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-extrabold text-slate-305">{cat}</span>
                                                <span className="font-black text-cyan-400 bg-cyan-950/40 px-1 rounded font-mono font-bold">{editingCategoryRates[cat]}%</span>
                                              </div>
                                              <input 
                                                type="number" 
                                                min="0" 
                                                max="60" 
                                                value={editingCategoryRates[cat]} 
                                                onChange={(e) => {
                                                  const val = Number(e.target.value);
                                                  setEditingCategoryRates({
                                                    ...editingCategoryRates,
                                                    [cat]: val
                                                  });
                                                }}
                                                className="w-full text-xs p-1.5 border border-slate-800 rounded bg-slate-900 text-white font-bold font-mono" 
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Action Buttons to save */}
                                    <div className="pt-3 border-t border-slate-105/10 flex gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSellerId('')}
                                        className="bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold text-[10.5px] px-4 py-2 rounded-xl transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={loading}
                                        onClick={async () => {
                                          setLoading(true);
                                          try {
                                            const res = await fetch('/api/admin/update-seller-commission', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                id: sel.id,
                                                commissionRate: editingBaseRate,
                                                categoryCommissionRates: editingCategoryRates
                                              })
                                            });
                                            if (res.ok) {
                                              showToast(`Custom rates successfully updated for ${sel.shopName}!`, 'success');
                                              setSelectedSellerId('');
                                              triggerRefresh(); // Refresh total app state
                                            } else {
                                              showToast('Error applying custom commission matrix.', 'error');
                                            }
                                          } catch (e) {
                                            showToast('Failed to save values. Connection error.', 'error');
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-[10.5px] px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                      >
                                        {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                        Save Custom Parameters
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">Manual Online payment Screeners</h3>
                  <p className="text-xs text-slate-400">Inspect UPI QR transaction logs submitted by customers for priority approval.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRefresh("Payment Verification")}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05d00] disabled:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer max-w-max self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync {refreshing ? '...' : 'Live'}</span>
                </button>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="bg-white p-6 rounded-3xl text-center border text-xs text-slate-400">No pending payment logs screening queue right now.</div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((ord) => (
                    <div key={ord.id} className="bg-slate-805 p-4 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">Order: #{ord.id} | Amount: ₹{ord.finalTotal}</p>
                          <p className="text-[10px] text-slate-400">Buyer: {ord.customerName} | Mobile: {ord.customerMobile}</p>
                          <p className="text-[10.5px] text-[#FF6B00] font-mono">Txn ID: {ord.paymentDetails?.transactionId || 'None'}</p>
                        </div>
                      </div>

                      {ord.paymentDetails?.screenshotUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer proof screenshot:</p>
                          <img src={ord.paymentDetails.screenshotUrl} className="max-h-60 rounded-xl border object-contain bg-slate-950" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePaymentVerify(ord.id, 'CONFIRM')}
                          className="bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] uppercase tracking-wide px-3 py-2 rounded-xl cursor-pointer"
                        >
                          Approve payment & Release order
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter payment rejection explanation (notified to buyer):");
                            if (reason) handlePaymentVerify(ord.id, 'CANCEL', reason);
                          }}
                          className="bg-red-500/15 hover:bg-red-500/30 text-red-400 font-extrabold text-[10px] uppercase px-3 py-2 rounded-xl"
                        >
                          Reject payment & Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">Operational Disputes Judge Desk</h3>
                  <p className="text-xs text-slate-400">Arbitrate order complaints with photograph documentation. Customer or Seller refunds processed in 48 hours.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRefresh("Disputes Board")}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05d00] disabled:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer max-w-max self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync {refreshing ? '...' : 'Live'}</span>
                </button>
              </div>

              {disputes.length === 0 ? (
                <div className="bg-white p-6 rounded-3xl border text-center text-xs text-slate-400">No dispute cases have been filed yet.</div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((disp) => (
                    <div key={disp.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block font-mono">#{disp.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${disp.status === 'PENDING' ? 'bg-yellow-500 text-black animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                          {disp.status}
                        </span>
                      </div>

                      <p className="text-xs font-black text-white">{disp.reason}</p>
                      <p className="text-xs text-slate-400">{disp.description}</p>
                      <p className="text-[10px] text-slate-500 font-bold">Seller: {disp.sellerName} | Customer: {disp.customerName}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {disp.customerEvidencePhoto && (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Customer Evidence:</span>
                            <img src={disp.customerEvidencePhoto} className="h-32 w-full object-cover rounded-xl border border-slate-800" />
                          </div>
                        )}
                        {disp.sellerEvidencePhoto ? (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Seller Counter-evidence:</span>
                            <img src={disp.sellerEvidencePhoto} className="h-32 w-full object-cover rounded-xl border border-slate-800" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 block italic">Waiting for merchant dispute counter-image...</span>
                        )}
                      </div>

                      {disp.status === 'PENDING' && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">State Resolution rationale (notified to both parties):</label>
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Type resolution description reason..."
                            className="w-full bg-[#0f172a] text-xs p-2 rounded-xl text-white h-20 border"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedDispute(disp); resolveOrderDispute('RESOLVED_CUSTOMER'); }}
                              className="bg-green-650 hover:bg-green-600 text-white font-extrabold text-[10px] uppercase px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Judicial Refund Customer
                            </button>
                            <button
                              onClick={() => { setSelectedDispute(disp); resolveOrderDispute('RESOLVED_SELLER'); }}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-extrabold text-[10px] uppercase px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Rule in favor of Seller
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-5">
              <form onSubmit={handleAddVideo} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <h3 className="font-extrabold text-sm uppercase text-white">Broadcast new advertisement / Trailer Reel</h3>
                <p className="text-xs text-slate-400 font-medium">Videos here bypass followers limitation rules, reaching 100% of the platform customers feed!</p>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Broadcast Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bangladesh Big Sale Trailer Reels" 
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border focus:border-[#FF6B00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Online Video Streaming URL (YouTube embed link / MP4 URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border focus:border-[#FF6B00] font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-brand-orange hover:bg-orange-500 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-orange-50 cursor-pointer"
                >
                  Publish Streaming Reel Broadcast
                </button>
              </form>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase">Active transmitted catalog streams:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map(v => (
                    <div key={v.id} className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800 relative space-y-2">
                      <p className="text-xs font-black text-slate-800 leading-tight block">{v.title}</p>
                      <p className="text-[10px] text-slate-500">Source: {v.videoUrl}</p>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md font-mono">{v.uploadedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-5">
              <form onSubmit={handleAddDeliveryAgent} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-white">Add Delivery Agent / Dispatch Partner</h3>
                <p className="text-xs text-slate-400">Add secure credentials for agents which they will use to sign in.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="text-xs p-2.5 border rounded-xl bg-slate-50"
                    required
                  />
                  <input 
                    type="tel" 
                    maxLength={10}
                    placeholder="10-Digit Mobile" 
                    value={agentMobile}
                    onChange={(e) => setAgentMobile(e.target.value.replace(/\D/g, ''))}
                    className="text-xs p-2.5 border rounded-xl bg-slate-50"
                    required
                  />
                  <input 
                    type="password" 
                    placeholder="Credentials password" 
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    className="text-xs p-2.5 border rounded-xl bg-slate-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#0077B6] hover:bg-sky-600 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md cursor-pointer"
                >
                  Create Agent Credentials
                </button>
              </form>

              <div className="bg-white p-5 rounded-3xl border shadow-sm">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase block mb-3">Loaded Platform Dispatch Personnel:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliveryAgents.map(ag => (
                    <div key={ag.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-white">{ag.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Mobile: {ag.mobile} | Pass: {ag.password}</p>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#FF6B00]">Custom Admin Contact details (Banners & Bio)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Owner Contact Name</label>
                    <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 font-semibold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Secretariat Mobile</label>
                    <input type="text" value={adminContact} onChange={(e) => setAdminContact(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 font-semibold" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-400">Email Address Contact</label>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 font-semibold" />
                  </div>
                  <div className="sm:col-span-2 pb-2">
                    <ImageSelector
                      label="Admin Profile Photograph (Bio Photo)"
                      value={adminPhoto}
                      onChange={setAdminPhoto}
                      placeholder="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Biographical Description biography (shown to customers)</label>
                  <textarea value={adminBio} onChange={(e) => setAdminBio(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 h-20" />
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  <label className="text-xs font-black text-red-500 uppercase flex items-center gap-1">
                    <Ban className="w-4 h-4" /> Customized Banned Words (Reject products instantly)
                  </label>
                  <p className="text-[10px] text-slate-400">Create comma separated terms. Product descriptions & names will be checked during seller catalogs upload process.</p>
                  <input 
                    type="text" 
                    value={bannedWordsInput} 
                    onChange={(e) => setBannedWordsInput(e.target.value)} 
                    placeholder="spam, scam, duplicate, fake"
                    className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 text-white font-mono"
                  />
                </div>

                <button 
                  onClick={saveAdminDetailsAndBannedWords}
                  className="bg-[#FF6B00] hover:bg-orange-500 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer"
                >
                  Save Secretariat Directory details
                </button>
              </div>

              {/* Legacy Config form panel code */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">System Gateway Configurations</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Admin Platform UPI ID</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Payment QR Code Link URL</label>
                    <input type="text" value={qrImage} onChange={(e) => setQrImage(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Platform-wide Running Broadcast Header Text</label>
                  <input type="text" value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Home Feed Carousel Hero Image Link</label>
                  <input type="text" value={homeFeedBanner} onChange={(e) => setHomeFeedBanner(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border" />
                </div>

                <div className="space-y-1">
                  <ImageSelector
                    label="App Universal Branding Logo"
                    value={appLogo}
                    onChange={setAppLogo}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <button 
                  onClick={saveSystemConfig}
                  className="bg-[#0077B6] hover:bg-sky-600 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer"
                >
                  Save Gateway configuration
                </button>
              </div>

            </div>
          )}

          {activeTab === 'add-product' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div>
                  <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Internal Catalog Insertion System</span>
                  <h3 className="text-sm font-black text-white uppercase mt-1">Add Product with Multi-Photo Uploads</h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed mt-1">
                    Deploy standard merchandise instantly onto client portals. Admin has bypass approvals, bypassing manual category restrictions.
                  </p>
                </div>

                <form onSubmit={handleAdminAddProduct} className="space-y-5 pt-2">
                  
                  {/* Store Select Option - Disabled selection, hardcoded to Admin's own store Kena Kata */}
                  <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <label className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-widest block">Authorized Merchant Profile</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-slate-100">Kena Kata (Admin's Own Storefront)</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">Products added from this panel are automatically published under your checked storefront.</p>
                  </div>

                  {/* Core product settings info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Product Name Title</label>
                      <input 
                        type="text" 
                        value={newProdName} 
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="e.g., Premium Leather Wallet" 
                        className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-widest block">Product Category</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00]"
                        required
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
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">MRP (Original Listing Price)</label>
                      <input 
                        type="number" 
                        value={newProdMrp} 
                        onChange={(e) => setNewProdMrp(Number(e.target.value))}
                        placeholder="e.g., 500" 
                        className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-widest block">Selling Price (Discounted Price)</label>
                      <input 
                        type="number" 
                        value={newProdPrice} 
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        placeholder="e.g., 350" 
                        className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Inventory Stock Count</label>
                      <input 
                        type="number" 
                        value={newProdStock} 
                        onChange={(e) => setNewProdStock(Number(e.target.value))}
                        placeholder="e.g., 100" 
                        className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Product Description Details</label>
                    <textarea 
                      value={newProdDescription} 
                      onChange={(e) => setNewProdDescription(e.target.value)}
                      placeholder="Input beautiful product features, dimensions, or details..." 
                      className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] h-24 leading-relaxed"
                    />
                  </div>

                  {/* Multiple Product Images Upload Section (Gallery) */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                    <span className="text-[10px] font-black text-[#FF6B00] uppercase block tracking-wider">🖼️ Product Photos Upload Gallery (Multi-Image Upload)</span>
                    <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed">
                      This application supports multiple high-definition photos for product listings. Upload files using the drop area or paste direct URLs, then select &apos;Add to product images&apos;.
                    </p>

                    {/* Image thumbnails list */}
                    {newProdImages.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Active Catalog Photos ({newProdImages.length})</span>
                        <div className="flex flex-wrap gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          {newProdImages.map((img, i) => (
                            <div key={i} className="relative group w-16 h-16 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shadow-md">
                              <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setNewProdImages(newProdImages.filter((_, idx) => idx !== i))}
                                className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 rounded-lg cursor-pointer text-white text-[10px] font-black uppercase"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-[10px] font-bold">
                        No photos added yet. Use the selector below to upload or paste your first photograph!
                      </div>
                    )}

                    {/* Image Selector Tool */}
                    <div className="pt-2 border-t border-slate-800/40 space-y-2.5">
                      <ImageSelector
                        label="Step 1: Choose or Paste Image file"
                        value={tempProductImage}
                        onChange={setTempProductImage}
                        placeholder="https://images.unsplash.com/photo-1523275335684-37898b6baf30"
                      />

                      {tempProductImage && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempProductImage) return;
                              setNewProdImages([...newProdImages, tempProductImage]);
                              setTempProductImage('');
                              showToast("Photo added to gallery successfully!", "success");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10.5px] px-4 py-2 rounded-xl transition shadow cursor-pointer uppercase tracking-wider h-10 flex items-center justify-center gap-1.5"
                          >
                            + Confirm & Append Image to product list
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF6B00] hover:bg-orange-500 text-white font-black text-xs py-3 px-6 rounded-xl transition shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? (
                      <>Publishing item details...</>
                    ) : (
                      <>Push To Active Catalogs Platform</>
                    )}
                  </button>

                </form>
              </div>
            </div>
          )}

          {activeTab === 'place-order' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div>
                  <span className="text-[8.5px] font-black text-[#FF6B00] uppercase block tracking-wider">Internal Order Dispatching System</span>
                  <h3 className="text-sm font-black text-white uppercase mt-1">Manual Order Booking Panel</h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed mt-1 font-mono">
                    Book transactions instantly on behalf of any customer. Automatically alerts designated delivery personnel and syncs sales streams.
                  </p>
                </div>

                <form onSubmit={handleAdminPlaceOrder} className="space-y-5 pt-2">
                  
                  {/* Select Customer Option */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-widest block">Quick Pick Customer (Optional)</label>
                      <span className="text-[9px] text-slate-400 font-mono">Selects previous buyers to auto-fill logistics details</span>
                    </div>

                    <select
                      className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-semibold"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const parts = val.split("||");
                        if (parts.length >= 6) {
                          setOrderCustId(parts[0]);
                          setOrderCustName(parts[1]);
                          setOrderCustMobile(parts[2]);
                          setOrderCustAddress(parts[3]);
                          setOrderCustDistrict(parts[4]);
                          setOrderCustState(parts[5]);
                        }
                      }}
                    >
                      <option value="">-- Choose from Dynamic Customers Roll List --</option>
                      {(() => {
                        const previousCustomersMap: { [mobile: string]: { id: string, name: string, mobile: string, address: string, state: string, district: string } } = {};
                        orders.forEach(o => {
                          if (o.customerMobile) {
                            previousCustomersMap[o.customerMobile] = {
                              id: o.customerId,
                              name: o.customerName,
                              mobile: o.customerMobile,
                              address: typeof o.deliveryAddress === 'object' ? o.deliveryAddress.address : String(o.deliveryAddress),
                              state: typeof o.deliveryAddress === 'object' ? o.deliveryAddress.state || 'West Bengal' : 'West Bengal',
                              district: typeof o.deliveryAddress === 'object' ? o.deliveryAddress.district || 'Kolkata' : 'Kolkata',
                            };
                          }
                        });
                        return Object.values(previousCustomersMap).map(cust => (
                          <option 
                            key={cust.mobile} 
                            value={`${cust.id}||${cust.name}||${cust.mobile}||${cust.address}||${cust.district}||${cust.state}`}
                          >
                            {cust.name} ({cust.mobile})
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Core Logistics Section */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                    <span className="text-[9.5px] font-black text-white uppercase tracking-wider block">Customer Logistics Information</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Customer Legal Name</label>
                        <input 
                          type="text" 
                          value={orderCustName} 
                          onChange={(e) => setOrderCustName(e.target.value)}
                          placeholder="e.g., Mohammad Rahman" 
                          className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-sans font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Customer Mobile Number</label>
                        <input 
                          type="text" 
                          value={orderCustMobile} 
                          onChange={(e) => setOrderCustMobile(e.target.value)}
                          placeholder="e.g., 9876543210" 
                          className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Doorstep Delivery Address</label>
                      <input 
                        type="text" 
                        value={orderCustAddress} 
                        onChange={(e) => setOrderCustAddress(e.target.value)}
                        placeholder="e.g., Plot 24, Sealdah Central St" 
                        className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-sans font-semibold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">District</label>
                        <input 
                          type="text" 
                          value={orderCustDistrict} 
                          onChange={(e) => setOrderCustDistrict(e.target.value)}
                          placeholder="e.g., Kolkata" 
                          className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-sans font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">State</label>
                        <input 
                          type="text" 
                          value={orderCustState} 
                          onChange={(e) => setOrderCustState(e.target.value)}
                          placeholder="e.g., West Bengal" 
                          className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-sans font-semibold"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Specification section */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                    <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider block font-mono">Catalog Product Item Selection</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 font-sans">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Select Catalog Item</label>
                        <select
                          value={orderSelectedProduct?.id || ''}
                          onChange={(e) => {
                            const found = products.find(p => p.id === e.target.value);
                            setOrderSelectedProduct(found || null);
                          }}
                          className="w-full text-xs p-3 rounded-xl border bg-slate-950 border-slate-850 text-slate-200 focus:border-[#FF6B00] font-sans"
                          required
                        >
                          <option value="">-- Choose Active Catalog Item --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Logistics Order Quantity</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                            className="bg-slate-800 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs hover:bg-slate-700 transition"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs text-white font-bold px-4">{orderQuantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const stockLimit = orderSelectedProduct?.stock || 999;
                              setOrderQuantity(prev => Math.min(stockLimit, prev + 1));
                            }}
                            className="bg-slate-800 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs hover:bg-slate-700 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Selected product fast metadata audit */}
                    {orderSelectedProduct && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between flex-wrap gap-3 font-sans">
                        <div className="flex items-center gap-3">
                          <img 
                            src={orderSelectedProduct.images?.[0] || 'https://via.placeholder.com/60'} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800" 
                          />
                          <div>
                            <span className="text-xs font-black text-white block">{orderSelectedProduct.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Storefront Node: {orderSelectedProduct.sellerName}</span>
                          </div>
                        </div>

                        <div className="flex gap-4 font-mono">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 uppercase block">Available Stock</span>
                            <span className={`text-[11px] font-black ${orderSelectedProduct.stock < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {orderSelectedProduct.stock} units left
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 uppercase block font-sans">Exclusive Pricing</span>
                            <span className="text-[11px] font-black text-[#FF6B00]">
                              ₹{orderSelectedProduct.price} Taka
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery & Dispatch selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div className="space-y-1 bg-slate-900 p-4 rounded-xl border border-slate-800 font-sans">
                      <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 font-sans">Delivery Service Level</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input 
                            type="radio" 
                            name="delivery_speed"
                            value="standard" 
                            checked={orderDeliverySpeed === 'standard'}
                            onChange={() => setOrderDeliverySpeed('standard')}
                            className="accent-[#FF6B00]"
                          />
                          <span>Standard Logistics Dispatch (4-5 Days, ₹40)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input 
                            type="radio" 
                            name="delivery_speed"
                            value="express" 
                            checked={orderDeliverySpeed === 'express'}
                            onChange={() => setOrderDeliverySpeed('express')}
                            className="accent-[#FF6B00]"
                          />
                          <span>Express Courier Lane (2 Days, ₹75)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input 
                            type="radio" 
                            name="delivery_speed"
                            value="sameday" 
                            checked={orderDeliverySpeed === 'sameday'}
                            onChange={() => setOrderDeliverySpeed('sameday')}
                            className="accent-[#FF6B00]"
                          />
                          <span>Instant Priority Same-Day Lane (24hrs, ₹150)</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900 p-4 rounded-xl border border-slate-800 font-sans">
                      <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 font-sans">Payment Mode Settings</label>
                      <div className="space-y-2 font-sans">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-sans">
                          <input 
                            type="radio" 
                            name="payment_method"
                            value="COD" 
                            checked={orderPaymentMethod === 'COD'}
                            onChange={() => setOrderPaymentMethod('COD')}
                            className="accent-[#FF6B00]"
                          />
                          <span>Cash on Delivery (Standard Courier Pay)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-sans">
                          <input 
                            type="radio" 
                            name="payment_method"
                            value="ONLINE" 
                            checked={orderPaymentMethod === 'ONLINE'}
                            onChange={() => setOrderPaymentMethod('ONLINE')}
                            className="accent-[#FF6B00]"
                          />
                          <span>Prepaid Online Settlement (Verified Instantly)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Manual Dispatch Special Notes</label>
                    <textarea 
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="e.g., Deliver during evening hours only, call before arrival."
                      className="w-full text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FF6B00] font-sans"
                      rows={2}
                    />
                  </div>

                  {/* Calculations breakdown display */}
                  {orderSelectedProduct && (
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
                      <div className="flex justify-between text-xs text-slate-400 font-mono">
                        <span className="font-sans">Items Subtotal ({orderQuantity} unit{orderQuantity > 1 ? 's' : ''})</span>
                        <span>₹{(orderSelectedProduct.price * orderQuantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-mono">
                        <span className="font-sans">Delivery & Surcharge</span>
                        <span>₹{(orderDeliverySpeed === 'sameday' ? 150 : orderDeliverySpeed === 'express' ? 75 : 40).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-2 font-extrabold font-mono">
                        <span className="text-[#FF6B00] font-sans">Grand Invoice Total</span>
                        <span className="text-[#FF6B00]">
                          ₹{((orderSelectedProduct.price * orderQuantity) + (orderDeliverySpeed === 'sameday' ? 150 : orderDeliverySpeed === 'express' ? 75 : 40)).toFixed(2)} Taka
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !orderSelectedProduct}
                    className="w-full bg-[#FF6B00] hover:bg-orange-500 text-white font-black text-xs py-3 px-6 rounded-xl transition shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? (
                      <>Disbursing Order Record...</>
                    ) : (
                      <>Place Manual Product Order (₹{orderSelectedProduct ? ((orderSelectedProduct.price * orderQuantity) + (orderDeliverySpeed === 'sameday' ? 150 : orderDeliverySpeed === 'express' ? 75 : 40)).toFixed(2) : '0.00'})</>
                    )}
                  </button>

                </form>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 p-5 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">📊 Platform Commercial Exports Hub</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Generate analytical spreadsheet models, invoices, or PDF reports for commercial stakeholders.</p>
                </div>
                
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button 
                    onClick={exportToExcelOfCommissions}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10.5px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer uppercase transition tracking-wider shadow"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" /> Export Commissions (CSV)
                  </button>

                  <button 
                    onClick={exportOrdersToExcel}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer uppercase transition tracking-wider shadow"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-100" /> Export All Sales & Orders (Excel)
                  </button>

                  <button 
                    onClick={() => setShowInvoiceReportModal(true)}
                    className="bg-[#FF6B00] hover:bg-orange-500 text-white font-extrabold text-[10.5px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer uppercase transition tracking-wider shadow"
                  >
                    <FileText className="w-3.5 h-3.5" /> Generate PDF Invoice / Sales Report
                  </button>
                </div>
              </div>

              {/* Referral dashboard details */}
              <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase block">Seller Referral Program Logs</h4>
                  <span className="bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded text-[9.5px] font-black uppercase">COMMISSION SYSTEM RECOUP</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Tracks referring chains as sellers onboard new associates onto Kena Kata network.</p>

                <div className="space-y-2 pt-2">
                  {referrals.map((refLog) => (
                    <div key={refLog.id} className="bg-slate-800 p-3 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] bg-green-500/25 text-green-400 px-2 py-0.5 rounded-md font-mono">{refLog.status}</span>
                        <p className="text-xs text-slate-650 font-black mt-1">Referred Partner: {refLog.referredMobile}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Referrer partner ID: {refLog.referrerId}</p>
                      </div>
                      <span className="text-xs font-black text-white">Bonus Token: +₹250</span>
                    </div>
                  ))}
                  {referrals.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-3">No referral entries on record right now.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* App Commission Rate Allocation Modal pop */}
      {selectedSellerForCommission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-display text-center">Set Platform Payout Commissions</h4>
            <p className="text-xs text-slate-500 text-center">Set the base revenue commission rate and category overrides immediately before workspace activation for:</p>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center font-bold text-xs text-white">
              {selectedSellerForCommission.shopName}
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 block uppercase">Default Base Rate (%)</label>
                <input 
                  type="number" 
                  value={sellerCommissionRate} 
                  onChange={(e) => setSellerCommissionRate(Number(e.target.value))}
                  className="w-full text-center text-xs p-2 rounded-xl border text-white font-mono block"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">FASHION %</label>
                  <input type="number" value={fashionCommission} onChange={(e) => setFashionCommission(Number(e.target.value))} className="w-full text-center text-xs p-1 text-white border rounded-lg font-mono" />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">ELECTRO %</label>
                  <input type="number" value={electronicsCommission} onChange={(e) => setElectronicsCommission(Number(e.target.value))} className="w-full text-center text-xs p-1 text-white border rounded-lg font-mono" />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">GROCERY %</label>
                  <input type="number" value={groceryCommission} onChange={(e) => setGroceryCommission(Number(e.target.value))} className="w-full text-center text-xs p-1 text-white border rounded-lg font-mono" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button 
                onClick={() => setSelectedSellerForCommission(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={submitSellerActivation}
                className="flex-1 bg-brand-orange hover:bg-orange-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow"
              >
                Approve & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy modals preserved */}
      {showFlashModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={createFlashSale} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase font-display">⚡ Launch active Flash promo</h4>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setShowFlashModal(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" className="flex-1 bg-[#FF6B00] py-3 rounded-xl font-bold text-xs text-white">Save promo</button>
            </div>
          </form>
        </div>
      )}

      {showInvoiceReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-955/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2x flex flex-col max-h-[90vh] border animate-fadeIn text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                  <FileText className="w-5 h-5 text-[#FF6B00]" /> Commercial Invoice & Sales Report Ledger
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Configure live parameters, preview real-time metrics, and compile PDF statements.</p>
              </div>
              <button 
                onClick={() => setShowInvoiceReportModal(false)}
                className="text-slate-400 hover:text-slate-650 font-black text-sm p-1 cursor-pointer bg-slate-105 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Configuration Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-650 block uppercase tracking-wider">Merchant Partner Filter</label>
                <select 
                  value={reportMerchantFilter} 
                  onChange={(e) => setReportMerchantFilter(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border focus:border-[#FF6B00] font-semibold"
                >
                  <option value="ALL">All Merchant Partners (Combined)</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.ownerName} ({s.shopName})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-650 block uppercase tracking-wider">Order Status Filter</label>
                <select 
                  value={reportStatusFilter} 
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border focus:border-[#FF6B00] font-semibold"
                >
                  <option value="ALL">All Status Levels</option>
                  <option value="PENDING">Pending Orders</option>
                  <option value="TRANSIT">In Transit</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered (Completed)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-650 block uppercase tracking-wider">Time Duration Block</label>
                <select 
                  value={reportDateFilter} 
                  onChange={(e) => setReportDateFilter(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border focus:border-[#FF6B00] font-semibold"
                >
                  <option value="ALL">All Recorded Dates (All Time)</option>
                  <option value="TODAY">Today's Transactions Only</option>
                  <option value="WEEK">Last 7 Active Operational Days</option>
                </select>
              </div>
            </div>

            {/* Dynamic Metric Ribbon */}
            {(() => {
              const previewOrdersList = getFilteredReportOrders();
              const previewTotalAmt = previewOrdersList.reduce((sum, o) => sum + o.finalTotal, 0);
              const previewTotalComm = previewOrdersList.reduce((sum, o) => sum + (o.status === 'DELIVERED' ? (o.commissionDeducted || 0) : 0), 0);
              const previewAvg = previewOrdersList.length > 0 ? previewTotalAmt / previewOrdersList.length : 0;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border p-3 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">RECORDED ORDERS</span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block">{previewOrdersList.length} orders</span>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider block font-display">GROSS GMV SALES</span>
                    <span className="text-sm font-black text-[#FF6B00] mt-0.5 block">₹{previewTotalAmt.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">PLATFORM REVENUE</span>
                    <span className="text-sm font-black text-emerald-600 mt-0.5 block">₹{previewTotalComm.toFixed(2)}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">AVG ORDER SIZE</span>
                    <span className="text-sm font-black text-blue-800 mt-0.5 block">₹{previewAvg.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Statement Preview Content Area */}
            <div className="flex-1 overflow-y-auto border rounded-2xl min-h-[150px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 sticky top-0">
                  <tr className="border-b text-[10px] font-extrabold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Merchant</th>
                    <th className="py-2.5 px-3">Catalog Items summary</th>
                    <th className="py-2.5 px-3 text-right">Billing Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs text-slate-700">
                  {getFilteredReportOrders().map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[10.5px] font-bold">{o.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{o.sellerName}</td>
                      <td className="py-2 px-3 max-w-[220px] truncate">{o.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}</td>
                      <td className="py-2 px-3 font-black text-[#FF6B00] text-right">₹{o.finalTotal}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-right">
                        {o.statusTimeline?.[0]?.timestamp?.split('T')[0] || ''}
                      </td>
                    </tr>
                  ))}
                  {getFilteredReportOrders().length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        No sales ledger records match selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-2.5 pt-3 border-t">
              <button 
                type="button"
                onClick={() => setShowInvoiceReportModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition cursor-pointer text-center"
              >
                Close Statement Portal
              </button>
              <button 
                type="button"
                onClick={handlePrintInvoiceReport}
                className="flex-1 bg-[#FF6B00] hover:bg-orange-500 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Download / Print PDF Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
