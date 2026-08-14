import React from 'react';
import { ShieldCheck, GitBranch, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-top bg-white px-4 py-3 text-secondary small">
      <div className="container-fluid p-0 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
        {/* Left Side: System Version & Health Status */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 fw-semibold text-dark">
            <ShieldCheck className="text-success" style={{ width: '16px', height: '16px' }} />
            <span>ProjectPulse System v1.0.0</span>
          </div>

          <span className="d-none d-sm-inline text-muted opacity-50">|</span>

          <div className="d-flex align-items-center gap-2 text-muted">
            <span className="bg-success rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }}></span>
            <span>API Gateway (/api/v1) Healthy</span>
          </div>
        </div>

        {/* Right Side: Quick Links & Environment */}
        <div className="d-flex align-items-center gap-4 fw-medium">
          <div className="d-flex align-items-center gap-1.5 text-muted">
            <GitBranch style={{ width: '14px', height: '14px' }} />
            <span>main (Java 21 / React 18)</span>
          </div>

          <a
            href="/api/v1/actuator/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none text-primary d-flex align-items-center gap-1"
          >
            <span>Actuator</span>
            <ExternalLink style={{ width: '12px', height: '12px' }} />
          </a>
        </div>
      </div>
    </footer>
  );
};
