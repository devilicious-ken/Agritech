"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/SideBar";
import TopNavigation from "@/components/TopNavigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Footer from "@/components/Footer";
import "./globals.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [date, setDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    // Check if user is logged in (only run on client)
    if (typeof window !== "undefined") {
      const loggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);

      if (!loggedIn && pathname !== "/login") {
        router.push("/login");
      } else if (loggedIn && pathname === "/login") {
        router.push("/dashboard");
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const handleNavigation = (page) => {
    router.push(`/${page}`);
  };

  // Get current page from pathname
  const currentPage = pathname === "/" ? "dashboard" : pathname.slice(1);

  // If on login page, render without layout
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
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
              setCurrentPage={handleNavigation}
              handleLogout={handleLogout}
              isOpen={isSidebarOpen}
              onClose={closeSidebar}
              onCollapse={setIsSidebarCollapsed}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              <TopNavigation
                toggleSidebar={toggleSidebar}
                currentPage={currentPage}
                currentTime={currentTime}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                date={date}
                setDate={setDate}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                unreadNotifications={unreadNotifications}
                handleLogout={handleLogout}
                setCurrentPage={handleNavigation}
              />
              <main
                className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#121212] transition-all duration-300
                ${isSidebarCollapsed ? "ml-1" : ""}`}
              >
                {children}
                <Footer />
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
