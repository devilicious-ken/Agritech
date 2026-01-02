import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "../components/DashboardPage";
import UserManagementPage from "../components/UserManagementPage";
import RsbsaRecordsPage from "../components/RsbsaRecordsPage";
import RegisterPage from "../components/RegisterPage";
import MapPage from "../components/MapPage";
import ImportPage from "../components/ImportPage";
import ExportPage from "../components/ExportPage";
import HistoryPage from "../components/HistoryPage";
import HelpPage from "../components/HelpPage";

import SetFarmLocationPage from "../components/SetFarmLocationPage";
import ProfilePage from "../components/ProfilePage";

const AppRoutes = ({ user, setUser }) => {
  // Get user role for route protection
  const userRole = user?.role?.toLowerCase().trim() || "user";

  // Protected Route Component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      return children;
    }
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Default redirect to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard - Available to all users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <DashboardPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* User Management - Admin only */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserManagementPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* RSBSA Records - All users */}
      <Route
        path="/records"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <RsbsaRecordsPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* Set Farm Location - Agritech Only */}
      <Route
        path="/set-farm-location/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "agritech"]}>
            <SetFarmLocationPage />
          </ProtectedRoute>
        }
      />

      {/* Register - All users */}
      <Route
        path="/register"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <RegisterPage user={user} /> {/* <-- Make sure user is passed */}
          </ProtectedRoute>
        }
      />

      {/* GIS Map - All users */}
      <Route
        path="/map"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <MapPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* Import/Export - Admin and Moderator only */}
      <Route
        path="/import"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator"]}>
            <ImportPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/export"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator"]}>
            <ExportPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* History - Admin and Moderator only */}
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator"]}>
            <HistoryPage user={user} />
          </ProtectedRoute>
        }
      />
      {/* Settings - All users (Aliased to Profile) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <ProfilePage user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Profile - All users */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <ProfilePage user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Help - All users */}
      <Route
        path="/help"
        element={
          <ProtectedRoute allowedRoles={["admin", "moderator", "user", "agritech"]}>
            <HelpPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
