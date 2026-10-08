import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const getTitleFromPath = (pathname) => {
  if (pathname.includes('/patients')) return 'Patient Management';
  if (pathname.includes('/doctors')) return 'Doctor Directory';
  if (pathname.includes('/mappings')) return 'Patient-Doctor Assignments';
  return 'Clinical Dashboard';
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={pageTitle}
        />
        <main className="main-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
