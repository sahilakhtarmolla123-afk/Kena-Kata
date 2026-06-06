export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  companyName: string;
  name: string;
  description: string;
  category: string;
  mrp: number; // original price
  price: number; // discounted price
  stock: number;
  minOrderQuantity: number;
  images: string[];
  videoUrl?: string;
  sizeGuideImage?: string;
  specifications: { key: string; value: string }[];
  sizeVariants?: string[];
  colorVariants?: string[];
  bundleDeal?: {
    name: string;
    products: string[]; // product IDs included
    price: number;
  };
  flashSale?: {
    discountPercent: number;
    startTime: string; // ISO string
    endTime: string; // ISO string
    approved: boolean;
  };
  rating: number;
  reviewCount: number;
  // --- NEW FEATURES ---
  deliverySpeeds?: {
    standard: { active: boolean; price: number };
    express: { active: boolean; price: number };
    sameday: { active: boolean; price: number };
  };
  isBannedPendingReview?: boolean;
  bannedReason?: string;
  liveViewers?: number;
  salesThisWeek?: number;
}

export interface Seller {
  id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  password?: string; // Set by admin or chosen at register
  logo: string;
  banner: string;
  rating: number;
  totalSales: number;
  followersCount: number;
  isActive: boolean; // Approved by admin
  isVerified: boolean; // Verified badge
  deliveryCharges: { [state: string]: { [district: string]: number } };
  joinDate: string;
  spammerFlag?: boolean;
  // --- NEW FEATURES ---
  reportCount?: number;
  isSuspended?: boolean;
  suspensionDate?: string;
  commissionRate?: number; // base percentage e.g. 8
  categoryCommissionRates?: { [category: string]: number }; // e.g. { "Electronics": 5, "Fashion": 8 }
  referralCode?: string;
  referredBy?: string;
  averageResponseTimeMinutes?: number; // for accept speed rating
}

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  mobile: string;
  altMobile?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  altMobile?: string;
  profilePhoto?: string;
  address: string;
  state: string;
  district: string;
  password?: string;
  followingSellers: string[]; // Seller IDs
  role?: "CUSTOMER" | "SELLER" | "ADMIN" | "DELIVERY_AGENT"; // Unified support
  sellerId?: string; // if user represents a seller
  deliveryAgentId?: string; // if user represents a logistics agent
  interests?: string[]; // Onboarding interests
  reviewCount?: number; // threshold for Top Reviewer badge
  wishlist?: string[]; // Product IDs saved to wishlist
  savedAddresses?: SavedAddress[];
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: {
    name: string;
    address: string;
    state: string;
    district: string;
  };
  sellerId: string;
  sellerName: string;
  items: {
    productId: string;
    productName: string;
    image: string;
    price: number;
    quantity: number;
    variant?: string;
    status?: "PLACED" | "CONFIRMED" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RETURNED"; // Partial delivery status
  }[];
  paymentMethod: "COD" | "ONLINE";
  paymentDetails?: {
    transactionId: string;
    screenshotUrl?: string;
    verified: boolean;
    verificationErrorReason?: string;
  };
  deliveryCharge: number;
  itemTotal: number;
  discountTotal: number;
  finalTotal: number;
  status: "PLACED" | "CONFIRMED" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "RETURNED";
  statusTimeline: {
    status: string;
    timestamp: string;
  }[];
  deliveryAgentId?: string;
  deliveryOtp?: string; // 4-digit code
  deliveryOtpExpiry?: string;
  returnDetails?: {
    reason: string;
    refundUpi: string;
    refundCompleted: boolean;
  };
  // --- NEW FEATURES ---
  selectedDeliverySpeed?: "standard" | "express" | "sameday";
  estimatedDeliveryDate?: string;
  proofPhotoUrl?: string; // Delivery proof photo
  liveLocation?: {
    lat: number;
    lng: number;
    distanceKm: number;
    lastUpdated: string;
  };
  orderNote?: string;
  commissionRateApplied?: number;
  commissionDeducted?: number; // calculated in backend
  sellerEarningNet?: number; // calculated as finalTotal - commissionDeducted
  responseAcceptTime?: string; // Timestamp when order confirmed
}

export interface OtpRequest {
  id: string;
  mobile: string;
  otp: string;
  requestedAt: string;
  sentAt?: string;
  role: "CUSTOMER" | "SELLER" | "OTP_SIGNUP" | "FORGOT_PASSWORD"; // Signup verification too
  shopName?: string; // If seller signup
  tempSignupData?: string; // stringified UserProfile JSON for delayed save
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "CUSTOMER" | "SELLER" | "ADMIN";
  senderName: string;
  message: string;
  timestamp: string;
  productId?: string; // contextual chat
  productName?: string;
}

export interface Announcement {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLogo: string;
  text: string;
  image?: string;
  timestamp: string;
  likes: string[]; // Customer user IDs
}

export interface ProductQA {
  id: string;
  productId: string;
  question: string;
  questionerName: string;
  timestamp: string;
  answers: {
    answererName: string;
    answer: string;
    isSeller: boolean;
    isBuyer: boolean; // Verified buyer
    timestamp: string;
  }[];
}

// --- MORE NEW INTERFACES ---
export interface Dispute {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED_CUSTOMER" | "RESOLVED_SELLER";
  customerEvidencePhoto?: string;
  sellerEvidencePhoto?: string;
  resolutionReason?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all' (broadcast) or customerId/sellerId
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "order" | "announcement" | "system" | "promo";
}

export interface SystemVideo {
  id: string;
  title: string;
  videoUrl: string;
  uploadedBy: "ADMIN" | "SELLER";
  uploaderId: string; // 'admin' or sellerId
  uploaderName: string;
  timestamp: string;
  thumbnail?: string;
}

export interface AdminSettingsDetails {
  name: string;
  contactNumber: string;
  email: string;
  photoUrl: string;
  bio: string;
  bannedWords: string[];
  customPassword?: string;
}
