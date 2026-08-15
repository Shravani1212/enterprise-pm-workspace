import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading ProjectPulse...',
  fullscreen = false,
}) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className="position-relative mb-3" style={{ width: '80px', height: '80px' }}>
        {/* Outer glowing pulsating ring */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-primary border-3 opacity-25 animate-ping"
          style={{ animationDuration: '2s' }}
        ></div>
        {/* Logo container pulsating scale heartbeat */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-circle bg-white shadow-md p-2 logo-pulse-anim"
        >
          <img
            src="/assets/logo.png"
            alt="Loading Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
      <div className="fw-semibold text-secondary text-sm tracking-wide animate-pulse mt-2">
        {message}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3 animate-fade-in"
        style={{ backdropFilter: 'blur(4px)', zIndex: 9999 }}
      >
        {content}
      </div>
    );
  }

  return content;
};
