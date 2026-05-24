import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const setThemeValue = (value) => {
    document.documentElement.setAttribute('data-theme', value);
    localStorage.setItem('palstack-theme', value);
    setTheme(value);
  };

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', gap: '0.375rem' }}>
      <button
        onClick={() => setThemeValue('light')}
        title="Light mode"
        style={{
          width: 36, height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: theme === 'light' ? 'rgba(56,189,248,0.15)' : 'var(--bg-card)',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          transition: 'background 0.2s',
        }}
      >☀️</button>
      <button
        onClick={() => setThemeValue('dark')}
        title="Dark mode"
        style={{
          width: 36, height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: theme === 'dark' ? 'rgba(56,189,248,0.15)' : 'var(--bg-card)',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          transition: 'background 0.2s',
        }}
      >🌙</button>
    </div>
  );
};

const Navigation = ({ children, user, property, hideSidebar = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen">
      <ThemeToggle />

      {!hideSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={closeSidebar}
          currentProperty={property}
          user={user}
        />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Navigation;