import React from "react";
import DashboardPage from "./DashboardPage";
import UserManagementPage from "./UserManagementPage";
import RsbsaRecordsPage from "./RsbsaRecordsPage";
import RegisterPage from "./RegisterPage";
import MapPage from "./MapPage";
import ImportPage from "./ImportPage";
import HistoryPage from "./HistoryPage";
import HelpPage from "./HelpPage";

const Content = ({ currentPage, isSidebarCollapsed }) => {
  switch (currentPage) {
    case "dashboard":
      return <DashboardPage isSidebarCollapsed={isSidebarCollapsed} />;
    case "users":
      return <UserManagementPage />;
    case "records":
      return <RsbsaRecordsPage />;
    case "register":
      return <RegisterPage />;
    case "map":
      return <MapPage />;
    case "import":
      return <ImportPage />;
    case "history":
      return <HistoryPage />;
    case "help":
      return <HelpPage />;
    default:
      return <DashboardPage isSidebarCollapsed={isSidebarCollapsed} />;
  }
};

export default Content;
