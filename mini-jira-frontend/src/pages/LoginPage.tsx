import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { ApiResponse, AuthResponse } from '../types';
import { 
  Layers, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  PlayCircle, 
  Moon,
  FolderKanban,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  UserCheck,
  Code2,
  Sparkles,
  Shield,
  BarChart3,
  Terminal
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

type RolePortalType = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export const LoginPage: React.FC = () => {
  // Theme Role Switcher State
  const [activePortal, setActivePortal] = useState<RolePortalType>('ADMIN');

  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Dynamic Theme Colors based on Role Portal using Lucide Icon Components
  const getThemeDetails = () => {
    switch (activePortal) {
      case 'ADMIN':
        return {
          portalName: 'Admin Portal',
          badgeText: 'ADMIN ACCESS',
          badgeBg: 'bg-purple bg-opacity-10 text-purple border-purple border-opacity-25',
          btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)',
          btnGlow: 'rgba(124, 58, 237, 0.45)',
          meshColor1: 'rgba(124, 58, 237, 0.35)',
          meshColor2: 'rgba(168, 85, 247, 0.2)',
          accentText: 'System administration, RBAC security, and service management control',
          presetUsername: 'admin',
          heroGraphicBadge: 'System Administrator Level',
          heroIcon: ShieldCheck,
          tagline: 'SECURE • ADMINISTER • CONTROL'
        };
      case 'PROJECT_MANAGER':
        return {
          portalName: 'Project Manager Portal',
          badgeText: 'PROJECT MANAGER ACCESS',
          badgeBg: 'bg-success bg-opacity-10 text-success border-success border-opacity-25',
          btnGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)',
          btnGlow: 'rgba(16, 185, 129, 0.45)',
          meshColor1: 'rgba(16, 185, 129, 0.35)',
          meshColor2: 'rgba(5, 150, 105, 0.2)',
          accentText: 'Manage projects, sprints, team members, and delivery milestones',
          presetUsername: 'pm_user',
          heroGraphicBadge: 'Sprint Leadership Level',
          heroIcon: BarChart3,
          tagline: 'MANAGE • PLAN • DELIVER'
        };
      case 'DEVELOPER':
      default:
        return {
          portalName: 'Developer Portal',
          badgeText: 'DEVELOPER ACCESS',
          badgeBg: 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25',
          btnGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
          btnGlow: 'rgba(59, 130, 246, 0.45)',
          meshColor1: 'rgba(59, 130, 246, 0.35)',
          meshColor2: 'rgba(37, 99, 235, 0.2)',
          accentText: 'Focus on your assigned tasks, code execution, and sprint deliverables',
          presetUsername: 'dev_user',
          heroGraphicBadge: 'Engineering & Execution Level',
          heroIcon: Code2,
          tagline: 'CODE • COLLABORATE • DELIVER'
        };
    }
  };

  const themeConfig = getThemeDetails();

  const handlePortalSwitch = (role: RolePortalType) => {
    setActivePortal(role);
    if (role === 'ADMIN') {
      setUsernameOrEmail('admin');
    } else if (role === 'PROJECT_MANAGER') {
      setUsernameOrEmail('pm_user');
    } else {
      setUsernameOrEmail('dev_user');
    }
    setPassword('Password123!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        usernameOrEmail,
        password,
      });
      if (res.data.success && res.data.data) {
        login(res.data.data);
        showSuccessAlert(`Welcome to ${themeConfig.portalName}!`, `Signed in as ${res.data.data.user.username}`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      showErrorAlert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container min-vh-100 d-flex flex-column justify-content-between position-relative">
      
      {/* Background Floating Animated Gradient Mesh Orbs dynamically matching theme */}
      <div 
        className="position-absolute rounded-circle animate-float-slow opacity-30 pointer-events-none transition-all"
        style={{
          width: '650px',
          height: '650px',
          background: `radial-gradient(circle, ${themeConfig.meshColor1} 0%, ${themeConfig.meshColor2} 50%, rgba(255,255,255,0) 70%)`,
          top: '-150px',
          left: '-130px',
          filter: 'blur(70px)',
          zIndex: 0
        }}
      />

      {/* Top Header Navbar */}
      <header className="px-4 px-lg-5 py-3 position-relative z-2">
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
          
          {/* Brand Logo */}
          <div className="d-flex align-items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div 
              className="rounded-3 d-flex align-items-center justify-center text-white shadow-md p-2 hover-scale transition-all" 
              style={{ width: '42px', height: '42px', background: themeConfig.btnGradient }}
            >
              <Layers style={{ width: '24px', height: '24px' }} />
            </div>
            <span className="h4 fw-bold mb-0 text-dark tracking-tight">ProjectPulse</span>
          </div>



          {/* Theme Toggle Button */}
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={toggleTheme}
              className="btn btn-sm btn-light rounded-3 p-2 text-muted border-0 d-flex align-items-center justify-center shadow-xs hover-scale"
              title="Toggle Theme"
            >
              <Moon style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Content Section */}
      <main className="container-fluid px-4 px-lg-5 py-4 position-relative z-2 flex-grow-1 d-flex align-items-center">
        <div className="row g-5 align-items-center w-100 mx-0">
          
          {/* Left Hero Section */}
          <div className="col-12 col-lg-7 d-flex flex-column justify-content-center pe-lg-5 animate-slide-up">
            <div className="mb-4">
              <div className={`badge rounded-pill px-3 py-2 fw-semibold mb-3 d-inline-flex align-items-center gap-2 shadow-xs border ${themeConfig.badgeBg}`}>
                <span className="badge-glowing-dot"></span>
                <span>{themeConfig.badgeText}</span>
              </div>

              <h1 className="display-4 fw-bold text-dark lh-sm mb-3">
                {themeConfig.portalName} <br />
                <span className="text-gradient-hero">{themeConfig.tagline}</span>
              </h1>
              <p className="lead text-muted mb-4" style={{ maxWidth: '540px', fontSize: '1.08rem', lineHeight: '1.6' }}>
                {themeConfig.accentText}
              </p>

              <div className="d-flex align-items-center gap-3 mb-4">
                <button 
                  onClick={handleSubmit}
                  className="btn border-0 btn-lg rounded-3 px-4 py-3 fw-semibold text-sm text-white shadow-md d-flex align-items-center gap-2 transition-all hover-scale"
                  style={{ background: themeConfig.btnGradient }}
                >
                  <span>Sign In as {activePortal}</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Role Dynamic Visual Graphic Canvas with Vector Icon Badges */}
            <div className="card hero-preview-card rounded-4 border-0 p-4 overflow-hidden position-relative" style={{ minHeight: '220px' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="rounded-circle bg-primary p-1"></span>
                  <span className="rounded-circle bg-success p-1"></span>
                  <span className="rounded-circle bg-warning p-1"></span>
                </div>
                <div className={`badge rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 border ${themeConfig.badgeBg}`} style={{ fontSize: '0.75rem' }}>
                  <themeConfig.heroIcon style={{ width: '15px', height: '15px' }} />
                  <span className="fw-semibold">{themeConfig.heroGraphicBadge}</span>
                </div>
              </div>

              {/* Stat Pill Chips */}
              <div className="row g-3 align-items-center mb-3">
                <div className="col-4">
                  <div className="p-3 rounded-3 bg-white border d-flex align-items-center gap-3 shadow-xs card-hover-lift">
                    <div className="rounded-3 p-2.5 text-white" style={{ background: themeConfig.btnGradient }}>
                      <FolderKanban style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small mb-0">Projects</div>
                      <span className="text-success fw-semibold" style={{ fontSize: '0.7rem' }}>Active Workspace</span>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-3 rounded-3 bg-white border d-flex align-items-center gap-3 shadow-xs card-hover-lift">
                    <div className="rounded-3 bg-warning text-dark p-2.5">
                      <Clock style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small mb-0">Sprints</div>
                      <span className="text-warning fw-semibold" style={{ fontSize: '0.7rem' }}>In Progress</span>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-3 rounded-3 bg-white border d-flex align-items-center gap-3 shadow-xs card-hover-lift">
                    <div className="rounded-3 bg-success text-white p-2.5">
                      <ShieldCheck style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small mb-0">RBAC Services</div>
                      <span className="text-info fw-semibold" style={{ fontSize: '0.7rem' }}>Role Mapped</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Role-Specific Login Card */}
          <div className="col-12 col-lg-5 d-flex justify-content-center justify-content-lg-end animate-slide-up">
            <div className="card glass-login-card border-0 rounded-4 p-4 p-sm-5 w-100 shadow-2xl" style={{ maxWidth: '440px' }}>
              
              {/* Role Selection Tabs directly on top of Login Card */}
              <div className="mb-4">
                <div className="text-uppercase text-muted fw-bold mb-2 text-center" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                  Select Login Role
                </div>
                <div className="d-flex align-items-center gap-1 p-1 bg-white bg-opacity-75 rounded-3 border shadow-xs">
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('DEVELOPER')}
                    className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${
                      activePortal === 'DEVELOPER'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover-bg-light hover-text-dark'
                    }`}
                  >
                    <Code2 style={{ width: '14px', height: '14px' }} />
                    <span>Developer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('ADMIN')}
                    className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${
                      activePortal === 'ADMIN'
                        ? 'text-white shadow-xs'
                        : 'text-muted hover-bg-light hover-text-dark'
                    }`}
                    style={activePortal === 'ADMIN' ? { backgroundColor: '#7c3aed' } : {}}
                  >
                    <Shield style={{ width: '14px', height: '14px' }} />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('PROJECT_MANAGER')}
                    className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${
                      activePortal === 'PROJECT_MANAGER'
                        ? 'bg-success text-white shadow-xs'
                        : 'text-muted hover-bg-light hover-text-dark'
                    }`}
                  >
                    <BarChart3 style={{ width: '14px', height: '14px' }} />
                    <span>Project Mgr</span>
                  </button>
                </div>
              </div>
              
              {/* Card Header */}
              <div className="text-center mb-4">
                <div 
                  className="rounded-circle text-white d-inline-flex align-items-center justify-center p-3 shadow-md mb-3 hover-scale transition-all" 
                  style={{ width: '58px', height: '58px', background: themeConfig.btnGradient }}
                >
                  <themeConfig.heroIcon style={{ width: '28px', height: '28px' }} />
                </div>
                <h2 className="h4 fw-bold text-dark mb-1">{themeConfig.portalName}</h2>
                <p className="text-muted small mb-0">Sign in to access your role dashboard</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger rounded-3 p-3 small mb-4 fw-semibold border-danger border-opacity-25 animate-shake" role="alert">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3.5">
                
                {/* Username Input */}
                <div>
                  <label className="form-label text-uppercase fw-bold text-muted small mb-1.5" style={{ fontSize: '0.7rem' }}>
                    Email Address or Username
                  </label>
                  <div className="input-group glass-input-container">
                    <span className="input-group-text bg-transparent border-0 text-muted px-3">
                      <Mail style={{ width: '18px', height: '18px' }} />
                    </span>
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="form-control form-control-lg bg-transparent border-0 shadow-none text-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <label className="form-label text-uppercase fw-bold text-muted small mb-0" style={{ fontSize: '0.7rem' }}>
                      Password
                    </label>
                    <a 
                      href="#forgot" 
                      onClick={(e) => { e.preventDefault(); showSuccessAlert('Password Reset', 'Password reset instructions sent.'); }}
                      className="text-primary text-decoration-none fw-semibold small"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="input-group glass-input-container">
                    <span className="input-group-text bg-transparent border-0 text-muted px-3">
                      <Lock style={{ width: '18px', height: '18px' }} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control form-control-lg bg-transparent border-0 shadow-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn bg-transparent border-0 text-muted px-3 d-flex align-items-center justify-center shadow-none"
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: '18px', height: '18px' }} />
                      ) : (
                        <Eye style={{ width: '18px', height: '18px' }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="d-flex align-items-center justify-content-between py-1">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="form-check-input shadow-none cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="form-check-label text-muted small cursor-pointer">
                      Remember me for 30 days
                    </label>
                  </div>
                </div>

                {/* Submit Button matching role theme */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn border-0 btn-lg rounded-3 fw-semibold text-sm shadow-md d-flex align-items-center justify-center gap-2 mt-1 py-3 text-white transition-all hover-scale"
                  style={{ background: themeConfig.btnGradient }}
                >
                  <span>{loading ? 'Signing in...' : `Sign In (${activePortal})`}</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>

              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 px-lg-5 py-3 position-relative z-2 text-center text-muted small">
        <div className="container-fluid p-0 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2" style={{ fontSize: '0.78rem' }}>
          <div>© 2026 ProjectPulse Platform. All rights reserved.</div>
          <div className="d-flex align-items-center gap-3">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-muted text-decoration-none hover-text-primary">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="text-muted text-decoration-none hover-text-primary">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
