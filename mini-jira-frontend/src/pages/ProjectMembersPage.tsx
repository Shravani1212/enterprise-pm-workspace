import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus, Shield, Trash2, Mail, Calendar, CheckCircle2, User, LayoutGrid, Table2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, ProjectMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';
import { getFriendlyError } from '../services/apiClient';
import { formatDateDDMMYYYY } from '../utils/dateUtils';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import GlobalDataTable, { DataTableColumn } from '../components/common/GlobalDataTable';

export const ProjectMembersPage: React.FC = () => {
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';
  const { user: currentUser } = useAuth();
  
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  // Toggle between card grid and data-table view
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState('DEVELOPER');
  const [submitting, setSubmitting] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const [membersRes, usersRes] = await Promise.all([
        apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${activeProjectId}/members`),
        apiClient.get<ApiResponse<any[]>>('/users'),
      ]);
      if (membersRes.data.success && membersRes.data.data) {
        setMembers(membersRes.data.data);
      }
      if (usersRes.data.success && usersRes.data.data) {
        setAllUsers(usersRes.data.data);
      }
    } catch (err: any) {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeProjectId]);

  const isAdminOrPm = currentUser?.roles?.some((r) => r === 'ADMIN' || r === 'PROJECT_MANAGER');

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      showErrorAlert('Missing Users', 'Please select at least one user');
      return;
    }

    setSubmitting(true);
    try {
      const promises = selectedUserIds.map((userId) => {
        const payload: any = {
          userId: Number(userId),
          roleCode: selectedRoleCode,
        };
        if (selectedRoleCode === 'DEVELOPER' && selectedLeadId) {
          payload.leadId = Number(selectedLeadId);
        }
        return apiClient.post<ApiResponse<ProjectMember>>(
          `/projects/${activeProjectId}/members`,
          payload
        );
      });

      await Promise.all(promises);

      showSuccessAlert('Members Added', `${selectedUserIds.length} members assigned to project successfully.`);
      setIsAddModalOpen(false);
      setSelectedUserIds([]);
      setSearchTerm('');
      setSelectedLeadId('');
      fetchMembers();
    } catch (err: any) {
      showErrorAlert('Assignment Failed', getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    const confirmed = await showConfirmAlert(
      `Remove ${member.user.firstName} ${member.user.lastName}?`,
      'They will lose access to project tasks and Kanban boards.',
      'Remove Member'
    );

    if (confirmed) {
      try {
        await apiClient.delete(`/projects/${activeProjectId}/members/${member.user.id}`);
        showSuccessAlert('Member Removed', `${member.user.firstName} removed from project.`);
        fetchMembers();
      } catch (err: any) {
        showErrorAlert('Removal Failed', getFriendlyError(err));
      }
    }
  };

  const getRoleBadgeClass = (roleCode: string) => {
    switch (roleCode) {
      case 'ADMIN':
        return 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25';
      case 'PROJECT_MANAGER':
        return 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25';
      default:
        return 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25';
    }
  };

  // Column definitions for the table view
  const memberColumns: DataTableColumn<ProjectMember>[] = [
    {
      key: 'user.firstName',
      label: 'Member',
      render: (m) => (
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-gradient-primary text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
          >
            {m.user?.firstName?.[0] || 'U'}
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
              {m.user?.firstName} {m.user?.lastName}
            </div>
            <div className="text-muted" style={{ fontSize: '0.73rem' }}>@{m.user?.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'user.email',
      label: 'Email',
      render: (m) => <span className="text-muted small">{m.user?.email}</span>,
    },
    {
      key: 'projectRole',
      label: 'Role',
      render: (m) => (
        <span className={`badge border rounded-pill px-2 py-1 text-uppercase fw-semibold ${getRoleBadgeClass(m.projectRole)}`} style={{ fontSize: '0.65rem' }}>
          {m.projectRole}
        </span>
      ),
    },
    {
      key: 'lead.firstName',
      label: 'Team Lead',
      render: (m) => (
        m.lead ? (
          <span className="text-secondary small fw-semibold">
            {m.lead.firstName} {m.lead.lastName} (@{m.lead.username})
          </span>
        ) : (
          <span className="text-muted small italic">None</span>
        )
      ),
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      render: (m) => <span className="text-muted small">{formatDateDDMMYYYY(m.joinedAt)}</span>,
    },
    ...(isAdminOrPm ? [{
      key: 'actions',
      label: 'Actions',
      noExport: true,
      render: (m: ProjectMember) => (
        m.user?.id !== currentUser?.id ? (
          <button
            onClick={() => handleRemoveMember(m)}
            className="btn btn-sm btn-light text-danger border-0 p-1 px-2 rounded-2 d-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem' }}
          >
            <Trash2 style={{ width: '13px', height: '13px' }} />
            <span>Remove</span>
          </button>
        ) : <span className="text-muted small">You</span>
      ),
    }] : []),
  ];

  const addMemberBtn = isAdminOrPm ? (
    <button
      onClick={() => setIsAddModalOpen(true)}
      className="btn btn-primary bg-gradient-primary border-0 rounded-3 d-flex align-items-center gap-2 px-4 py-2 fw-semibold shadow-sm"
      style={{ fontSize: '0.85rem' }}
    >
      <UserPlus style={{ width: '16px', height: '16px' }} />
      <span>Add Member</span>
    </button>
  ) : undefined;
  const projectLeads = members.filter(
    (m) => m.projectRole?.toUpperCase() === 'PROJECT_LEAD' || m.projectRole?.toUpperCase() === 'ROLE_PROJECT_LEAD'
  );
  const filteredUsers = allUsers.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || username.includes(search) || email.includes(search);
  });
  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1200px' }}>
      {/* Top Header Card */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold mb-0 text-dark">Project Members &amp; Team</h1>
              <span className="badge badge-subtle-primary rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                {members.length} Active Members
              </span>
            </div>
            <p className="small text-muted mb-0">
              Manage project-level access control, roles, and assigned engineering team members.
            </p>
          </div>

          {/* View toggle + Add button */}
          <div className="d-flex align-items-center gap-2">
            {/* Grid / Table view toggle */}
            <div className="btn-group btn-group-sm" role="group" aria-label="View mode">
              <button
                type="button"
                className={`btn border rounded-start-3 d-flex align-items-center gap-1 px-3 ${
                  viewMode === 'grid' ? 'btn-primary bg-gradient-primary text-white border-primary' : 'btn-light text-muted'
                }`}
                onClick={() => setViewMode('grid')}
                title="Card view"
                style={{ fontSize: '0.80rem' }}
              >
                <LayoutGrid style={{ width: '14px', height: '14px' }} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                className={`btn border rounded-end-3 d-flex align-items-center gap-1 px-3 ${
                  viewMode === 'table' ? 'btn-primary bg-gradient-primary text-white border-primary' : 'btn-light text-muted'
                }`}
                onClick={() => setViewMode('table')}
                title="Table view"
                style={{ fontSize: '0.80rem' }}
              >
                <Table2 style={{ width: '14px', height: '14px' }} />
                <span>Table</span>
              </button>
            </div>

            {isAdminOrPm && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary bg-gradient-primary border-0 rounded-3 d-flex align-items-center gap-2 px-4 py-2 fw-semibold shadow-sm text-sm"
              >
                <UserPlus style={{ width: '18px', height: '18px' }} />
                <span>Add Team Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Grid / Table View */}
      {loading ? (
        <LoadingSpinner message="Loading project members..." />
      ) : members.length === 0 ? (
        <div className="card card-glass p-5 rounded-4 text-center border-0 shadow-sm">
          <Users className="text-muted mb-3 mx-auto" style={{ width: '48px', height: '48px', opacity: 0.5 }} />
          <h5 className="fw-bold text-dark mb-1">No Members Assigned</h5>
          <p className="text-muted small mb-3">Add team members to collaborate on tasks and Kanban sprints.</p>
          {isAdminOrPm && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-sm btn-primary bg-gradient-primary border-0 px-4 rounded-3"
            >
              Assign First Member
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ── Table view via GlobalDataTable ── */
        <GlobalDataTable<ProjectMember>
          id="members-data-table"
          title="Project Members"
          columns={memberColumns}
          data={members}
          exportFileName="project_members"
          actions={addMemberBtn}
        />
      ) : (
        <div className="row g-3">
          {members.map((m) => (
            <div key={m.id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle bg-gradient-primary text-white fw-bold d-flex align-items-center justify-center shadow-xs"
                      style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}
                    >
                      {m.user?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">
                        {m.user?.firstName} {m.user?.lastName}
                      </h6>
                      <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                        @{m.user?.username}
                      </span>
                    </div>
                  </div>

                  <span className={`badge border rounded-pill px-2.5 py-1 text-uppercase fw-semibold ${getRoleBadgeClass(m.projectRole)}`} style={{ fontSize: '0.65rem' }}>
                    {m.projectRole}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 small text-muted border-top pt-3" style={{ fontSize: '0.8rem' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Mail className="text-secondary" style={{ width: '14px', height: '14px' }} />
                    <span className="text-truncate">{m.user?.email}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar className="text-secondary" style={{ width: '14px', height: '14px' }} />
                    <span>Joined: {formatDateDDMMYYYY(m.joinedAt)}</span>
                  </div>
                  {m.lead && (
                    <div className="d-flex align-items-center gap-2">
                      <User className="text-secondary" style={{ width: '14px', height: '14px' }} />
                      <span>Lead: <span className="fw-semibold text-dark">{m.lead.firstName} {m.lead.lastName}</span></span>
                    </div>
                  )}
                </div>

                {isAdminOrPm && m.user?.id !== currentUser?.id && (
                  <div className="pt-3 mt-2 border-top d-flex justify-content-end">
                    <button
                      onClick={() => handleRemoveMember(m)}
                      className="btn btn-sm btn-light text-danger border-0 p-1 px-2 rounded-2 d-flex align-items-center gap-1"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Assign Project Member</h5>
                <button onClick={() => setIsAddModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small d-flex justify-content-between align-items-center" style={{ fontSize: '0.7rem' }}>
                    <span>Select Registered Users / Developers</span>
                    {selectedUserIds.length > 0 && (
                      <span className="badge bg-primary rounded-pill">
                        {selectedUserIds.length} selected
                      </span>
                    )}
                  </label>

                  {/* Search filter input */}
                  <div className="input-group input-group-sm mb-2">
                    <input
                      type="text"
                      className="form-control bg-light border-end-0 shadow-none text-xs"
                      placeholder="Search users by name, username, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0"
                        onClick={() => setSearchTerm('')}
                        style={{ fontSize: '0.7rem' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div 
                    className="border rounded bg-light overflow-auto p-2" 
                    style={{ maxHeight: '160px' }}
                  >
                    {filteredUsers.length === 0 ? (
                      <div className="text-center text-muted small py-3">No users found matching search</div>
                    ) : (
                      filteredUsers.map((u) => {
                        const uid = String(u.id);
                        const isChecked = selectedUserIds.includes(uid);
                        return (
                          <div key={u.id} className="form-check py-1 border-bottom border-light d-flex align-items-center">
                            <input
                              className="form-check-input flex-shrink-0 cursor-pointer me-2"
                              type="checkbox"
                              id={`user-check-${u.id}`}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds(prev => [...prev, uid]);
                                } else {
                                  setSelectedUserIds(prev => prev.filter(id => id !== uid));
                                }
                              }}
                            />
                            <label className="form-check-label text-xs cursor-pointer w-100 mb-0" htmlFor={`user-check-${u.id}`}>
                              <span className="fw-semibold text-dark">{u.firstName} {u.lastName}</span>{' '}
                              <span className="text-muted">(@{u.username})</span>
                              <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '-2px' }}>{u.email}</div>
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                    Project Role
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Shield style={{ width: '16px', height: '16px' }} />
                    </span>
                    <select
                      value={selectedRoleCode}
                      onChange={(e) => {
                        setSelectedRoleCode(e.target.value);
                        if (e.target.value !== 'DEVELOPER') {
                          setSelectedLeadId('');
                        }
                      }}
                      className="form-select bg-light rounded-end-3 shadow-none text-sm border-start-0"
                    >
                      <option value="DEVELOPER">Developer (Task execution access)</option>
                      <option value="PROJECT_LEAD">Project Lead (Task management & delegation)</option>
                      {(currentUser?.roles?.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN')) && (
                        <>
                          <option value="PROJECT_MANAGER">Project Manager (Full sprint control)</option>
                          <option value="ADMIN">Administrator (Full workspace access)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {selectedRoleCode === 'DEVELOPER' && (
                  <div className="mb-4">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                      Assign to Team Lead / Project Lead (Optional)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <User style={{ width: '16px', height: '16px' }} />
                      </span>
                      <select
                        value={selectedLeadId}
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                        className="form-select bg-light rounded-end-3 shadow-none text-sm border-start-0"
                      >
                        <option value="">No Lead (Direct Assignment)</option>
                        {projectLeads.map((m) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.firstName} {m.user.lastName} (@{m.user.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
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
                    <span>{submitting ? 'Assigning...' : 'Assign Member'}</span>
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
