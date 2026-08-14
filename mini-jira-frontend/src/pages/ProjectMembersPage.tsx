import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus, Shield, Trash2, Mail, Calendar, CheckCircle2, User } from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, ProjectMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

export const ProjectMembersPage: React.FC = () => {
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';
  const { user: currentUser } = useAuth();
  
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState('DEVELOPER');
  const [submitting, setSubmitting] = useState(false);

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
        if (usersRes.data.data.length > 0 && !targetUserId) {
          setTargetUserId(String(usersRes.data.data[0].id));
        }
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
    if (!targetUserId.trim()) {
      showErrorAlert('Missing User', 'Please enter a valid User ID');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<ProjectMember>>(
        `/projects/${activeProjectId}/members`,
        {
          userId: Number(targetUserId),
          roleCode: selectedRoleCode,
        }
      );

      if (res.data.success) {
        showSuccessAlert('Member Added', 'New team member assigned to project successfully.');
        setIsAddModalOpen(false);
        setTargetUserId('');
        fetchMembers();
      }
    } catch (err: any) {
      showErrorAlert('Assignment Failed', err.response?.data?.error?.message || 'Failed to add member to project.');
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
        showErrorAlert('Removal Failed', err.response?.data?.error?.message || 'Failed to remove member.');
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

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1100px' }}>
      {/* Top Header Card */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold mb-0 text-dark">Project Members & Team</h1>
              <span className="badge badge-subtle-primary rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                {members.length} Active Members
              </span>
            </div>
            <p className="small text-muted mb-0">
              Manage project-level access control, roles, and assigned engineering team members.
            </p>
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

      {/* Members Grid / List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading members...</span>
          </div>
        </div>
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
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                    Select Registered Developer / User
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <User style={{ width: '16px', height: '16px' }} />
                    </span>
                    <select
                      required
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="form-select bg-light rounded-end-3 shadow-none text-sm border-start-0"
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} (@{u.username}) - {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                    Project Role
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Shield style={{ width: '16px', height: '16px' }} />
                    </span>
                    <select
                      value={selectedRoleCode}
                      onChange={(e) => setSelectedRoleCode(e.target.value)}
                      className="form-select bg-light rounded-end-3 shadow-none text-sm border-start-0"
                    >
                      <option value="DEVELOPER">Developer (Task execution access)</option>
                      <option value="PROJECT_MANAGER">Project Manager (Full sprint control)</option>
                      <option value="ADMIN">Administrator (Full workspace access)</option>
                    </select>
                  </div>
                </div>

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
