import React from 'react';
import { ShieldCheck, GitBranch, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md px-8 py-4 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side: System Version & Health Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Enterprise PM System v1.0.0</span>
          </div>

          <span className="hidden sm:inline text-slate-300">|</span>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Gateway (/api/v1) Healthy</span>
          </div>
        </div>

        {/* Right Side: Quick Links & Environment */}
        <div className="flex items-center gap-5 font-medium">
          <div className="flex items-center gap-1 text-slate-400">
            <GitBranch className="h-3.5 w-3.5" />
            <span>main (Java 21 / React 18)</span>
          </div>

          <a
            href="/api/v1/actuator/health"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <span>Actuator</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
