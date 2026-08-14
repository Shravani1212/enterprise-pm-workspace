import React from 'react';
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
    <div className="position-fixed bottom-0 end-0 p-4 z-3 d-flex flex-column gap-2" style={{ maxWidth: '380px', width: '100%' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert alert-dismissible fade show shadow-lg rounded-3 mb-0 d-flex align-items-center justify-between border ${
            toast.type === 'error'
              ? 'alert-danger'
              : toast.type === 'warning'
              ? 'alert-warning'
              : 'alert-success'
          }`}
          style={{ animation: 'slideUp 0.25s ease-out' }}
        >
          <div className="d-flex align-items-center gap-2 me-3">
            {toast.type === 'error' ? (
              <AlertCircle className="text-danger flex-shrink-0" style={{ width: '18px', height: '18px' }} />
            ) : (
              <CheckCircle className="text-success flex-shrink-0" style={{ width: '18px', height: '18px' }} />
            )}
            <span className="fw-semibold small leading-snug">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="btn-close shadow-none"
            style={{ position: 'relative', padding: '0.5rem', top: 0, right: 0 }}
            aria-label="Close"
          ></button>
        </div>
      ))}
    </div>
  );
};
