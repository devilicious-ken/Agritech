import React from "react";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Calendar } from "components/ui/calendar";
import { ScrollArea } from "components/ui/scroll-area";

const TopNavigation = ({
  toggleSidebar,
  currentPage,
  currentTime,
  showCalendar,
  setShowCalendar,
  date,
  setDate,
  handleLogout,
  setCurrentPage,
}) => {
  return (
    <header className="h-16 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-between px-4">
      <div className="flex items-center md:hidden">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-white text-xl"
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
        <div className="relative">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="h-8 w-8 rounded-full bg-[#252525] flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <i className="fas fa-calendar-alt"></i>
          </button>
          {showCalendar && (
            <div className="absolute right-0 mt-2 z-10 bg-[#252525] border border-[#333333] rounded-md shadow-lg">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="bg-[#252525] text-white border-[#333333]"
              />
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm hidden md:block">
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
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-green-700 to-blue-700 text-white text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#252525] border-[#333333] text-white">
            <div className="p-2 border-b border-[#333333]">
              <p className="font-medium">John Doe</p>
              <p className="text-xs text-gray-400">john.doe@agritech.gov</p>
            </div>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#333333]">
              <i className="fas fa-user mr-2 text-gray-400"></i>
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#333333]">
              <i className="fas fa-cog mr-2 text-gray-400"></i>
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[#333333]"
              onClick={() => {
                setCurrentPage("help"); // Navigate to Help page
                // If this is inside a DropdownMenu, it will auto-close on click; otherwise, add logic to close it (e.g., setShowNotifications(false))
              }}
            >
              <i className="fas fa-question-circle mr-2 text-gray-400"></i>
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[#333333]"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt mr-2 text-gray-400"></i>
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopNavigation;
