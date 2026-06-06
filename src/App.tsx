import React, { useState, useEffect } from 'react';
import { 
  Shield, User, ShoppingBag, Bike, Database, RefreshCw, Upload, 
  Sparkles, Heart, MapPin, Eye, EyeOff, Lock, Smartphone, ArrowRight,
  LogOut, Phone, Settings, Globe, Wifi
} from 'lucide-react';
import { 
  Product, 
  Seller, 
  Order, 
  UserProfile, 
  Announcement, 
  ProductQA, 
  ChatMessage,
  Dispute,
  AppNotification,
  SystemVideo
} from './types';
import AdminPortal from './components/AdminPortal';
import SellerPortal from './components/SellerPortal';
import CustomerPortal from './components/CustomerPortal';
import DeliveryPortal from './components/DeliveryPortal';
import Toast, { ToastType } from './components/Toast';
import ImageSelector from './components/ImageSelector';
import { apiFetch as fetch } from './utils/api';
import { INDIAN_STATES, STATE_DISTRICTS } from './indianRegions';

export default function App() {
  // Global Database state synced with backend Express
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [otpRequests, setOtpRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [qas, setQas] = useState<ProductQA[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [videos, setVideos] = useState<SystemVideo[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  
  const [adminConfig, setAdminConfig] = useState({
    upiId: "kenakata@ybl",
    qrImage: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60",
    broadcastText: "⚡ Kena Kata Big Sale is LIVE! Get up to 50% flat discount on Fashion & Electronics today!",
    homeFeedBanner: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1200&auto=format&fit=crop&q=80",
    pinnedSellers: [] as string[],
    autoRankEnabled: true,
    minOrdersForRank: 1,
    appLogo: "https://lh3.googleusercontent.com/d/19n78bQLG7UDNICpat0W-CcHI39Wu796f"
  });

  // Current logged in session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('kk_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Admin browsing storefront state simulator
  const [adminAsBuyer, setAdminAsBuyer] = useState(false);

  // Unified auth states
  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup states
  const [signupStep, setSignupStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupAltMobile, setSignupAltMobile] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupState, setSignupState] = useState<string>('West Bengal');
  const [signupDistrict, setSignupDistrict] = useState<string>('Kolkata');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupProfilePhoto, setSignupProfilePhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60');
  const [signupInterests, setSignupInterests] = useState<string[]>([]);
  const [referralSellerId, setReferralSellerId] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [simulatedOtpHint, setSimulatedOtpHint] = useState<string | null>(null);

  // Forgot Password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotSimulatedOtp, setForgotSimulatedOtp] = useState<string | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Loading indicator for background syncs
  const [syncing, setSyncing] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Toast notifications trigger state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Profile settings modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfilePassword, setEditProfilePassword] = useState("");
  const [editProfileAddress, setEditProfileAddress] = useState("");
  const [editProfileDistrict, setEditProfileDistrict] = useState("");
  const [editProfileStateStr, setEditProfileStateStr] = useState("");
  const [editProfilePhoto, setEditProfilePhoto] = useState("");
  const [editProfileAltMobile, setEditProfileAltMobile] = useState("");
  const [editSavedAddresses, setEditSavedAddresses] = useState<any[]>([]);

  // New Saved Address form states
  const [newAddrAddress, setNewAddrAddress] = useState("");
  const [newAddrState, setNewAddrState] = useState("West Bengal");
  const [newAddrDistrict, setNewAddrDistrict] = useState("Kolkata");
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrAltMobile, setNewAddrAltMobile] = useState("");

  // OTP Resend Countdown states and hooks
  const [signupResendTimer, setSignupResendTimer] = useState(0);
  const [forgotResendTimer, setForgotResendTimer] = useState(0);

  // Server connection configuration states
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(() => {
    return localStorage.getItem('custom_backend_url') || 'https://ais-dev-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app';
  });

  const handleSaveServerUrl = (url: string) => {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (cleanUrl) {
      localStorage.setItem('custom_backend_url', cleanUrl);
      setCustomServerUrl(cleanUrl);
      triggerToast("Server Connection URL Updated!", "success");
      fetchState(true);
    }
  };

  useEffect(() => {
    let interval: any;
    if (signupResendTimer > 0) {
      interval = setInterval(() => {
        setSignupResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signupResendTimer]);

  useEffect(() => {
    let interval: any;
    if (forgotResendTimer > 0) {
      interval = setInterval(() => {
        setForgotResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotResendTimer]);

  const handleResendSignupOtp = async () => {
    if (signupResendTimer > 0) return;
    setAuthLoading(true);
    try {
      const tempSignupData = {
        name: signupName,
        address: signupAddress,
        state: signupState,
        district: signupDistrict,
        password: signupPassword,
        profilePhoto: signupProfilePhoto,
        interests: signupInterests,
        referredBySellerId: referralSellerId || undefined,
        altMobile: signupAltMobile,
        savedAddresses: [
          {
            id: "addr_" + Math.random().toString(36).substring(2, 7),
            name: signupName,
            address: signupAddress,
            state: signupState,
            district: signupDistrict,
            mobile: signupMobile,
            altMobile: signupAltMobile,
            isDefault: true
          }
        ]
      };
      const res = await fetch('/api/auth/otp-request-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: signupMobile, tempSignupData })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimulatedOtpHint(data.simulatedOtp);
        setSignupResendTimer(30); // reset countdown
        triggerToast("A new Kena Kata SignUp OTP was requested and dispatched!", "success");
      } else {
        triggerToast(data.error || "OTP dispatch failed.", "error");
      }
    } catch {
      triggerToast("Resend request error.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (forgotResendTimer > 0) return;
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: forgotMobile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSimulatedOtp(data.simulatedOtp);
        setForgotResendTimer(30); // reset countdown
        triggerToast("A new Kena Kata verification OTP was dispatched to administrator logs!", "success");
      } else {
        triggerToast(data.error || "OTP request failed.", "error");
      }
    } catch {
      triggerToast("Resend request error.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchState = async (silently = false) => {
    if (!silently) setSyncing(true);
    try {
      const res = await fetch('/api/db-state');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.db) {
          setProducts(data.db.products || []);
          setSellers(data.db.sellers || []);
          setOrders(data.db.orders || []);
          setUsers(data.db.users || []);
          setOtpRequests(data.db.otpRequests || []);
          setChats(data.db.chats || []);
          setAnnouncements(data.db.announcements || []);
          setQas(data.db.qas || []);
          setDisputes(data.db.disputes || []);
          setNotifications(data.db.notifications || []);
          setVideos(data.db.videos || []);
          setDeliveryAgents(data.db.deliveryAgents || []);
          setReferrals(data.db.referrals || []);
          setAdminConfig({
            upiId: data.db.adminConfig.upiId,
            qrImage: data.db.adminConfig.qrImage,
            broadcastText: data.db.adminConfig.broadcastText,
            homeFeedBanner: data.db.adminConfig.homeFeedBanner,
            pinnedSellers: data.db.adminConfig.pinnedSellers || [],
            autoRankEnabled: data.db.adminConfig.autoRankEnabled !== false,
            minOrdersForRank: data.db.adminConfig.minOrdersForRank || 1,
            appLogo: data.db.adminConfig.appLogo || "https://lh3.googleusercontent.com/d/19n78bQLG7UDNICpat0W-CcHI39Wu796f"
          });

          // Sync logged-in session user's state securely
          setCurrentUser(prevUser => {
            if (!prevUser) return null;
            if (prevUser.role === 'ADMIN' && data.db.adminDetails) {
              const updated = {
                ...prevUser,
                name: data.db.adminDetails.name || prevUser.name,
                mobile: data.db.adminDetails.contactNumber || prevUser.mobile,
                profilePhoto: data.db.adminDetails.photoUrl || prevUser.profilePhoto,
                email: data.db.adminDetails.email || prevUser.email,
                bio: data.db.adminDetails.bio || prevUser.bio
              };
              localStorage.setItem('kk_current_user', JSON.stringify(updated));
              return updated;
            } else if (prevUser.role === 'SELLER') {
              const sellerInfo = (data.db.sellers || []).find((s: any) => s.id === prevUser.id);
              if (sellerInfo) {
                const updated = {
                  ...prevUser,
                  name: sellerInfo.ownerName || prevUser.name,
                  mobile: sellerInfo.mobile || prevUser.mobile,
                  profilePhoto: sellerInfo.logo || prevUser.profilePhoto,
                  shopName: sellerInfo.shopName || prevUser.shopName
                };
                localStorage.setItem('kk_current_user', JSON.stringify(updated));
                return updated;
              }
            } else if (prevUser.role === 'CUSTOMER') {
              const customerInfo = (data.db.users || []).find((u: any) => u.id === prevUser.id || u.mobile === prevUser.mobile);
              if (customerInfo) {
                const updated = {
                  ...prevUser,
                  name: customerInfo.name || prevUser.name,
                  mobile: customerInfo.mobile || prevUser.mobile,
                  profilePhoto: customerInfo.profilePhoto || prevUser.profilePhoto,
                  address: customerInfo.address || prevUser.address,
                  district: customerInfo.district || prevUser.district,
                  state: customerInfo.state || prevUser.state
                };
                localStorage.setItem('kk_current_user', JSON.stringify(updated));
                return updated;
              }
            }
            return prevUser;
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch database state polling:", e);
    } finally {
      if (!silently) setSyncing(false);
    }
  };

  useEffect(() => {
    fetchState(false);
    const interval = setInterval(() => {
      fetchState(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Drag-and-drop file processing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignupProfilePhoto(event.target.result as string);
          triggerToast("Successfully completed doorstep photograph drag-drop upload!", "success");
        }
      };
      reader.readAsDataURL(file);
    } else {
      triggerToast("File type not supported. Please drag and drop an image.", "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignupProfilePhoto(event.target.result as string);
          triggerToast("Profile photo loaded successfully!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Core Authentication Handlers
  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginMobile || !loginPassword) {
      triggerToast("Please enter both registered mobile and password.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: loginMobile, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('kk_current_user', JSON.stringify(data.user));
        triggerToast(`Welcome back, ${data.user.name}! Accessing portal.`, "success");
        fetchState(true);
      } else {
        triggerToast(data.error || "Login failed. Verify credentials.", "error");
      }
    } catch (err) {
      triggerToast("Network authentication failure.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotMobile) {
      triggerToast("Please enter your registered mobile number.", "error");
      return;
    }
    if (forgotMobile.length !== 10) {
      triggerToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: forgotMobile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotPasswordStep('VERIFY');
        setForgotSimulatedOtp(data.simulatedOtp);
        setForgotResendTimer(30); // 30 seconds OTP Resend countdown starts
        triggerToast("OTP requested! Admins will receive the OTP in their 'OTP Secretariat' panel and can share via WhatsApp. 💬", "success");
      } else {
        triggerToast(data.error || "Failed to locate registered profile with this number.", "error");
      }
    } catch (err) {
      triggerToast("Network connector failure.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotMobile || !forgotOtp || !forgotNewPassword) {
      triggerToast("Please fill in OTP code and your new security password.", "error");
      return;
    }
    if (forgotOtp.length !== 4) {
      triggerToast("Please enter the 4-digit verification OTP code.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: forgotMobile,
          otp: forgotOtp,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Credentials successfully updated! You can now log in securely. ✅", "success");
        // Reset states and switch to login with filled values
        setForgotPasswordMode(false);
        setForgotPasswordStep('REQUEST');
        setLoginMobile(forgotMobile);
        setLoginPassword(forgotNewPassword);
        setForgotMobile('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotSimulatedOtp(null);
      } else {
        triggerToast(data.error || "Incorrect or expired Admin verification code.", "error");
      }
    } catch (err) {
      triggerToast("Security system synchronization failed.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupAddress || !signupPassword) {
      triggerToast("Please fill in all mandatory signup parameters.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const tempSignupData = {
        name: signupName,
        address: signupAddress,
        state: signupState,
        district: signupDistrict,
        password: signupPassword,
        profilePhoto: signupProfilePhoto,
        interests: signupInterests,
        referredBySellerId: referralSellerId || undefined,
        altMobile: signupAltMobile,
        savedAddresses: [
          {
            id: "addr_" + Math.random().toString(36).substring(2, 7),
            name: signupName,
            address: signupAddress,
            state: signupState,
            district: signupDistrict,
            mobile: signupMobile,
            altMobile: signupAltMobile,
            isDefault: true
          }
        ]
      };
      const res = await fetch('/api/auth/otp-request-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: signupMobile, tempSignupData })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimulatedOtpHint(data.simulatedOtp);
        setSignupStep('OTP');
        setSignupResendTimer(30); // 30 seconds OTP Resend countdown starts
        triggerToast("SignUp OTP sent successfully! Verify 4-digit code.", "success");
      } else {
        triggerToast(data.error || "OTP Dispatch failed.", "error");
      }
    } catch (err) {
      triggerToast("Failed to dispatch signup Verification token.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp) {
      triggerToast("Please type the received 4-digit OTP code.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/otp-verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: signupMobile, otp: enteredOtp })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('kk_current_user', JSON.stringify(data.user));
        triggerToast("Account activated successfully! Logging you in.", "success");
        setSignupStep('DETAILS');
        setAuthTab('LOGIN');
        fetchState(true);
      } else {
        triggerToast(data.error || "OTP validation failed. Retrying.", "error");
      }
    } catch (err) {
      triggerToast("Verification failed.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kk_current_user');
    setCurrentUser(null);
    setLoginMobile('');
    setLoginPassword('');
    triggerToast("Logged out of session safely.", "info");
  };

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setEditProfileName(currentUser.name || "");
    setEditProfilePassword(currentUser.password || "");
    setEditProfileAddress(currentUser.address || "");
    setEditProfileDistrict(currentUser.district || "");
    setEditProfileStateStr(currentUser.state || "");
    setEditProfilePhoto(currentUser.profilePhoto || "");
    setEditProfileAltMobile(currentUser.altMobile || "");
    setEditSavedAddresses(currentUser.savedAddresses || []);
    setShowProfileModal(true);
  };

  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          mobile: currentUser.mobile,
          name: editProfileName,
          password: editProfilePassword,
          address: editProfileAddress,
          district: editProfileDistrict,
          state: editProfileStateStr,
          profilePhoto: editProfilePhoto,
          altMobile: editProfileAltMobile,
          savedAddresses: editSavedAddresses
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { 
          ...currentUser, 
          name: editProfileName,
          password: editProfilePassword,
          address: editProfileAddress,
          district: editProfileDistrict,
          state: editProfileStateStr,
          profilePhoto: editProfilePhoto,
          altMobile: editProfileAltMobile,
          savedAddresses: editSavedAddresses
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('kk_current_user', JSON.stringify(updatedUser));
        triggerToast("Profile updated successfully!", "success");
        setShowProfileModal(false);
        fetchState(true);
      } else {
        triggerToast(data.error || "Failed to update profile details.", "error");
      }
    } catch (err) {
      triggerToast("Failed to save changes. Network error.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const toggleInterest = (category: string) => {
    if (signupInterests.includes(category)) {
      setSignupInterests(signupInterests.filter(c => c !== category));
    } else {
      setSignupInterests([...signupInterests, category]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* Dynamic Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white/95 px-4 py-3 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          {/* High density elegant logo */}
          <div className="flex items-center gap-1.5">
            {adminConfig.appLogo ? (
              <img 
                key={adminConfig.appLogo}
                src={adminConfig.appLogo} 
                className="w-8 h-8 object-cover rounded-xl border border-[#FF6B00] bg-slate-950" 
                alt="logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="bg-[#FF6B00] text-white p-1 rounded-lg hidden sm:block">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <span className="font-black text-base tracking-wider block font-display">
              <span className="text-[#FF6B00] uppercase drop-shadow-[0_2px_10px_rgba(255,107,0,0.35)]">Kena</span>
              <span className="text-[#FF6B00] ml-1 uppercase drop-shadow-[0_2px_10px_rgba(255,107,0,0.35)]">Kata</span>
            </span>
            <span className="text-[8.5px] text-[#FF5500] font-mono tracking-widest block uppercase font-black opacity-90">
              Dynamic Shopping Nexus
            </span>
          </div>
          {syncing && <RefreshCw className="w-3 h-3 animate-spin text-[#FF6B00] ml-1" />}
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60"} 
                className="w-7 h-7 rounded-full border border-[#FF6B00]/40 object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-bold block bg-slate-800/50 px-1.5 py-0.25 rounded-md">
                  Role: {currentUser.role || 'CUSTOMER'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="bg-red-500/20 text-red-400 p-2 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition cursor-pointer flex items-center gap-1 font-bold text-[10px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col">
        {currentUser ? (
          /* Logged In portals */
          <div className="flex-1 flex flex-col">
            {(currentUser.role === 'CUSTOMER' || !currentUser.role) && (
              <CustomerPortal 
                products={products}
                sellers={sellers}
                orders={orders}
                announcements={announcements}
                qas={qas}
                chats={chats}
                disputes={disputes}
                notifications={notifications}
                videos={videos}
                currentUser={currentUser}
                adminConfig={adminConfig}
                triggerRefresh={() => fetchState(true)}
                showToast={triggerToast}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  localStorage.setItem('kk_current_user', JSON.stringify(updated));
                }}
              />
            )}

            {currentUser.role === 'SELLER' && (
              <SellerPortal 
                products={products}
                sellers={sellers}
                orders={orders}
                users={users}
                disputes={disputes}
                notifications={notifications}
                videos={videos}
                currentUser={currentUser}
                adminConfig={adminConfig}
                triggerRefresh={() => fetchState(true)}
                showToast={triggerToast}
              />
            )}

            {currentUser.role === 'DELIVERY_AGENT' && (
              <DeliveryPortal 
                orders={orders}
                currentUser={currentUser}
                triggerRefresh={() => fetchState(true)}
                showToast={triggerToast}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              adminAsBuyer ? (
                <div className="flex-1 flex flex-col">
                  {/* Dynamic simulator banner indicator */}
                  <div className="bg-gradient-to-r from-red-650 via-[#FF6B00] to-orange-500 text-white py-2 px-4 shadow flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-orange-600 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/25 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Storefront Sim Mode</span>
                      <p className="text-xs font-bold">
                        Logged in as <span className="underline">Admin Secretariat</span>. You are browsing the live customer interface.
                      </p>
                    </div>
                    <button
                      onClick={() => setAdminAsBuyer(false)}
                      className="bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 text-[10px] font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      🛡️ Exit & Switch back to Admin Console
                    </button>
                  </div>

                  <CustomerPortal 
                    products={products}
                    sellers={sellers}
                    orders={orders}
                    announcements={announcements}
                    qas={qas}
                    chats={chats}
                    disputes={disputes}
                    notifications={notifications}
                    videos={videos}
                    currentUser={currentUser}
                    adminConfig={adminConfig}
                    triggerRefresh={() => fetchState(true)}
                    showToast={triggerToast}
                    onUpdateUser={(updated) => {
                      setCurrentUser(updated);
                      localStorage.setItem('kk_current_user', JSON.stringify(updated));
                    }}
                  />
                </div>
              ) : (
                <AdminPortal 
                  products={products}
                  sellers={sellers}
                  orders={orders}
                  otpRequests={otpRequests}
                  chats={chats}
                  announcements={announcements}
                  disputes={disputes}
                  notifications={notifications}
                  videos={videos}
                  deliveryAgents={deliveryAgents}
                  referrals={referrals}
                  adminConfig={adminConfig}
                  triggerRefresh={() => fetchState(true)}
                  showToast={triggerToast}
                  toggleBuyerMode={() => setAdminAsBuyer(true)}
                />
              )
            )}
          </div>
        ) : (
          /* Unified Auth Gateway (Unlogged Users) */
          <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-xl bg-[#0b1329] border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
              
              {/* Background gradient design */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#FF6B00]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 text-center mb-6">
                <h1 className="text-4xl font-black font-display tracking-wider">
                  <span className="text-[#FF6B00] uppercase drop-shadow-[0_2px_15px_rgba(255,107,0,0.45)]">Kena</span>
                  <span className="text-[#FF6B00] ml-2 uppercase drop-shadow-[0_2px_15px_rgba(255,107,0,0.45)]">Kata</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold mt-1 font-sans">Unified E-Commerce Portal & Secured Logistics Workspace</p>

                {/* Tab select slider */}
                <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mt-6 max-w-sm mx-auto">
                  <button
                    onClick={() => { setAuthTab('LOGIN'); setSignupStep('DETAILS'); }}
                    className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition ${authTab === 'LOGIN' ? 'bg-[#FF6B00] text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Log In to Store
                  </button>
                  <button
                    onClick={() => { setAuthTab('SIGNUP'); setSignupStep('DETAILS'); }}
                    className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition ${authTab === 'SIGNUP' ? 'bg-[#FF6B00] text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Register Profile
                  </button>
                </div>
              </div>

              {/* Login UI */}
              {authTab === 'LOGIN' && (
                forgotPasswordMode ? (
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                      <h2 className="text-sm font-black text-[#FF6B00] uppercase tracking-wider">Forgot Password Recovery</h2>
                      <button 
                        type="button" 
                        onClick={() => { setForgotPasswordMode(false); setForgotPasswordStep('REQUEST'); }}
                        className="text-slate-400 hover:text-white text-xs font-bold transition"
                      >
                        Back to Login
                      </button>
                    </div>

                    {forgotPasswordStep === 'REQUEST' ? (
                      <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Enter your registered 10-digit mobile number below. We will send a secure verification OTP. 
                          The code will go directly to the <span className="text-[#FF6B00] font-bold">Admin Secretariat</span> queue. 
                          You can ask the admin to share it with you over WhatsApp.
                        </p>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Registered Mobile Number</label>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            <input 
                              type="tel"
                              maxLength={10}
                              placeholder="Enter 10-digit mobile" 
                              value={forgotMobile}
                              onChange={(e) => setForgotMobile(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full btn-premium py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                        >
                          {authLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Request Admin Secretariat Verification OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                        <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/20 p-3 rounded-2xl text-center">
                          <p className="text-[10px] text-slate-350">
                            Verification OTP code has been routed to the administrative logs.
                          </p>
                          <span className="text-xs text-[#FF6B00] font-black mt-1 block">
                            Contact Admin via WhatsApp to receive your 4-digit code.
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Enter 4-Digit OTP Code</label>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            <input 
                              type="text"
                              maxLength={4}
                              placeholder="e.g. 1234" 
                              value={forgotOtp}
                              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-center font-mono text-xs font-black text-white focus:outline-none tracking-widest"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Set New Security Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            <input 
                              type={showForgotNewPassword ? "text" : "password"} 
                              placeholder="Minimum 4 characters" 
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-white focus:outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                              className="absolute right-3 top-3 text-slate-500 hover:text-white transition"
                            >
                              {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow"
                        >
                          {authLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Verify OTP & Save Credentials</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        <div className="space-y-2 pt-2">
                          {forgotResendTimer > 0 ? (
                            <div className="text-center text-[10.5px] text-slate-400 bg-[#0b1329] border border-slate-850 py-3 rounded-xl font-semibold">
                              Resend available in <strong className="text-[#FF6B00] font-mono">{forgotResendTimer}s</strong>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendForgotOtp}
                              disabled={authLoading}
                              className="w-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00]/20 text-[#FF6B00] py-3 rounded-xl text-xs font-black uppercase tracking-wider transition block text-center cursor-pointer"
                            >
                              Resend Verification OTP
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => { setForgotPasswordStep('REQUEST'); setForgotResendTimer(0); }}
                            className="w-full text-slate-500 hover:text-slate-400 transition text-[10.5px] font-bold block text-center underline"
                          >
                            Change mobile number
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleUnifiedLogin} className="space-y-4 relative z-10">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Registered Mobile Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile" 
                          value={loginMobile}
                          onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Security Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-white focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-white transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full btn-premium py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Enter Workspace Securely</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center pt-2">
                      <button 
                        type="button"
                        onClick={() => { setForgotPasswordMode(true); setForgotPasswordStep('REQUEST'); setForgotMobile(loginMobile); }}
                        className="text-[11px] font-extrabold text-slate-400 hover:text-[#FF6B00] transition flex items-center gap-1.5"
                      >
                        Forgot Password? Recover via Mobile OTP Code
                      </button>
                    </div>
                  </form>
                )
              )}

              {/* Signup UI */}
              {authTab === 'SIGNUP' && (
                signupStep === 'DETAILS' ? (
                  <form onSubmit={handleRequestSignupOtp} className="space-y-4 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Customers Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sahil Akhtar" 
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                          required
                        />
                      </div>

                      {/* Mobile Numbers */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Primary Mobile</label>
                          <input 
                            type="tel" 
                            maxLength={10}
                            placeholder="Primary 10-digit" 
                            value={signupMobile}
                            onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-[#FF6B00] uppercase block">Alternative Mobile</label>
                          <input 
                            type="tel" 
                            maxLength={10}
                            placeholder="Alternative 15-digit" 
                            value={signupAltMobile}
                            onChange={(e) => setSignupAltMobile(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#0f172a] border border-[#FF6B00]/30 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none placeholder-slate-600 focus:border-[#FF6B00]"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Security Password</label>
                        <input 
                          type="password" 
                          placeholder="Create strong password" 
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                          required
                        />
                      </div>

                      {/* Referral seller ID optional */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Referral Seller ID (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., seller_1" 
                          value={referralSellerId}
                          onChange={(e) => setReferralSellerId(e.target.value)}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none font-mono"
                        />
                      </div>

                    </div>

                    {/* Address block */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Full Delivery Address</label>
                      <input 
                        type="text" 
                        placeholder="Village, Town, Street, House No." 
                        value={signupAddress}
                        onChange={(e) => setSignupAddress(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block">State</label>
                        <select 
                          value={signupState} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setSignupState(val);
                            const defaultDist = STATE_DISTRICTS[val as keyof typeof STATE_DISTRICTS]?.[0] || "";
                            setSignupDistrict(defaultDist);
                          }}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                        >
                          {INDIAN_STATES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block">District</label>
                        <select 
                          value={signupDistrict} 
                          onChange={(e) => {
                            setSignupDistrict(e.target.value);
                          }}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                        >
                          {(STATE_DISTRICTS[signupState as keyof typeof STATE_DISTRICTS] || []).map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Category Selection Onboarding */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" /> Select Interests (Onboarding Personalization):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Electronics", "Fashion", "Grocery", "Cosmetics", "Home Decor", "Sports"].map((cat) => {
                          const active = signupInterests.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => toggleInterest(cat)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition cursor-pointer ${active ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                            >
                              {cat} {active && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Drag & Drop Area for Profile Photo */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Profile Photograph (Drag-Drop or URL)</label>
                      
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${isDragging ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-slate-800 bg-slate-950/40'}`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {signupProfilePhoto ? (
                            <img src={signupProfilePhoto} className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow-md" referrerPolicy="no-referrer" />
                          ) : (
                            <Upload className="w-7 h-7 text-slate-500" />
                          )}
                          <div className="text-[11px]">
                            <span className="text-[#FF6B00] font-extrabold">Drag & Drop Image Here</span> or{' '}
                            <label className="underline cursor-pointer">
                              Browse files
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                          </div>
                          <p className="text-[9px] text-slate-500">Supports direct drag-dropping & files reading.</p>
                        </div>
                      </div>

                      <input 
                        type="text" 
                        value={signupProfilePhoto} 
                        onChange={(e) => setSignupProfilePhoto(e.target.value)}
                        placeholder="Or input dynamic URL link directly"
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 text-[11px] font-semibold text-white focus:outline-none mt-1 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full btn-premium py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Submit & Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* OTP verification form */
                  <form onSubmit={handleVerifySignupOtp} className="space-y-4 text-center relative z-10">
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-white">Enter OTP Credentials</h2>
                      <p className="text-slate-400 text-xs">Verify your 10-digit mobile number {signupMobile} to activate profile.</p>
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto">
                      <label className="text-[10px] font-extrabold text-slate-400 block uppercase">Enter 4-Digit Verification Code</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="OTP..." 
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-32 text-center text-xl font-black tracking-widest border border-slate-800 p-3 rounded-xl focus:border-[#FF6B00] bg-[#0f172a] text-white block mx-auto font-mono"
                        required
                      />
                    </div>

                    {/* SIMULATED HINT */}
                    {simulatedOtpHint && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 max-w-sm mx-auto text-xs">
                        <p className="text-orange-400 font-bold flex items-center justify-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Simulated WhatsApp / SMS OTP Hint:
                        </p>
                        <p className="text-white font-black tracking-widest mt-1 text-lg font-mono">{simulatedOtpHint}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Verification is securely checked on the server side.</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full btn-premium py-3.5 rounded-xl text-xs font-black max-w-xs mx-auto flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Verify & Create Profile</span>
                      )}
                    </button>

                    <div className="max-w-xs mx-auto space-y-2 pt-1 text-center">
                      {signupResendTimer > 0 ? (
                        <div className="text-center text-[10.5px] text-slate-400 bg-[#0b1329] border border-slate-850 py-3 rounded-xl font-semibold">
                          Resend available in <strong className="text-[#FF6B00] font-mono">{signupResendTimer}s</strong>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendSignupOtp}
                          disabled={authLoading}
                          className="w-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00]/20 text-[#FF6B00] py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition block text-center cursor-pointer"
                        >
                          Resend OTP Code
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { setSignupStep('DETAILS'); setSignupResendTimer(0); }}
                        className="text-slate-500 font-bold hover:text-slate-400 transition text-[10.5px] block mx-auto underline mt-1"
                      >
                        Change profile details
                      </button>
                    </div>
                  </form>
                )
              )}

              {/* Server Connection Settings Button */}
              <div className="mt-6 pt-4 border-t border-slate-900 text-center relative z-10">
                <button
                  type="button"
                  onClick={() => setShowServerConfig(!showServerConfig)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <Wifi className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Server Connection Settings (APK / Offline Mobile)</span>
                </button>
              </div>

              {showServerConfig && (
                <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-200 relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <span>🔧 Active API Server Address</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      When deployed as an APK on your mobile, the app needs to establish a network connection to our cloud workspace server.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customServerUrl}
                      onChange={(e) => setCustomServerUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 text-xs font-mono font-semibold text-white focus:outline-none focus:border-[#FF6B00]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomServerUrl('https://ais-dev-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app');
                          localStorage.setItem('custom_backend_url', 'https://ais-dev-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app');
                          triggerToast("Switched to Development Server", "success");
                          fetchState(true);
                        }}
                        className={`py-2 rounded-xl text-[9px] font-extrabold uppercase transition cursor-pointer ${customServerUrl === 'https://ais-dev-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app' ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-slate-900 text-slate-400 border border-slate-850 hover:bg-slate-850 hover:text-white'}`}
                      >
                        Dev Server
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomServerUrl('https://ais-pre-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app');
                          localStorage.setItem('custom_backend_url', 'https://ais-pre-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app');
                          triggerToast("Switched to Production Server", "success");
                          fetchState(true);
                        }}
                        className={`py-2 rounded-xl text-[9px] font-extrabold uppercase transition cursor-pointer ${customServerUrl === 'https://ais-pre-gcapm3shyaooil6h2wbd3l-103906586141.asia-southeast1.run.app' ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-slate-900 text-slate-400 border border-slate-850 hover:bg-slate-850 hover:text-white'}`}
                      >
                        Prod/Shared Server
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveServerUrl(customServerUrl)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-black transition text-center uppercase tracking-wider shadow cursor-pointer"
                    >
                      Connect & Sync Database
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Profile Settings Modal Overlay */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Profile Configurations</h3>
                <p className="text-[10px] text-slate-400">Modify your login credentials and personal records safely.</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileChanges} className="space-y-4">
              {/* Profile Photo ImageSelector */}
              <div className="space-y-1">
                <ImageSelector
                  label="Profile Picture Avatar"
                  value={editProfilePhoto}
                  onChange={setEditProfilePhoto}
                  placeholder="https://example.com/photo.png"
                />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">Full Legal Name</label>
                <input 
                  type="text" 
                  value={editProfileName} 
                  onChange={(e) => setEditProfileName(e.target.value)} 
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white" 
                  required 
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">Secret Security Password</label>
                <input 
                  type="password" 
                  value={editProfilePassword} 
                  onChange={(e) => setEditProfilePassword(e.target.value)} 
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white" 
                  required 
                />
              </div>

              {/* Conditional Address details if Customer role */}
              {(currentUser.role === 'CUSTOMER' || !currentUser.role) && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h4 className="text-[11px] font-black uppercase text-[#FF6B00] tracking-wider">Saved Contact & Delivery Addresses</h4>
                  
                  {/* Alternative Mobile Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase">Alternative Contact Phone</label>
                    <input 
                      type="tel" 
                      maxLength={10}
                      placeholder="Enter second mobile number"
                      value={editProfileAltMobile} 
                      onChange={(e) => setEditProfileAltMobile(e.target.value.replace(/\D/g, ''))} 
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono" 
                    />
                  </div>

                  {/* Saved Addresses List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editSavedAddresses.map((addr, idx) => (
                      <div key={addr.id || idx} className={`p-3 rounded-xl border relative text-xs space-y-1 ${addr.isDefault ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-slate-800 bg-slate-950/40'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-white text-[10.5px] uppercase tracking-wider">📍 {addr.name || 'Delivery Address'}</span>
                          <div className="flex items-center gap-1">
                            {addr.isDefault ? (
                              <span className="bg-[#FF6B00]/20 text-[#FF6B00] text-[8px] font-black uppercase px-2 py-0.5 rounded">Default</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  // Mark as default and update top-level profile fields too for backward compatibility
                                  const updated = editSavedAddresses.map((a, i) => ({ ...a, isDefault: i === idx }));
                                  setEditSavedAddresses(updated);
                                  setEditProfileAddress(addr.address);
                                  setEditProfileStateStr(addr.state);
                                  setEditProfileDistrict(addr.district);
                                }}
                                className="text-[#FF6B00] text-[8px] font-black uppercase hover:underline cursor-pointer"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editSavedAddresses.filter((_, i) => i !== idx);
                                setEditSavedAddresses(updated);
                              }}
                              className="text-red-400 hover:text-red-300 text-[10px] ml-2 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-300 line-clamp-2">{addr.address}</p>
                        <p className="text-[10px] text-slate-405 font-bold">{addr.district}, {addr.state}</p>
                        <p className="text-[9.5px] text-slate-500 font-mono">Alt Mobile: {addr.altMobile || 'N/A'}</p>
                      </div>
                    ))}
                    {editSavedAddresses.length === 0 && (
                      <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-400">No saved addresses defined. Specify one below!</div>
                    )}
                  </div>

                  {/* Add New Address Form Section */}
                  <div className="p-3 border border-slate-800 rounded-2xl bg-slate-950/20 space-y-3">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">Add Alternate Address</span>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Address Label (e.g., Home, Office)</label>
                      <input 
                        type="text"
                        placeholder="e.g., Office, Parents Home"
                        value={newAddrLabel}
                        onChange={(e) => setNewAddrLabel(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-800 bg-slate-950 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Address Details</label>
                      <input 
                        type="text"
                        placeholder="Flat, Building, Street details"
                        value={newAddrAddress}
                        onChange={(e) => setNewAddrAddress(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-800 bg-slate-950 text-white"
                      />
                    </div>

                    {/* State District Selection Cascade (same as registration!) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block">State</label>
                        <select 
                          value={newAddrState} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAddrState(val);
                            const defaultDist = STATE_DISTRICTS[val as keyof typeof STATE_DISTRICTS]?.[0] || "";
                            setNewAddrDistrict(defaultDist);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                        >
                          {INDIAN_STATES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block">District</label>
                        <select 
                          value={newAddrDistrict} 
                          onChange={(e) => setNewAddrDistrict(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                        >
                          {(STATE_DISTRICTS[newAddrState as keyof typeof STATE_DISTRICTS] || []).map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Alternative Contact Phone (Optional)</label>
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="Alternative 10-digit number"
                        value={newAddrAltMobile}
                        onChange={(e) => setNewAddrAltMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newAddrAddress) {
                          alert("Please specify the delivery address details first.");
                          return;
                        }
                        const isFirst = editSavedAddresses.length === 0;
                        const newVal = {
                          id: "addr_" + Math.random().toString(36).substring(2, 7),
                          name: newAddrLabel || "Alternate Address",
                          address: newAddrAddress,
                          state: newAddrState,
                          district: newAddrDistrict,
                          mobile: currentUser.mobile,
                          altMobile: newAddrAltMobile || editProfileAltMobile,
                          isDefault: isFirst
                        };
                        const updatedList = [...editSavedAddresses, newVal];
                        setEditSavedAddresses(updatedList);
                        
                        // If this is the first address, also sync top level
                        if (isFirst) {
                          setEditProfileAddress(newAddrAddress);
                          setEditProfileStateStr(newAddrState);
                          setEditProfileDistrict(newAddrDistrict);
                        }

                        // Reset fields
                        setNewAddrAddress("");
                        setNewAddrLabel("Home");
                        setNewAddrAltMobile("");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10.5px] uppercase tracking-wider py-2 px-4 rounded-xl w-full cursor-pointer transition active:scale-95"
                    >
                      + Save Alternate Address Location
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={syncing}
                  className="bg-[#0077B6] hover:bg-sky-600 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {syncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Toast notify block */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
