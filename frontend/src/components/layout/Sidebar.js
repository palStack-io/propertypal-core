import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, closeSidebar, currentProperty, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current &&
          !sidebarRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-btn')) {
        closeSidebar();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSidebar]);

  const isActive = (path) => location.pathname === path;

  const handleSignout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentPropertyId');
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user && user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return 'U';
  };

  return (
    <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #38bdf8, #3b82f6)' }}
          >
            {getUserInitials()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {user ? `${user.first_name} ${user.last_name}` : 'User'}
            </p>
            {user?.email && (
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-nav">

          {/* Property context */}
          <div className="px-4 mb-5 mt-4">
            <span className="sidebar-section-label">My Home</span>
            {currentProperty && (
              <p className="text-xs mt-1" style={{ color: 'var(--brand-primary)' }} id="current-property-address">
                {currentProperty.address}
              </p>
            )}
          </div>

          {/* Dashboard */}
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </Link>

          {/* Property Management Section */}
          <div className="px-4 mt-5 mb-2">
            <span className="sidebar-section-label">Property Management</span>
          </div>

          <Link to="/documents" className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Documents</span>
          </Link>

          <Link to="/maintenance" className={`sidebar-link ${isActive('/maintenance') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span>Maintenance</span>
          </Link>

          <Link to="/appliances" className={`sidebar-link ${isActive('/appliances') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Appliances</span>
          </Link>

          <Link to="/projects" className={`sidebar-link ${isActive('/projects') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Projects</span>
          </Link>

          {/* Finance Section */}
          <div className="px-4 mt-5 mb-2">
            <span className="sidebar-section-label">Finance</span>
          </div>

          <Link to="/expenses" className={`sidebar-link ${isActive('/expenses') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Expenses</span>
          </Link>

          <Link to="/budget" className={`sidebar-link ${isActive('/budget') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Budget</span>
          </Link>

          <Link to="/reports" className={`sidebar-link ${isActive('/reports') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Reports</span>
          </Link>

          {/* Settings Section */}
          <div className="px-4 mt-5 mb-2">
            <span className="sidebar-section-label">Settings</span>
          </div>

          <Link to="/settings" className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </Link>

          <button className="sidebar-link" onClick={handleSignout}>
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>

          {/* palStack Ecosystem */}
          <div className="px-4 mt-6 mb-2">
            <span className="sidebar-section-label">palStack Ecosystem</span>
          </div>

          <div className="sidebar-link opacity-50 cursor-not-allowed">
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fbbf24' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span><span style={{ color: '#fbbf24' }}>car</span>Pal</span>
            <span className="badge badge-neutral ml-auto">Soon</span>
          </div>

          <div className="sidebar-link opacity-50 cursor-not-allowed">
            <svg className="sidebar-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fb7185' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span><span style={{ color: '#fb7185' }}>pet</span>Pal</span>
            <span className="badge badge-neutral ml-auto">Soon</span>
          </div>

      </div>

      {/* PropertyPal brand at bottom */}
      <div className="sidebar-brand">
        <Link to="/dashboard" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <img src="/propertyPal.png" alt="propertyPal Logo" className="h-7 w-7" />
          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontSize: '1rem',
            lineHeight: 1,
          }}>
            <span className="property-text">property</span>
            <span style={{ color: 'var(--text-primary)' }}>Pal</span>
          </span>
        </Link>
      </div>

    </aside>
  );
};

export default Sidebar;
