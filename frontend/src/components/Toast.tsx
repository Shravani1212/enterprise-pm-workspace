import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-panel p-4 rounded-xl shadow-lg border flex items-center justify-between gap-3 animate-slide-up ${
            toast.type === 'error'
              ? 'bg-rose-50/90 text-rose-800 border-rose-200'
              : toast.type === 'warning'
              ? 'bg-amber-50/90 text-amber-800 border-amber-200'
              : 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            <span className="text-xs font-semibold leading-snug">{toast.text}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
