import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { ApiResponse, UserResponse } from '../../types';
import { showSuccessAlert, showErrorAlert } from '../../utils/alertUtils';
import { getFriendlyError } from '../../services/apiClient';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.put<ApiResponse<UserResponse>>('/auth/profile', {
        firstName,
        lastName,
        email,
        newPassword: newPassword || undefined,
      });

      if (res.data.success && res.data.data) {
        const storedAuth = localStorage.getItem('auth_data');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          parsed.user = res.data.data;
          login(parsed);
        }
        showSuccessAlert('Profile Updated', 'Your profile details have been updated successfully.');
        onClose();
      }
    } catch (err: any) {
      showErrorAlert('Update Failed', getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal fade show d-block animate-fade-in"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 bg-white bg-opacity-10 d-flex align-items-center justify-center text-info p-2" style={{ width: '40px', height: '40px' }}>
                <User style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Account Settings</h5>
                <p className="text-light text-opacity-75 small mb-0" style={{ fontSize: '0.75rem' }}>Update your profile details and security</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-close btn-close-white shadow-none"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="modal-body p-4">
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                />
              </div>

              <div className="col-6">
                <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                Email Address
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <Mail style={{ width: '16px', height: '16px' }} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control bg-light shadow-none text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                New Password <span className="text-muted fw-normal lowercase">(optional)</span>
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <Lock style={{ width: '16px', height: '16px' }} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-control bg-light shadow-none text-sm border-end-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-light border border-start-0 text-muted px-2 d-flex align-items-center justify-center"
                  title={showPassword ? 'Password visible' : 'Password hidden'}
                >
                  {showPassword ? (
                    <Eye style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <EyeOff style={{ width: '14px', height: '14px' }} />
                  )}
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 d-flex align-items-center gap-2 shadow-sm"
              >
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                <span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
