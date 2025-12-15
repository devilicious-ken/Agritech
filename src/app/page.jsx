'use client';

import React, { useState, useEffect } from 'react';
import LoginPage from '@/components/LogInPage';
import Sidebar from '@/components/SideBar';
import TopNavigation from '@/components/TopNavigation';
import Content from '@/components/Content';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome
import Footer from '@/components/Footer';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@agritech.gov');
  const [password, setPassword] = useState('password');
  const [loginError, setLoginError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [date, setDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      // safe to use window here
      console.log(window.innerWidth);
    }
  }, []);
  


  // removed global clock; TopNavigation manages its own time to avoid rerenders

  useEffect(() => {
    if (isLoggedIn && currentPage === 'dashboard') {
      setTimeout(() => {
        initCharts();
      }, 100);
    }
  }, [isLoggedIn, currentPage]);

  

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@agritech.gov' && password === 'password') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (!isLoggedIn) {
    return <LoginPage 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loginError={loginError}
      handleLogin={handleLogin}
    />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="flex h-screen overflow-hidden">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={closeSidebar}
          />
        )}
        <Sidebar 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          handleLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          onCollapse={setIsSidebarCollapsed}   // 🔥 get collapse state
        />

        <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          toggleSidebar={toggleSidebar}
          currentPage={currentPage}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          date={date}
          setDate={setDate}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadNotifications={unreadNotifications}
          handleLogout={handleLogout}
          setCurrentPage={setCurrentPage}  // Add this line
        />
          <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#121212] transition-all duration-300
    ${isSidebarCollapsed ? "ml-1" : ""}`}>
            <Content 
              currentPage={currentPage}
              isSidebarCollapsed={isSidebarCollapsed}
            />
            <Footer/>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;