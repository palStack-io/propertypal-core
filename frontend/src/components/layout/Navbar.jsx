import React, { useState, useEffect } from 'react';

const Navbar = () => {
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

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('palstack-theme', next);
    setTheme(next);
  };

  return (
    <nav className="navbar py-3 px-4 md:px-6" style={{ left: '236px' }}>
      <div className="flex justify-end items-center">
        {/* Theme toggle */}
        <div className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <button
            className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
            aria-label="Light mode"
            onClick={e => { e.stopPropagation(); if (theme !== 'light') toggleTheme(); }}
          >
            ☀️
          </button>
          <button
            className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            aria-label="Dark mode"
            onClick={e => { e.stopPropagation(); if (theme !== 'dark') toggleTheme(); }}
          >
            🌙
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
