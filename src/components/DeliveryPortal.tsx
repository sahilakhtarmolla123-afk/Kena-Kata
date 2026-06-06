import React, { useState } from 'react';
import { 
  Bike, LogIn, ClipboardList, CheckCircle2, ChevronRight, MapPin, 
  Smartphone, User, Check, XCircle, ArrowLeft, RefreshCw, Undo2, LogOut,
  Upload, Navigation, HelpCircle, Truck
} from 'lucide-react';
import { Order, UserProfile } from '../types';
import { apiFetch as fetch } from '../utils/api';

interface DeliveryPortalProps {
  orders: Order[];
  currentUser: UserProfile;
  triggerRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DeliveryPortal({ 
  orders, 
  currentUser,
  triggerRefresh, 
  showToast 
}: DeliveryPortalProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // OTP code inputs
  const [otpVal, setOtpVal] = useState('');

  // Proof Photograph states
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Active Simulated GPS states
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentLat, setCurrentLat] = useState(22.5726); // Default Kolkata
  const [currentLng, setCurrentLng] = useState(88.3639);

  // Assigned deliveries to this logged in delivery agents mobile
  const assignedDeliveries = orders.filter(o => 
    o.status !== 'CANCELLED' && 
    o.status !== 'DELIVERED' && 
    o.status !== 'RETURNED'
  );

  const assignedReturns = orders.filter(o => o.status === 'RETURN_REQUESTED');

  // Trigger GPS Movement Mock 
  const simulateGpsDriveAndTransmit = async (orderId: string) => {
    setIsSharingLocation(true);
    // Mock tiny steps towards destination
    const nextLat = currentLat + (Math.random() - 0.5) * 0.01;
    const nextLng = currentLng + (Math.random() - 0.5) * 0.01;
    setCurrentLat(nextLat);
    setCurrentLng(nextLng);

    try {
      const res = await fetch('/api/orders/update-gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          lat: nextLat,
          lng: nextLng
        })
      });
      if (res.ok) {
        showToast(`📍 Mapped GPS Updated! Latitude: ${nextLat.toFixed(4)}, Longitude: ${nextLng.toFixed(4)} transmitted to customer feed.`, "success");
        triggerRefresh();
      }
    } catch (e) {
      showToast("GPS transmitter error.", "error");
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, deliveryAgentId: currentUser.id })
      });
      if (res.ok) {
        showToast(`Status updated to ${status}! ✅`, "success");
        triggerRefresh();
        const updated = await res.json();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated.order);
        }
      }
    } catch (e) {
      showToast("Could not sync tracking logs.", "error");
    }
  };

  // Drag & Drop proof upload processing
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
          setProofPhotoUrl(event.target.result as string);
          showToast("Proof photogragh captured via drag-drop successfully!", "success");
        }
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Only photos are allowed as delivery proofs.", "error");
    }
  };

  // Submit delivery proof credentials and double OTP 
  const submitDeliveryVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!proofPhotoUrl) {
      showToast("Mandatory upload: Delivery verification requires a clear Doorstep parcel photograph proof.", "error");
      return;
    }
    if (otpVal.length !== 4) {
      showToast("Verification code must be 4 digits passcode.", "error");
      return;
    }

    try {
      // 1. Submit photograph proof
      const uploadProofRes = await fetch('/api/orders/delivery-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          proofPhotoUrl
        })
      });

      if (!uploadProofRes.ok) {
        showToast("Proof photo validation failed on server.", "error");
        return;
      }

      // 2. Submit OTP validation code
      const res = await fetch('/api/orders/verify-delivery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, otp: otpVal })
      });

      if (res.ok) {
        showToast("Double Handshake Clearances Confirmed! Order DELIVERED successfully! 🏁", "success");
        setOtpVal('');
        setProofPhotoUrl('');
        setSelectedOrder(null);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Wrong WhatsApp delivery passcode details. Retrying.", "error");
      }
    } catch (e) {
      showToast("Verification dispatch failure logs.", "error");
    }
  };

  const confirmReturnReceipt = async (orderId: string) => {
    try {
      const res = await fetch('/api/orders/confirm-return-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        showToast("Returned parcel catalog restocked. Customer instant refund completed!", "success");
        triggerRefresh();
        setSelectedOrder(null);
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Agent subheader status indicator */}
      <div className="bg-[#0b1329] p-4 md:px-6 border-b border-rose-500/10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Bike className="w-6 h-6 text-[#FF6B00] animate-bounce" />
          <div>
            <h3 className="text-sm font-black text-white">{currentUser.name}</h3>
            <p className="text-[10px] text-slate-400">Logistics agent mobile: <strong className="font-mono text-indigo-400">{currentUser.mobile}</strong></p>
          </div>
        </div>
        <button 
          onClick={triggerRefresh}
          className="bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Synchronize lists
        </button>
      </div>

      {selectedOrder ? (
        <div className="flex-1 p-4 md:p-6 space-y-4 max-w-lg mx-auto w-full">
          <button 
            onClick={() => { setSelectedOrder(null); setOtpVal(''); }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dispatch Panel
          </button>

          <div className="bg-[#0b1329] rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b pb-3 border-slate-800">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#FF6B00]">Parcel Destination Workspace</span>
                <h3 className="text-sm font-black text-white font-mono">ORDER ID: {selectedOrder.id}</h3>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[9px] px-2.5 py-1 rounded-xl uppercase">
                {selectedOrder.status}
              </span>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 text-xs">
              <p className="text-slate-400 font-bold uppercase text-[9px]">Recipient Details</p>
              <p className="text-sm font-black text-white">{selectedOrder.customerName}</p>
              <p className="font-semibold text-slate-300 flex items-center gap-1 font-mono">
                📞 +91 {selectedOrder.customerMobile}
              </p>
              <p className="text-[10.5px] text-[#FF6B00] font-mono block uppercase">Speed Priority: {selectedOrder.selectedDeliverySpeed || 'Standard'}</p>
              
              <div className="bg-slate-950/65 p-3 rounded-2xl border border-slate-850 mt-1 text-slate-300">
                <span className="font-bold flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> Delivery Address:</span>
                <p className="text-slate-400">{selectedOrder.deliveryAddress.address}, {selectedOrder.deliveryAddress.district}, {selectedOrder.deliveryAddress.state}</p>
              </div>
            </div>

            {/* GPS coordinate updater */}
            {(selectedOrder.status === 'DISPATCHED' || selectedOrder.status === 'OUT_FOR_DELIVERY') && (
              <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/15 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-black text-white flex items-center justify-center gap-1 uppercase tracking-wider">
                  <Navigation className="w-4 h-4 text-[#FF6B00] animate-spin" /> Live Location coordinates sharing
                </p>
                <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">Mock active driving telemetry. Update and transmit exact GPS telemetry maps to the Customer's home screen.</p>
                <div className="flex justify-center gap-4 text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-xl">
                  <span>Lat: {currentLat.toFixed(5)}</span>
                  <span>Lng: {currentLng.toFixed(5)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => simulateGpsDriveAndTransmit(selectedOrder.id)}
                  className="bg-[#FF6B00] hover:bg-orange-500 text-white font-extrabold text-[10px] uppercase py-2 px-4 rounded-xl cursor-pointer"
                >
                  Transmit GPS Movement Telemetry
                </button>
              </div>
            )}

            {/* Package details */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Items Package Summary</p>
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} className="flex gap-2 text-xs">
                  <img src={i.image} alt="" className="w-8 h-8 object-cover rounded-lg border border-slate-850" />
                  <div className="flex-1">
                    <p className="text-white line-clamp-1">{i.productName}</p>
                    <p className="text-slate-500">Qty: {i.quantity} {i.variant && `| Size: ${i.variant}`}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons with file proof requirements */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              {selectedOrder.status === 'PLACED' || selectedOrder.status === 'CONFIRMED' ? (
                <button
                  onClick={() => updateStatus(selectedOrder.id, 'DISPATCHED')}
                  className="w-full bg-[#FF6B00] text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer uppercase"
                >
                  Mark as PICKED UP & transit
                </button>
              ) : selectedOrder.status === 'DISPATCHED' ? (
                <button
                  onClick={() => updateStatus(selectedOrder.id, 'OUT_FOR_DELIVERY')}
                  className="w-full bg-blue-500 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer uppercase"
                >
                  Mark Out for Delivery 🚚
                </button>
              ) : selectedOrder.status === 'OUT_FOR_DELIVERY' ? (
                <form onSubmit={submitDeliveryVerification} className="space-y-4">
                  
                  {/* Proof Photo drag area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">📦 Required Doorstep Proof Photo (Drag-Drop or URL):</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${isDragging ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-slate-800 bg-slate-950/40'}`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        {proofPhotoUrl ? (
                          <img src={proofPhotoUrl} className="w-20 h-14 rounded-lg object-cover border border-slate-700 shadow-md" />
                        ) : (
                          <Upload className="w-7 h-7 text-slate-500" />
                        )}
                        <div className="text-[11px] text-slate-400">
                          <span className="text-[#FF6B00] font-extrabold">Drag & Drop Parcel Proof Photo</span> or choose file.
                        </div>
                      </div>
                    </div>

                    <input 
                      type="text" 
                      value={proofPhotoUrl} 
                      onChange={(e) => setProofPhotoUrl(e.target.value)}
                      placeholder="Or input dynamic URL Link directly"
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 text-[11px] font-semibold text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Customer's OTP Code details */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-center space-y-3">
                    <p className="text-xs font-black text-white">Enter customer Double-handshake OTP</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Ask customer for the 4-digit security code displayed on their app payment detail screen.</p>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={otpVal}
                      onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                      placeholder="OTP Code"
                      className="w-28 text-center text-lg font-bold tracking-widest bg-slate-900 border border-slate-800 p-2 rounded-xl text-white block mx-auto font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-premium py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Confirm Double Handshake Delivery
                  </button>
                </form>
              ) : selectedOrder.status === 'RETURN_REQUESTED' ? (
                <div className="space-y-2">
                  <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-3 text-xs space-y-1">
                    <p className="font-extrabold text-red-400">Return Reason: {selectedOrder.returnDetails?.reason}</p>
                    <p className="text-slate-400 font-mono">UPI Refund to: {selectedOrder.returnDetails?.refundUpi}</p>
                  </div>
                  <button
                    onClick={() => confirmReturnReceipt(selectedOrder.id)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer uppercase font-mono shadow"
                  >
                    Verify Return Receipt & Refund Buyer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-6 space-y-4 max-w-lg mx-auto w-full">
          
          <div className="flex justify-between items-center bg-[#0b1329] p-4 rounded-3xl border border-slate-800">
            <span className="text-xs font-extrabold text-slate-400">Assigned Transit Orders</span>
            <span className="bg-[#FF6B00] text-white text-[10px] px-2.5 py-0.5 rounded-xl font-bold font-mono">
              {assignedDeliveries.length} packages
            </span>
          </div>

          <div className="space-y-2.5">
            {assignedDeliveries.length === 0 && assignedReturns.length === 0 ? (
              <div className="bg-[#0b1329] rounded-3xl p-12 text-center border border-slate-800 space-y-2">
                <ClipboardList className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-slate-400">No shipments assigned to your ledger catalog.</p>
              </div>
            ) : (
              <>
                {assignedDeliveries.map((o) => (
                  <div 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    className="bg-[#0b1329] p-4 rounded-3xl border border-slate-800 hover:border-slate-700 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">#{o.id}</span>
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.25 rounded uppercase">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-300 mt-1">{o.customerName}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" /> {o.deliveryAddress.address}, {o.deliveryAddress.district}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                  </div>
                ))}

                {assignedReturns.map((o) => (
                  <div 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    className="bg-red-500/5 p-4 rounded-3xl border border-red-500/15 hover:border-red-500/25 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <span className="text-[10px] text-red-400 font-black tracking-wider block">⚠️ PENDING RETURN TASK</span>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">Order: {o.id}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-500 shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
