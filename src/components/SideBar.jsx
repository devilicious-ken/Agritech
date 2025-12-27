import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeContext } from "../App";

const Sidebar = ({ currentPage, setCurrentPage, handleLogout, isOpen, onClose, onCollapse, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Get the current theme to toggle styles conditionally
  const { theme } = useContext(ThemeContext);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapse) onCollapse(newState);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'MAO Staff';
  };

  // Get avatar color based on role
  const getAvatarColor = () => {
    switch (user?.role?.toLowerCase().trim()) {
      case 'admin': return 'bg-red-600';
      case 'moderator': return 'bg-blue-600';
      case 'user': return 'bg-green-600';
      default: return 'bg-purple-600';
    }
  };

  // RBAC: Define navigation items
  const getNavigationItems = () => {
    const allNavItems = [
      { name: 'Dashboard', icon: 'fas fa-tachometer-alt', page: 'dashboard', roles: ['admin', 'moderator', 'user', 'agritech'] },
      { name: 'User Management', icon: 'fas fa-users', page: 'users', roles: ['admin'] },
      { name: 'RSBSA Records', icon: 'fas fa-database', page: 'records', roles: ['admin', 'moderator', 'user', 'agritech'] },
      { name: 'Register', icon: 'fas fa-user-plus', page: 'register', roles: ['admin', 'moderator', 'user', 'agritech'] },
      { name: 'GIS Map', icon: 'fas fa-map-marked-alt', page: 'map', roles: ['admin', 'moderator', 'user', 'agritech'] },
      { name: 'Import/Export', icon: 'fas fa-file-export', page: 'import', roles: ['admin', 'moderator'] },
      { name: 'History', icon: 'fas fa-history', page: 'history', roles: ['admin', 'moderator'] },
    ];
    const userRole = user?.role?.toLowerCase().trim() || 'user';
    return allNavItems.filter(item => item.roles.includes(userRole));
  };

  // Helper to determine Nav Item classes based on Theme
  const getNavItemClasses = (isActive) => {
    if (theme === 'dark') {
      // YOUR SPECIFIC DARK MODE COLORS
      return isActive
        ? 'bg-[#333333] text-white shadow-md'
        : 'text-gray-300 hover:bg-[#252525] hover:text-white';
    } else {
      // LIGHT MODE COLORS (Clean light grey style)
      return isActive
        ? 'bg-gray-200 text-black shadow-sm font-semibold'
        : 'text-gray-600 hover:bg-gray-100 hover:text-black';
    }
  };

  // Helper for User Section Hover classes
  const getUserSectionHoverClass = () => {
    return theme === 'dark'
      ? 'hover:bg-[#252525] hover:text-white'
      : 'hover:bg-gray-100 hover:text-black';
  };

  return (
    <div
      className={`
        bg-card text-card-foreground
        ${isCollapsed ? 'w-16' : 'w-50'} 
        z-50 
        transform transition-all duration-300 ease-in-out 
        fixed inset-y-0 left-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block
        flex flex-col
        border-0 shadow-lg hover:shadow-xl
      `}
    >
      {/* Header with Logo and Toggle Button */}
      <div className="flex items-center justify-between h-16 px-4 transition-colors duration-300">
        {!isCollapsed && (
          <div className="flex items-center">
            <img
              src="/LOGO.png"
              alt="AgriTech Logo"
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-lg font-bold text-foreground ml-2">AgriTech</h1>
          </div>
        )}
        {isCollapsed && (
          <img
            src='/LOGO.png'
            alt="AgriTech Logo"
            className="h-8 w-8"
          />
        )}
        <button
          onClick={toggleCollapse}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 rounded-md transition-colors duration-200"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-2">
          {getNavigationItems().map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page);
                  if (isOpen) onClose();
                }}
                className={`
                  w-full flex items-center px-3 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200
                  ${getNavItemClasses(isActive)}
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <i
                  className={`
                    ${item.icon} 
                    ${isCollapsed ? 'text-lg' : 'mr-3 text-lg'}
                    ${/* Icon color: Blue if active, otherwise depends on theme */ ''}
                    ${isActive
                      ? (theme === 'dark' ? 'text-blue-400' : 'text-primary')
                      : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                    }
                  `}
                ></i>
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div
        className={`mt-auto p-4 border-t border-border transition-colors duration-200 group cursor-pointer ${getUserSectionHoverClass()}`}
        title="User Profile"
      >
        <div className={`flex ${isCollapsed ? 'flex-col items-center space-y-3' : 'items-center'}`}>
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/50 transition-colors">
            <AvatarFallback className={`${getAvatarColor()} text-white text-xs font-semibold`}>
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="ml-2 flex-1 min-w-0">
              <p className={`text-sm font-medium break-words leading-tight max-w-full transition-colors ${theme === 'dark' ? 'text-white' : 'text-foreground'}`}>
                {getUserDisplayName()}
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                {user?.role === 'user' && (
                  <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded border border-green-500/20">MAO Staff</span>
                )}
                {user?.role === 'agritech' && (
                  <span className="text-[10px] bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded border border-orange-500/20">Agritech</span>
                )}
                {user?.role === 'admin' && (
                  <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded border border-red-500/20">Admin</span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutModal(true);
            }}
            className={`
              text-muted-foreground hover:text-red-500 
              cursor-pointer transition-colors duration-200
              ${isCollapsed ? '' : 'ml-auto'}
            `}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-sm p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Sidebar;