import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, CheckCircle2, Lock, KeyRound, Sparkles, Eye, EyeOff, FolderKanban } from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, User, ProjectResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils';
import { getFriendlyError } from '../services/apiClient';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import GlobalDataTable, { DataTableColumn } from '../components/common/GlobalDataTable';

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
  const [showPassword, setShowPassword] = useState(false);
  const [roleCode, setRoleCode] = useState('DEVELOPER');
  const [assignProjectId, setAssignProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRoleCode, setEditRoleCode] = useState('DEVELOPER');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editingSubmitting, setEditingSubmitting] = useState(false);

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

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get<ApiResponse<ProjectResponse[]>>('/projects');
      if (res.data.success && res.data.data) setProjects(res.data.data);
    } catch { }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditingSubmitting(true);
    try {
      const res = await apiClient.put<ApiResponse<any>>(`/users/${editingUser.id}`, {
        email: editEmail,
        firstName: editFirstName,
        lastName: editLastName,
        status: editStatus,
        roleCodes: [editRoleCode],
      });

      if (res.data.success) {
        showSuccessAlert('User Updated', `User @${editingUser.username} updated successfully.`);
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showErrorAlert('User Edit Failed', getFriendlyError(err));
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userToToggle: User) => {
    try {
      const newStatus = userToToggle.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      const res = await apiClient.put<ApiResponse<any>>(`/users/${userToToggle.id}`, {
        email: userToToggle.email,
        firstName: userToToggle.firstName,
        lastName: userToToggle.lastName,
        status: newStatus,
        roleCodes: userToToggle.roles,
      });

      if (res.data.success) {
        showSuccessAlert('Status Toggled', `User @${userToToggle.username} status updated to ${newStatus}.`);
        fetchUsers();
      }
    } catch (err: any) {
      showErrorAlert('Toggle Failed', getFriendlyError(err));
    }
  };

  const openEditModal = (selectedUser: User) => {
    setEditingUser(selectedUser);
    setEditEmail(selectedUser.email || '');
    setEditFirstName(selectedUser.firstName || '');
    setEditLastName(selectedUser.lastName || '');
    setEditStatus(selectedUser.status || 'ACTIVE');
    setEditRoleCode(selectedUser.roles?.[0] || 'DEVELOPER');
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
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

      if (res.data.success && res.data.data) {
        const newUser = res.data.data;

        // If a role that needs project assignment is selected AND a project was chosen,
        // call the members API to add them to that project right away.
        const rolesWithProject = ['PROJECT_MANAGER', 'PROJECT_LEAD', 'DEVELOPER'];
        if (rolesWithProject.includes(roleCode) && assignProjectId) {
          try {
            await apiClient.post(`/projects/${assignProjectId}/members`, {
              userId: newUser.id,
              roleCode: roleCode,
            });
            showSuccessAlert(
              'User Created & Assigned',
              `@${username} created as ${roleCode.replace('_', ' ')} and assigned to the selected project.`
            );
          } catch {
            showSuccessAlert(
              'User Created',
              `@${username} created. Project assignment may need to be set manually.`
            );
          }
        } else {
          showSuccessAlert('User Created', `User @${username} registered successfully as ${roleCode}.`);
        }
        setIsModalOpen(false);
        setUsername('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setPassword('Password123!');
        setAssignProjectId('');
        fetchUsers();
      }
    } catch (err: any) {
      showErrorAlert('User Creation Failed', getFriendlyError(err));
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
    if (roles.includes('PROJECT_LEAD') || roles.includes('ROLE_PROJECT_LEAD')) {
      return 'bg-info bg-opacity-10 text-info border-info border-opacity-25';
    }
    return 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25';
  };

  // ── Column definitions for GlobalDataTable ──────────────────────────────────
  const userColumns: DataTableColumn<User>[] = [
    {
      key: 'firstName',
      label: 'User',
      render: (u) => (
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-gradient-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
            style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}
          >
            {u.firstName?.[0] || 'U'}
          </div>
          <div>
            <div className="fw-bold text-dark mb-0">{u.firstName} {u.lastName}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>@{u.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      render: (u) => <span className="font-monospace text-dark text-sm">@{u.username}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (u) => <span className="text-muted small">{u.email}</span>,
    },
    {
      key: 'roles',
      label: 'System Roles',
      render: (u) => (
        <div className="d-flex gap-1 flex-wrap">
          {u.roles?.map((r) => (
            <span
              key={r}
              className={`badge border rounded-pill px-2 py-1 text-uppercase fw-semibold ${getRoleBadgeStyle(u.roles)}`}
              style={{ fontSize: '0.65rem' }}
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (u) => (
        <span className={`badge border rounded-pill px-2 py-1 small text-uppercase fw-semibold ${u.status === 'INACTIVE' ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-success bg-opacity-10 text-success border-success border-opacity-25'}`}>
          {u.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="d-flex gap-2">
          <button
            onClick={() => openEditModal(u)}
            className="btn btn-xs btn-outline-secondary px-2 py-1 rounded-3 text-xs"
            style={{ fontSize: '0.75rem' }}
          >
            Edit
          </button>
          <button
            onClick={() => handleToggleUserStatus(u)}
            className={`btn btn-xs px-2 py-1 rounded-3 text-xs ${u.status === 'INACTIVE' ? 'btn-outline-success' : 'btn-outline-danger'}`}
            style={{ fontSize: '0.75rem' }}
          >
            {u.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      ),
    },
  ];

  // "Create New User" button – passed as the actions slot to GlobalDataTable
  const createUserBtn = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="btn btn-primary bg-gradient-primary border-0 rounded-3 d-flex align-items-center gap-2 px-4 py-2 fw-semibold shadow-sm"
      style={{ fontSize: '0.85rem' }}
    >
      <UserPlus style={{ width: '16px', height: '16px' }} />
      <span>Create New User</span>
    </button>
  );

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1200px' }}>
      {/* Top Header Card */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <h1 className="h4 fw-bold mb-0 text-dark">User Management &amp; Global Roles</h1>
        </div>
        <p className="small text-muted mb-0">
          Admin control panel to provision accounts, specify global system roles, and grant permissions.
        </p>
      </div>

      {/* Users DataTable */}
      {loading ? (
        <LoadingSpinner message="Loading workspace users..." />
      ) : (
        <GlobalDataTable<User>
          id="users-data-table"
          title="System Users"
          columns={userColumns}
          data={users}
          exportFileName="system_users"
          actions={createUserBtn}
        />
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
                    placeholder="e.g. rahul@project-pulse.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Initial Password</label>
                  <div className="input-group input-group-sm">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control bg-light rounded-start-3 shadow-none text-sm border-end-0"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="btn btn-light border border-start-0 rounded-end-3 px-2 text-muted"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <Eye style={{ width: '15px', height: '15px' }} />
                        : <EyeOff style={{ width: '15px', height: '15px' }} />}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Global Role Specification</label>
                  <select
                    value={roleCode}
                    onChange={(e) => { setRoleCode(e.target.value); setAssignProjectId(''); }}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm"
                  >
                    <option value="DEVELOPER">Developer (Sprint &amp; Task execution)</option>
                    <option value="PROJECT_LEAD">Project Lead (Task creation &amp; developer assignment)</option>
                    <option value="PROJECT_MANAGER">Project Manager (Sprint creation &amp; project control)</option>
                    <option value="ADMIN">System Administrator (Full access)</option>
                  </select>
                </div>

                {/* Assign to Project — visible for DEVELOPER, PROJECT_LEAD, and PROJECT_MANAGER */}
                {(roleCode === 'PROJECT_MANAGER' || roleCode === 'PROJECT_LEAD' || roleCode === 'DEVELOPER') && (
                  <div className="mb-4 p-3 rounded-3 border border-primary border-opacity-25 bg-primary bg-opacity-5">
                    <label className="form-label text-uppercase fw-bold text-muted small d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.7rem' }}>
                      <FolderKanban style={{ width: '13px', height: '13px' }} />
                      Assign to Project <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <select
                      value={assignProjectId}
                      onChange={(e) => setAssignProjectId(e.target.value)}
                      className="form-select form-select-sm bg-white rounded-3 shadow-none text-sm"
                    >
                      <option value="">— No project assignment yet —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                    {assignProjectId && (
                      <div className="mt-2 d-flex align-items-center gap-1 text-primary small fw-semibold" style={{ fontSize: '0.72rem' }}>
                        <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                        Will be added as{' '}
                        {roleCode === 'PROJECT_MANAGER' ? 'Project Manager'
                          : roleCode === 'PROJECT_LEAD' ? 'Project Lead'
                          : 'Developer'}{' '}
                        to the selected project.
                      </div>
                    )}
                  </div>
                )}

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
      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Edit System User @{editingUser.username}</h5>
                <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>First Name</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Last Name</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Global Role</label>
                  <select
                    value={editRoleCode}
                    onChange={(e) => setEditRoleCode(e.target.value)}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm"
                  >
                    <option value="DEVELOPER">Developer (Sprint &amp; Task execution)</option>
                    <option value="PROJECT_LEAD">Project Lead (Task creation &amp; developer assignment)</option>
                    <option value="PROJECT_MANAGER">Project Manager (Sprint creation &amp; project control)</option>
                    <option value="ADMIN">System Administrator (Full access)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                  </select>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingSubmitting}
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 d-flex align-items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    <span>{editingSubmitting ? 'Saving...' : 'Save Changes'}</span>
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
