import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors = {
    success: 'bg-[#0f1f1a] border-emerald-500/20 text-emerald-350',
    error: 'bg-[#2a1313] border-red-500/20 text-red-350',
    info: 'bg-[#131b2e] border-blue-500/20 text-blue-350',
    warning: 'bg-[#241a10] border-amber-500/20 text-amber-350',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${bgColors[type]}`}>
      {icons[type]}
      <span className="text-xs font-semibold text-white">{message}</span>
      <button onClick={onClose} className="text-white/40 hover:text-white/80 ml-2 text-base leading-none">
        &times;
      </button>
    </div>
  );
}
