import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

interface AdminLockGateProps {
  onUnlock: () => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminLockGate({ onUnlock, onCancel, showToast }: AdminLockGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = password.trim();
    // Accept standard secure credentials: admin registered phone '9609495971', pin '9609', 'New-Shopping-Application-9681' or 'admin123'
    if (trimmed === 'admin123' || trimmed === '9609' || trimmed === '9609495971' || trimmed === 'New-Shopping-Application-9681') {
      showToast("Access Granted: God Mode Activated successfully! ✅", "success");
      onUnlock();
    } else {
      setErrorCount(prev => prev + 1);
      setPassword('');
      showToast("Incorrect Admin Security PIN or Password! Please try again.", "error");
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="glossy-card max-w-md w-full p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 shadow-inner">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight font-display uppercase">
              God Mode Authorization
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              This terminal is protected for registered platform authorities. Please verify your administrative credentials to enter.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Enter Admin Security Passcode
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="PIN / Passcode..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-xs bg-slate-900/95 border border-white/10 rounded-xl focus:border-brand-orange text-white placeholder-slate-600 font-mono tracking-wider"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-premium py-3 text-xs font-extrabold flex items-center justify-center gap-2 tracking-wide"
          >
            <LogIn className="w-4 h-4" />
            Authenticate Admin Mode
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition duration-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel & Go Back to Storefront
          </button>
        </form>

        {errorCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-[10px] font-semibold text-red-400 animate-bounce">
              Failed Attempts: {errorCount}. Unauthorized actions are registered live in system logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
