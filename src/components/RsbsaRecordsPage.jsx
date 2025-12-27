import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ApiService from "../services/api";
import { ThemeContext } from "../App";

// ✅ Modal Component - Moved outside to prevent re-creation on every render
const Modal = React.memo(({ show, onClose, title, children, size = "md" }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  if (!show) return null;

  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-6xl",
    full: "max-w-[95vw]",
  };

  // Theme-based Styles for Modal
  const modalContainerClass = isDark
    ? "bg-[#1e1e1e] border border-[#333333] shadow-2xl"
    : "bg-card text-card-foreground border-0 shadow-2xl";
  
  const headerBorderClass = isDark ? "border-[#333333]" : "border-border/50";
  const titleClass = isDark ? "text-white" : "text-foreground";
  const closeBtnClass = isDark
    ? "text-gray-400 hover:text-white hover:bg-[#333333]"
    : "text-muted-foreground hover:text-foreground hover:bg-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`${modalContainerClass} rounded-lg ${sizeClasses[size]} w-full mx-4 relative flex flex-col max-h-[90vh]`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${headerBorderClass}`}>
          <h3 className={`text-lg font-semibold ${titleClass}`}>{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={closeBtnClass}
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
});

const RsbsaRecordsPage = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  // --- Dynamic Style Classes ---
  // Text Colors
  const textClass = isDark ? "text-white" : "text-foreground";
  const subTextClass = isDark ? "text-gray-400" : "text-muted-foreground";

  // Card Styles (Slight border logic)
  const cardClass = isDark
    ? "bg-[#1e1e1e] border border-[#333333] shadow-md"
    : "bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300";

  // Input/Select Styles
  const inputClass = isDark
    ? "bg-[#252525] border border-[#333333] text-gray-200 focus:ring-blue-500"
    : "bg-muted/50 border-0 text-foreground focus:ring-primary";

  // Button Styles (Secondary/Cancel)
  const secondaryBtnClass = isDark
    ? "bg-[#444444] hover:bg-[#555555] text-white"
    : "bg-muted hover:bg-muted/80 text-foreground";

  // Table Styles
  const tableHeaderClass = isDark ? "bg-[#252525]" : "bg-muted/50";
  const tableBorderClass = isDark ? "border-[#333333]" : "border-border/50";
  const tableRowHoverClass = isDark ? "hover:bg-[#252525]" : "hover:bg-muted/30";

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for database data
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role); // ✅ Set role
    fetchRegistrants();
  }, []);

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Fetch function
  const fetchRegistrants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getRegistrants();
      console.log("✅ Fetched registrants:", data);

      // Transform database data to match UI format
      const formattedRecords = data.map((registrant) => ({
        id: registrant.reference_no || `RS-${registrant.id.slice(0, 8)}`,
        dbId: registrant.id,
        name: [
          registrant.first_name,
          registrant.middle_name,
          registrant.surname,
        ]
          .filter(Boolean)
          .join(" "),
        address: formatAddress(registrant.addresses?.[0]),
        type: formatRegistryType(registrant.registry),
        registeredOn: formatDate(registrant.created_at),
        modifiedOn: formatDate(registrant.updated_at),
        modifiedBy: registrant.updated_by_name || "System",
        status: registrant.status || "Created", // ✅ Read status from database
        crops: registrant.crops?.map((c) => c.name).join(", ") || "N/A",
        farmSize: calculateTotalFarmSize(registrant.farm_parcels),
        phone: registrant.mobile_number || "N/A",
        coordinates: "N/A",
        fullData: registrant,
      }));

      // ✅ Remove duplicates based on dbId (unique database ID)
      const uniqueRecords = formattedRecords.filter(
        (record, index, self) =>
          index === self.findIndex((r) => r.dbId === record.dbId)
      );

      console.log("✅ Total records:", formattedRecords.length);
      console.log("✅ Unique records:", uniqueRecords.length);

      setRecords(uniqueRecords);
    } catch (err) {
      console.error("❌ Error fetching registrants:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatAddress = (address) => {
    if (!address) return "N/A";
    return [address.purok, address.barangay].filter(Boolean).join(", ");
  };

  const formatRegistryType = (registry) => {
    const types = {
      farmer: "Farmer",
      fisherfolk: "Fisherfolk",
      agri_youth: "Agri-Youth",
      farm_worker: "Farm Worker/Laborer",
    };
    return types[registry] || registry;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const calculateTotalFarmSize = (parcels) => {
    if (!parcels || parcels.length === 0) return "N/A";
    const total = parcels.reduce(
      (sum, p) => sum + (parseFloat(p.total_farm_area_ha) || 0),
      0
    );
    return `${total.toFixed(2)} hectares`;
  };

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || record.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecords(paginatedRecords.map((record) => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter((id) => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  // ✅ Delete records with proper checkbox clearing
  const handleDeleteRecords = async () => {
    try {
      setIsDeleting(true);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const ipAddress = await ApiService.getUserIpAddress();

      const recordsToDelete = records.filter((r) =>
        selectedRecords.includes(r.id)
      );

      for (const record of recordsToDelete) {
        await ApiService.softDeleteRegistrant(
          record.dbId,
          currentUser.id,
          deleteReason || "No reason provided"
        );

        await ApiService.createActivityLog(
          currentUser.id,
          `${currentUser.first_name} ${currentUser.last_name}`,
          "Delete",
          `${record.id} (${record.name})`,
          ipAddress
        );
      }

      setRecords(
        records.filter((record) => !selectedRecords.includes(record.id))
      );
      setShowDeleteModal(false);
      setShowDeleteMode(false);
      setDeleteReason("");
      setIsDeleting(false);

      setSuccessMessage(
        `Successfully deleted ${recordsToDelete.length} record(s)`
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error deleting records:", error);
      setIsDeleting(false);

      setErrorMessage(
        error.message || "Failed to delete records. Please try again."
      );
      setShowErrorModal(true);
    }
  };

  const handleViewRecord = (record) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  // ✅ Handle edit click - populate form with current data
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFormData({
      // Personal Info
      first_name: record.fullData?.first_name || "",
      middle_name: record.fullData?.middle_name || "",
      surname: record.fullData?.surname || "",
      sex: record.fullData?.sex || "",
      date_of_birth: record.fullData?.date_of_birth || "",
      place_of_birth: record.fullData?.place_of_birth || "",
      civil_status: record.fullData?.civil_status || "",
      religion: record.fullData?.religion || "",
      spouse_name: record.fullData?.spouse_name || "",
      // Contact
      mobile_number: record.fullData?.mobile_number || "",
      landline_number: record.fullData?.landline_number || "",
      // Household
      is_household_head: record.fullData?.is_household_head || false,
      household_members_count: record.fullData?.household_members_count || "",
      household_males: record.fullData?.household_males || "",
      household_females: record.fullData?.household_females || "",
      // Government
      has_government_id: record.fullData?.has_government_id || false,
      government_id_type: record.fullData?.government_id_type || "",
      is_pwd: record.fullData?.is_pwd || false,
      is_4ps: record.fullData?.is_4ps || false,
      is_indigenous: record.fullData?.is_indigenous || false,
      indigenous_group_name: record.fullData?.indigenous_group_name || "",
    });
    setShowEditModal(true);
  };

  // Helper function to clean form data
  const cleanFormData = (data) => {
    const cleaned = {};

    for (const [key, value] of Object.entries(data)) {
      // Convert empty strings to null
      if (value === "") {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const ipAddress = await ApiService.getUserIpAddress();

      // ✅ Clean all empty strings to null
      const cleanedData = cleanFormData(editFormData);

      const result = await ApiService.updateRegistrant(
        editingRecord.dbId,
        cleanedData,
        currentUser.id,
        `${currentUser.first_name} ${currentUser.last_name}`
      );

      await ApiService.createActivityLog(
        currentUser.id,
        `${currentUser.first_name} ${currentUser.last_name}`,
        "Update",
        `${editingRecord.id} (${editingRecord.name})`,
        ipAddress
      );

      await fetchRegistrants();

      setShowEditModal(false);
      setEditingRecord(null);
      setIsSaving(false);

      setSuccessMessage("Record updated successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Error updating record:", error);
      setIsSaving(false);
      setErrorMessage(
        error.message || "Failed to update record. Please try again."
      );
      setShowErrorModal(true);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Created":
        return "bg-yellow-500/10 text-yellow-600 border-0";
      case "Updating":
        return "bg-blue-500/10 text-blue-600 border-0";
      case "Updated":
        return "bg-green-500/10 text-green-600 border-0";
      default:
        return "bg-gray-500/10 text-gray-500 border-0";
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "Farmer":
        return "bg-green-500/10 text-green-600 border-0";
      case "Fisherfolk":
        return "bg-blue-500/10 text-blue-600 border-0";
      case "Farm Worker/Laborer":
        return "bg-orange-500/10 text-orange-600 border-0";
      case "Agri-Youth":
        return "bg-red-500/10 text-red-600 border-0";
      default:
        return "bg-gray-500/10 text-gray-500 border-0";
    }
  };


  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Loading records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
          <p className="text-destructive mb-4">{error}</p>
          <Button
            onClick={fetchRegistrants}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <i className="fas fa-sync mr-2"></i> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${textClass}`}>RSBSA Records</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`${secondaryBtnClass} !rounded-button`}
          >
            <i className="fas fa-filter mr-2"></i> Filters
          </Button>
          {!showDeleteMode ? (
            <Button
              onClick={() => setShowDeleteMode(true)}
              className="bg-red-600 hover:bg-red-700 text-white !rounded-button"
            >
              <i className="fas fa-trash mr-2"></i> Delete Records
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={selectedRecords.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 !rounded-button"
              >
                <i className="fas fa-trash mr-2"></i> Delete Selected (
                {selectedRecords.length})
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteMode(false);
                  setSelectedRecords([]);
                }}
                className={`${secondaryBtnClass} !rounded-button`}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium ${subTextClass} mb-2`}>
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full rounded-md px-3 py-2 cursor-pointer outline-none ${inputClass}`}
                >
                  <option value="all">All Types</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Fisherfolk">Fisherfolk</option>
                  <option value="Farm Worker/Laborer">
                    Farm Worker/Laborer
                  </option>
                  <option value="Agri-Youth">Agri-Youth</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${subTextClass} mb-2`}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full rounded-md px-3 py-2 cursor-pointer outline-none ${inputClass}`}
                >
                  <option value="all">All Status</option>
                  <option value="Created">Created</option>
                  <option value="Updating">Updating</option>
                  <option value="Updated">Updated</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className={`w-full ${secondaryBtnClass} !rounded-button`}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className={cardClass}>
        <CardContent className="p-4">
          <div className="relative">
            <i className={`fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 ${subTextClass}`}></i>
            <Input
              type="text"
              placeholder="Search by name, ID, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${inputClass}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className={textClass}>Registrant Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`overflow-x-auto rounded-md border ${tableBorderClass}`}>
            <Table>
              <TableHeader className={tableHeaderClass}>
                <TableRow className={`border-b ${tableBorderClass} hover:bg-transparent`}>
                  {showDeleteMode && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedRecords.length === paginatedRecords.length &&
                          paginatedRecords.length > 0
                        }
                        className={`w-4 h-4 rounded border-gray-600 ${isDark ? 'bg-[#333333]' : 'bg-white'} focus:ring-blue-500`}
                      />
                    </TableHead>
                  )}
                  <TableHead className={subTextClass}>Reference ID</TableHead>
                  <TableHead className={subTextClass}>Name</TableHead>
                  <TableHead className={subTextClass}>Address</TableHead>
                  <TableHead className={subTextClass}>Type</TableHead>
                  <TableHead className={subTextClass}>Phone</TableHead>
                  <TableHead className={subTextClass}>Registered On</TableHead>
                  <TableHead className={subTextClass}>Status</TableHead>
                  <TableHead className={`${subTextClass} text-right`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showDeleteMode ? 9 : 8}
                      className={`text-center ${subTextClass} py-8`}
                    >
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow
                      key={record.dbId}
                      className={`border-b ${tableBorderClass} ${tableRowHoverClass} transition-colors`}
                    >
                      {showDeleteMode && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                            className={`w-4 h-4 rounded border-gray-600 ${isDark ? 'bg-[#333333]' : 'bg-white'} focus:ring-blue-500`}
                          />
                        </TableCell>
                      )}
                      <TableCell className={`${subTextClass} font-mono text-sm`}>
                        {record.id}
                      </TableCell>
                      <TableCell className={`text-sm ${textClass}`}>
                        {record.name}
                      </TableCell>
                      <TableCell className={`${subTextClass} text-sm`}>
                        {record.address}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(record.type)}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${subTextClass} text-sm`}>
                        {record.phone}
                      </TableCell>
                      <TableCell className={`${subTextClass} text-sm`}>
                        {record.registeredOn}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {userRole === 'agritech' && record.type !== 'Fisherfolk' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/set-farm-location/${record.dbId}`)}
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 mr-2"
                          >
                            <i className="fas fa-map-marker-alt mr-1"></i> Add Location
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRecord(record)}
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <i className="fas fa-eye mr-1"></i> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${tableBorderClass}`}>
              <p className={`text-sm ${subTextClass}`}>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of{" "}
                {filteredRecords.length} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`border ${tableBorderClass} bg-transparent hover:bg-muted ${subTextClass} disabled:opacity-50 !rounded-button`}
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <span className={`px-4 py-2 ${subTextClass}`}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`border ${tableBorderClass} bg-transparent hover:bg-muted ${subTextClass} disabled:opacity-50 !rounded-button`}
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
        title="Confirm Deletion"
        size="md"
      >
        <div className="space-y-4">
          {isDeleting && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-white mb-3"></i>
                <p className="text-white font-medium">Deleting records...</p>
              </div>
            </div>
          )}

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-500 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Are you sure you want to delete {selectedRecords.length} selected
              record(s)? This will move them to the deleted records section.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${subTextClass} mb-2`}>
              Reason for Deletion (Optional)
            </label>
            <textarea
              placeholder="Enter reason for deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className={`w-full rounded-md px-3 py-2 outline-none resize-none ${inputClass}`}
              disabled={isDeleting}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteReason("");
              }}
              className={`border ${tableBorderClass} bg-transparent hover:bg-muted ${textClass} !rounded-button`}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteRecords}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 !rounded-button"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i> Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ✅ View Record Modal */}
      {showViewModal && viewingRecord && (
        <Modal
          show={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Registrant Details"
          size="3xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Personal Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-user mr-2"></i> Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${subTextClass}`}>Reference ID</label>
                  <p className={`${textClass} font-mono`}>{viewingRecord.id}</p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Registry Type</label>
                  <p>
                    <Badge className={getTypeBadgeColor(viewingRecord.type)}>
                      {viewingRecord.type}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className={`text-sm ${subTextClass}`}>Full Name</label>
                  <p className={textClass}>{viewingRecord.name}</p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Sex</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.sex || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Date of Birth</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.date_of_birth
                      ? formatDate(viewingRecord.fullData.date_of_birth)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    Place of Birth
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.place_of_birth || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Civil Status</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.civil_status || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Religion</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.religion || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Spouse Name</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.spouse_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-phone mr-2"></i> Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${subTextClass}`}>Mobile Number</label>
                  <p className={textClass}>{viewingRecord.phone}</p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    Landline Number
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.landline_number || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className={`text-sm ${subTextClass}`}>Address</label>
                  <p className={textClass}>{viewingRecord.address}</p>
                </div>
              </div>
            </div>

            {/* Household Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-home mr-2"></i> Household Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    Household Head
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.is_household_head ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Total Members</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.household_members_count || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Males</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.household_males || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Females</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.household_females || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Farm/Fishing Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-tractor mr-2"></i>{" "}
                {viewingRecord.type === "Farmer" ? "Farm" : "Fishing"}{" "}
                Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {viewingRecord.type === "Farmer" && (
                  <>
                    <div>
                      <label className={`text-sm ${subTextClass}`}>
                        Total Farm Size
                      </label>
                      <p className={textClass}>{viewingRecord.farmSize}</p>
                    </div>
                    <div className="col-span-2">
                      <label className={`text-sm ${subTextClass}`}>Crops</label>
                      <p className={textClass}>
                        {viewingRecord.fullData?.crops
                          ?.map((c) => `${c.name}${c.value_text ? ` (${c.value_text})` : ''}`)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className={`text-sm ${subTextClass}`}>Livestock</label>
                      <p className={textClass}>
                        {viewingRecord.fullData?.livestock
                          ?.map((l) => `${l.animal} (${l.head_count})`)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className={`text-sm ${subTextClass}`}>Poultry</label>
                      <p className={textClass}>
                        {viewingRecord.fullData?.poultry
                          ?.map((p) => `${p.bird} (${p.head_count})`)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                  </>
                )}
                {viewingRecord.type === "Fisherfolk" && (
                  <div className="col-span-2">
                    <label className={`text-sm ${subTextClass}`}>
                      Fishing Activities
                    </label>
                    <p className={textClass}>
                      {viewingRecord.fullData?.fishing_activities
                        ?.map((f) => f.activity)
                        .join(", ") || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Government IDs & Benefits Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-id-card mr-2"></i> Government IDs &
                Benefits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    Has Government ID
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.has_government_id ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>ID Type</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.government_id_type || "N/A"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>PWD</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.is_pwd ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    4Ps Beneficiary
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.is_4ps ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Indigenous</label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.is_indigenous ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>
                    Indigenous Group
                  </label>
                  <p className={textClass}>
                    {viewingRecord.fullData?.indigenous_group_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-calendar mr-2"></i> Registration
                Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${subTextClass}`}>Registered On</label>
                  <p className={textClass}>{viewingRecord.registeredOn}</p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Last Modified</label>
                  <p className={textClass}>{viewingRecord.modifiedOn}</p>
                </div>
                <div>
                  <label className={`text-sm ${subTextClass}`}>Status</label>
                  <p>
                    <Badge
                      className={getStatusBadgeColor(viewingRecord.status)}
                    >
                      {viewingRecord.status}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex justify-between pt-4 border-t ${tableBorderClass} mt-6`}>
            <Button
              onClick={() => setShowViewModal(false)}
              className={`${secondaryBtnClass} !rounded-button`}
            >
              <i className="fas fa-times mr-2"></i> Close
            </Button>
            <Button
              onClick={() => handleEditClick(viewingRecord)}
              className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button"
            >
              <i className="fas fa-edit mr-2"></i> Edit Record
            </Button>
          </div>
        </Modal>
      )}

      {/* ✅ Edit Record Modal */}
      {showEditModal && editingRecord && (
        <Modal
          show={showEditModal}
          onClose={() => {
            if (!isSaving) {
              setShowEditModal(false);
              setEditingRecord(null);
            }
          }}
          title="Edit Registrant"
          size="3xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Loading Overlay */}
            {isSaving && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                <div className="text-center">
                  <i className="fas fa-spinner fa-spin text-4xl text-white mb-3"></i>
                  <p className="text-white font-medium">Saving changes...</p>
                </div>
              </div>
            )}

            {/* Personal Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-user mr-2"></i> Personal Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    First Name *
                  </label>
                  <Input
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        first_name: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Middle Name
                  </label>
                  <Input
                    value={editFormData.middle_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        middle_name: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Surname *
                  </label>
                  <Input
                    value={editFormData.surname}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        surname: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Sex *
                  </label>
                  <select
                    value={editFormData.sex}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, sex: e.target.value })
                    }
                    className={`${inputClass} w-full rounded-md px-3 py-2 outline-none`}
                    disabled={isSaving}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        date_of_birth: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Place of Birth
                  </label>
                  <Input
                    value={editFormData.place_of_birth}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        place_of_birth: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Civil Status
                  </label>
                  <select
                    value={editFormData.civil_status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        civil_status: e.target.value,
                      })
                    }
                    className={`${inputClass} w-full rounded-md px-3 py-2 outline-none`}
                    disabled={isSaving}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Religion
                  </label>
                  <Input
                    value={editFormData.religion}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        religion: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Spouse Name
                  </label>
                  <Input
                    value={editFormData.spouse_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        spouse_name: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-phone mr-2"></i> Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Mobile Number
                  </label>
                  <Input
                    value={editFormData.mobile_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        mobile_number: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Landline Number
                  </label>
                  <Input
                    value={editFormData.landline_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        landline_number: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Household Information Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-home mr-2"></i> Household Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.is_household_head}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_household_head: e.target.checked,
                      })
                    }
                    className={`w-4 h-4 rounded ${isDark ? 'bg-[#333333] border-gray-600' : 'bg-white border-input'} focus:ring-blue-500 mr-2`}
                    disabled={isSaving}
                  />
                  <label className={`text-sm ${subTextClass}`}>
                    Household Head
                  </label>
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Total Members
                  </label>
                  <Input
                    type="number"
                    value={editFormData.household_members_count}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        household_members_count: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Males
                  </label>
                  <Input
                    type="number"
                    value={editFormData.household_males}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        household_males: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Females
                  </label>
                  <Input
                    type="number"
                    value={editFormData.household_females}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        household_females: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Government IDs & Benefits Section */}
            <div>
              <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                <i className="fas fa-id-card mr-2"></i> Government IDs &
                Benefits
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.has_government_id}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        has_government_id: e.target.checked,
                      })
                    }
                    className={`w-4 h-4 rounded ${isDark ? 'bg-[#333333] border-gray-600' : 'bg-white border-input'} focus:ring-blue-500 mr-2`}
                    disabled={isSaving}
                  />
                  <label className={`text-sm ${subTextClass}`}>
                    Has Government ID
                  </label>
                </div>
                <div className="col-span-2">
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    ID Type
                  </label>
                  <Input
                    value={editFormData.government_id_type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        government_id_type: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving || !editFormData.has_government_id}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.is_pwd}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_pwd: e.target.checked,
                      })
                    }
                    className={`w-4 h-4 rounded ${isDark ? 'bg-[#333333] border-gray-600' : 'bg-white border-input'} focus:ring-blue-500 mr-2`}
                    disabled={isSaving}
                  />
                  <label className={`text-sm ${subTextClass}`}>PWD</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.is_4ps}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_4ps: e.target.checked,
                      })
                    }
                    className={`w-4 h-4 rounded ${isDark ? 'bg-[#333333] border-gray-600' : 'bg-white border-input'} focus:ring-blue-500 mr-2`}
                    disabled={isSaving}
                  />
                  <label className={`text-sm ${subTextClass}`}>
                    4Ps Beneficiary
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.is_indigenous}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_indigenous: e.target.checked,
                      })
                    }
                    className={`w-4 h-4 rounded ${isDark ? 'bg-[#333333] border-gray-600' : 'bg-white border-input'} focus:ring-blue-500 mr-2`}
                    disabled={isSaving}
                  />
                  <label className={`text-sm ${subTextClass}`}>Indigenous</label>
                </div>
                <div className="col-span-3">
                  <label className={`block text-sm ${subTextClass} mb-1`}>
                    Indigenous Group Name
                  </label>
                  <Input
                    value={editFormData.indigenous_group_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        indigenous_group_name: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={isSaving || !editFormData.is_indigenous}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex justify-between pt-4 border-t ${tableBorderClass} mt-6`}>
            <Button
              onClick={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
              className={`${secondaryBtnClass} !rounded-button`}
              disabled={isSaving}
            >
              <i className="fas fa-times mr-2"></i> Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 !rounded-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i> Save Changes
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}
      {showSuccessModal && (
        <Modal
          show={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success!"
          size="md"
        >
          <div className="text-center py-6">
            <i className="fas fa-check-circle text-green-400 text-5xl mb-3"></i>
            <h3 className="text-green-500 font-bold text-xl mb-2">
              Operation Successful
            </h3>
            <p className={`${subTextClass} mb-4`}>
              {successMessage || "Records have been deleted successfully."}
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white !rounded-button"
              onClick={() => {
                setShowSuccessModal(false);
                setShowErrorModal(false);
                setShowViewModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
              }}
            >
              OK
            </Button>
          </div>
        </Modal>
      )}
      {showErrorModal && (
        <Modal
          show={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          size="md"
        >
          <div className="text-center py-6">
            <i className="fas fa-exclamation-triangle text-red-400 text-5xl mb-3"></i>
            <h3 className="text-red-500 font-bold text-xl mb-2">
              Operation Failed
            </h3>
            <p className={`${subTextClass} mb-4`}>
              {errorMessage || "An error occurred while deleting records."}
            </p>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white !rounded-button"
              onClick={() => setShowErrorModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RsbsaRecordsPage;