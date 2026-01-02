import React, { useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeContext } from "../App";

// Modal wrapper component (same as EditableViewModal but stripped down)
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
                <div className={`p-4 border-t ${headerBorderClass} flex justify-end`}>
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </div>
        </div>
    );
});

const ViewRecordModal = ({
    show,
    record,
    onClose,
    getStatusBadgeColor,
    getTypeBadgeColor,
}) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Style classes
    const textClass = isDark ? "text-white" : "text-foreground";
    const subTextClass = isDark ? "text-gray-400" : "text-muted-foreground";
    const tableBorderClass = isDark ? "border-[#333333]" : "border-border/50";
    const valueClass = isDark ? "text-gray-200 font-medium" : "text-gray-800 font-medium";

    // Normalize data structure from DB to UI format (Read-Only)
    const normalizedData = useMemo(() => {
        if (!record?.fullData) return {};
        const data = { ...record.fullData };

        if (data.farm_parcels) {
            data.farm_parcels = data.farm_parcels.map(parcel => ({
                ...parcel,
                parcel_infos: parcel.parcel_infos?.map(info => {
                    let flattened = { ...info };
                    // Map DB fields to UI fields
                    flattened.size = info.size_ha; // This is the crucial missing link in display
                    flattened.organic = info.is_organic_practitioner ? 'Yes' : 'No';
                    flattened.farm_type = info.farm_kind;

                    if (info.crops?.length > 0) {
                        flattened.crop_commodity = 'Crops';
                        flattened.crop_name = info.crops[0].name;
                        flattened.corn_type = info.crops[0].corn_type;
                        // If size_ha is null, try getting it from crop value_text
                        if (!flattened.size && info.crops[0].value_text) {
                            flattened.size = info.crops[0].value_text.replace(' ha', '');
                        }
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

        // === HYBRID FALLBACK: Legacy Data Support ===
        const hasNestedData = data.farm_parcels?.some(p => p.parcel_infos?.some(info =>
            (info.crops?.length > 0) || (info.livestock?.length > 0) || (info.poultry?.length > 0)
        ));

        if (!hasNestedData) {
            const rootCrops = Array.isArray(data.crops) ? data.crops : [];
            const rootLivestock = Array.isArray(data.livestock) ? data.livestock : [];
            const rootPoultry = Array.isArray(data.poultry) ? data.poultry : [];
            const productionInfos = [];

            rootCrops.forEach(c => {
                productionInfos.push({
                    id: c.id || `crop-${Math.random()}`,
                    crop_commodity: 'Crops',
                    crop_name: c.name,
                    size: c.value_text ? c.value_text.replace(' ha', '') : (parseFloat(c.value_text || 0) || 0),
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
                if (data.farm_parcels && data.farm_parcels.length > 0) {
                    if (!data.farm_parcels[0].parcel_infos) data.farm_parcels[0].parcel_infos = [];
                    data.farm_parcels[0].parcel_infos = [...data.farm_parcels[0].parcel_infos, ...productionInfos];
                } else {
                    data.farm_parcels = [{
                        id: 'virtual-production',
                        farm_location: 'Unassigned Production Data',
                        total_farm_area_ha: 0,
                        ownership_document: 'N/A',
                        ownership: 'N/A',
                        parcel_infos: productionInfos
                    }];
                }
            }
        }

        // Handle Financial Info (Array -> Object)
        if (Array.isArray(data.financial_infos) && data.financial_infos.length > 0) {
            data.financial_infos = data.financial_infos[0];
        }

        return data;
    }, [record]);

    const getValue = (path, defaultValue = "N/A") => {
        return normalizedData[path] || defaultValue;
    };

    const getAddressValue = (kind, field, defaultValue = "N/A") => {
        const addresses = normalizedData.addresses || [];
        const address = addresses.find(a => a.kind === kind) || {};
        return address[field] || defaultValue;
    };

    if (!show || !record) return null;

    const DisplayField = ({ label, value }) => (
        <div>
            <label className={`text-sm ${subTextClass} block mb-1`}>{label}</label>
            <p className={`${valueClass} break-words`}>{value || 'N/A'}</p>
        </div>
    );

    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`View Registrant Details - ${record.id}`}
            size="full"
        >
            <div className="space-y-6">
                {/* Personal Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-user mr-2"></i> Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DisplayField label="Reference ID" value={getValue('reference_no', record.id)} />
                        <div>
                            <label className={`text-sm ${subTextClass} block mb-1`}>Registry Type</label>
                            <Badge className={getTypeBadgeColor(record.type)}>{record.type}</Badge>
                        </div>
                        <div>
                            <label className={`text-sm ${subTextClass} block mb-1`}>Status</label>
                            <Badge className={getStatusBadgeColor(record.status)}>{record.status}</Badge>
                        </div>

                        <DisplayField label="Surname" value={getValue('surname')} />
                        <DisplayField label="First Name" value={getValue('first_name')} />
                        <DisplayField label="Middle Name" value={getValue('middle_name')} />
                        <DisplayField label="Extension Name" value={getValue('extension_name')} />
                        <DisplayField label="Sex" value={getValue('sex')} />
                        <DisplayField label="Date of Birth" value={getValue('date_of_birth')} />
                        <DisplayField label="Place of Birth" value={getValue('place_of_birth')} />
                        <DisplayField label="Religion" value={getValue('religion')} />
                        <DisplayField label="Civil Status" value={getValue('civil_status')} />

                        {getValue('civil_status') === 'Married' && (
                            <DisplayField label="Spouse Name" value={getValue('spouse_name')} />
                        )}

                        <div className="col-span-1 md:col-span-3">
                            <DisplayField label="Mother's Maiden Full Name" value={getValue('mother_full_name')} />
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-phone mr-2"></i> Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DisplayField label="Mobile Number" value={getValue('mobile_number')} />
                        <DisplayField label="Landline Number" value={getValue('landline_number')} />
                        <DisplayField label="Emergency Contact Name" value={getValue('emergency_contact_name')} />
                        <DisplayField label="Emergency Contact Phone" value={getValue('emergency_contact_phone')} />
                    </div>
                </div>

                {/* Address Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-map-marker-alt mr-2"></i> Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DisplayField label="Barangay" value={getAddressValue('permanent', 'barangay')} />
                        <DisplayField label="Purok/Sitio" value={getAddressValue('permanent', 'purok')} />
                        <DisplayField label="Municipality/City" value={getAddressValue('permanent', 'municipality_city')} />
                        <DisplayField label="Province" value={getAddressValue('permanent', 'province')} />
                        <div className="md:col-span-2">
                            <DisplayField label="Region" value={getAddressValue('permanent', 'region')} />
                        </div>
                    </div>
                </div>

                {/* Household Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-users mr-2"></i> Household Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-4">
                            <DisplayField label="Household Head" value={getValue('is_household_head') ? "Yes" : "No"} />
                        </div>

                        {!getValue('is_household_head') && (
                            <>
                                <div className="md:col-span-2">
                                    <DisplayField label="Household Head Name" value={getValue('household_head_name')} />
                                </div>
                                <div className="md:col-span-2">
                                    <DisplayField label="Relationship to Household Head" value={getValue('household_head_relationship')} />
                                </div>
                                <DisplayField label="Total Members" value={getValue('household_members_count')} />
                                <DisplayField label="Male Members" value={getValue('household_males')} />
                                <DisplayField label="Female Members" value={getValue('household_females')} />
                            </>
                        )}
                    </div>
                </div>

                {/* Government IDs & Benefits Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-id-card mr-2"></i> Government IDs & Benefits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DisplayField label="Government ID Type" value={getValue('government_id_type')} />
                        <DisplayField label="ID Number" value={getValue('government_id_number')} />
                        <DisplayField label="PWD" value={getValue('is_pwd') ? "Yes" : "No"} />
                        <DisplayField label="4Ps Beneficiary" value={getValue('is_4ps') ? "Yes" : "No"} />
                        <DisplayField label="Indigenous" value={getValue('is_indigenous') ? "Yes" : "No"} />

                        {getValue('is_indigenous') && (
                            <DisplayField label="Indigenous Group Name" value={getValue('indigenous_group_name')} />
                        )}

                        <div className="md:col-span-3">
                            <DisplayField label="Member of Association/Cooperative" value={getValue('is_member_coop') ? "Yes" : "No"} />
                            {getValue('is_member_coop') && (
                                <div className="mt-2">
                                    <DisplayField label="Cooperative Name" value={getValue('coop_name')} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Information Section */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-money-bill mr-2"></i> Financial Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DisplayField label="TIN Number" value={getValue('tin_number', normalizedData.financial_infos?.tin_number)} />
                        <DisplayField label="Source of Funds" value={getValue('source_of_funds', normalizedData.financial_infos?.source_of_funds)} />
                        <DisplayField label="Highest Education" value={getValue('highest_education')} />
                        <DisplayField label="Income from Farming" value={normalizedData.financial_infos?.income_farming} />
                        <DisplayField label="Income from Non-Farming" value={normalizedData.financial_infos?.income_non_farming} />
                    </div>
                </div>

                {/* Farm Data Section - Only for Farmers */}
                {record.type === "Farmer" && (
                    <div>
                        <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                            <i className="fas fa-tractor mr-2"></i> Farm Data
                        </h4>

                        <div className="space-y-4">
                            <h5 className={`font-semibold ${textClass}`}>Farm Parcels</h5>

                            {(normalizedData.farm_parcels || []).map((parcel, parcelIndex) => (
                                <div key={parcel.id || parcelIndex} className={`border ${tableBorderClass} rounded-lg p-4 ${isDark ? 'bg-[#1e1e1e]' : 'bg-card'}`}>
                                    <h6 className={`font-semibold ${textClass} mb-4`}>
                                        <i className="fas fa-map mr-2"></i>Parcel #{parcelIndex + 1}
                                    </h6>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <DisplayField label="Farmers in Rotation" value={parcel.farmers_in_rotation} />
                                        <DisplayField label="Farm Location" value={parcel.farm_location} />
                                        <DisplayField label="Total Farm Area (ha)" value={parcel.total_farm_area_ha} />
                                        <DisplayField label="Ownership Document" value={parcel.ownership_document} />
                                        <DisplayField label="Document Number" value={parcel.ownership_document_no} />
                                        <DisplayField label="Ownership Type" value={parcel.ownership} />
                                        <DisplayField label="Within Ancestral Domain" value={parcel.within_ancestral_domain ? "Yes" : "No"} />
                                        <DisplayField label="Agrarian Reform Beneficiary" value={parcel.agrarian_reform_beneficiary ? "Yes" : "No"} />
                                    </div>

                                    {/* Farm Parcel Information (Nested) */}
                                    <div className={`border-t ${tableBorderClass} pt-4`}>
                                        <h6 className={`text-sm font-semibold ${textClass} mb-3`}>Farm Parcel Information</h6>

                                        {(parcel.parcel_infos || []).map((info, infoIndex) => (
                                            <div key={info.id || infoIndex} className={`border ${tableBorderClass} rounded p-3 mb-3 ${isDark ? 'bg-[#1A1A1A]' : 'bg-muted/30'}`}>
                                                <span className={`text-sm font-medium ${subTextClass} block mb-2`}>Parcel Info {infoIndex + 1}</span>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <DisplayField label="Commodity" value={info.crop_commodity} />

                                                    {info.crop_commodity === 'Crops' && (
                                                        <>
                                                            <DisplayField label="Crop Name" value={info.crop_name} />
                                                            {info.crop_name === 'Corn' && (
                                                                <DisplayField label="Corn Type" value={info.corn_type} />
                                                            )}
                                                            <DisplayField label="Size (ha)" value={info.size} />
                                                            <DisplayField label="Farm Type" value={info.farm_type} />
                                                            <DisplayField label="Organic" value={info.organic} />
                                                        </>
                                                    )}

                                                    {(info.crop_commodity === 'Livestock' || info.crop_commodity === 'Poultry') && (
                                                        <>
                                                            <DisplayField label="Animal Name" value={info.animal_name} />
                                                            <DisplayField label="No. of Heads" value={info.head_count} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!parcel.parcel_infos || parcel.parcel_infos.length === 0) && (
                                            <p className={`text-sm ${subTextClass} italic`}>No additional info found for this parcel.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!normalizedData.farm_parcels || normalizedData.farm_parcels.length === 0) && (
                                <p className={`text-sm ${subTextClass} italic`}>No farm parcels recorded.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Registration Information Section - READ ONLY */}
                <div>
                    <h4 className={`text-lg font-semibold ${textClass} mb-3 border-b ${tableBorderClass} pb-2`}>
                        <i className="fas fa-calendar mr-2"></i> Registration Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DisplayField label="Registered On" value={record.registeredOn} />
                        <DisplayField label="Last Modified" value={record.modifiedOn} />
                        <DisplayField label="Modified By" value={record.modifiedBy} />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ViewRecordModal;
