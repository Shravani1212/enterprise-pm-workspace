import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { ApiResponse, AuthResponse } from '../types';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Moon,
  FolderKanban,
  Clock,
  ShieldCheck,
  Code2,
  Shield,
  BarChart3,
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  };

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
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the Captcha verification.');
      showErrorAlert('Verification Required', 'Please complete the Captcha to sign in.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        usernameOrEmail,
        password,
        captchaToken,
      });
      if (res.data.success && res.data.data) {
        login(res.data.data);
        showSuccessAlert(`Welcome to ${themeConfig.portalName}!`, `Signed in as ${res.data.data.user.username}`);

        const roles = res.data.data.user.roles || [];
        const hasHigherRole = roles.some(r =>
          r === 'ADMIN' || r === 'ROLE_ADMIN' ||
          r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER' ||
          r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD'
        );

        if (!hasHigherRole && roles.some(r => r === 'DEVELOPER' || r === 'ROLE_DEVELOPER')) {
          navigate('/projects');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      showErrorAlert('Authentication Error', msg);
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container min-vh-100 d-flex flex-column flex-lg-row position-relative" style={{ overflowX: 'hidden' }}>

      {/* ── Left content area (Header, Hero contents, Stats card, Footer) ── */}
      <div className="d-flex flex-column flex-grow-1 justify-content-between position-relative z-2" style={{ minWidth: 0 }}>

        {/* Background animated gradient blobs */}
        {/* Top-left blob */}
        <div
          className="position-absolute rounded-circle pointer-events-none animate-float-slow"
          style={{
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, ${themeConfig.meshColor1} 0%, ${themeConfig.meshColor2} 50%, transparent 70%)`,
            top: '-180px',
            left: '-160px',
            filter: 'blur(80px)',
            opacity: 0.35,
            zIndex: 0,
          }}
        />

        {/* Bottom-right blob */}
        <div
          className="position-absolute rounded-circle pointer-events-none animate-float-slow"
          style={{
            width: '500px',
            height: '500px',
            background: `radial-gradient(circle, ${themeConfig.meshColor2} 0%, ${themeConfig.meshColor1} 60%, transparent 80%)`,
            bottom: '-120px',
            right: '-100px',
            filter: 'blur(80px)',
            opacity: 0.25,
            animationDelay: '3s',
            zIndex: 0,
          }}
        />

        {/* Top Header Navbar */}
        <header className="px-4 px-lg-5 py-1 position-relative z-2">
          <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <img
                src="/assets/logo.png"
                alt="ProjectPulse Logo"
                style={{ height: '90px', objectFit: 'contain' }}
                className="hover-scale transition-all"
              />
              <div className="d-flex flex-column justify-content-center" style={{ gap: '1px' }}>
                <span className="fw-bold lh-1 d-flex align-items-center" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
                  <span className="text-dark">Project&nbsp;</span>
                  <span className="text-gradient-hero">Pulse</span>

                  <svg
                    viewBox="0 0 160 50"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '120px', height: '36px', marginLeft: '10px', overflow: 'visible' }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
                        <stop offset="40%" stopColor="#7c3aed" />
                        <stop offset="70%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#db2777" stopOpacity="0.7" />
                      </linearGradient>
                      <filter id="ecgGlow" x="-20%" y="-80%" width="140%" height="260%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      d="M 0,25 L 40,25 L 50,20 L 55,25 L 65,5 L 72,42 L 80,25 L 95,30 L 105,25 L 160,25"
                      fill="none"
                      stroke="url(#pulseGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#ecgGlow)"
                    />
                  </svg>
                </span>
                <span className="text-gradient-hero fw-bold" style={{ fontSize: '1.0rem', letterSpacing: '0.04em', marginTop: '3px' }}>
                  {themeConfig.tagline}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="container-fluid px-4 px-lg-5 py-2 position-relative z-2 flex-grow-1">
          <div className="row g-3 w-100 mx-0">
            <div className="col-12 d-flex flex-column justify-content-start pe-lg-3 animate-slide-up">

              {/* Promo Video */}
              <div
                className="rounded-4 overflow-hidden position-relative mb-3"
                style={{
                  minHeight: '200px',
                  boxShadow: '0 20px 50px -10px rgba(79,70,229,0.45)',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                <video
                  src="/assets/promo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', minHeight: '200px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLVideoElement).style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    minHeight: '200px',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #6b21a8 100%)',
                  }}
                  className="align-items-center justify-content-center flex-column gap-2 text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ width: '44px', height: '44px', opacity: 0.45 }}>
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
                  </svg>
                  <span className="small fw-semibold" style={{ opacity: 0.55 }}>Place assets/promo.mp4 in /public/assets</span>
                </div>
              </div>


              <div className="mb-2">
                <div className={`badge rounded-pill px-3 py-2 fw-semibold mb-2 d-inline-flex align-items-center gap-2 shadow-xs border ${themeConfig.badgeBg}`}>
                  <span className="badge-glowing-dot"></span>
                  <span>{themeConfig.badgeText}</span>
                </div>

                <p className="mb-3 fw-semibold" style={{ maxWidth: '540px', fontSize: '1.02rem', lineHeight: '1.55', color: '#4b5563' }}>
                  {themeConfig.accentText}
                </p>

                <div className="d-flex align-items-center gap-3 mb-2 d-lg-none">
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

              {/* Stats Preview Card */}
              <div
                className="card rounded-4 border-0 p-4 overflow-hidden position-relative mt-3"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #6b21a8 100%)',
                  boxShadow: '0 20px 50px -10px rgba(79,70,229,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle bg-danger" style={{ width: '10px', height: '10px', display: 'inline-block' }}></span>
                    <span className="rounded-circle bg-warning" style={{ width: '10px', height: '10px', display: 'inline-block' }}></span>
                    <span className="rounded-circle bg-success" style={{ width: '10px', height: '10px', display: 'inline-block' }}></span>
                  </div>
                  <div className="badge rounded-pill px-3 d-flex align-items-center gap-2 border border-white border-opacity-25 bg-white bg-opacity-10 text-white" style={{ fontSize: '0.75rem' }}>
                    <themeConfig.heroIcon style={{ width: '15px', height: '15px' }} />
                    <span className="fw-semibold">{themeConfig.heroGraphicBadge}</span>
                  </div>
                </div>
                <div className="row g-3 align-items-center">
                  <div className="col-4">
                    <div className="p-3 rounded-3 d-flex align-items-center gap-3 card-hover-lift" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <div className="rounded-3 p-2 text-white" style={{ background: 'rgba(99,102,241,0.8)' }}>
                        <FolderKanban style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div>
                        <div className="fw-bold small mb-0 text-white">Projects</div>
                        <span className="fw-semibold" style={{ fontSize: '0.68rem', color: '#86efac' }}>Active Workspace</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 d-flex align-items-center gap-3 card-hover-lift" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <div className="rounded-3 p-2 text-dark" style={{ background: 'rgba(251,191,36,0.9)' }}>
                        <Clock style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div>
                        <div className="fw-bold small mb-0 text-white">Sprints</div>
                        <span className="fw-semibold" style={{ fontSize: '0.68rem', color: '#fde68a' }}>In Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 d-flex align-items-center gap-3 card-hover-lift" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <div className="rounded-3 p-2 text-white" style={{ background: 'rgba(34,197,94,0.85)' }}>
                        <ShieldCheck style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div>
                        <div className="fw-bold small mb-0 text-white">RBAC</div>
                        <span className="fw-semibold" style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>Role Mapped</span>
                      </div>
                    </div>
                  </div>
                </div>
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

      <div
        className="d-flex flex-column justify-content-between p-4"
        style={{
          width: '100%',
          maxWidth: '460px',
          minHeight: '100vh',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '-8px 0 40px -10px rgba(99,102,241,0.18)',
        }}
      >
        {/* Login Card */}
        <div className="w-100 animate-slide-up mt-2" style={{ animationDelay: '0.15s' }}>
          <div className="card glass-login-card border-0 rounded-4 p-4 w-100 shadow-2xl">

            {/* Theme Toggle - moved to top */}
            <div className="w-100 mb-3 d-flex align-items-center justify-content-end">
              <button
                onClick={toggleTheme}
                className="btn btn-sm rounded-3 p-2 d-flex align-items-center gap-2 border-0 text-muted hover-scale transition-all"
                style={{ background: 'rgba(99,102,241,0.08)', fontSize: '0.78rem' }}
                title="Toggle Theme"
              >
                <Moon style={{ width: '16px', height: '16px' }} />
                <span className="fw-semibold">Toggle Theme</span>
              </button>
            </div>

            {/* Role Selection Tabs */}
            <div className="mb-4">
              <div className="text-uppercase text-muted fw-bold mb-2 text-center" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                Select Login Role
              </div>
              <div className="d-flex align-items-center gap-1 p-1 bg-white bg-opacity-75 rounded-3 border shadow-xs">
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('DEVELOPER')}
                  className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${activePortal === 'DEVELOPER'
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
                  className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${activePortal === 'ADMIN'
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
                  className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 text-xs transition-all d-flex align-items-center justify-content-center gap-1.5 ${activePortal === 'PROJECT_MANAGER'
                    ? 'bg-success text-white shadow-xs'
                    : 'text-muted hover-bg-light hover-text-dark'
                    }`}
                >
                  <BarChart3 style={{ width: '14px', height: '14px' }} />
                  <span>Project Mgr</span>
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <div
                className="rounded-circle text-white d-inline-flex align-items-center justify-center p-3 shadow-md mb-3 hover-scale transition-all"
                style={{ width: '58px', height: '50px', background: themeConfig.btnGradient }}
              >
                <themeConfig.heroIcon style={{ width: '28px', height: '28px' }} />
              </div>
              <h2 className="h5 fw-bold text-dark mb-1">{themeConfig.portalName}</h2>
            </div>


            {error && (
              <div className="alert alert-danger rounded-3 p-3 small mb-4 fw-semibold border-danger border-opacity-25 animate-shake" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-uppercase fw-bold text-muted small mb-1" style={{ fontSize: '0.7rem' }}>
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

              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
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
                    {showPassword ? <Eye style={{ width: '18px', height: '18px' }} /> : <EyeOff style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              {/* <div className="form-check">
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
              </div> */}

              <div className="d-flex justify-content-center my-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="import.meta.env.VITE_RECAPTCHA_SITE_KEY"
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => {
                    setCaptchaToken(null);
                  }}
                  onErrored={() => {
                    setCaptchaToken(null);
                    recaptchaRef.current?.reset();
                  }}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn border-0 btn-lg rounded-3 fw-semibold text-sm shadow-md d-flex align-items-center justify-center gap-2 py-3 text-white transition-all hover-scale"
                style={{ background: themeConfig.btnGradient }}
              >
                <span>{loading ? 'Signing in...' : `Sign In (${activePortal})`}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </form>
          </div>
        </div>


      </div>

    </div>
  );
};
