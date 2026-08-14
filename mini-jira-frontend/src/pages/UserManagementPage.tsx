import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, CheckCircle2, Lock, KeyRound, Sparkles } from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [roleCode, setRoleCode] = useState('DEVELOPER');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<User[]>>('/users');
      if (res.data.success && res.data.data) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      showErrorAlert('Error', 'Failed to fetch system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/users', {
        username,
        email,
        firstName,
        lastName,
        password,
        roleCodes: [roleCode],
      });

      if (res.data.success) {
        showSuccessAlert('User Created', `User @${username} registered successfully as ${roleCode}.`);
        setIsModalOpen(false);
        setUsername('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setPassword('Password123!');
        fetchUsers();
      }
    } catch (err: any) {
      showErrorAlert('User Creation Failed', err.response?.data?.error?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (roles: string[]) => {
    if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) {
      return 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25';
    }
    if (roles.includes('PROJECT_MANAGER') || roles.includes('ROLE_PROJECT_MANAGER')) {
      return 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25';
    }
    return 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25';
  };

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1100px' }}>
      {/* Top Header Card */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold mb-0 text-dark">User Management & Global Roles</h1>
              <span className="badge badge-subtle-primary rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                {users.length} Registered Accounts
              </span>
            </div>
            <p className="small text-muted mb-0">
              Admin control panel to provision accounts, specify global system roles, and grant permissions.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary bg-gradient-primary border-0 rounded-3 d-flex align-items-center gap-2 px-4 py-2 fw-semibold shadow-sm text-sm"
          >
            <UserPlus style={{ width: '18px', height: '18px' }} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
        </div>
      ) : (
        <div className="card card-glass border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light text-uppercase fw-bold text-muted" style={{ fontSize: '0.72rem' }}>
                <tr>
                  <th className="ps-4">User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>System Roles</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">User ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle bg-gradient-primary text-white fw-bold d-flex align-items-center justify-center shadow-xs"
                          style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}
                        >
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="fw-bold text-dark mb-0">
                            {u.firstName} {u.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace text-dark text-sm">@{u.username}</span>
                    </td>
                    <td className="text-muted small">{u.email}</td>
                    <td>
                      <div className="d-flex gap-1.5 flex-wrap">
                        {u.roles?.map((r) => (
                          <span
                            key={r}
                            className={`badge border rounded-pill px-2.5 py-1 text-uppercase fw-semibold ${getRoleBadgeStyle(u.roles)}`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-subtle-success rounded-pill px-2.5 py-1 small">
                        Active
                      </span>
                    </td>
                    <td className="pe-4 text-end text-muted font-monospace small">#{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin User Creation Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Provision New System User</h5>
                <button onClick={() => setIsModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                      placeholder="e.g. Rahul"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                      placeholder="e.g. Sharma"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    placeholder="e.g. rahul_dev"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    placeholder="e.g. rahul@enterprise.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Initial Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Global Role Specification</label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm"
                  >
                    <option value="DEVELOPER">Developer (Sprint & Task execution)</option>
                    <option value="PROJECT_LEAD">Project Lead (Task creation & developer assignment)</option>
                    <option value="PROJECT_MANAGER">Project Manager (Sprint creation & project control)</option>
                    <option value="ADMIN">System Administrator (Full access)</option>
                  </select>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 d-flex align-items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    <span>{submitting ? 'Creating User...' : 'Provision User'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
