import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import ApiService, { supabase } from "../services/api";
import { ThemeContext } from "../App";

// Modal wrapper component
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

const EditableViewModal = ({
    show,
    record,
    onClose,
    onSave,
    getStatusBadgeColor,
    getTypeBadgeColor,
    formatDate
}) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Style classes
    const textClass = isDark ? "text-white" : "text-foreground";
    const subTextClass = isDark ? "text-gray-400" : "text-muted-foreground";
    const inputClass = isDark
        ? "bg-[#252525] border border-[#333333] text-gray-200 focus:ring-blue-500"
        : "bg-muted/50 border-0 text-foreground focus:ring-primary";
    const tableBorderClass = isDark ? "border-[#333333]" : "border-border/50";
    const secondaryBtnClass = isDark
        ? "bg-[#444444] hover:bg-[#555555] text-white"
        : "bg-muted hover:bg-muted/80 text-foreground";

    // State for tracking changes
    const [editedData, setEditedData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dropdown options
    const extensionOptions = ['Sr.', 'Jr.', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated'];
    const religionOptions = ['Roman Catholic', 'Islam', 'Iglesia ni Cristo', 'Protestant', 'Buddhist', 'Hindu', 'Other'];
    const educationOptions = ['None', 'Elementary', 'High School', 'Vocational', 'College', 'Post Graduate'];
    const governmentIdOptions = ['PhilID / ePhilID', 'GSIS', 'SSS', 'PhilHealth', 'Voter\'s ID', 'Driver\'s License', 'PRC License', 'Passport', 'Senior Citizen ID', 'PWD ID', 'Postal ID', 'TIN ID', 'Barangay ID', 'Company ID', 'School ID'];
    const barangayOptions = ['Upper Jasaan', 'Lower Jasaan'];
    const regionOptions = ['Region 1 - Ilocos', 'Region 2 - Cagayan Valley', 'Region 3 - Central Luzon', 'Region 4A - CALABARZON', 'Region 4B - MIMAROPA', 'Region 5 - Bicol', 'Region 6 - Western Visayas', 'Region 7 - Central Visayas', 'Region 8 - Eastern Visayas', 'Region 9 - Zamboanga Peninsula', 'Region 10 - Northern Mindanao', 'Region 11 - Davao', 'Region 12 - SOCCSKSARGEN', 'Region 13 - Caraga', 'NCR - National Capital Region', 'CAR - Cordillera', 'BARMM - Bangsamoro'];

    const ownershipDocOptions = ['Certificate of Land Transfer', 'Emancipation Patent', 'Individual Certificate of Land Ownership Award (CLOA)', 'Collective CLOA', 'Co-ownership CLOA', 'Agricultural Sales Patent', 'Homestead Patent', 'Free Patent', 'Certificate of Title or Regular Title', 'Certificate of Ancestral Domain Title', 'Certificate of Ancestral Land Title', 'Tax Declaration'];
    const ownershipTypeOptions = ['Registered Owner', 'Tenant', 'Lessee', 'Mortgage'];
    const farmTypeOptions = ['Irrigated', 'Rainfed Upland', 'Rainfed Lowland'];
    const cropCommodityOptions = ['Crops', 'Poultry', 'Livestock'];

    const cropNameOptions = [
        'Ampalaya', 'Broccoli', 'Cabbage', 'Carrot', 'Cauliflower', 'Eggplant (Talong)', 'Ginger', 'Gourd (Upo/Patola)', 'Lettuce', 'Okra',
        'Pechay (Native)', 'Pechay (Chinese/Bok choy)', 'Pepper (Chili/Bell)', 'Squash (Kalabasa)', 'String beans/Sitaw', 'Tomato',
        'Sweet potato (Kamote)', 'Cassava', 'Ube (Purple yam)', 'Gabi (Taro)', 'Singkamas', 'Spring onions', 'Celery', 'Mustard (Mustasa)',
        'Onion', 'Onion (bunching)', 'Cucumber', 'Radish (Labanos)', 'Spinach', 'Corn', 'Peas/Sweet peas', 'Beans (bush/pole)',
        'Peanut', 'Mung bean (Munggo)', 'Garlic (Bawang)', 'Kangkong (Water spinach)', 'Alugbati (Malabar spinach)', 'Patola (Sponge gourd)',
        'Sayote (Chayote)', 'Banana', 'Mango', 'Pineapple', 'Papaya', 'Rambutan', 'Lanzones', 'Durian', 'Guava', 'Pomelo',
        'Citrus (Calamansi/Oranges)', 'Mangosteen', 'Watermelon', 'Melon (Cantaloupe)', 'Coconut (Niyog)', 'Jackfruit (Langka)',
        'Calamansi', 'Avocado', 'Guyabano (Soursop)', 'Atis (Sugar apple)', 'Chico (Sapodilla)', 'Dalandan (Orange)',
        'Coffee', 'Rubber', 'Cashew', 'Sugarcane', 'Rice', 'Abaca', 'Cacao', 'Tobacco'
    ];
    const cornTypeOptions = ['Yellow', 'White'];
    const poultryOptions = ['Chicken', 'Duck', 'Turkey', 'Gamefowl'];
    const livestockOptions = ['Carabao', 'Cattle/Cow', 'Goat', 'Pig/Swine', 'Sheep', 'Horse'];

    const getPurokOptions = (barangay) => {
        if (barangay === 'Upper Jasaan') {
            return ['Purok 5', 'Purok 6A', 'Purok 6B', 'Purok 7', 'Purok 8', 'Purok 9A', 'Purok 9B'];
        } else if (barangay === 'Lower Jasaan') {
            return ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 10', 'Purok 11'];
        }
        return [];
    };

    // Reset edited data when modal opens
    useEffect(() => {
        if (show && record) {
            setEditedData({});
            setHasChanges(false);
            console.log("🔍 EditableViewModal: Opened with record:", record);
            console.log("🔍 EditableViewModal: Full Data:", record.fullData);
            console.log("🔍 EditableViewModal: ID Type:", record.fullData?.government_id_type);
            console.log("🔍 EditableViewModal: ID Number:", record.fullData?.government_id_number);
        }
    }, [show, record]);

    const fullData = record?.fullData || {};

    // Normalize data structure from DB to UI format
    const normalizedData = useMemo(() => {
        if (!record?.fullData) return {};
        const data = { ...record.fullData };

        if (data.farm_parcels) {
            data.farm_parcels = data.farm_parcels.map(parcel => ({
                ...parcel,
                parcel_infos: parcel.parcel_infos?.map(info => {
                    let flattened = { ...info };
                    // Map DB fields to UI fields
                    flattened.size = info.size || info.size_ha;
                    flattened.organic = info.is_organic_practitioner ? 'yes' : 'no';
                    flattened.farm_type = info.farm_kind;

                    // Handle nested crops/livestock/poultry
                    if (info.crops?.length > 0) {
                        flattened.crop_commodity = 'Crops';
                        flattened.crop_name = info.crops[0].name;
                        flattened.corn_type = info.crops[0].corn_type;
                    } else if (info.livestock?.length > 0) {
                        flattened.crop_commodity = 'Livestock';
                        flattened.animal_name = info.livestock[0].animal;
                        flattened.head_count = info.livestock[0].head_count;
                    } else if (info.poultry?.length > 0) {
                        flattened.crop_commodity = 'Poultry';
                        flattened.animal_name = info.poultry[0].bird;
                        flattened.head_count = info.poultry[0].head_count;
                    }

                    return flattened;
                })
            }));
        }
        // === HYBRID FALLBACK: Inject root-level data if nested data is missing ===
        // Check if ANY parcel has valid CONTENT (not just empty containers)
        const hasNestedData = data.farm_parcels?.some(p => p.parcel_infos?.some(info =>
            (info.crops?.length > 0) || (info.livestock?.length > 0) || (info.poultry?.length > 0)
        ));

        if (!hasNestedData) {
            const rootCrops = Array.isArray(data.crops) ? data.crops : [];
            const rootLivestock = Array.isArray(data.livestock) ? data.livestock : [];
            const rootPoultry = Array.isArray(data.poultry) ? data.poultry : [];

            // Group legacy data (crops that are NOT linked to a parcel_info) into the first parcel or a default one
            // Ideally, we should check if they are already in valid parcel_infos. But here we are dealing with root fallback.
            const productionInfos = [];

            rootCrops.forEach(c => {
                productionInfos.push({
                    id: c.id || `crop-${Math.random()}`,
                    crop_commodity: 'Crops',
                    crop_name: c.name,
                    size: parseFloat(c.value_text || 0),
                    corn_type: c.corn_type,
                    farm_type: 'N/A',
                    organic: 'no'
                });
            });

            rootLivestock.forEach(l => {
                productionInfos.push({
                    id: l.id || `lstk-${Math.random()}`,
                    crop_commodity: 'Livestock',
                    animal_name: l.animal,
                    head_count: l.head_count,
                    farm_type: 'N/A',
                    organic: 'no'
                });
            });

            rootPoultry.forEach(p => {
                productionInfos.push({
                    id: p.id || `plty-${Math.random()}`,
                    crop_commodity: 'Poultry',
                    animal_name: p.bird,
                    head_count: p.head_count,
                    farm_type: 'N/A',
                    organic: 'no'
                });
            });

            if (productionInfos.length > 0) {
                // strict fallback: Only create a virtual parcel if NO parcels exist
                // If parcels exist but have no info, we DO NOT inject root data into them
                // because that causes the "all data in parcel 1" issue.
                if (!data.farm_parcels || data.farm_parcels.length === 0) {
                    data.farm_parcels = [{
                        id: 'virtual-production',
                        farm_location: 'Unassigned Production Data',
                        total_farm_area_ha: 0,
                        ownership_document: 'N/A',
                        ownership_type: 'N/A',
                        parcel_infos: productionInfos
                    }];
                }
                // If parcels exist, we assume the user intended to manage them via the parcel UI
                // and we should NOT dump root data into Parcel 1.
            }
        }

        // 3. Fix Financial Info (Array -> Object)
        if (Array.isArray(data.financial_infos) && data.financial_infos.length > 0) {
            data.financial_infos = data.financial_infos[0];
        }

        console.log("✅ Normalized Data for View (Hybrid):", data);
        return data;
    }, [record]);

    // Debugging Data Flow
    useEffect(() => {
        if (record?.fullData) {
            console.group("🔍 Debug: View Modal Data Loading");
            console.log("⬇️ Raw Record Data:", record.fullData);

            if (record.fullData.farm_parcels) {
                console.log("🚜 Raw Farm Parcels:", record.fullData.farm_parcels);
                console.table(record.fullData.farm_parcels);
            } else {
                console.warn("⚠️ No Farm Parcels in Raw Data");
            }

            console.log("🔄 Normalized Data:", normalizedData);
            if (normalizedData.farm_parcels) {
                console.log("🚜 Mapped Farm Parcels (for UI):", normalizedData.farm_parcels);
                console.table(normalizedData.farm_parcels.map(p => ({
                    id: p.id,
                    location: p.farm_location,
                    area: p.total_farm_area_ha,
                    mapped_infos_count: p.parcel_infos?.length || 0
                })));
            }
            console.groupEnd();
        }
    }, [record, normalizedData]);

    // Helper to get current value (edited or original)
    const getValue = (path, defaultValue = "") => {
        const val = editedData[path] !== undefined ? editedData[path] : (normalizedData[path] || defaultValue);
        // console.log(`🔍 getValue(${path}):`, val);
        return val;
    };

    // Helper to get address value
    const getAddressValue = (kind, field, defaultValue = "") => {
        const addresses = normalizedData.addresses || [];
        const address = addresses.find(a => a.kind === kind) || {};
        const editKey = `${kind}_${field}`;
        return editedData[editKey] !== undefined ? editedData[editKey] : (address[field] || defaultValue);
    };

    // Handle field change
    const handleFieldChange = (fieldPath, value) => {
        setEditedData(prev => ({
            ...prev,
            [fieldPath]: value
        }));
        setHasChanges(true);
    };

    const handleCancelChanges = () => {
        setEditedData({});
        setHasChanges(false);
    };

    // Auto-calculate Total Farm Area if user edits crop sizes
    useEffect(() => {
        // We only recalc if we are in "Farmer" mode and have farm parcels
        if (record?.type !== "Farmer") return;

        const currentParcels = (editedData['farm_parcels'] !== undefined)
            ? editedData['farm_parcels']
            : (normalizedData.farm_parcels || []);

        // Check if any parcel needs an area update based on recent crop size changes
        // This is a simplified "Re-calc all" strategy for safety
        const updatedParcels = currentParcels.map(parcel => {
            // Calculate partial sum from infos
            const infos = parcel.parcel_infos || [];
            const calculatedArea = infos.reduce((sum, info) => {
                if (info.crop_commodity === 'Crops') {
                    return sum + (parseFloat(info.size) || 0);
                }
                return sum;
            }, 0);

            // Update the total_farm_area_ha if it differs significantly
            // We only update if the calculated area > 0 to avoid wiping manual entries if logic fails
            // But user requested: "Value should be based on Sum of all Size (ha)... not total of all"
            // So we enforce strict sum.
            return { ...parcel, total_farm_area_ha: calculatedArea > 0 ? calculatedArea.toFixed(2) : parcel.total_farm_area_ha };
        });

        // Only update state if something actually changed to avoid infinite loops
        // JSON.stringify compare is potentially expensive but safe for this depth
        if (JSON.stringify(updatedParcels) !== JSON.stringify(currentParcels)) {
            setEditedData(prev => ({ ...prev, farm_parcels: updatedParcels }));
        }
    }, [editedData, record, normalizedData]);

    // Save changes
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await onSave(editedData);
            setEditedData({});
            setHasChanges(false);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    };


    const sourceFundsOptions = ['Personal Savings', 'Family Support', 'Agricultural Income', 'Remittance', 'Loan', 'Government Assistance', 'Pension', 'Business Income'];

    if (!show || !record) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`Registrant Details - ${record.id}`}
            size="full"
        >
            <div className="space-y-6">
                {/* Personal Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-user mr-2"></i> Personal Information
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        {/* EDITABLE: Reference ID */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Reference ID</label>
                            <Input
                                value={getValue('reference_no', record.id)}
                                onChange={(e) => handleFieldChange('reference_no', e.target.value)}
                                className={`${inputClass} font-mono`}
                                placeholder="Reference ID"
                            />
                        </div>

                        {/* READ-ONLY: Registry Type */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Registry Type</label>
                            <div>
                                <Badge className={getTypeBadgeColor(record.type)}>
                                    {record.type}
                                </Badge>
                            </div>
                        </div>

                        {/* READ-ONLY: Status */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Status</label>
                            <div>
                                <Badge className={getStatusBadgeColor(record.status)}>
                                    {record.status}
                                </Badge>
                            </div>
                        </div>

                        {/* EDITABLE: Surname */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Surname</label>
                            <Input
                                value={getValue('surname')}
                                onChange={(e) => handleFieldChange('surname', e.target.value)}
                                className={inputClass}
                                placeholder="Surname"
                            />
                        </div>

                        {/* EDITABLE: First Name */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>First Name</label>
                            <Input
                                value={getValue('first_name')}
                                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                                className={inputClass}
                                placeholder="First Name"
                            />
                        </div>

                        {/* EDITABLE: Middle Name */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Middle Name</label>
                            <Input
                                value={getValue('middle_name')}
                                onChange={(e) => handleFieldChange('middle_name', e.target.value)}
                                className={inputClass}
                                placeholder="Middle Name"
                            />
                        </div>

                        {/* EDITABLE: Extension Name (Dropdown) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Extension Name</label>
                            <select
                                value={getValue('extension_name')}
                                onChange={(e) => handleFieldChange('extension_name', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select</option>
                                {extensionOptions.map(ext => (
                                    <option key={ext} value={ext}>{ext}</option>
                                ))}
                            </select>
                        </div>

                        {/* EDITABLE: Sex (Radio) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Sex</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('sex') === 'male'}
                                        onChange={() => handleFieldChange('sex', 'male')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Male</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('sex') === 'female'}
                                        onChange={() => handleFieldChange('sex', 'female')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Female</span>
                                </label>
                            </div>
                        </div>

                        {/* EDITABLE: Date of Birth */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Date of Birth</label>
                            <Input
                                type="date"
                                value={getValue('date_of_birth')}
                                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {/* EDITABLE: Place of Birth */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Place of Birth</label>
                            <Input
                                value={getValue('place_of_birth')}
                                onChange={(e) => handleFieldChange('place_of_birth', e.target.value)}
                                className={inputClass}
                                placeholder="City/Municipality, Province"
                            />
                        </div>

                        {/* EDITABLE: Religion (Dropdown) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Religion</label>
                            <select
                                value={getValue('religion')}
                                onChange={(e) => handleFieldChange('religion', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select</option>
                                {(() => {
                                    const currentVal = getValue('religion');
                                    const options = [...religionOptions];
                                    if (currentVal && !options.includes(currentVal)) {
                                        options.push(currentVal);
                                    }
                                    return options.map(rel => (
                                        <option key={rel} value={rel}>{rel}</option>
                                    ));
                                })()}
                            </select>
                        </div>

                        {/* EDITABLE: Civil Status (Dropdown) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Civil Status</label>
                            <select
                                value={getValue('civil_status')}
                                onChange={(e) => handleFieldChange('civil_status', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select</option>
                                {(() => {
                                    const currentVal = getValue('civil_status');
                                    const options = [...civilStatusOptions];
                                    if (currentVal && !options.includes(currentVal)) {
                                        options.push(currentVal);
                                    }
                                    return options.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ));
                                })()}
                            </select>
                        </div>

                        {/* CONDITIONAL: Spouse Name (show if Married) */}
                        {getValue('civil_status') === 'Married' && (
                            <div className="col-span-2">
                                <label className={`text-sm ${subTextClass}`}>Spouse Name</label>
                                <Input
                                    value={getValue('spouse_name')}
                                    onChange={(e) => handleFieldChange('spouse_name', e.target.value)}
                                    className={inputClass}
                                    placeholder="Spouse's full name"
                                />
                            </div>
                        )}

                        {/* EDITABLE: Mother's Maiden Name */}
                        <div className="col-span-3">
                            <label className={`text-sm ${subTextClass}`}>Mother's Maiden Full Name</label>
                            <Input
                                value={getValue('mother_full_name')}
                                onChange={(e) => handleFieldChange('mother_full_name', e.target.value)}
                                className={inputClass}
                                placeholder="Mother's full maiden name"
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
                        {/* EDITABLE: Mobile Number */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Mobile Number</label>
                            <div className="flex">
                                <span className={`inline-flex items-center px-3 text-sm ${isDark ? 'bg-[#252525] border-[#333333] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'} border border-r-0 rounded-l-md`}>
                                    +63
                                </span>
                                <Input
                                    value={getValue('mobile_number', '').replace('+63 - ', '').replace('+63-', '').replace('+63', '')}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        handleFieldChange('mobile_number', digits ? `+63 - ${digits}` : '');
                                    }}
                                    className={`${inputClass} rounded-l-none`}
                                    placeholder="0000000000"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* EDITABLE: Landline Number */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Landline Number</label>
                            <div className="flex">
                                <span className={`inline-flex items-center px-3 text-sm ${isDark ? 'bg-[#252525] border-[#333333] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'} border border-r-0 rounded-l-md`}>
                                    +63
                                </span>
                                <Input
                                    value={getValue('landline_number', '').replace('+63 - ', '').replace('+63-', '').replace('+63', '')}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        handleFieldChange('landline_number', digits ? `+63 - ${digits}` : '');
                                    }}
                                    className={`${inputClass} rounded-l-none`}
                                    placeholder="0000000000"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* EDITABLE: Emergency Contact Name */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Emergency Contact Name</label>
                            <Input
                                value={getValue('emergency_contact_name')}
                                onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                                className={inputClass}
                                placeholder="Full name"
                            />
                        </div>

                        {/* EDITABLE: Emergency Contact Phone */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Emergency Contact Phone</label>
                            <div className="flex">
                                <span className={`inline-flex items-center px-3 text-sm ${isDark ? 'bg-[#252525] border-[#333333] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'} border border-r-0 rounded-l-md`}>
                                    +63
                                </span>
                                <Input
                                    value={getValue('emergency_contact_phone', '').replace('+63 ', '').replace('+63-', '').replace('+63', '')}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        handleFieldChange('emergency_contact_phone', digits ? `+63 ${digits}` : '');
                                    }}
                                    className={`${inputClass} rounded-l-none`}
                                    placeholder="0000000000"
                                    maxLength={10}
                                    disabled={!getValue('emergency_contact_name')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-map-marker-alt mr-2"></i> Address
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        {/* EDITABLE: Barangay */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Barangay</label>
                            <select
                                value={getAddressValue('permanent', 'barangay')}
                                onChange={(e) => {
                                    handleFieldChange('permanent_barangay', e.target.value);
                                    handleFieldChange('permanent_purok', ''); // Reset purok when barangay changes
                                }}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select Barangay</option>
                                {barangayOptions.map(brgy => (
                                    <option key={brgy} value={brgy}>{brgy}</option>
                                ))}
                            </select>
                        </div>

                        {/* CONDITIONAL: Purok/Sitio (based on Barangay) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Purok/Sitio</label>
                            <select
                                value={getAddressValue('permanent', 'purok')}
                                onChange={(e) => handleFieldChange('permanent_purok', e.target.value)}
                                disabled={!getAddressValue('permanent', 'barangay')}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select Purok</option>
                                {getPurokOptions(getAddressValue('permanent', 'barangay')).map(purok => (
                                    <option key={purok} value={purok}>{purok}</option>
                                ))}
                            </select>
                        </div>

                        {/* EDITABLE: Municipality/City */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Municipality/City</label>
                            <Input
                                value={getAddressValue('permanent', 'municipality_city', 'Jasaan')}
                                onChange={(e) => handleFieldChange('permanent_municipality_city', e.target.value)}
                                className={inputClass}
                                placeholder="Municipality/City"
                            />
                        </div>

                        {/* EDITABLE: Province */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Province</label>
                            <Input
                                value={getAddressValue('permanent', 'province', 'Misamis Oriental')}
                                onChange={(e) => handleFieldChange('permanent_province', e.target.value)}
                                className={inputClass}
                                placeholder="Province"
                            />
                        </div>

                        {/* EDITABLE: Region */}
                        <div className="col-span-2">
                            <label className={`text-sm ${subTextClass}`}>Region</label>
                            <select
                                value={getAddressValue('permanent', 'region', 'Region 10 - Northern Mindanao')}
                                onChange={(e) => handleFieldChange('permanent_region', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                {regionOptions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Household Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-users mr-2"></i> Household Information
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                        {/* EDITABLE: Household Head (Radio) */}
                        <div className="col-span-4">
                            <label className={`text-sm ${subTextClass}`}>Household Head</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_household_head', true) === true}
                                        onChange={() => handleFieldChange('is_household_head', true)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_household_head', true) === false}
                                        onChange={() => handleFieldChange('is_household_head', false)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>No</span>
                                </label>
                            </div>
                        </div>

                        {/* CONDITIONAL: Show when NOT household head */}
                        {!getValue('is_household_head', true) && (
                            <>
                                <div className="col-span-2">
                                    <label className={`text-sm ${subTextClass}`}>Household Head Name</label>
                                    <Input
                                        value={getValue('household_head_name')}
                                        onChange={(e) => handleFieldChange('household_head_name', e.target.value)}
                                        className={inputClass}
                                        placeholder="Full name"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={`text-sm ${subTextClass}`}>Relationship to Household Head</label>
                                    <Input
                                        value={getValue('household_head_relationship')}
                                        onChange={(e) => handleFieldChange('household_head_relationship', e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g., Son, Daughter"
                                    />
                                </div>

                                {/* READ-ONLY: Total/Male/Female Members Count */}
                                <div>
                                    <label className={`text-sm ${subTextClass}`}>Total Members</label>
                                    <Input
                                        type="number"
                                        value={parseInt(getValue('household_males') || 0) + parseInt(getValue('household_females') || 0)}
                                        readOnly
                                        className={`${inputClass} opacity-70 cursor-not-allowed`}
                                        title="Auto-calculated from Males + Females"
                                    />
                                </div>

                                <div>
                                    <label className={`text-sm ${subTextClass}`}>Male Members</label>
                                    <Input
                                        type="number"
                                        value={getValue('household_males')}
                                        onChange={(e) => handleFieldChange('household_males', e.target.value)}
                                        className={inputClass}
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className={`text-sm ${subTextClass}`}>Female Members</label>
                                    <Input
                                        type="number"
                                        value={getValue('household_females')}
                                        onChange={(e) => handleFieldChange('household_females', e.target.value)}
                                        className={inputClass}
                                        placeholder="0"
                                    />
                                </div>
                            </>
                        )}


                    </div>
                </div>

                {/* Government IDs & Benefits Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-id-card mr-2"></i> Government IDs & Benefits
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        {/* EDITABLE: Government ID Type */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Government ID Type</label>
                            <select
                                value={getValue('government_id_type')}
                                onChange={(e) => handleFieldChange('government_id_type', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select ID Type</option>
                                {governmentIdOptions.map(id => (
                                    <option key={id} value={id}>{id}</option>
                                ))}
                                {getValue('government_id_type') && !governmentIdOptions.includes(getValue('government_id_type')) && (
                                    <option value={getValue('government_id_type')}>{getValue('government_id_type')}</option>
                                )}
                            </select>
                        </div>

                        {/* EDITABLE: ID Number */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>ID Number</label>
                            <Input
                                value={getValue('government_id_number')}
                                onChange={(e) => handleFieldChange('government_id_number', e.target.value)}
                                className={inputClass}
                                placeholder="ID Number"
                                disabled={!getValue('government_id_type')}
                            />
                        </div>

                        {/* EDITABLE: PWD (Radio) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>PWD</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_pwd', false) === true}
                                        onChange={() => handleFieldChange('is_pwd', true)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_pwd', false) === false}
                                        onChange={() => handleFieldChange('is_pwd', false)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>No</span>
                                </label>
                            </div>
                        </div>

                        {/* EDITABLE: 4Ps (Radio) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>4Ps Beneficiary</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_4ps', false) === true}
                                        onChange={() => handleFieldChange('is_4ps', true)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_4ps', false) === false}
                                        onChange={() => handleFieldChange('is_4ps', false)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>No</span>
                                </label>
                            </div>
                        </div>

                        {/* EDITABLE: Indigenous (Radio) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Indigenous</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_indigenous', false) === true}
                                        onChange={() => handleFieldChange('is_indigenous', true)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_indigenous', false) === false}
                                        onChange={() => handleFieldChange('is_indigenous', false)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>No</span>
                                </label>
                            </div>
                        </div>

                        {/* CONDITIONAL: Indigenous Group Name */}
                        {getValue('is_indigenous', false) === true && (
                            <div className="col-span-3">
                                <label className={`text-sm ${subTextClass}`}>Indigenous Group Name</label>
                                <Input
                                    value={getValue('indigenous_group_name')}
                                    onChange={(e) => handleFieldChange('indigenous_group_name', e.target.value)}
                                    className={inputClass}
                                    placeholder="Specify indigenous group name"
                                />
                            </div>
                        )}

                        {/* EDITABLE: Member of Cooperative (Radio) */}
                        <div className="col-span-3">
                            <label className={`text-sm ${subTextClass}`}>Member of Association/Cooperative</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_member_coop', false) === true}
                                        onChange={() => handleFieldChange('is_member_coop', true)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={getValue('is_member_coop', false) === false}
                                        onChange={() => handleFieldChange('is_member_coop', false)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className={`ml-2 ${textClass}`}>No</span>
                                </label>
                            </div>
                        </div>

                        {/* CONDITIONAL: Cooperative Name */}
                        {getValue('is_member_coop', false) === true && (
                            <div className="col-span-3">
                                <label className={`text-sm ${subTextClass}`}>Cooperative Name</label>
                                <Input
                                    value={getValue('coop_name')}
                                    onChange={(e) => handleFieldChange('coop_name', e.target.value)}
                                    className={inputClass}
                                    placeholder="Specify association/cooperative name"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-money-bill mr-2"></i> Financial Information
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        {/* EDITABLE: TIN Number */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>TIN Number</label>
                            <Input
                                value={getValue('tin_number', normalizedData.financial_infos?.tin_number || "")}
                                onChange={(e) => handleFieldChange('tin_number', e.target.value)}
                                className={inputClass}
                                placeholder="TIN Number"
                            />
                        </div>

                        {/* EDITABLE: Source of Funds (Dropdown) */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Source of Funds</label>
                            <select
                                value={getValue('source_of_funds', normalizedData.financial_infos?.source_of_funds || "")}
                                onChange={(e) => handleFieldChange('source_of_funds', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select</option>
                                {sourceFundsOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                {getValue('source_of_funds') && !sourceFundsOptions.includes(getValue('source_of_funds')) && (
                                    <option value={getValue('source_of_funds')}>{getValue('source_of_funds')}</option>
                                )}
                            </select>
                        </div>

                        {/* EDITABLE: Highest Education */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Highest Education</label>
                            <select
                                value={getValue('highest_education')}
                                onChange={(e) => handleFieldChange('highest_education', e.target.value)}
                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                            >
                                <option value="">Select</option>
                                {educationOptions.map(edu => (
                                    <option key={edu} value={edu}>{edu}</option>
                                ))}
                                {/* Handle legacy values */}
                                {getValue('highest_education') && !educationOptions.includes(getValue('highest_education')) && (
                                    <option value={getValue('highest_education')}>{getValue('highest_education')}</option>
                                )}
                            </select>
                        </div>

                        {/* EDITABLE: Income from Farming */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Income from Farming</label>
                            <Input
                                type="number"
                                value={getValue('income_farming', normalizedData.financial_infos?.income_farming || "")}
                                onChange={(e) => handleFieldChange('income_farming', e.target.value)}
                                className={inputClass}
                                placeholder="0.00"
                            />
                        </div>

                        {/* EDITABLE: Income from Non-Farming */}
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Income from Non-Farming</label>
                            <Input
                                type="number"
                                value={getValue('income_non_farming', normalizedData.financial_infos?.income_non_farming || "")}
                                onChange={(e) => handleFieldChange('income_non_farming', e.target.value)}
                                className={inputClass}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Farm Data Section - Only for Farmers */}
                {record.type === "Farmer" && (
                    <div>
                        <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                            <i className="fas fa-tractor mr-2"></i> Farm Data
                        </h4>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className={`font-semibold ${textClass}`}>Farm Parcels (Max 3)</h5>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                        if (currentParcels.length < 3) {
                                            const newParcel = {
                                                id: Date.now(),
                                                farmers_in_rotation: '',
                                                farm_location: '',
                                                total_farm_area_ha: '',
                                                ownership_document: '',
                                                ownership_document_no: '',
                                                ownership: '',
                                                within_ancestral_domain: false,
                                                agrarian_reform_beneficiary: false,
                                                parcel_infos: []
                                            };
                                            handleFieldChange('farm_parcels', [...currentParcels, newParcel]);
                                        }
                                    }}
                                    disabled={getValue('farm_parcels', fullData.farm_parcels || []).length >= 3}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm disabled:opacity-50 !rounded-button"
                                >
                                    <Plus className="h-4 w-4 mr-1 inline" /> Add Parcel
                                </Button>
                            </div>

                            {getValue('farm_parcels', fullData.farm_parcels || []).map((parcel, parcelIndex) => (
                                <div key={parcel.id || parcelIndex} className={`border ${tableBorderClass} rounded-lg p-4 ${isDark ? 'bg-[#1e1e1e]' : 'bg-card'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h6 className={`font-semibold ${textClass}`}>
                                            <i className="fas fa-map mr-2"></i>Parcel #{parcelIndex + 1}
                                        </h6>
                                        {getValue('farm_parcels', fullData.farm_parcels || []).length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.filter((_, idx) => idx !== parcelIndex);
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs !rounded-button"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Farmers in Rotation */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Farmers in Rotation</label>
                                            <Input
                                                value={parcel.farmers_in_rotation || ''}
                                                onChange={(e) => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.map((p, idx) =>
                                                        idx === parcelIndex ? { ...p, farmers_in_rotation: e.target.value } : p
                                                    );
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                className={inputClass}
                                                placeholder="Number of farmers"
                                            />
                                        </div>

                                        {/* Farm Location */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Farm Location</label>
                                            <Input
                                                value={parcel.farm_location || ''}
                                                onChange={(e) => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.map((p, idx) =>
                                                        idx === parcelIndex ? { ...p, farm_location: e.target.value } : p
                                                    );
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                className={inputClass}
                                                placeholder="Barangay, City/Municipality"
                                            />
                                        </div>

                                        {/* Total Farm Area */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Total Farm Area (ha)</label>
                                            <Input
                                                type="number"
                                                value={parcel.total_farm_area_ha || ''}
                                                readOnly
                                                className={`${inputClass} opacity-70 cursor-not-allowed`}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Ownership Document */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Ownership Document</label>
                                            <select
                                                value={parcel.ownership_document || ''}
                                                onChange={(e) => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.map((p, idx) =>
                                                        idx === parcelIndex ? { ...p, ownership_document: e.target.value, ownership_document_no: '', ownership: '' } : p
                                                    );
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                                            >
                                                <option value="">Select Document</option>
                                                {ownershipDocOptions.map(doc => (
                                                    <option key={doc} value={doc}>{doc}</option>
                                                ))}
                                                {parcel.ownership_document && !ownershipDocOptions.includes(parcel.ownership_document) && (
                                                    <option value={parcel.ownership_document}>{parcel.ownership_document}</option>
                                                )}
                                            </select>
                                        </div>

                                        {/* Document Number */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Document Number</label>
                                            <Input
                                                value={parcel.ownership_document_no || ''}
                                                onChange={(e) => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.map((p, idx) =>
                                                        idx === parcelIndex ? { ...p, ownership_document_no: e.target.value } : p
                                                    );
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                disabled={!parcel.ownership_document}
                                                className={inputClass}
                                                placeholder="Document Number"
                                            />
                                        </div>

                                        {/* Ownership Type */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Ownership Type</label>
                                            <select
                                                value={parcel.ownership || ''}
                                                onChange={(e) => {
                                                    const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                    const newParcels = currentParcels.map((p, idx) =>
                                                        idx === parcelIndex ? { ...p, ownership: e.target.value } : p
                                                    );
                                                    handleFieldChange('farm_parcels', newParcels);
                                                }}
                                                disabled={!parcel.ownership_document}
                                                className={`w-full h-10 px-3 py-2 rounded-md ${inputClass}`}
                                            >
                                                <option value="">Select Ownership Type</option>
                                                {ownershipTypeOptions.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                                {parcel.ownership && !ownershipTypeOptions.includes(parcel.ownership) && (
                                                    <option value={parcel.ownership}>{parcel.ownership}</option>
                                                )}
                                            </select>
                                        </div>

                                        {/* Within Ancestral Domain */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Within Ancestral Domain</label>
                                            <div className="flex gap-4 mt-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={parcel.within_ancestral_domain === true}
                                                        onChange={() => {
                                                            const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                            const newParcels = currentParcels.map((p, idx) =>
                                                                idx === parcelIndex ? { ...p, within_ancestral_domain: true } : p
                                                            );
                                                            handleFieldChange('farm_parcels', newParcels);
                                                        }}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={parcel.within_ancestral_domain === false}
                                                        onChange={() => {
                                                            const currentParcels = getValue('farm_parcels', fullData.farm_parcels || []);
                                                            const newParcels = currentParcels.map((p, idx) =>
                                                                idx === parcelIndex ? { ...p, within_ancestral_domain: false } : p
                                                            );
                                                            handleFieldChange('farm_parcels', newParcels);
                                                        }}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <span className={`ml-2 ${textClass}`}>No</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Agrarian Reform Beneficiary */}
                                        <div>
                                            <label className={`text-sm ${subTextClass}`}>Agrarian Reform Beneficiary</label>
                                            <div className="flex gap-4 mt-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={parcel.agrarian_reform_beneficiary === true}
                                                        onChange={() => {
                                                            const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                            const newParcels = currentParcels.map((p, idx) =>
                                                                idx === parcelIndex ? { ...p, agrarian_reform_beneficiary: true } : p
                                                            );
                                                            handleFieldChange('farm_parcels', newParcels);
                                                        }}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <span className={`ml-2 ${textClass}`}>Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={parcel.agrarian_reform_beneficiary === false}
                                                        onChange={() => {
                                                            const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                            const newParcels = currentParcels.map((p, idx) =>
                                                                idx === parcelIndex ? { ...p, agrarian_reform_beneficiary: false } : p
                                                            );
                                                            handleFieldChange('farm_parcels', newParcels);
                                                        }}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <span className={`ml-2 ${textClass}`}>No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Farm Parcel Information (Nested) */}
                                    <div className={`border-t ${tableBorderClass} mt-4 pt-4`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h6 className={`text-sm font-semibold ${textClass}`}>Farm Parcel Information (Max 5)</h6>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                    const currentParcel = currentParcels[parcelIndex];
                                                    const currentInfos = currentParcel.parcel_infos || [];

                                                    if (currentInfos.length < 5) {
                                                        const newInfo = {
                                                            id: Date.now(),
                                                            crop_commodity: 'Crops',
                                                            crop_name: '',
                                                            corn_type: '',
                                                            animal_name: '',
                                                            size: '',
                                                            head_count: '',
                                                            farm_type: '',
                                                            organic: ''
                                                        };
                                                        const newParcels = currentParcels.map((p, idx) =>
                                                            idx === parcelIndex ? { ...p, parcel_infos: [...currentInfos, newInfo] } : p
                                                        );
                                                        handleFieldChange('farm_parcels', newParcels);
                                                    }
                                                }}
                                                disabled={(parcel.parcel_infos || []).length >= 5}
                                                className="bg-blue-600/20 hover:bg-blue-600/80 text-white px-2 py-1 text-xs disabled:opacity-50 !rounded-button"
                                            >
                                                <Plus className="h-3 w-3 mr-1 inline" /> Add Info
                                            </Button>
                                        </div>

                                        {(parcel.parcel_infos || []).map((info, infoIndex) => (
                                            <div key={info.id || infoIndex} className={`border ${tableBorderClass} rounded p-3 mb-3 ${isDark ? 'bg-[#1A1A1A]' : 'bg-muted/30'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-sm font-medium ${subTextClass}`}>Parcel Info {infoIndex + 1}</span>
                                                    {(parcel.parcel_infos || []).length > 1 && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                const currentParcel = currentParcels[parcelIndex];
                                                                const newInfos = (currentParcel.parcel_infos || []).filter((_, idx) => idx !== infoIndex);
                                                                const newParcels = currentParcels.map((p, idx) =>
                                                                    idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                );
                                                                handleFieldChange('farm_parcels', newParcels);
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-1 py-1 text-xs !rounded-button"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    {/* Crop/Commodity */}
                                                    <div>
                                                        <label className={`text-xs ${subTextClass}`}>Crop/Commodity</label>
                                                        <select
                                                            value={info.crop_commodity || 'Crops'}
                                                            onChange={(e) => {
                                                                const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                const currentParcel = currentParcels[parcelIndex];
                                                                const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                    idx === infoIndex ? {
                                                                        ...i,
                                                                        crop_commodity: e.target.value,
                                                                        crop_name: '',
                                                                        animal_name: '',
                                                                        size: '',
                                                                        head_count: '',
                                                                        farm_type: '',
                                                                        organic: ''
                                                                    } : i
                                                                );
                                                                const newParcels = currentParcels.map((p, idx) =>
                                                                    idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                );
                                                                handleFieldChange('farm_parcels', newParcels);
                                                            }}
                                                            className={`w-full h-8 px-2 py-1 rounded text-sm ${inputClass}`}
                                                        >
                                                            {cropCommodityOptions.map(crop => (
                                                                <option key={crop} value={crop}>{crop}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* CROPS Fields */}
                                                    {info.crop_commodity === 'Crops' && (
                                                        <>
                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>Crop Name</label>
                                                                <input
                                                                    list={`cropList-${parcelIndex}-${infoIndex}`}
                                                                    value={info.crop_name || ''}
                                                                    onChange={(e) => {
                                                                        const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                        const currentParcel = currentParcels[parcelIndex];
                                                                        const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                            idx === infoIndex ? { ...i, crop_name: e.target.value } : i
                                                                        );
                                                                        const newParcels = currentParcels.map((p, idx) =>
                                                                            idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                        );
                                                                        handleFieldChange('farm_parcels', newParcels);
                                                                    }}
                                                                    className={`w-full h-8 px-2 py-1 rounded text-sm ${inputClass}`}
                                                                    placeholder="Search or type..."
                                                                />
                                                                <datalist id={`cropList-${parcelIndex}-${infoIndex}`}>
                                                                    {cropNameOptions.map(crop => (
                                                                        <option key={crop} value={crop} />
                                                                    ))}
                                                                </datalist>
                                                            </div>

                                                            {info.crop_name === 'Corn' && (
                                                                <div>
                                                                    <label className={`text-xs ${subTextClass}`}>Corn Type</label>
                                                                    <select
                                                                        value={info.corn_type || ''}
                                                                        onChange={(e) => {
                                                                            const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                            const currentParcel = currentParcels[parcelIndex];
                                                                            const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                                idx === infoIndex ? { ...i, corn_type: e.target.value } : i
                                                                            );
                                                                            const newParcels = currentParcels.map((p, idx) =>
                                                                                idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                            );
                                                                            handleFieldChange('farm_parcels', newParcels);
                                                                        }}
                                                                        className={`w-full h-8 px-2 py-1 rounded text-sm ${inputClass}`}
                                                                    >
                                                                        <option value="">Select Type</option>
                                                                        {cornTypeOptions.map(type => (
                                                                            <option key={type} value={type}>{type}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>Size (ha)</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={info.size || ''}
                                                                    onChange={(e) => {
                                                                        const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                        const currentParcel = currentParcels[parcelIndex];
                                                                        const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                            idx === infoIndex ? { ...i, size: e.target.value } : i
                                                                        );
                                                                        const newParcels = currentParcels.map((p, idx) =>
                                                                            idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                        );
                                                                        handleFieldChange('farm_parcels', newParcels);
                                                                    }}
                                                                    className={`h-8 text-sm ${inputClass}`}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>Farm Type</label>
                                                                <select
                                                                    value={info.farm_type || ''}
                                                                    onChange={(e) => {
                                                                        const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                        const currentParcel = currentParcels[parcelIndex];
                                                                        const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                            idx === infoIndex ? { ...i, farm_type: e.target.value } : i
                                                                        );
                                                                        const newParcels = currentParcels.map((p, idx) =>
                                                                            idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                        );
                                                                        handleFieldChange('farm_parcels', newParcels);
                                                                    }}
                                                                    className={`w-full h-8 px-2 py-1 rounded text-sm ${inputClass}`}
                                                                >
                                                                    <option value="">Select Type</option>
                                                                    {farmTypeOptions.map(type => (
                                                                        <option key={type} value={type}>{type}</option>
                                                                    ))}
                                                                    {info.farm_type && !farmTypeOptions.includes(info.farm_type) && (
                                                                        <option value={info.farm_type}>{info.farm_type}</option>
                                                                    )}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>Organic Practitioner</label>
                                                                <div className="flex gap-2 mt-1">
                                                                    <label className="flex items-center">
                                                                        <input
                                                                            type="radio"
                                                                            checked={info.organic === 'yes'}
                                                                            onChange={() => {
                                                                                const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                                const currentParcel = currentParcels[parcelIndex];
                                                                                const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                                    idx === infoIndex ? { ...i, organic: 'yes' } : i
                                                                                );
                                                                                const newParcels = currentParcels.map((p, idx) =>
                                                                                    idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                                );
                                                                                handleFieldChange('farm_parcels', newParcels);
                                                                            }}
                                                                            className="h-3 w-3 text-blue-600"
                                                                        />
                                                                        <span className={`ml-1 text-xs ${textClass}`}>Yes</span>
                                                                    </label>
                                                                    <label className="flex items-center">
                                                                        <input
                                                                            type="radio"
                                                                            checked={info.organic === 'no'}
                                                                            onChange={() => {
                                                                                const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                                const currentParcel = currentParcels[parcelIndex];
                                                                                const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                                    idx === infoIndex ? { ...i, organic: 'no' } : i
                                                                                );
                                                                                const newParcels = currentParcels.map((p, idx) =>
                                                                                    idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                                );
                                                                                handleFieldChange('farm_parcels', newParcels);
                                                                            }}
                                                                            className="h-3 w-3 text-blue-600"
                                                                        />
                                                                        <span className={`ml-1 text-xs ${textClass}`}>No</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* LIVESTOCK/POULTRY Fields */}
                                                    {(info.crop_commodity === 'Livestock' || info.crop_commodity === 'Poultry') && (
                                                        <>
                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>
                                                                    {info.crop_commodity === 'Livestock' ? 'Livestock' : 'Poultry'} Name
                                                                </label>
                                                                <input
                                                                    list={`animalList-${parcelIndex}-${infoIndex}`}
                                                                    value={info.animal_name || ''}
                                                                    onChange={(e) => {
                                                                        const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                        const currentParcel = currentParcels[parcelIndex];
                                                                        const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                            idx === infoIndex ? { ...i, animal_name: e.target.value } : i
                                                                        );
                                                                        const newParcels = currentParcels.map((p, idx) =>
                                                                            idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                        );
                                                                        handleFieldChange('farm_parcels', newParcels);
                                                                    }}
                                                                    className={`w-full h-8 px-2 py-1 rounded text-sm ${inputClass}`}
                                                                    placeholder="Search or type..."
                                                                />
                                                                <datalist id={`animalList-${parcelIndex}-${infoIndex}`}>
                                                                    {(info.crop_commodity === 'Livestock' ? livestockOptions : poultryOptions).map(animal => (
                                                                        <option key={animal} value={animal} />
                                                                    ))}
                                                                </datalist>
                                                            </div>

                                                            <div>
                                                                <label className={`text-xs ${subTextClass}`}>No. of Heads</label>
                                                                <Input
                                                                    type="number"
                                                                    value={info.head_count || ''}
                                                                    onChange={(e) => {
                                                                        const currentParcels = getValue('farm_parcels', normalizedData.farm_parcels || []);
                                                                        const currentParcel = currentParcels[parcelIndex];
                                                                        const newInfos = (currentParcel.parcel_infos || []).map((i, idx) =>
                                                                            idx === infoIndex ? { ...i, head_count: e.target.value } : i
                                                                        );
                                                                        const newParcels = currentParcels.map((p, idx) =>
                                                                            idx === parcelIndex ? { ...p, parcel_infos: newInfos } : p
                                                                        );
                                                                        handleFieldChange('farm_parcels', newParcels);
                                                                    }}
                                                                    className={`h-8 text-sm ${inputClass}`}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Registration Information Section - READ ONLY */}

                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-calendar mr-2"></i> Registration Information
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Registered On</label>
                            <p className={`${textClass} font-medium mt-1`}>{record.registeredOn}</p>
                        </div>
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Last Modified</label>
                            <p className={`${textClass} font-medium mt-1`}>{record.modifiedOn}</p>
                        </div>
                        <div>
                            <label className={`text-sm ${subTextClass}`}>Modified By</label>
                            <p className={`${textClass} font-medium mt-1`}>{record.modifiedBy}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex justify-between pt-4 border-t ${tableBorderClass} mt-6`}>
                <Button
                    onClick={onClose}
                    className={`${secondaryBtnClass} !rounded-button`}
                    disabled={isSaving}
                >
                    <i className="fas fa-times mr-2"></i> Close
                </Button>

                {hasChanges && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleCancelChanges}
                            className={`${secondaryBtnClass} !rounded-button`}
                            disabled={isSaving}
                        >
                            <i className="fas fa-undo mr-2"></i> Cancel Changes
                        </Button>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white !rounded-button"
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
                )}
            </div>
        </Modal >
    );
};

export default EditableViewModal;
