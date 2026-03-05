import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1rem)] max-w-sm sm:w-auto sm:max-w-md bottom-[84px] sm:bottom-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl border ${
        type === 'success'
          ? 'bg-gray-900/95 border-gray-800 text-white'
          : 'bg-red-600/95 border-red-500 text-white'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-white shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-bold leading-tight truncate">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
