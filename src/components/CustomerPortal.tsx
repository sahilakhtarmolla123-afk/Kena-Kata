import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Bell, Heart, User, MapPin, ChevronRight, 
  Trash2, Ticket, Sparkles, Smartphone, Check, ArrowRight, HelpCircle, 
  ChevronLeft, Camera, PhoneCall, Copy, ArrowLeft, Image as ImageIcon,
  MessageSquare, Star, Clock, AlertTriangle, ChevronUp, Share2, Mic,
  Volume2, Eye, Play, Plus, Scale, Compass, Map, Info, UserCheck, Shield, X,
  FileText, Download, Printer, Home, ShoppingCart, Package, Store
} from 'lucide-react';
import { Product, Seller, Order, UserProfile, Announcement, ProductQA, ChatMessage, Dispute, SystemVideo, AppNotification } from '../types';
import { apiFetch as fetch } from '../utils/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';

function ProductWatermark({ logo }: { logo?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 select-none z-10 w-full h-full">
      {logo ? (
        <img src={logo} className="w-14 h-14 object-contain filter brightness-110 drop-shadow-md mix-blend-screen" alt="watermark" />
      ) : (
        <span className="text-white text-[10.5px] font-black tracking-widest bg-slate-950/40 px-3 py-1 rounded uppercase font-mono">KENA KATA</span>
      )}
    </div>
  );
}

interface CustomerPortalProps {
  products: Product[];
  sellers: Seller[];
  orders: Order[];
  announcements: Announcement[];
  qas: ProductQA[];
  chats: ChatMessage[];
  disputes: Dispute[];
  notifications: AppNotification[];
  videos: SystemVideo[];
  currentUser: UserProfile;
  adminConfig: {
    upiId: string;
    qrImage: string;
    broadcastText: string;
    homeFeedBanner: string;
    appLogo?: string;
  };
  triggerRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

const getStatusStepValue = (status?: string): number => {
  switch (status) {
    case 'PLACED': return 1;
    case 'CONFIRMED': return 2;
    case 'DISPATCHED': return 3;
    case 'OUT_FOR_DELIVERY': return 4;
    case 'DELIVERED': return 5;
    case 'RETURNED': return 0;
    default: return 1;
  }
};

export default function CustomerPortal({
  products,
  sellers,
  orders,
  announcements,
  qas,
  chats,
  disputes,
  notifications,
  videos,
  currentUser,
  adminConfig,
  triggerRefresh,
  showToast,
  onUpdateUser
}: CustomerPortalProps) {
  
  // Navigation / View state
  const [currentView, setCurrentView] = useState<'home' | 'categories' | 'cart' | 'purchases' | 'profile' | 'detail' | 'checkout' | 'online_pay' | 'tracking' | 'videos' | 'compare' | 'history' | 'wishlist'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Details product context
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedCheckoutAddressId, setSelectedCheckoutAddressId] = useState<string>('default');

  // Cart storage arrays
  const [cartItems, setCartItems] = useState<{ product: Product, quantity: number, selectedVariant?: string }[]>([]);

  // Selected sizes
  const [chosenSize, setChosenSize] = useState('');

  // Selected shipping options
  const [selectedSpeed, setSelectedSpeed] = useState<string>('Standard');
  const [shippingPrice, setShippingPrice] = useState<number>(40);

  // Payments input fields
  const [onlineTxnId, setOnlineTxnId] = useState('');
  const [onlineScreenshot, setOnlineScreenshot] = useState('');

  // Ratings forms
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Dispute creation popup form
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeIdToCreate, setDisputeIdToCreate] = useState('');
  const [disputeReason, setDisputeReason] = useState('Damaged Product Delivered');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidencePhoto, setDisputeEvidencePhoto] = useState('https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60');

  // Apply for seller modal state
  const [showApplySellerModal, setShowApplySellerModal] = useState(false);
  const [sellerShopName, setSellerShopName] = useState('');
  const [sellerOwnerName, setSellerOwnerName] = useState(currentUser.name);
  const [sellerBanner, setSellerBanner] = useState('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80');
  const [sellerLogo, setSellerLogo] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60');

  // Followed sellers list 
  const [followedSellers, setFollowedSellers] = useState<string[]>([]);

  // Active tour guide index (App Tour)
  const [tourStep, setTourStep] = useState<number | null>(() => {
    const closed = localStorage.getItem('kk_tour_closed');
    return closed ? null : 0;
  });

  const tourPoints = [
    { title: "Personalized Feed", text: "Apnar select kora categories base dynamic recommendations feeds upore display korbe!" },
    { title: "Voice & Image Search", text: "Sanjeeg voice microphones ba image uploads directly use kore dynamic search korun." },
    { title: "Delivery Priority Choose", text: "Standard, Same-Day deliver priority set kore fast parcels process korun." },
    { title: "Transmitted Reels", text: "Videos catalog follow korar maddhome local & global broadcast stream access korun." }
  ];

  // Simulated Offline Mode State toggle
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [isChronological, setIsChronological] = useState(false);

  // Simulated Voice Search state
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Simulated Image Search state
  const [imageSearchFileUrl, setImageSearchFileUrl] = useState('');

  // Sizing Comparison Array
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);

  // Recently Viewed caching list
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kk_recent_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  // Price Range filtering state
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  // Recent Searches list
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kk_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  // Automatically save non-empty searches
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    const trimmed = searchTerm.trim();
    const handler = setTimeout(() => {
      setRecentSearches(prev => {
        if (prev.includes(trimmed)) return prev;
        const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 5);
        localStorage.setItem('kk_recent_searches', JSON.stringify(next));
        return next;
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const clearRecentSearch = (term: string) => {
    const updated = recentSearches.filter(t => t !== term);
    setRecentSearches(updated);
    localStorage.setItem('kk_recent_searches', JSON.stringify(updated));
  };

  // Home Banner cycle
  const promoBanners = [
    adminConfig.homeFeedBanner,
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80"
  ];
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % promoBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const addRecentlyViewed = (id: string) => {
    if (recentlyViewedIds.includes(id)) {
      const filtered = recentlyViewedIds.filter(x => x !== id);
      const updated = [id, ...filtered].slice(0, 5);
      setRecentlyViewedIds(updated);
      localStorage.setItem('kk_recent_viewed', JSON.stringify(updated));
    } else {
      const updated = [id, ...recentlyViewedIds].slice(0, 5);
      setRecentlyViewedIds(updated);
      localStorage.setItem('kk_recent_viewed', JSON.stringify(updated));
    }
  };

  // Custom onboarding preferences recommendations filter logic
  const myOnboardingCategories = currentUser.interests || [];
  
  const getProductViewerCount = (prodId: string) => {
    // Return mock active viewer counts for trending rows
    const hash = prodId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 18) + 4; // Simulated range 4 to 22 people viewing!
  };

  const handleApplySellerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerShopName) return;
    try {
      const res = await fetch('/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, role: 'SELLER', shopName: sellerShopName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Complete activation with credentials
        const regRes = await fetch('/api/auth/register-seller', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopName: sellerShopName,
            ownerName: sellerOwnerName,
            mobile: currentUser.mobile,
            logo: sellerLogo,
            banner: sellerBanner,
            otp: data.simulatedOtp || "1234"
          })
        });
        const regData = await regRes.json();
        if (regRes.ok && regData.success) {
          showToast(`Applied successfully! Shop "${sellerShopName}" submitted for approval.`, "success");
          setShowApplySellerModal(false);
          triggerRefresh();
        }
      }
    } catch (e) {
      showToast("Error processing seller request.", "error");
    }
  };

  const toggleFollowSeller = (sellId: string) => {
    if (followedSellers.includes(sellId)) {
      setFollowedSellers(followedSellers.filter(id => id !== sellId));
      showToast("Unfollowed merchant shop.", "info");
    } else {
      setFollowedSellers([...followedSellers, sellId]);
      showToast("Followed shop! You unlocked exclusive follower clips. 🎥", "success");
    }
  };

  // Simulated Voice Search phrase triggers
  const triggerSpeakSearchMocker = () => {
    setIsListeningVoice(true);
    const mockPhrases = ["Cotton Jamdani Saree", "Premium Gadgets", "Organic Groceries", "Spoon and Flatware", "Cosmetics Kit"];
    const picked = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    
    setTimeout(() => {
      setSearchTerm(picked);
      setIsListeningVoice(false);
      showToast(`Search phrase matched: "${picked}" ✨`, "success");
    }, 2000);
  };

  // Simulated Drag-Drop Image search matching
  const triggerImageSearchSim = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) {
      showToast("Scanning uploaded photograph for visual attributes...", "info");
      setTimeout(() => {
        setSearchTerm("Saree"); // Matches default mock saree
        showToast("Scan finished! Categorized as 'Saree' listings.", "success");
      }, 1500);
    }
  };

  const toggleWishlist = async (productId: string) => {
    const currentWishlist = currentUser.wishlist || [];
    let updatedWishlist: string[];
    let actionType: 'added' | 'removed';

    if (currentWishlist.includes(productId)) {
      updatedWishlist = currentWishlist.filter(id => id !== productId);
      actionType = 'removed';
    } else {
      updatedWishlist = [...currentWishlist, productId];
      actionType = 'added';
    }

    try {
      const res = await fetch('/api/profile/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          wishlist: updatedWishlist
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            wishlist: updatedWishlist
          });
        }
        if (actionType === 'added') {
          showToast("Added to personalized Wishlist! ❤️", "success");
        } else {
          showToast("Removed from personalized Wishlist.", "info");
        }
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to update wishlist.", "error");
      }
    } catch (err) {
      showToast("Failed to connect to security gateway.", "error");
    }
  };

  const handleDownloadInvoice = (ord: Order) => {
    const timestamp = ord.statusTimeline?.[0]?.timestamp 
      ? new Date(ord.statusTimeline[0].timestamp).toLocaleString('default', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
      : 'N/A';
    
    // Safely calculate item subtotal and tax values (Assuming 5% GST is included in product catalog prices as standard)
    const itemsSubtotal = ord.itemTotal || ord.items.reduce((acc, current) => acc + (current.price * current.quantity), 0);
    const taxableValue = itemsSubtotal / 1.05;
    const totalTax = itemsSubtotal - taxableValue;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    const itemsHtml = ord.items.map(item => `
      <tr style="page-break-inside: avoid;">
        <td style="padding: 12px; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
          ${item.productName}
          ${item.variant ? `<div style="font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">Variant: ${item.variant}</div>` : ''}
        </td>
        <td style="padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: center;">${item.variant || 'Standard'}</td>
        <td class="number-col" style="padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right; font-family: 'JetBrains Mono', monospace;">₹${item.price.toFixed(2)}</td>
        <td class="number-col" style="padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: center; font-family: 'JetBrains Mono', monospace;">${item.quantity}</td>
        <td class="number-col" style="padding: 12px; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right; font-family: 'JetBrains Mono', monospace;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - Mouchak Bazaar #${ord.id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        /* General Document layout for both screen and standard A4 Print */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
            color: #1e293b; 
            background: #f1f5f9; 
            padding: 40px 20px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        
        .actions-bar { 
            max-width: 840px; 
            margin: 0 auto 20px auto; 
            display: flex; 
            justify-content: flex-end; 
            gap: 12px;
        }
        
        .no-print-btn { 
            background: #FF6B00; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            font-size: 13px; 
            font-weight: 700; 
            border-radius: 10px; 
            cursor: pointer; 
            text-transform: uppercase; 
            box-shadow: 0 4px 6px -1px rgba(255, 107, 0, 0.2); 
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        .no-print-btn:hover {
            background: #e05e00;
            transform: translateY(-1px);
        }
        .no-print-btn.sec { 
            background: #475569; 
            box-shadow: 0 4px 6px -1px rgba(71, 85, 105, 0.2);
        }
        .no-print-btn.sec:hover {
            background: #334155;
        }

        .invoice-card { 
            background: white; 
            padding: 45px; 
            max-width: 840px; 
            margin: 0 auto; 
            border: 1px solid #e2e8f0; 
            border-radius: 20px; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); 
            position: relative; 
            overflow: hidden;
        }
        
        /* High aesthetic header with honeycomb watermark logo */
        .watermark { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) rotate(-30deg); 
            font-size: 90px; 
            font-weight: 900; 
            opacity: 0.02; 
            color: #000; 
            pointer-events: none; 
            text-transform: uppercase; 
            letter-spacing: 12px; 
        }

        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 3px double #f1f5f9; 
            padding-bottom: 24px; 
            margin-bottom: 28px; 
        }
        
        .logo-block {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo-icon {
            width: 44px;
            height: 44px;
            background: #FF6B00;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-text { 
            font-size: 24px; 
            font-weight: 800; 
            color: #FF6B00; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            line-height: 1;
        }
        
        .logo-subtext { 
            font-size: 11px; 
            color: #64748b; 
            font-weight: 500;
            margin-top: 4px;
        }
        
        .invoice-title-block {
            text-align: right;
        }
        
        .invoice-title { 
            font-size: 24px; 
            font-weight: 800; 
            color: #0f172a; 
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        
        .invoice-id-badge {
            display: inline-block;
            background: #f1f5f9;
            color: #0f172a;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            margin-top: 6px;
        }

        /* Billing metadata splits */
        .meta-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
        }
        
        .meta-block {
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #f1f5f9;
        }
        
        .meta-block h3 { 
            font-size: 11px; 
            text-transform: uppercase; 
            letter-spacing: 0.75px; 
            color: #475569; 
            margin-bottom: 10px; 
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
        }
        
        .meta-block p { 
            margin: 4px 0; 
            font-size: 13px; 
            line-height: 1.5; 
            color: #334155; 
        }
        
        .meta-block p strong { 
            color: #0f172a; 
        }

        /* Styled table details */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 25px; 
        }
        
        th { 
            background: #0f172a; 
            text-align: left; 
            padding: 12px 14px; 
            font-size: 11px; 
            text-transform: uppercase; 
            color: #ffffff; 
            font-weight: 700; 
            letter-spacing: 0.5px;
            border-bottom: 2px solid #334155; 
        }
        th:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }
        th:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
        }
        
        .number-col { 
            text-align: right; 
        }

        /* A4 Layout with Tax Table on left, Totals on right */
        .splits-summary-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 25px;
            align-items: start;
            margin-bottom: 30px;
        }
        
        .tax-summary-box {
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 14px;
            background: #ffffff;
        }
        
        .tax-summary-title {
            font-size: 10.5px;
            text-transform: uppercase;
            font-weight: 800;
            color: #475569;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .tax-table {
            width: 100%;
            margin-bottom: 0;
        }
        .tax-table th {
            font-size: 9px;
            padding: 6px 8px;
            background: #f1f5f9;
            color: #475569;
            border-bottom: 1px solid #cbd5e1;
        }
        .tax-table th:first-child, .tax-table th:last-child {
            border-radius: 0;
        }
        .tax-table td {
            font-size: 10px;
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-family: 'JetBrains Mono', monospace;
        }

        .summary-box { 
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 6px 0; 
            font-size: 12px; 
            color: #475569; 
        }
        
        .summary-row.total { 
            font-size: 15px; 
            font-weight: 800; 
            color: white; 
            background: #FF6B00;
            margin: 10px -16px -16px -16px;
            padding: 12px 16px; 
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }

        /* Dual signoff signatures cards for official delivery gateway validation */
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 15px;
        }
        
        .signature-card {
            border-top: 1px solid #cbd5e1;
            text-align: center;
            padding-top: 8px;
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
        }

        .footer { 
            text-align: center; 
            margin-top: 35px; 
            color: #94a3b8; 
            font-size: 10px; 
            border-top: 1px solid #f1f5f9; 
            padding-top: 15px; 
        }

        /* ========================================================
           DEDICATED PRINT-FRIENDLY STYLESHEET FOR A4 PRINTING
           ======================================================== */
        @media print {
            @page {
                size: A4 portrait;
                margin: 12mm 12mm 15mm 12mm;
            }
            body { 
                background: white; 
                padding: 0 !important; 
                margin: 0 !important;
                color: #000000;
                font-size: 11px;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
            }
            .actions-bar { 
                display: none !important; 
            }
            .invoice-card { 
                border: none !important; 
                box-shadow: none !important; 
                padding: 5px !important; 
                max-width: 100% !important;
                margin: 0 !important;
                background: white !important;
            }
            .watermark {
                opacity: 0.015 !important;
            }
            .meta-block {
                background: #fafafa !important;
                border: 1px solid #cbd5e1 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            th {
                background: #1e293b !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .tax-table th {
                background: #f1f5f9 !important;
                color: #334155 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .summary-box {
                background: #fafafa !important;
                border: 1px solid #cbd5e1 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .summary-row.total {
                background: #FF6B00 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            tr {
                page-break-inside: avoid !important;
            }
            .splits-summary-grid {
                grid-template-columns: 1.1fr 1fr !important;
                gap: 15px !important;
            }
            .signature-grid {
                margin-top: 55px !important;
            }
        }
    </style>
</head>
<body>
    <div class="actions-bar">
        <button class="no-print-btn" onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print This Invoice
        </button>
        <button class="no-print-btn sec" onclick="window.close()">
            Close Window
        </button>
    </div>
    
    <div class="invoice-card">
        <div class="watermark">MOUCHAK</div>
        
        <!-- Header Section with Brand Emblem logo and descriptor -->
        <div class="header">
            <div class="logo-block">
                <div class="logo-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/>
                        <path d="M12 22V12"/>
                        <path d="M12 12l8.66-5"/>
                        <path d="M12 12L3.34 7"/>
                    </svg>
                </div>
                <div>
                    <h1 class="logo-text">Mouchak Bazaar</h1>
                    <p class="logo-subtext">Direct Hub & Verified Seller Gateway Partner</p>
                </div>
            </div>
            <div class="invoice-title-block">
                <h2 class="invoice-title">Tax Invoice</h2>
                <div class="invoice-id-badge">ID: #${ord.id}</div>
            </div>
        </div>

        <!-- Dynamic Billing Split info (Billed to vs sold by merchant) -->
        <div class="meta-grid">
            <div class="meta-block">
                <h3>Billed To (Customer Detail)</h3>
                <p><strong>Name:</strong> ${ord.customerName}</p>
                <p><strong>Mobile:</strong> ${ord.customerMobile}</p>
                <p><strong>Address:</strong> ${ord.deliveryAddress.address}</p>
                <p><strong>Location:</strong> ${ord.deliveryAddress.district}, ${ord.deliveryAddress.state}</p>
            </div>
            <div class="meta-block" style="text-align: left;">
                <h3>Sold By (Merchant Partner)</h3>
                <p><strong>Merchant Shop:</strong> ${ord.sellerName || 'Verified Mouchak Merchant'}</p>
                <p><strong>Merchant ID:</strong> <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${ord.sellerId || 'N/A'}</span></p>
                <p><strong>Delivery Priority:</strong> Tier ${ord.selectedDeliverySpeed || 'Standard'}</p>
                <p><strong>Invoice Date:</strong> ${timestamp}</p>
            </div>
        </div>

        <!-- Main Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="padding: 12px;">Item Description</th>
                    <th style="padding: 12px; text-align: center;">Variant Choice</th>
                    <th class="number-col" style="padding: 12px; width: 120px;">Unit Price</th>
                    <th style="padding: 12px; text-align: center; width: 60px;">Qty</th>
                    <th class="number-col" style="padding: 12px; width: 120px;">Total Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <!-- Splitted summaries grid containing Tax breakdown table + Grand Totals -->
        <div class="splits-summary-grid">
            <!-- Statutory Tax summary breakdown table matrix -->
            <div class="tax-summary-box">
                <div class="tax-summary-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:-webkit-inline-box; display:inline-flex; align-items:center;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>&nbsp;
                    Statutory Tax Breakdown Summary (GST 5% Included)
                </div>
                <table class="tax-table">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Description</th>
                            <th style="text-align: right;">Taxable (Base)</th>
                            <th style="text-align: right;">CGST (2.5%)</th>
                            <th style="text-align: right;">SGST (2.5%)</th>
                            <th style="text-align: right;">Tax Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight: 600;">General Foods/Goods</td>
                            <td style="text-align: right;">₹${taxableValue.toFixed(2)}</td>
                            <td style="text-align: right;">₹${cgst.toFixed(2)}</td>
                            <td style="text-align: right;">₹${sgst.toFixed(2)}</td>
                            <td style="text-align: right; font-weight: 600;">₹${totalTax.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: bold; background: #f8fafc;">
                            <td style="font-size: 9px; text-transform: uppercase;">Total Included</td>
                            <td style="text-align: right;">₹${taxableValue.toFixed(2)}</td>
                            <td style="text-align: right;">₹${cgst.toFixed(2)}</td>
                            <td style="text-align: right;">₹${sgst.toFixed(2)}</td>
                            <td style="text-align: right; color:#FF6B00;">₹${totalTax.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Grand totals receipt list -->
            <div class="summary-box">
                <div class="summary-row">
                    <span>Items Net Subtotal:</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">₹${itemsSubtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Priority Shipping Charge (Incl. GST):</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">₹${ord.deliveryCharge.toFixed(2)}</span>
                </div>
                ${ord.discountTotal ? `
                <div class="summary-row" style="color: #ef4444;">
                    <span>Promo Coupon Discount:</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">-₹${ord.discountTotal.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span>Selected Payment Mode:</span>
                    <span style="font-weight: 700; color: #1e293b;">${ord.paymentMethod === 'ONLINE' ? 'Online QR Payment' : 'Cash on Delivery (COD)'}</span>
                </div>
                ${ord.paymentDetails?.transactionId ? `
                <div class="summary-row" style="font-size: 11px; padding-top: 2px;">
                    <span>Verified Payment ID:</span>
                    <span style="font-family: 'JetBrains Mono', monospace; color: #475569;">${ord.paymentDetails.transactionId}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Grand Total Checklist:</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800;">₹${ord.finalTotal.toFixed(2)} Taka</span>
                </div>
            </div>
        </div>

        <!-- Official Signoffs -->
        <div class="signature-grid">
            <div class="signature-card" style="margin-top: 30px;">
                Authorized Seller Stamp / Signature
            </div>
            <div class="signature-card" style="margin-top: 30px;">
                Customer Acknowledgment Receive Signoff
            </div>
        </div>

        <!-- Beautiful Disclaimer footer -->
        <div class="footer">
            <p>Thank you for shopping on Mouchak Bazaar! For cargo returns or consumer dispute logs, please file a claim inside your Purchases Ledger.</p>
            <p style="margin-top: 8px; font-size: 9px; opacity: 0.85;">Invoice generated automatically on security gateways on: <strong>${new Date().toLocaleString()}</strong></p>
        </div>
    </div>
</body>
</html>
    `;

    try {
      const blob = new Blob([htmlCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_Mouchak_Order_${ord.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully! 📄 Feel free to print or save it.", "success");
    } catch (e) {
      showToast("Failed to compile or trigger download.", "error");
    }
  };

  const handleComparisonToggle = (id: string) => {
    if (compareProductIds.includes(id)) {
      setCompareProductIds(compareProductIds.filter(x => x !== id));
      showToast("Removed product from comparison slate.", "info");
    } else {
      if (compareProductIds.length >= 3) {
        showToast("You can compare up to 3 products at a time.", "error");
        return;
      }
      setCompareProductIds([...compareProductIds, id]);
      showToast("Added product to comparison slate! 📊", "success");
    }
  };

  // Dispute creation submission
  const handleOpenDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDescription) {
      showToast("Please provide full dispute description details.", "error");
      return;
    }
    try {
      const res = await fetch('/api/orders/open-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: disputeIdToCreate,
          reason: disputeReason,
          description: disputeDescription,
          customerEvidencePhoto: disputeEvidencePhoto
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Dispute Case filed successfully! ID: #${data.dispute.id}. Admin will arbitrate in 48 hours.`, "success");
        setShowDisputeModal(false);
        setDisputeDescription('');
        triggerRefresh();
      }
    } catch (err) {
      showToast("Dispute creation failed.", "error");
    }
  };

  // Submit Order process
  const submitNewOrderCheckout = async (payMethod: 'COD' | 'ONLINE') => {
    if (isOfflineSimulated) {
      showToast("Action locked: Cloud transactions are paused under Simulated Offline mode.", "error");
      return;
    }
    if (cartItems.length === 0) return;

    try {
      const speedOptionsPrice = speedSelectedPriceOverride();
      const targetDeliveryAddress = (() => {
        if (selectedCheckoutAddressId === 'default' || !currentUser.savedAddresses || currentUser.savedAddresses.length === 0) {
          return {
            address: currentUser.address,
            state: currentUser.state,
            district: currentUser.district
          };
        }
        const match = currentUser.savedAddresses.find(a => a.id === selectedCheckoutAddressId);
        if (match) {
          return {
            address: match.address,
            state: match.state,
            district: match.district
          };
        }
        return {
          address: currentUser.address,
          state: currentUser.state,
          district: currentUser.district
        };
      })();

      const finalPayload = {
        customerMobile: currentUser.mobile,
        customerName: currentUser.name,
        paymentMethod: payMethod,
        items: cartItems.map(c => ({
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
          price: c.product.price,
          variant: c.selectedVariant,
          image: c.product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"
        })),
        deliveryAddress: targetDeliveryAddress,
        selectedDeliverySpeed: selectedSpeed,
        deliveryFeeApplied: speedOptionsPrice,
        paymentDetails: payMethod === 'ONLINE' ? {
          transactionId: onlineTxnId || `online_txn_${Date.now()}`,
          screenshotUrl: onlineScreenshot || "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60",
          verified: false
        } : undefined
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Success! Your order has been placed in the queue feed! 🚀", "success");
        setCartItems([]);
        setSelectedOrder(data.order);
        setCurrentView('purchases');
        triggerRefresh();
      } else {
        showToast(data.error || "Order creation failure.", "error");
      }
    } catch (e) {
      showToast("Offline connectivity locks.", "error");
    }
  };

  const speedSelectedPriceOverride = () => {
    if (selectedSpeed === 'Express') return 105;
    if (selectedSpeed === 'Same Day') return 240;
    return 40; // Default standard
  };

  const addToCart = (product: Product, buyNow = false) => {
    if (product.stock <= 0) {
      showToast("Item currently out of stock!", "error");
      return;
    }
    const existsIndex = cartItems.findIndex(i => i.product.id === product.id && i.selectedVariant === chosenSize);
    if (existsIndex !== -1) {
      const updated = [...cartItems];
      updated[existsIndex].quantity++;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, quantity: 1, selectedVariant: chosenSize || undefined }]);
    }
    showToast(`${product.name} appended to cart! 🛒`, "success");
    if (buyNow) {
      setCurrentView('cart');
    }
  };

  const filteredProducts = products.filter(p => {
    // If onboarding matches
    const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
    const priceMatch = p.price >= minPrice && p.price <= maxPrice;
    return nameMatch && catMatch && priceMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Offline Mode & Broadcast banner alerts */}
      <div className="bg-[#1e1b4b] border-b border-rose-500/10 px-4 py-2 flex justify-between items-center text-xs flex-wrap gap-2 text-indigo-200">
        <marquee className="flex-1 font-bold text-xs">{adminConfig.broadcastText}</marquee>
        <div className="flex items-center gap-2">
          {/* Simulated Offline Switcher Toggle */}
          <button
            onClick={() => {
              setIsOfflineSimulated(!isOfflineSimulated);
              showToast(isOfflineSimulated ? "Reconnected to live Firebase servers." : "Simulating Offline Caching state active! Reads verified mock caches.", "info");
            }}
            className={`px-3 py-1 rounded-xl text-[9.5px] font-black uppercase transition cursor-pointer ${isOfflineSimulated ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {isOfflineSimulated ? "⚠️ Offline Mode Active" : "Simulate Offline Mode"}
          </button>
        </div>
      </div>

      {/* App Onboarding Tour */}
      {tourStep !== null && (
        <div className="bg-[#FF6B00] text-white p-3.5 text-xs text-center flex justify-between items-center gap-2 font-display">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
            <span className="font-extrabold">{tourPoints[tourStep].title}:</span>
            <span className="font-medium">{tourPoints[tourStep].text}</span>
          </div>
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px]">
            <button
              onClick={() => {
                if (tourStep < tourPoints.length - 1) setTourStep(tourStep + 1);
                else { setTourStep(null); localStorage.setItem('kk_tour_closed', 'true'); }
              }}
              className="bg-slate-950 px-2.5 py-1 rounded-lg"
            >
              Next Step
            </button>
            <button
              onClick={() => { setTourStep(null); localStorage.setItem('kk_tour_closed', 'true'); }}
              className="underline"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Customer Header navigation */}
      <div className="bg-[#0b1329] p-3.5 border-b border-rose-500/10 flex flex-col sm:flex-row gap-3 justify-between items-center sticky top-[40px] z-30">
        
        {/* Dynamic Voice/Image Search Bar */}
        <div className="w-full sm:max-w-md flex items-center relative gap-1.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search saree, gadgets, cosmetics..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/40 rounded-xl p-2.5 pl-10 pr-10 text-xs"
            />
            {searchTerm && <X className="w-4 h-4 text-slate-400 absolute right-3 top-3 cursor-pointer" onClick={() => setSearchTerm('')} />}
          </div>

          {/* Voice Search Button */}
          <button
            onClick={triggerSpeakSearchMocker}
            className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${isListeningVoice ? 'bg-red-500 text-white animate-ping' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'}`}
            title="Voice Speech Search"
          >
            {isListeningVoice ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Image Search Drag/Drop Area Mock */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={triggerImageSearchSim}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            title="Drag dropping image search matching similar styles"
          >
            <Camera className="w-4 h-4" />
          </div>
        </div>

        {/* Global tab selections */}
        <nav className="flex gap-2 text-xs flex-wrap">
          <button onClick={() => setCurrentView('home')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'home' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}>Mouchak Feed</button>
          <button onClick={() => setCurrentView('videos')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'videos' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}>Reels 🎥</button>
          <button onClick={() => setCurrentView('compare')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'compare' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}>Compare slate 📊</button>
          <button onClick={() => setCurrentView('purchases')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'purchases' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}>My Purchases</button>
          <button onClick={() => setCurrentView('wishlist')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'wishlist' ? 'bg-[#FF6B00] text-white font-black' : 'text-slate-400'} flex items-center gap-1`}>
            <span>My Wishlist</span>
            <Heart className={`w-3 h-3 ${ (currentUser.wishlist || []).length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
            {(currentUser.wishlist || []).length > 0 && (
              <span className="text-[9px] bg-rose-600 text-white min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-mono font-black">{(currentUser.wishlist || []).length}</span>
            )}
          </button>
          <button onClick={() => setCurrentView('history')} className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentView === 'history' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}>Order History 📊</button>
        </nav>
      </div>

      <main className="max-w-5xl mx-auto w-full p-4">
        
        {currentView === 'compare' && (
          <div className="space-y-6">
            <div className="bg-[#0b1329] border border-slate-805 p-5 rounded-3xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Product Comparison matrix slate</h2>
              <p className="text-xs text-slate-400">Evaluate product costs, specification details, rating parameters, and merchant clearance indexes side-by-side.</p>
            </div>

            {compareProductIds.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-16 bg-white rounded-3xl border">Please click the compare button on product listings cards to begin comparisons slate.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareProductIds.map((id) => {
                  const prod = products.find(p => p.id === id);
                  if (!prod) return null;
                  return (
                    <div key={prod.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4">
                      <div className="text-right">
                        <button onClick={() => handleComparisonToggle(prod.id)} className="text-red-400 text-xs font-bold font-mono">Remove</button>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl">
                        <img src={prod.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-36 object-cover rounded-2xl" />
                        <ProductWatermark logo={adminConfig?.appLogo} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{prod.name}</h4>
                        <p className="text-lg font-mono text-[#FF6B00] font-black mt-1">₹{prod.price}</p>
                      </div>
                      <div className="space-y-2 text-xs text-slate-400 border-t border-slate-850 pt-2">
                        <p>Category: <strong className="text-white">{prod.category}</strong></p>
                        <p>Merchant Shop: <strong className="text-white">{prod.sellerName}</strong></p>
                        <p>Platform Clearance: <strong className="text-green-400">Security Approved ✓</strong></p>
                        <div>
                          <span className="font-bold block text-[10px] text-slate-500 uppercase">Specs details:</span>
                          {Object.entries(prod.specifications || {}).map(([k, v]) => (
                            <p key={k} className="text-[10px] font-mono">{k}: {String(v)}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'home' && (
          <div className="space-y-6">
            
            {/* Banner Slider */}
            <div className="h-44 sm:h-56 rounded-3xl overflow-hidden relative border border-slate-800 shadow-lg">
              <img src={promoBanners[bannerIdx]} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 p-5 flex flex-col justify-end">
                <span className="bg-[#FF6B00] text-white text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest w-max mb-1">Mouchak Flash Discount</span>
                <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">Up to 60% Flat Off across traditional Saree & Cosmetics!</h2>
              </div>
            </div>

            {/* Personalized Recommendations list based on onboarding selected categories interests */}
            {myOnboardingCategories.length > 0 && (
              <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/10 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 text-[#FF6B00]">
                  <Sparkles className="w-4 h-4 animate-spin text-yellow-400" /> Recommended for You (Based on onboarding preferences)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {products
                    .filter(p => myOnboardingCategories.includes(p.category))
                    .slice(0, 4)
                    .map((prod) => (
                      <div key={prod.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition cursor-pointer" onClick={() => { setSelectedProduct(prod); setCurrentView('detail'); addRecentlyViewed(prod.id); }}>
                        <div className="relative overflow-hidden rounded-xl">
                          <img src={prod.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-24 object-cover rounded-xl" />
                          <ProductWatermark logo={adminConfig?.appLogo} />
                        </div>
                        <h4 className="text-[11px] font-extrabold text-white mt-1.5 truncate">{prod.name}</h4>
                        <p className="text-[11.5px] font-mono text-[#FF6B00] font-black">₹{prod.price}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Trending Shelf products with visitor counts indicators */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <FlameIcon /> Trending right now (Live Buyer counters stream)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.slice(0, 4).map((p) => {
                  const viewersCount = getProductViewerCount(p.id);
                  return (
                    <div key={p.id} className="bg-[#0b1329] border border-slate-800 rounded-3xl p-3 relative hover:border-[#FF6B00]/30 transition group flex flex-col justify-between">
                      <div>
                        {/* Live Counter Badge */}
                        <span className="absolute top-2 left-2 bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 z-10 animate-pulse">
                          ● {viewersCount} viewing
                        </span>
                        
                        <div className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(p); setCurrentView('detail'); addRecentlyViewed(p.id); }}>
                          <img src={p.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-32 object-cover group-hover:scale-105 duration-300" />
                          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition" />
                          <ProductWatermark logo={adminConfig?.appLogo} />
                        </div>

                        <h4 className="text-xs font-extrabold text-white mt-2 truncate">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{p.sellerName}</p>
                        
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[#FF6B00] font-mono font-black text-sm">₹{p.price}</span>
                          <span className="bg-orange-500/10 text-brand-orange border border-orange-500/20 text-[7.5px] font-black px-1 py-0.25 rounded uppercase">Buyer Protection ✓</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-slate-850">
                        <button
                          onClick={() => handleComparisonToggle(p.id)}
                          className={`flex-1 py-1.5 rounded-xl border text-[9.5px] font-black uppercase transition cursor-pointer ${compareProductIds.includes(p.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
                        >
                          Compare
                        </button>
                        <button
                          onClick={() => addToCart(p)}
                          className="flex-1 bg-[#FF6B00] text-white font-extrabold py-1.5 rounded-xl text-[9.5px] uppercase cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standard Grid and Categories list */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
              
              {/* Sidebar filter controls */}
              <aside className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2">
                  <span className="text-[9.5px] font-black text-[#FF6B00] uppercase block">Explore Categories</span>
                  <div className="flex flex-col gap-1.5 pt-2.5">
                    {["All", "Fashion", "Electronics", "Grocery", "Cosmetics", "Home Decor"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left font-bold text-xs p-2 rounded-xl transition cursor-pointer ${selectedCategory === cat ? 'bg-[#FFFF] text-[#0f172a] shadow font-black' : 'text-slate-400 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black text-[#FF6B00] uppercase block">Price Range (₹)</span>
                    <span className="text-[8.5px] text-slate-400 font-mono">Found: {filteredProducts.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-slate-400 font-black uppercase block mb-1">Min (₹)</label>
                      <input 
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-1 text-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-400 font-black uppercase block mb-1">Max (₹)</label>
                      <input 
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-1 text-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Pre-made quick dynamic presets */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                    <span className="text-[7.5px] text-slate-500 uppercase block font-bold">Quick Cost Presets</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: "Under ₹1K", min: 0, max: 1000 },
                        { label: "₹1K - ₹2K", min: 1000, max: 2000 },
                        { label: "₹2K - ₹5K", min: 2000, max: 5000 },
                        { label: "Above ₹5K", min: 5000, max: 100000 },
                      ].map((preset) => {
                        const isSelected = minPrice === preset.min && maxPrice === preset.max;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setMinPrice(preset.min);
                              setMaxPrice(preset.max);
                            }}
                            className={`text-[8.5px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                              isSelected ? 'bg-[#FF6B00] text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice(0);
                          setMaxPrice(100000);
                        }}
                        className="text-[8.5px] font-bold px-2 py-1 rounded-lg bg-slate-950 text-slate-500 border border-slate-800 hover:text-white transition cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {followingSellersAdvertiserPanel()}
              </aside>

              {/* Grid listings */}
              <div className="md:col-span-3 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-white uppercase block">All Catalog Items</h3>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-[10px] font-bold text-[#FF6B00] hover:underline"
                    >
                      Clear Filter Filter
                    </button>
                  )}
                </div>

                {/* Recent Searches and Popular Categories quick-link section */}
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    {/* Recent Searches */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Recent Searches</span>
                        </span>
                        {recentSearches.length > 0 && (
                          <button
                            onClick={() => {
                              setRecentSearches([]);
                              localStorage.removeItem('kk_recent_searches');
                            }}
                            className="text-[9px] font-bold text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      {recentSearches.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No search history yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-0.5 animate-fade-in">
                          {recentSearches.map((term, idx) => (
                            <div 
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10.5px] text-slate-300 hover:text-white transition"
                            >
                              <button
                                onClick={() => setSearchTerm(term)}
                                className="font-bold hover:underline text-left cursor-pointer"
                              >
                                {term}
                              </button>
                              <button
                                onClick={() => clearRecentSearch(term)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                                title="Remove search term"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Popular Categories */}
                    <div className="space-y-1.5 shrink-0">
                      <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
                        <span>Popular Categories</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {["Fashion", "Electronics", "Grocery", "Cosmetics"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                            }}
                            className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                              selectedCategory === cat
                                ? 'bg-white text-slate-900 border-white font-black shadow'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <span>#{cat}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => {
                    const isInWishlist = (currentUser.wishlist || []).includes(p.id);
                    return (
                      <div key={p.id} className="bg-slate-900 border border-slate-850 rounded-3xl p-3 flex flex-col justify-between group relative">
                        <div className="cursor-pointer" onClick={() => { setSelectedProduct(p); setCurrentView('detail'); addRecentlyViewed(p.id); }}>
                          <div className="relative overflow-hidden rounded-2xl">
                            <img src={p.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-32 object-cover rounded-2xl" />
                            <ProductWatermark logo={adminConfig?.appLogo} />
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(p.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white transition z-20 shadow"
                              title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-400'}`} />
                            </button>
                          </div>
                          <h4 className="text-xs font-extrabold text-white mt-1.5 truncate">{p.name}</h4>
                        <p className="text-[9.5px] text-slate-400 truncate">{p.sellerName}</p>
                        <p className="text-sm font-mono text-[#FF6B00] font-black mt-1">₹{p.price}</p>
                      </div>

                      <div className="flex gap-1 mt-2.5 pt-2 border-t border-slate-850">
                        <button onClick={() => { setSelectedProduct(p); setCurrentView('detail'); addRecentlyViewed(p.id); }} className="flex-1 bg-slate-950 border border-slate-850 hover:bg-[#0b1329] text-slate-300 text-[10px] font-bold py-1 px-1.5 rounded-xl text-center">Details</button>
                        <button onClick={() => addToCart(p)} className="flex-1 bg-[#FF6B00] text-white py-1 px-1 rounded-xl text-[10px] font-semibold text-center cursor-pointer">Add to Cart</button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

            </div>

            {/* Recently Viewed Shelf Carousel */}
            {recentlyViewedIds.length > 0 && (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3 pt-4">
                <span className="text-[9.5px] uppercase font-black text-slate-500 tracking-wider block">Recently Viewed Products</span>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {recentlyViewedIds.map((id) => {
                    const prod = products.find(p => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={prod.id} className="flex-shrink-0 w-28 text-center cursor-pointer" onClick={() => { setSelectedProduct(prod); setCurrentView('detail'); }}>
                        <img src={prod.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-800" />
                        <p className="text-[10px] text-slate-400 truncate font-semibold mt-1">{prod.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {currentView === 'videos' && (
          <div className="space-y-6">
            <div className="bg-[#0b1329] border border-slate-800 p-5 rounded-3xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Kena Kata Global Reels Broadcaster</h2>
              <p className="text-xs text-slate-400">Stream trailer advertisements or vendor tutorials directly. Click follow to unlock exclusive seller uploads!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((video) => {
                const isAdmin = video.uploadedBy === 'ADMIN';
                const isFollowed = followedSellers.includes(video.uploaderId) || isAdmin;

                return (
                  <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-white leading-tight">{video.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${isAdmin ? 'bg-orange-500 text-white' : 'bg-slate-850 text-indigo-400'}`}>
                        {video.uploadedBy}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-400">Merchant shop: <strong>{video.uploaderName}</strong></p>

                    {isFollowed ? (
                      <div className="rounded-2xl overflow-hidden aspect-video relative bg-slate-950">
                        {/* Stream Frame Block. Seller clips block direct clicking to protect copyright! */}
                        <iframe
                          src={video.videoUrl}
                          className="w-full h-full pointer-events-auto"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="no-referrer"
                        />
                        {!isAdmin && (
                          <div className="absolute inset-0 bg-transparent pointer-events-none border border-[#FF6B00]/10" title="Follower restriction: Clicking out to Youtube is blocked." />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col justify-center items-center p-4 text-center border border-slate-850 space-y-2">
                        <Play className="w-8 h-8 text-indigo-500 animate-pulse" />
                        <p className="text-xs font-bold text-slate-400">Follow the shop "{video.uploaderName}" to unlock exclusive product stream reels.</p>
                        <button
                          onClick={() => toggleFollowSeller(video.uploaderId)}
                          className="bg-[#FF6B00] text-white font-extrabold text-[10px] uppercase px-3.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          Follow Shop & Watch
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {videos.length === 0 && (
                <div className="col-span-2 text-center text-xs text-slate-400 py-16 bg-white rounded-3xl border">No translated clip reels uploaded yet.</div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedProduct && (
          <div className="bg-[#0b1329] border border-slate-850 rounded-3xl p-5 space-y-6">
            
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-1 text-xs text-slate-400 font-bold hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to mouchak catalog
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-3xl">
                  <img src={selectedProduct.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-72 object-cover rounded-3xl shadow" />
                  <ProductWatermark logo={adminConfig?.appLogo} />
                </div>
                
                {/* Variant Selector */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Selected Variant Size:</span>
                    <div className="flex gap-2">
                      {selectedProduct.sizes.map(s => (
                        <button
                          key={s}
                          onClick={() => setChosenSize(s)}
                          className={`w-10 h-10 rounded-xl text-xs font-black transition cursor-pointer border ${chosenSize === s ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-slate-950 text-slate-400 border-slate-850'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-slate-950 px-3 py-1 rounded-xl text-brand-orange border uppercase font-bold tracking-wider">{selectedProduct.category}</span>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black uppercase">🔥 {getProductViewerCount(selectedProduct.id)} views today</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1.5">{selectedProduct.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">Sold by: <span className="font-extrabold text-white">{selectedProduct.sellerName}</span></p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#FF6B00] font-display">₹{selectedProduct.price} Taka</span>
                  <span className="text-slate-400 text-xs line-through font-mono">₹{Math.round(selectedProduct.price * 1.5)}</span>
                  <span className="bg-green-500/10 text-green-400 text-[9px] px-2 py-0.5 rounded-lg border uppercase font-black uppercase">33% OFF</span>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs space-y-1 text-slate-350">
                  <span className="font-extrabold text-white uppercase block text-[10px]">Product Information specifications:</span>
                  <p className="font-medium">{selectedProduct.description}</p>
                </div>

                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                      <p key={k} className="text-[10.5px] font-semibold text-slate-450">{k}: <strong className="text-white">{String(v)}</strong></p>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white py-3.5 px-4 text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-300" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => addToCart(selectedProduct, true)}
                    className="flex-1 btn-premium py-3.5 text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>Instant Checkout Buy Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="p-3 bg-slate-950 hover:bg-[#0b1329] border border-slate-850 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-black uppercase text-slate-300 cursor-pointer"
                    title={(currentUser.wishlist || []).includes(selectedProduct.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={`w-4.5 h-4.5 ${(currentUser.wishlist || []).includes(selectedProduct.id) ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'purchases' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <h2 className="text-sm font-black text-white uppercase block">Purchases Ledger history ({orders.filter(o => o.customerMobile === currentUser.mobile).length} transactions)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Track shipment locations, verify OTP clearances, or open dispute complaints.</p>
            </div>

            <div className="space-y-4">
              {orders
                .filter(o => o.customerMobile === currentUser.mobile)
                .map((ord) => (
                  <div key={ord.id} className="bg-[#0b1329] border border-slate-805 p-4 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center border-b pb-2.5 border-slate-850 flex-wrap gap-2">
                      <div>
                        <span className="text-[10.5px] font-black text-rose-400 uppercase tracking-widest font-mono">Invoice ID: #{ord.id}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Status: <strong className="text-white uppercase font-mono">{ord.status}</strong></p>
                      </div>
                      <span className="text-xs font-mono text-[#FF6B00] font-black">₹{ord.finalTotal} Taka</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ord.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-slate-400">{i.productName} (Qty: {i.quantity})</span>
                          <span className="text-slate-300 font-bold">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Live Order Status Progression Tracker using Recharts Step-Line */}
                    <div className="bg-slate-950/45 border border-slate-800/60 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#FF6B00]" /> Real-Time Progress Timeline (Step-Line)
                        </h4>
                        <span className="text-[9.5px] font-mono font-bold bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded uppercase">
                          {ord.status === 'RETURNED' ? 'Returned' : ord.status}
                        </span>
                      </div>

                      {/* Line Chart */}
                      <div className="h-28 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[
                              { stage: 'Placed', progress: getStatusStepValue(ord.status) >= 1 ? 100 : 0 },
                              { stage: 'Confirmed', progress: getStatusStepValue(ord.status) >= 2 ? 100 : 0 },
                              { stage: 'Dispatched', progress: getStatusStepValue(ord.status) >= 3 ? 100 : 0 },
                              { stage: 'Out for Delivery', progress: getStatusStepValue(ord.status) >= 4 ? 100 : 0 },
                              { stage: 'Delivered', progress: getStatusStepValue(ord.status) >= 5 ? 100 : 0 }
                            ]}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis 
                              dataKey="stage" 
                              stroke="#64748b" 
                              fontSize={9} 
                              tickLine={false} 
                              axisLine={{ stroke: '#334155' }}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              hide={true} 
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-[10px] shadow-lg">
                                      <p className="font-bold text-white uppercase">{data.stage}</p>
                                      <p className="text-slate-400 font-mono mt-0.5">
                                        Status: <span className={data.progress === 100 ? "text-green-400 font-bold" : "text-amber-500 font-bold"}>
                                          {data.progress === 100 ? "Reached" : "Pending"}
                                        </span>
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="stepAfter" 
                              dataKey="progress" 
                              stroke="#FF6B00" 
                              strokeWidth={2.5} 
                              activeDot={{ r: 6 }} 
                              dot={{ r: 4, strokeWidth: 1.5, stroke: '#FF6B00', fill: '#0b1329' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Bullet milestones summary */}
                      <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-900/60 text-center font-mono">
                        {[
                          { label: 'Pending', step: 1 },
                          { label: 'Approved', step: 2 },
                          { label: 'Shipped', step: 3 },
                          { label: 'Near You', step: 4 },
                          { label: 'Arrived', step: 5 }
                        ].map((m) => {
                          const isActive = getStatusStepValue(ord.status) >= m.step;
                          return (
                            <div key={m.step} className="flex flex-col items-center">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-black border ${
                                isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}>
                                {isActive ? '✓' : m.step}
                              </span>
                              <span className={`text-[8px] mt-1 font-sans ${
                                isActive ? 'text-white font-bold' : 'text-slate-500'
                              }`}>
                                {m.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live delivery agent coordinate tracker frame */}
                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/15 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-black text-rose-400 flex items-center justify-center gap-1 uppercase tracking-wider">
                          <Compass className="w-4 h-4 animate-spin text-[#FF6B00]" /> Active Geolocation Telemetry sharing
                        </p>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">Your delivery partner is streaming their coordinates live as they move towards you.</p>
                        {ord.liveLocation ? (
                          <div className="bg-slate-950 p-2 text-xs text-green-400 font-mono rounded-xl max-w-sm mx-auto font-semibold">
                            Lat: {ord.liveLocation.lat.toFixed(5)}, Lng: {ord.liveLocation.lng.toFixed(5)}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic block">Waiting for driver coordinates transmitter...</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-850 flex-wrap gap-3">
                      
                      {/* OTP display for checkout double handshake */}
                      <div>
                        {ord.status === 'OUT_FOR_DELIVERY' && (
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-2 px-3 flex items-center gap-2">
                            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block">Verify OTP:</span>
                            <span className="text-sm font-mono font-black text-white tracking-widest">{ord.deliveryOtp || '----'}</span>
                          </div>
                        )}
                        {ord.proofPhotoUrl && (
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">Delivered Proof photograph:</span>
                            <img src={ord.proofPhotoUrl} className="w-16 h-12 object-cover rounded-md border" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="bg-slate-955 hover:bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-[10px] uppercase py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>View & Download Invoice 📄</span>
                        </button>

                        {(ord.status === 'DELIVERED') && (
                          <button
                            onClick={() => { setDisputeIdToCreate(ord.id); setShowDisputeModal(true); }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase py-2 px-3 rounded-xl border border-red-500/30 cursor-pointer"
                          >
                            Open Dispute Claim
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              {orders.filter(o => o.customerMobile === currentUser.mobile).length === 0 && (
                <div className="bg-white p-6 rounded-3xl border text-center text-xs text-slate-400">No purchase records registered yet.</div>
              )}
            </div>
          </div>
        )}

        {currentView === 'wishlist' && (() => {
          const wishlistedIds = currentUser.wishlist || [];
          const wishlistedProducts = products.filter(p => wishlistedIds.includes(p.id));

          return (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-sm font-black text-white uppercase flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                    <span>My Saved Wishlist ({wishlistedProducts.length} Items)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Products you saved for future purchases. Move them directly to your cart at any time.</p>
                </div>
                {wishlistedProducts.length > 0 && (
                  <button
                    onClick={() => {
                      wishlistedProducts.forEach(p => addToCart(p));
                      showToast("All wishlist items moved to cart successfully!", "success");
                    }}
                    className="bg-[#FF6B00] hover:bg-orange-650 text-white font-black uppercase text-[10px] px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move All to Cart</span>
                  </button>
                )}
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="bg-slate-900/40 p-12 rounded-3xl border border-dashed border-slate-800 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                    <Heart className="w-7 h-7 text-slate-650" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Your Wishlist is Empty</h3>
                    <p className="text-xs text-slate-400 mt-1">Explore our products feed today to discover amazing sarees, organic honey, sweets, and local delicacies.</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs mt-2 transition cursor-pointer"
                  >
                    Browse Catalogs ➜
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlistedProducts.map((p) => {
                    return (
                      <div key={p.id} className="bg-slate-900 border border-slate-850 rounded-3xl p-3 flex flex-col justify-between group relative hover:border-rose-500/35 transition">
                        <div className="cursor-pointer" onClick={() => { setSelectedProduct(p); setCurrentView('detail'); }}>
                          <div className="relative overflow-hidden rounded-2xl">
                            <img src={p.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-full h-36 object-cover rounded-2xl" />
                            <ProductWatermark logo={adminConfig?.appLogo} />
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(p.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-rose-500 transition z-20 shadow"
                              title="Remove from Wishlist"
                            >
                              <Heart className="w-3.5 h-3.5 fill-rose-500" />
                            </button>
                          </div>
                          <h4 className="text-xs font-semibold text-white mt-2 truncate">{p.name}</h4>
                          <p className="text-[9.5px] text-slate-400 truncate">{p.sellerName}</p>
                          <p className="text-sm font-mono text-[#FF6B00] font-black mt-1">₹{p.price}</p>
                        </div>

                        <div className="flex gap-1 mt-3 pt-2 border-t border-slate-850">
                          <button 
                            onClick={() => { setSelectedProduct(p); setCurrentView('detail'); }} 
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 text-[10px] font-bold py-1 px-2 rounded-xl"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => {
                              addToCart(p);
                            }} 
                            className="flex-1 bg-[#FF6B00] hover:bg-orange-650 text-white py-1 px-2 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {currentView === 'history' && (() => {
          const customerOrders = orders.filter(o => o.customerMobile === currentUser.mobile);
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          
          // Group spend by month (accounting for year to avoid overlaps)
          const groupedData: { [key: string]: number } = {};
          customerOrders.forEach(o => {
            const timestamp = o.statusTimeline?.[0]?.timestamp;
            if (!timestamp) return;
            try {
              const d = new Date(timestamp);
              const mIndex = d.getMonth();
              const yNum = d.getFullYear();
              const mKey = `${monthNames[mIndex]} ${yNum}`;
              groupedData[mKey] = (groupedData[mKey] || 0) + (o.finalTotal || 0);
            } catch (e) {}
          });

          const chartData = Object.keys(groupedData).map(mKey => {
            const [mName, yStr] = mKey.split(' ');
            const mIdx = monthNames.indexOf(mName);
            return {
              monthName: mKey,
              totalSpent: parseFloat(groupedData[mKey].toFixed(2)),
              monthSortValue: parseInt(yStr) * 12 + mIdx
            };
          }).sort((a, b) => a.monthSortValue - b.monthSortValue);

          // Get chronological or reverse-chronological list of past orders
          const sortedHistoryOrders = [...customerOrders].sort((a, b) => {
            const timeA = new Date(a.statusTimeline?.[0]?.timestamp || 0).getTime();
            const timeB = new Date(b.statusTimeline?.[0]?.timestamp || 0).getTime();
            return isChronological ? timeA - timeB : timeB - timeA;
          });

          return (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <h2 className="text-sm font-black text-white uppercase block">Order History & Spend Analytics ({customerOrders.length} orders)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Analyze your monthly purchase volumes, check spending metrics, and review archived items.</p>
              </div>

              {/* Top Analytical Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0b1329] border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Investment</span>
                  <p className="text-lg font-mono font-black text-[#FF6B00] mt-1">
                    ₹{customerOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0).toLocaleString()} Taka
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Across all status phases</p>
                </div>

                <div className="bg-[#0b1329] border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Average Order Value</span>
                  <p className="text-lg font-mono font-black text-[#FF6B00] mt-1">
                    ₹{customerOrders.length > 0 
                      ? (customerOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0) / customerOrders.length).toFixed(2) 
                      : "0.00"
                    } Taka
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Mean expenditure per invoice</p>
                </div>

                <div className="bg-[#0b1329] border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Completed Packages</span>
                  <p className="text-lg font-mono font-black text-emerald-400 mt-1">
                    {customerOrders.filter(o => o.status === 'DELIVERED').length} Delivered
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    {customerOrders.filter(o => o.status === 'CANCELLED' || o.status === 'RETURNED').length} Cancelled / Returned
                  </p>
                </div>
              </div>

              {/* Monthly Spending Summary Bar Chart card */}
              <div className="bg-[#0b1329] border border-slate-805 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-slate-850 animate-fade-in">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Monthly Spending Summary</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total spend grouped by billing month</p>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-805 rounded-2xl">
                    No billing periods on record to compile analytics.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#121e36" vertical={false} />
                        <XAxis 
                          dataKey="monthName" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={{ stroke: '#334155' }} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={{ stroke: '#334155' }}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,107,0,0.04)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs shadow-xl space-y-1">
                                  <p className="font-extrabold text-white uppercase tracking-wider">{data.monthName}</p>
                                  <p className="text-sm font-black text-[#FF6B00] font-mono">₹{data.totalSpent} Taka spent</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="totalSpent" 
                          fill="#FF6B00" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* List of past orders */}
              <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-850 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Archived Purchases Timeline</h3>
                  <button 
                    onClick={() => setIsChronological(!isChronological)} 
                    className="text-[10px] font-extrabold text-slate-400 hover:text-white transition flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    <span>Sort: {isChronological ? "Oldest First ⬆" : "Newest First ⬇"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {sortedHistoryOrders.map((ord) => (
                    <div key={ord.id} id={`history-card-${ord.id}`} className="bg-[#0b1329]/60 border border-slate-855 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#FF6B00]/45 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-[#FF6B00]">#{ord.id}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-black ${
                            ord.status === 'DELIVERED' ? 'bg-emerald-500/15 text-emerald-400' :
                            ord.status === 'CANCELLED' ? 'bg-rose-500/15 text-rose-400' :
                            'bg-amber-500/15 text-amber-400'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 font-mono">
                          Date: {ord.statusTimeline?.[0]?.timestamp ? new Date(ord.statusTimeline[0].timestamp).toLocaleString('default', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </p>
                        <div className="text-xs text-slate-350 font-medium">
                          {ord.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-2 shrink-0 w-full md:w-auto">
                        <span className="text-sm font-mono font-black text-white">₹{ord.finalTotal} Taka</span>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedInvoiceOrder(ord);
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-extrabold px-2.5 py-1.5 rounded-xl text-[9px] uppercase flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Invoice 📄</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setCurrentView('purchases');
                              setTimeout(() => {
                                const el = document.getElementById(`order-card-${ord.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 120);
                            }}
                            className="bg-[#FF6B00] text-white hover:bg-orange-650 px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 transition cursor-pointer"
                          >
                            Track Package ➜
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedHistoryOrders.length === 0 && (
                    <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-805 rounded-2xl">
                      No matching historical logs found on record.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {currentView === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white font-display">My Cart Items ({cartItems.length})</h2>
            
            {cartItems.map((cart, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={cart.product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60"} className="w-12 h-12 object-cover rounded-xl" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{cart.product.name}</h4>
                    <p className="text-[11.5px] font-black font-mono text-[#FF6B00]">₹{cart.product.price} Taka</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))} className="text-red-400 text-xs font-bold font-mono">Remove</button>
                </div>
              </div>
            ))}

            {cartItems.length > 0 ? (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4 pt-4">
                
                {/* Multiple address selection list */}
                <div className="space-y-2 pb-3 border-b border-slate-850/60">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Deliver To / Shipping Endpoint:</label>
                    <span className="text-[9px] text-[#FF6B00] font-black uppercase font-mono">Multiple Addresses Enabled</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {/* Render standard register/profile address */}
                    <button
                      type="button"
                      onClick={() => setSelectedCheckoutAddressId('default')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition ${selectedCheckoutAddressId === 'default' ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-slate-800 bg-slate-950/20 text-slate-350 hover:bg-slate-950/40'}`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="font-extrabold text-[10px] uppercase">🏠 Primary Register Address</span>
                        {selectedCheckoutAddressId === 'default' && <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                      </div>
                      <p className="line-clamp-2 text-[11px] font-medium">{currentUser.address}</p>
                      <p className="text-[9.5px] text-slate-500 font-bold mt-1 uppercase">{currentUser.district}, {currentUser.state}</p>
                    </button>

                    {/* Render saved address list */}
                    {(currentUser.savedAddresses || []).map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedCheckoutAddressId(addr.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition ${selectedCheckoutAddressId === addr.id ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-slate-800 bg-slate-950/20 text-slate-350 hover:bg-slate-950/40'}`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className="font-extrabold text-[10px] uppercase">📍 {addr.name}</span>
                          {selectedCheckoutAddressId === addr.id && <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                        </div>
                        <p className="line-clamp-2 text-[11px] font-medium">{addr.address}</p>
                        <p className="text-[9.5px] text-slate-505 font-bold mt-1 uppercase">{addr.district}, {addr.state}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shipping Class select dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Priority Shipping Speed Choose:</label>
                  <select 
                    value={selectedSpeed} 
                    onChange={(e) => {
                      const speed = e.target.value;
                      setSelectedSpeed(speed);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border text-white font-mono"
                  >
                    <option value="Standard">Standard priority (Comes in 5 Days) — ₹40</option>
                    <option value="Express">Express Speed (Comes in 24h) — ₹105</option>
                    <option value="Same Day">Same Day Delivery Priority (6h) — ₹240</option>
                  </select>
                </div>

                <div className="space-y-1.5 font-bold text-xs text-slate-400 pt-2 border-t border-slate-850">
                  <div className="flex justify-between">
                    <span>Products Total:</span> 
                    <span className="text-white">₹{cartItems.reduce((acc, c) => acc + (c.product.price * c.quantity), 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Shipping Applied:</span> 
                    <span className="text-white">₹{speedSelectedPriceOverride()}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-[#FF6B00] border-t border-slate-850 pt-2">
                    <span>Grand Total Checklist:</span> 
                    <span>₹{cartItems.reduce((acc, c) => acc + (c.product.price * c.quantity), 0) + speedSelectedPriceOverride()} Taka</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => submitNewOrderCheckout('COD')} className="flex-1 bg-slate-950 hover:bg-[#0b1329] border border-slate-850 text-slate-300 font-extrabold py-3 rounded-xl uppercase text-[10.5px] cursor-pointer">Cash on Delivery</button>
                  <button onClick={() => submitNewOrderCheckout('ONLINE')} className="flex-1 bg-[#FF6B00] text-white font-extrabold py-3 rounded-xl uppercase text-[10.5px] cursor-pointer shadow">Pay Online QR</button>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border text-xs text-slate-400">Cart is empty. Browse products first.</div>
            )}
          </div>
        )}

      </main>

      {/* Floating Application switcher drawer */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-slate-950/90 border-t border-slate-800/80 p-3 flex justify-around items-center text-[10px] uppercase z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.5)]">
        <button 
          onClick={() => setCurrentView('home')} 
          className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer group py-1 px-3 rounded-xl ${
            currentView === 'home' 
              ? 'text-[#FF6B00] scale-110 drop-shadow-[0_0_12px_rgba(255,107,0,0.3)] font-extrabold' 
              : 'text-slate-400 font-medium hover:text-slate-100'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentView === 'home' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="tracking-wide">Home Feed</span>
        </button>

        <button 
          onClick={() => setCurrentView('cart')} 
          className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer group py-1 px-3 rounded-xl relative ${
            currentView === 'cart' 
              ? 'text-[#FF6B00] scale-110 drop-shadow-[0_0_12px_rgba(255,107,0,0.3)] font-extrabold' 
              : 'text-slate-400 font-medium hover:text-slate-100'
          }`}
        >
          <ShoppingCart className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentView === 'cart' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="tracking-wide">Cart Ledger</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#FF6B00] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black animate-pulse shadow-[0_0_8px_rgba(255,107,0,0.6)]">
              {cartItems.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentView('purchases')} 
          className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer group py-1 px-3 rounded-xl ${
            currentView === 'purchases' 
              ? 'text-[#FF6B00] scale-110 drop-shadow-[0_0_12px_rgba(255,107,0,0.3)] font-extrabold' 
              : 'text-slate-400 font-medium hover:text-slate-100'
          }`}
        >
          <Package className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentView === 'purchases' ? 'stroke-[2.5px]' : 'stroke-1.5'}`} />
          <span className="tracking-wide">Purchases</span>
        </button>

        <button 
          onClick={() => setShowApplySellerModal(true)} 
          className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-all duration-300 cursor-pointer group py-1 px-3 rounded-xl hover:scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.1)]"
        >
          <Store className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 stroke-1.5 group-hover:stroke-2" />
          <span className="tracking-wide font-extrabold">Apply Merchant</span>
        </button>
      </div>

      {/* Dispute Modal POP */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleOpenDisputeSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-150">
            <h4 className="font-extrabold text-sm text-slate-905 uppercase tracking-wider text-center">Open Dispute Case Filed</h4>
            <p className="text-xs text-slate-500 text-center">Filings are verified by the Admin panel. Refund details processed inside commission splits.</p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase">Reason category:</label>
                <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50">
                  <option value="Damaged Product Delivered">Damaged Product Delivered</option>
                  <option value="Wrong product design/sizes delivered">Wrong product design/sizes delivered</option>
                  <option value="Parcel items missing">Parcel items missing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block">Rationale Detail description:</label>
                <textarea value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} placeholder="Type details reason..." className="w-full text-xs p-2 rounded-xl bg-slate-50 h-20" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block">Evidence photo URL link:</label>
                <input type="text" value={disputeEvidencePhoto} onChange={(e) => setDisputeEvidencePhoto(e.target.value)} className="w-full text-xs p-2.5 rounded-xl bg-slate-50 font-mono" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowDisputeModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="flex-1 bg-red-650 hover:bg-red-600 text-white py-2 rounded-xl text-xs font-bold shadow">Submit Case Claim</button>
            </div>
          </form>
        </div>
      )}

      {/* Apply for Seller Modal POP */}
      {showApplySellerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleApplySellerAccount} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase text-center font-display">Apply for Merchant workspace</h4>
            <p className="text-xs text-slate-500 text-center">Submit your shop parameters. Verifications sent instantly to the God Mode approving queue.</p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase">Owner Name</label>
                <input type="text" value={sellerOwnerName} onChange={(e) => setSellerOwnerName(e.target.value)} className="w-full text-xs p-2 border rounded-xl" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase">Shop Name</label>
                <input type="text" placeholder="e.g. Molla traditional looms" value={sellerShopName} onChange={(e) => setSellerShopName(e.target.value)} className="w-full text-xs p-2 border rounded-xl" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Logo URL</label>
                  <input type="text" value={sellerLogo} onChange={(e) => setSellerLogo(e.target.value)} className="w-full text-xs p-1.5 border rounded-xl font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Banner URL</label>
                  <input type="text" value={sellerBanner} onChange={(e) => setSellerBanner(e.target.value)} className="w-full text-xs p-1.5 border rounded-xl font-mono" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowApplySellerModal(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="flex-1 bg-[#FF6B00] text-white py-2.5 rounded-xl text-xs font-black shadow-lg">Submit Application</button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Invoice Preview Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8 text-white">
            <button 
              type="button" 
              onClick={() => setSelectedInvoiceOrder(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-955 hover:bg-slate-900 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-800 pb-4 flex justify-between items-start gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/10 px-2.5 py-1 rounded-md">Official Invoice Receipt</span>
                <h4 className="font-black text-lg text-white font-display mt-2 uppercase">Mouchak Bazaar Hub</h4>
                <p className="text-[11px] text-slate-400 mt-1">Direct-To-Consumer Rural Commerce Platform</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-slate-400">Invoice ID: <span className="text-rose-400">#{selectedInvoiceOrder.id}</span></p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Placed Date: {selectedInvoiceOrder.statusTimeline?.[0]?.timestamp 
                    ? new Date(selectedInvoiceOrder.statusTimeline[0].timestamp).toLocaleString('default', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                    : "N/A"
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Buyer Information (Billed To)</h5>
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-white text-sm">{selectedInvoiceOrder.customerName}</p>
                  <p className="text-slate-400">Mobile: {selectedInvoiceOrder.customerMobile}</p>
                  <p className="text-slate-400 leading-relaxed font-sans">
                    Address: {selectedInvoiceOrder.deliveryAddress.address}, {selectedInvoiceOrder.deliveryAddress.district}, {selectedInvoiceOrder.deliveryAddress.state}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-2 text-right md:text-left">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment & Seller Details</h5>
                <div className="text-xs space-y-1">
                  <p className="text-slate-300 font-semibold">Store: <span className="text-white font-extrabold">{selectedInvoiceOrder.sellerName}</span></p>
                  <p className="text-slate-400">
                    Payment Method: <span className="font-black text-rose-400">{selectedInvoiceOrder.paymentMethod === 'ONLINE' ? 'QR Payment Verified' : 'Cash On Delivery'}</span>
                  </p>
                  {selectedInvoiceOrder.paymentDetails?.transactionId && (
                    <p className="text-slate-400 font-mono text-[10.5px]">TrxID: {selectedInvoiceOrder.paymentDetails.transactionId}</p>
                  )}
                  <p className="text-slate-400">
                    Current Dispatch Status: <span className="text-emerald-400 uppercase font-black font-mono">{selectedInvoiceOrder.status}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-2xl border border-slate-850 overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-850 text-[10px] uppercase font-black text-slate-400">
                    <th className="py-2.5 px-4 text-left">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Variant</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-850/60 hover:bg-slate-900/30 transition">
                      <td className="py-3 px-4 text-left font-bold text-white">{item.productName}</td>
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">{item.variant || 'Standard'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300 font-bold">₹{item.price}</td>
                      <td className="py-3 px-3 text-center text-white font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#FF6B00] font-black">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <div className="w-full max-w-xs space-y-2 text-xs font-semibold text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal Catalog Items:</span>
                  <span className="text-slate-200 font-mono">₹{selectedInvoiceOrder.itemTotal || selectedInvoiceOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority Shipping Level:</span>
                  <span className="text-slate-200 font-mono">₹{selectedInvoiceOrder.deliveryCharge}</span>
                </div>
                {selectedInvoiceOrder.discountTotal ? (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Discount Deductions:</span>
                    <span className="font-mono">-₹{selectedInvoiceOrder.discountTotal}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-black text-[#FF6B00] border-t border-slate-800 pt-2.5">
                  <span>Invoice Grand Total:</span>
                  <span className="font-mono">₹{selectedInvoiceOrder.finalTotal} Taka</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedInvoiceOrder)}
                className="flex-1 bg-[#FF6B00] hover:bg-orange-650 text-white font-black uppercase text-xs py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Save Offline Invoice (HTML File)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadInvoice(selectedInvoiceOrder);
                }}
                className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-extrabold uppercase text-xs py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Download & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function FlameIcon() {
    return <span className="text-red-500 animate-pulse font-bold text-xs uppercase block">🔥</span>;
  }

  function followingSellersAdvertiserPanel() {
    return (
      <div className="bg-[#0b1329] border border-slate-800 p-4 rounded-3xl space-y-3 text-xs text-slate-400">
        <span className="text-[9.5px] uppercase font-black text-rose-400 block tracking-widest leading-none">Merchant Connections directories</span>
        <p className="font-medium text-[11px] leading-relaxed">Follow matching traditional loom boutiques to view exclusive follower streaming reels uploads.</p>
        
        <div className="space-y-2 pt-1">
          {sellers.map(s => {
            const isFoll = followedSellers.includes(s.id);
            return (
              <div key={s.id} className="flex justify-between items-center bg-slate-905 p-2 rounded-xl text-xs">
                <span className="font-bold text-white max-w-[120px] truncate">{s.shopName}</span>
                <button
                  type="button"
                  onClick={() => toggleFollowSeller(s.id)}
                  className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase ${isFoll ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}
                >
                  {isFoll ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
