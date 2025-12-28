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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiService, { supabase } from "../services/api";
import { ThemeContext } from "../App";
import EditableViewModal from "./EditableViewModal"; // ✅ NEW: Editable View Modal component

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
  // Dropdown Options
  const extensionOptions = ['Sr.', 'Jr.', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common-law/Live-in'];
  const educationOptions = ['None', 'Elementary', 'High School', 'Vocational', 'College', 'Post Graduate'];
  const religionOptions = ['Roman Catholic', 'Islam', 'Iglesia ni Cristo', 'Protestant', 'Buddhist', 'Hindu', 'Other'];
  const governmentIdOptions = ['PhilID / ePhilID', 'GSIS', 'SSS', 'PhilHealth', 'Voter\'s ID', 'Driver\'s License', 'PRC License', 'Passport', 'Senior Citizen ID', 'PWD ID', 'Postal ID', 'TIN ID', 'Barangay ID', 'Company ID', 'School ID'];

  // Farm & Crop Options
  const ownershipTypeOptions = ['Registered Owner', 'Tenant', 'Lessee', 'Mortgage', 'Others'];
  const ownershipDocOptions = ['OCT/TCT', 'Tax Declaration', 'Certificate of Land Transfer', 'Emancipation Patent', 'CLOA', 'Barangay Certification', 'None'];
  const farmTypeOptions = ['Irrigated', 'Rainfed Upland', 'Rainfed Lowland'];

  // Crop & Animal Lists
  const cropNameOptions = [
    'Ampalaya', 'Broccoli', 'Cabbage', 'Carrot', 'Cauliflower', 'Eggplant (Talong)', 'Ginger', 'Gourd (Upo/Patola)', 'Lettuce', 'Okra',
    'Pechay (Native)', 'Pechay (Chinese/Bok choy)', 'Pepper (Chili/Bell)', 'Squash (Kalabasa)', 'String beans/Sitaw', 'Tomato',
    'Sweet potato (Kamote)', 'Cassava', 'Ube (Purple yam)', 'Gabi (Taro)', 'Singkamas', 'Spring onions', 'Celery', 'Mustard (Mustasa)',
    'Onion', 'Onion (bunching)', 'Cucumber', 'Radish (Labanos)', 'Spinach', 'Corn', 'Peas/Sweet peas', 'Beans (bush/pole)',
    'Peanut', 'Mung bean (Munggo)', 'Garlic (Bawang)', 'Kangkong (Water spinach)', 'Alugbati (Malabar spinach)', 'Patola (Sponge gourd)',
    'Sayote (Chayote)',
    'Banana', 'Mango', 'Pineapple', 'Papaya', 'Rambutan', 'Lanzones', 'Durian', 'Guava', 'Pomelo', 'Citrus (Calamansi/Oranges)',
    'Mangosteen', 'Watermelon', 'Melon (Cantaloupe)', 'Coconut (Niyog)', 'Jackfruit (Langka)', 'Calamansi', 'Avocado',
    'Guyabano (Soursop)', 'Atis (Sugar apple)', 'Chico (Sapodilla)', 'Dalandan (Orange)',
    'Coffee', 'Rubber', 'Cashew', 'Sugarcane', 'Rice', 'Abaca', 'Cacao', 'Tobacco'
  ];
  const cornTypeOptions = ['Yellow', 'White'];
  const poultryOptions = ['Chicken', 'Duck', 'Turkey', 'Gamefowl'];
  const livestockOptions = ['Carabao', 'Cattle/Cow', 'Goat', 'Pig/Swine', 'Sheep', 'Horse'];

  // Address Options
  const barangayOptions = ['Upper Jasaan', 'Lower Jasaan']; // Example - Expand as needed or fetch dynamic
  // Simplified Purok logic for demo (or copy complete map if available)
  const getPurokOptions = (barangay) => {
    // Basic mock based on RegisterPage
    if (barangay === 'Upper Jasaan') return ['Purok 1', 'Purok 2'];
    if (barangay === 'Lower Jasaan') return ['Purok A', 'Purok B'];
    return [];
  };
  const regionOptions = ['Region 1 - Ilocos', 'Region 2 - Cagayan Valley', 'Region 3 - Central Luzon', 'Region 4A - CALABARZON', 'Region 4B - MIMAROPA', 'Region 5 - Bicol', 'Region 6 - Western Visayas', 'Region 7 - Central Visayas', 'Region 8 - Eastern Visayas', 'Region 9 - Zamboanga Peninsula', 'Region 10 - Northern Mindanao', 'Region 11 - Davao', 'Region 12 - SOCCSKSARGEN', 'Region 13 - Caraga', 'NCR - National Capital Region', 'CAR - Cordillera', 'BARMM - Bangsamoro'];

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Editable View Modal states (replaces old Edit Modal)
  const [editedData, setEditedData] = useState({}); // Track changes in View Modal
  const [hasChanges, setHasChanges] = useState(false); // Show Save button when true
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
    setEditedData({}); // Initialize empty - changes will be tracked here
    setHasChanges(false); // No changes initially
    setShowViewModal(true);
  };



  // ✅ NEW: Cancel changes in View Modal
  const handleCancelChanges = () => {
    setEditedData({});
    setHasChanges(false);
  };

  // ✅ NEW: Save changes from View Modal
  const handleSaveChanges = async (editedData) => {
    try {
      setIsSaving(true);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const fullData = viewingRecord.fullData || {};

      console.log("💾 Saving updates:", editedData);

      // 1. Root Registrant Updates
      const registrantUpdates = {};
      const specialPrefixes = ['present_', 'permanent_', 'farm_parcels', 'financial_infos'];
      const specialKeys = ['tin_number', 'source_of_funds', 'income_farming', 'income_non_farming'];

      Object.keys(editedData).forEach(key => {
        if (!specialPrefixes.some(pref => key.startsWith(pref)) && !specialKeys.includes(key)) {
          registrantUpdates[key] = editedData[key];
        }
      });

      if (Object.keys(registrantUpdates).length > 0) {
        await ApiService.updateRegistrant(
          viewingRecord.dbId,
          registrantUpdates,
          currentUser.id,
          `${currentUser.first_name} ${currentUser.last_name}`
        );
      }

      // 2. Addresses Updates
      const kinds = ['permanent', 'present'];
      for (const kind of kinds) {
        const addressUpdates = {};
        let kindChanged = false;
        ['barangay', 'purok', 'municipality_city', 'province', 'region'].forEach(field => {
          const key = `${kind}_${field}`;
          if (editedData[key] !== undefined) {
            addressUpdates[field] = editedData[key];
            kindChanged = true;
          }
        });

        if (kindChanged) {
          const existing = (fullData.addresses || []).find(a => a.kind === kind);
          if (existing) {
            await ApiService.updateResource('addresses', existing.id, addressUpdates);
          } else {
            await ApiService.createAddress({
              ...addressUpdates,
              registrant_id: viewingRecord.dbId,
              kind
            });
          }
        }
      }

      // 3. Financial Info Updates
      const finUpdates = {};
      let finChanged = false;
      ['tin_number', 'source_of_funds', 'income_farming', 'income_non_farming'].forEach(field => {
        if (editedData[field] !== undefined) {
          finUpdates[field] = editedData[field];
          finChanged = true;
        }
      });

      if (finChanged) {
        const existing = (fullData.financial_infos || [])[0];
        if (existing) {
          await ApiService.updateResource('financial_infos', existing.id, finUpdates);
        } else {
          await ApiService.createFinancialInfo({
            ...finUpdates,
            registrant_id: viewingRecord.dbId
          });
        }
      }

      // 4. Farm Parcels Update
      if (editedData.farm_parcels) {
        const currentParcels = fullData.farm_parcels || [];
        const newParcels = editedData.farm_parcels;

        // Delete removed parcels
        for (const existing of currentParcels) {
          if (!newParcels.some(np => np.id === existing.id)) {
            await ApiService.deleteResource('farm_parcels', existing.id);
          }
        }

        // Update or Create parcels
        for (const parcel of newParcels) {
          const parcelData = {
            registrant_id: viewingRecord.dbId,
            farmers_in_rotation: parcel.farmers_in_rotation || null,
            farm_location: parcel.farm_location || null,
            total_farm_area_ha: parcel.total_farm_area_ha || null,
            ownership_document: parcel.ownership_document || null,
            ownership_document_no: parcel.ownership_document_no || null,
            ownership: parcel.ownership || null,
            within_ancestral_domain: parcel.within_ancestral_domain === true,
            agrarian_reform_beneficiary: parcel.agrarian_reform_beneficiary === true
          };

          const isNew = typeof parcel.id === 'number' && parcel.id > 1000000000000;

          if (!isNew && currentParcels.some(cp => cp.id === parcel.id)) {
            await ApiService.updateResource('farm_parcels', parcel.id, parcelData);
          } else if (isNew) {
            await ApiService.createFarmParcel(parcelData);
          }
        }

        // 5. Production Data Sync (Crops, Livestock, Poultry)
        const allNewCrops = [];
        const allNewLivestock = [];
        const allNewPoultry = [];

        newParcels.forEach(p => {
          (p.parcel_infos || []).forEach(info => {
            if (info.crop_commodity === 'Crops' && info.crop_name) {
              allNewCrops.push({
                id: info.dbId || info.id,
                name: info.crop_name,
                value_text: info.size || "",
                corn_type: info.corn_type || null
              });
            } else if (info.crop_commodity === 'Livestock' && info.animal_name) {
              allNewLivestock.push({
                id: info.dbId || info.id,
                animal: info.animal_name,
                head_count: parseInt(info.head_count) || 0
              });
            } else if (info.crop_commodity === 'Poultry' && info.animal_name) {
              allNewPoultry.push({
                id: info.dbId || info.id,
                bird: info.animal_name,
                head_count: parseInt(info.head_count) || 0
              });
            }
          });
        });

        const syncTable = async (table, currentItems, newItems, fields) => {
          for (const existing of currentItems) {
            if (!newItems.some(ni => ni.id === existing.id)) {
              await ApiService.deleteResource(table, existing.id);
            }
          }
          for (const item of newItems) {
            const itemData = { registrant_id: viewingRecord.dbId };
            fields.forEach(f => itemData[f] = item[f]);
            const isNew = typeof item.id === 'string' || (typeof item.id === 'number' && item.id > 1000000000000);
            if (!isNew && currentItems.some(ci => ci.id === item.id)) {
              await ApiService.updateResource(table, item.id, itemData);
            } else {
              await ApiService.createResource(table, itemData);
            }
          }
        };

        await syncTable('crops', fullData.crops || [], allNewCrops, ['name', 'value_text', 'corn_type']);
        await syncTable('livestock', fullData.livestock || [], allNewLivestock, ['animal', 'head_count']);
        await syncTable('poultry', fullData.poultry || [], allNewPoultry, ['bird', 'head_count']);
      }

      // Refresh data and close modal
      await fetchRegistrants();
      setSuccessMessage("Record updated successfully");
      setShowSuccessModal(true);
      setShowViewModal(false);
      setEditedData({});
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating record:", error);
      setErrorMessage(
        error.message || "Failed to update record. Please try again."
      );
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
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
                  <TableHead className={subTextClass}>Reference Number</TableHead>
                  <TableHead className={subTextClass}>Name</TableHead>
                  <TableHead className={subTextClass}>Address</TableHead>
                  <TableHead className={subTextClass}>Type</TableHead>
                  <TableHead className={subTextClass}>Phone</TableHead>
                  <TableHead className={subTextClass}>Registered On</TableHead>
                  <TableHead className={subTextClass}>Set Location</TableHead>
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
                      colSpan={showDeleteMode ? 10 : 9}
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
                        {record.fullData?.farm_parcels?.some(p => p.latitude && p.longitude) ? (
                          <Badge className="bg-green-500/10 text-green-600 border-0">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600 border-0">No</Badge>
                        )}
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

      {/* ✅ NEW: Editable View Modal Component */}
      <EditableViewModal
        show={showViewModal}
        record={viewingRecord}
        onClose={() => {
          setShowViewModal(false);
          setViewingRecord(null);
        }}
        onSave={handleSaveChanges}
        getStatusBadgeColor={getStatusBadgeColor}
        getTypeBadgeColor={getTypeBadgeColor}
        formatDate={formatDate}
      />

      {/* Success Modal */}
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
              {successMessage || "Operation completed successfully."}
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white !rounded-button"
              onClick={() => {
                setShowSuccessModal(false);
                setShowErrorModal(false);
                setShowViewModal(false);
                setShowDeleteModal(false);
              }}
            >
              OK
            </Button>
          </div>
        </Modal>
      )}

      {/* Error Modal */}
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
              {errorMessage || "An error occurred."}
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

    </div >
  );
};

export default RsbsaRecordsPage;
