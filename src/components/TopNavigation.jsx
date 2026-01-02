import React, { useEffect, useState, useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";

import { ThemeContext } from "../App";

const TopNavigation = ({
  toggleSidebar,
  handleLogout,
  setCurrentPage,
  user,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U"; // Default fallback
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.email) {
      return user.email.split("@")[0]; // Use email username part
    }
    return "User";
  };

  // Get avatar color based on role
  const getAvatarColor = () => {
    switch (user?.role?.toLowerCase()) {
      case "admin":
        return "bg-gradient-to-br from-red-600 to-red-700";
      case "moderator":
        return "bg-gradient-to-br from-blue-600 to-blue-700";
      case "user":
        return "bg-gradient-to-br from-green-600 to-green-700";
      default:
        return "bg-gradient-to-br from-green-700 to-blue-700";
    }
  };

  return (
    // UPDATED: Added "border-0 shadow-lg hover:shadow-xl"
    <header className="h-16 bg-card flex items-center justify-between px-4 border-0 shadow-lg ">
      <div className="flex items-center md:hidden">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-foreground text-xl"
        >
          <i className="fas fa-bars"></i>
        </button>
        <img
          src="https://readdy.ai/api/search-image?query=Modern%20minimalist%20agriculture%20and%20fisheries%20logo%20design%20with%20a%20stylized%20leaf%20and%20fish%20icon%20in%20gradient%20green%20and%20blue%20colors%20on%20a%20dark%20background%2C%20professional%20and%20clean%20design%2C%20suitable%20for%20government%20agency&width=32&height=32&seq=15&orientation=squarish"
          alt="AgriTech Logo"
          className="h-8 w-8 ml-3"
        />
      </div>
      <div className="hidden md:flex items-center"></div>
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <div className="text-muted-foreground text-sm hidden md:block">
          <span className="mr-2">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url} className="object-cover" />
                <AvatarFallback
                  className="bg-primary/10 text-primary font-semibold"
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card text-foreground border-0 shadow-lg">
            <div className="p-2">
              <p className="font-medium break-words leading-tight">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {user?.email || "No email"}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {user?.role === "admin" && (
                  <span className="text-xs bg-red-600 text-red-100 px-1 rounded">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <DropdownMenuItem className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setCurrentPage("profile")}>
              <i className="fas fa-user mr-2 text-muted-foreground"></i>
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => {
                setCurrentPage("help");
              }}
            >
              <i className="fas fa-question-circle mr-2 text-muted-foreground"></i>
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setShowLogoutModal(true)}
            >
              <i className="fas fa-sign-out-alt mr-2 text-muted-foreground"></i>
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
        </div>
      )}
    </header>
  );
};

export default TopNavigation;