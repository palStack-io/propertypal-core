import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
