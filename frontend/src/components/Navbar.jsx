import React from 'react';
import { getCurrentUser } from '../api/auth';

const Navbar = ({ onToggleSidebar, pageTitle = 'Healthcare Management' }) => {
  const user = getCurrentUser();
  const userName = user?.name || 'Darshan';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="navbar-title-container">
          <h1 className="navbar-title">{pageTitle}</h1>
          <span className="navbar-subtitle">MediCare Portal &bull; Enterprise EHR</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="system-status-indicator" title="Connected to Django REST API">
          <span className="status-pulse-dot" />
          <span className="status-label">API Online</span>
        </div>

        <div className="navbar-user-chip">
          <div className="navbar-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="navbar-user-text">
            <span className="navbar-user-name">{userName}</span>
            <span className="navbar-user-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
