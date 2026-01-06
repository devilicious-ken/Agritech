"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  useNavigate,
  useLocation,
} from "react-router-dom";
import * as echarts from "echarts";
import LoginPage from "@/components/LogInPage";
import Sidebar from "@/components/SideBar";
import TopNavigation from "@/components/TopNavigation";
import ConnectionStatus from "@/components/ConnectionStatus";
import AppRoutes from "./routes/AppRoutes";
import ApiService from "./services/api";
import { supabase } from "./services/api"; // ✅ Add { supabase }
import { Toast } from "@/components/ui/toast";
import "@fortawesome/fontawesome-free/css/all.min.css";


export const ThemeContext = createContext();
// Main App Content Component (inside Router)
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // THEME STATE AND EFFECT (add here)
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [date, setDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toast states for error and success (replacing modals)
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSuspendedToast, setShowSuspendedToast] = useState(false);

  // Only show this after a successful login, not page reload
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Sidebar controls
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname.slice(1);
    return path || "dashboard";
  };

  // Navigation function
  const setCurrentPage = (page) => {
    navigate(`/${page}`);
  };

  // Only load user session without showing notification
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        handleLogout();
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(window.innerWidth);
    }
  }, []);

  // removed global clock to avoid app-wide rerenders; handled in TopNavigation

  // Charts on dashboard only
  useEffect(() => {
    if (isLoggedIn && getCurrentPage() === "dashboard") {
      initCharts();
    }
  }, [isLoggedIn, location.pathname]);

  const initCharts = () => {
    const donutElement = document.getElementById("donutChart");
    const barElement = document.getElementById("barChart");
    const lineElement = document.getElementById("lineChart");
    if (!donutElement || !barElement || !lineElement) return;

    // Donut Chart
    const donutChart = echarts.init(donutElement);
    /* ... chart options as before ... */
    // OMITTED FOR BREVITY
  };

  // Login against Supabase users table (no Supabase Auth)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setShowErrorToast(false);
    setShowSuccessToast(false);
    setShowSuspendedToast(false);

    try {
      // ✅ Get user's IP address
      const ipAddress = await ApiService.getUserIpAddress();

      const { data, error: tableErr } = await ApiService.login(email, password);
      const profile = data?.user;

      if (tableErr || !profile) {
        throw new Error("Invalid email or password");
      }

      // Block login if account is suspended/inactive
      if (profile.is_active === false) {
        const msg =
          "Your account is suspended. Please contact your administrator.";
        setErrorMessage(msg);
        setShowSuspendedToast(true);
        setLoading(false);
        return;
      }

      // ✅ Update last_login timestamp in database
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", profile.id);

      const userData = {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        firstName:profile.first_name || "",
        lastName: profile.last_name || "",
        role: (profile.role || "user").trim(),
        is_active: profile.is_active ?? true,
        avatar_url: profile.avatar_url || "",
        last_login: new Date().toISOString(), // ✅ Update with current time
        created_at: profile.created_at || null,
        source: "supabase_table",
      };

      // ✅ Log the login activity
      await ApiService.createActivityLog(
        userData.id,
        `${userData.first_name} ${userData.last_name}`,
        "Log In",
        "System",
        ipAddress
      );

      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("user", JSON.stringify(userData));
      setEmail("");
      setPassword("");
      setJustLoggedIn(true);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        setJustLoggedIn(false);
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setLoginError(error.message || "Login failed. Please try again.");
      setErrorMessage(error.message || "Login failed. Please try again.");
      // If not an explicit suspension, show generic error toast
      if (!showSuspendedToast) {
        setShowErrorToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // ✅ Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // ✅ Get user's IP address
      const ipAddress = await ApiService.getUserIpAddress();

      // ✅ Log the logout activity
      if (currentUser.id && currentUser.first_name && currentUser.last_name) {
        await ApiService.createActivityLog(
          currentUser.id,
          `${currentUser.first_name} ${currentUser.last_name}`,
          "Log Out",
          "System",
          ipAddress
        );
      }

      // Clear localStorage and state
      ApiService.logout();
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      setUser(null);
      setIsLoggedIn(false);
      setEmail("");
      setPassword("");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      // Still log out even if activity logging fails
      ApiService.logout();
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      setUser(null);
      setIsLoggedIn(false);
      setEmail("");
      setPassword("");
      navigate("/");
    }
  };

  // Get user's full name for welcome notification
  const getUserName = () =>
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name ||
      user?.firstName ||
      user?.lastName ||
      user?.email ||
      "User";

  if (!isLoggedIn) {
    return (
      <div>
        <LoginPage
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loginError={loginError}
          handleLogin={handleLogin}
          showErrorModal={showErrorToast}
          setShowErrorModal={setShowErrorToast}
          errorMessage={errorMessage}
          loading={loading}
        />
        {/* Suspended Account Toast - Center of screen */}
        {showSuspendedToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <Toast
                variant="warning"
                title="Account Suspended"
                description={
                  errorMessage ||
                  "Your account is suspended. Please contact your administrator."
                }
                onClose={() => setShowSuspendedToast(false)}
                autoCloseMs={5000}
              />
            </div>
          </div>
        )}
        {/* Error Toast - Center of screen */}
        {showErrorToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <Toast
                variant="error"
                title="Login Failed"
                description={errorMessage}
                onClose={() => setShowErrorToast(false)}
                autoCloseMs={2000}
              />
            </div>
          </div>
        )}
        {/* Success Toast - Center of screen */}
        {showSuccessToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <Toast
                variant="success"
                title="Login Successful!"
                description="Redirecting to Dashboard..."
                onClose={() => setShowSuccessToast(false)}
                autoCloseMs={2000}
              />
            </div>
          </div>
        )}
        <ConnectionStatus />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Top-center Welcome Notification After Login ONLY */}
        {justLoggedIn && (
          <div className="fixed top-8 left-2/3 transform -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <Toast
                variant="success"
                title={`Welcome, ${getUserName()}!`}
                description="Login Successful."
                onClose={() => setJustLoggedIn(false)}
                autoCloseMs={2000}
              />
            </div>
          </div>
        )}

        <ConnectionStatus />

        <div className="flex h-screen overflow-hidden">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
              onClick={closeSidebar}
            />
          )}
          <Sidebar
            currentPage={getCurrentPage()}
            setCurrentPage={setCurrentPage}
            handleLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            user={user}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopNavigation
              toggleSidebar={toggleSidebar}
              currentPage={getCurrentPage()}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              date={date}
              setDate={setDate}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              unreadNotifications={unreadNotifications}
              handleLogout={handleLogout}
              setCurrentPage={setCurrentPage}
              user={user}
            />
            <main className="flex-1 overflow-y-auto bg-background text-foreground transition-colors duration-300">
              <AppRoutes user={user} setUser={setUser} />
            </main>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

// Main App Component with Router
const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;

