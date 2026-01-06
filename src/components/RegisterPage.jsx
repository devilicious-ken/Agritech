import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, CheckCircle } from "lucide-react";
import ApiService from '../services/api';  // <-- ADDED ONLY THIS LINE

const RegisterPage = ({ user }) => {  // <-- ADDED user prop
  const [registryType, setRegistryType] = useState('farmer');
  const [activeTab, setActiveTab] = useState('personal');
  const [isHouseholdHead, setIsHouseholdHead] = useState(true);
  const [civilStatus, setCivilStatus] = useState('');
  const [sameAsPermAddress, setSameAsPermAddress] = useState(false);
  // Government ID is now always required - removed hasGovId state
  const [isPwd, setIsPwd] = useState(false);
  const [is4ps, setIs4ps] = useState(false);
  const [isIndigenous, setIsIndigenous] = useState(false);
  const [isMemberCoop, setIsMemberCoop] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Track if data has been loaded
  
  const [isRiceChecked, setIsRiceChecked] = useState(false);
  const [isCornChecked, setIsCornChecked] = useState(false);
  const [cornType, setCornType] = useState('');
  const [riceValue, setRiceValue] = useState('');
  const [cornValue, setCornValue] = useState('');
  
  // Dynamic form arrays
  // Your farmParcels state should store all the field data
// Dynamic form arrays
const [farmParcels, setFarmParcels] = useState([
  {
    id: Date.now(),
    farmer_rotation: '',
    farm_location: '',
    total_area: '',
    ownership_doc: '',
    ownership_doc_no: '',
    ownership_type: '',
    ancestral_domain: '',
    agrarian_reform: ''
  }
]);

// Extended parcelInfo to include crop_name / animal_name / corn_type
// Initialize with one parcel info for the first farm parcel
const [parcelInfo, setParcelInfo] = useState([
  {
    id: Date.now(),
    parcel_id: Date.now(), // Links to the first farm parcel
    crop_commodity: 'Crops',
    crop_name: '',
    corn_type: '',
    animal_name: '',
    size: '',
    head_count: '',
    farm_type: '',
    organic: '',
    remarks: ''
  }
]);

  const [otherCrops, setOtherCrops] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [poultry, setPoultry] = useState([]);
  const [fishingActivities, setFishingActivities] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [involvementTypes, setInvolvementTypes] = useState([]);
  const [religion, setReligion] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedPurok, setSelectedPurok] = useState('');
  const [selectedBarangayPresent, setSelectedBarangayPresent] = useState('');
  const [selectedPurokPresent, setSelectedPurokPresent] = useState('');

// Form data states for preview
const [formInputs, setFormInputs] = useState({
  reference_no: '',
  surname: '',
  first_name: '',
  middle_name: '',
  extension_name: '',
  sex: '',
  mobile_number: '',
  landline_number: '',
  date_of_birth: '',
  place_of_birth: '',
  mother_full_name: '',
  spouse_name: '',
  household_members_count: '',
  household_males: '',
  household_females: '',
  perm_municipality_city: 'Jasaan',
  perm_province: 'Misamis Oriental',
  perm_region: 'Region 10 - Northern Mindanao',
  pres_municipality_city: '',
  pres_province: '',
  pres_region: '',
  highest_education: '',
  rsbsa_reference_no: '',
  tin_number: '',
  profession: '',
  source_of_funds: '',
  income_farming: '',
  income_non_farming: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  government_id_type: '',
  government_id_number: '',
  coop_name: '',
  indigenous_group_name: ''
});

const [fishingCheckboxes, setFishingCheckboxes] = useState({
  fish_capture: false,
  aquaculture: false,
  gleaning: false,
  fish_processing: false,
  fish_vending: false
});

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormInputs(prev => ({
    ...prev,
    [name]: value
  }));
};

// Auto-copy permanent address to present address when checkbox is checked
React.useEffect(() => {
  if (sameAsPermAddress) {
    setSelectedBarangayPresent(selectedBarangay);
    setSelectedPurokPresent(selectedPurok);
    setFormInputs(prev => ({
      ...prev,
      pres_municipality_city: prev.perm_municipality_city,
      pres_province: prev.perm_province,
      pres_region: prev.perm_region
    }));
  }
}, [sameAsPermAddress, selectedBarangay, selectedPurok, formInputs.perm_municipality_city, formInputs.perm_province, formInputs.perm_region]);

// Load form data from localStorage on component mount
React.useEffect(() => {
  try {
    const savedFormData = localStorage.getItem('registerFormData');
    if (savedFormData) {
      const parsed = JSON.parse(savedFormData);
      
      // Restore all form states
      if (parsed.formInputs) {
        // Preserve default values if saved values are empty
        setFormInputs({
          ...parsed.formInputs,
          perm_municipality_city: parsed.formInputs.perm_municipality_city || 'Jasaan',
          perm_province: parsed.formInputs.perm_province || 'Misamis Oriental',
          perm_region: parsed.formInputs.perm_region || 'Region 10 - Northern Mindanao'
        });
      }
      if (parsed.registryType) setRegistryType(parsed.registryType);
      if (parsed.civilStatus) setCivilStatus(parsed.civilStatus);
      if (parsed.religion) setReligion(parsed.religion);
      if (parsed.selectedBarangay) setSelectedBarangay(parsed.selectedBarangay);
      if (parsed.selectedPurok) setSelectedPurok(parsed.selectedPurok);
      if (parsed.selectedBarangayPresent) setSelectedBarangayPresent(parsed.selectedBarangayPresent);
      if (parsed.selectedPurokPresent) setSelectedPurokPresent(parsed.selectedPurokPresent);
      if (typeof parsed.sameAsPermAddress === 'boolean') setSameAsPermAddress(parsed.sameAsPermAddress);
      if (typeof parsed.isHouseholdHead === 'boolean') setIsHouseholdHead(parsed.isHouseholdHead);
      if (typeof parsed.isPwd === 'boolean') setIsPwd(parsed.isPwd);
      if (typeof parsed.is4ps === 'boolean') setIs4ps(parsed.is4ps);
      if (typeof parsed.isIndigenous === 'boolean') setIsIndigenous(parsed.isIndigenous);
      if (typeof parsed.isMemberCoop === 'boolean') setIsMemberCoop(parsed.isMemberCoop);
      if (parsed.riceValue) setRiceValue(parsed.riceValue);
      if (parsed.cornValue) setCornValue(parsed.cornValue);
      if (typeof parsed.isRiceChecked === 'boolean') setIsRiceChecked(parsed.isRiceChecked);
      if (typeof parsed.isCornChecked === 'boolean') setIsCornChecked(parsed.isCornChecked);
      if (parsed.cornType) setCornType(parsed.cornType);
      if (parsed.otherCrops) setOtherCrops(parsed.otherCrops);
      if (parsed.livestock) setLivestock(parsed.livestock);
      if (parsed.poultry) setPoultry(parsed.poultry);
      if (parsed.farmParcels) setFarmParcels(parsed.farmParcels);
      if (parsed.parcelInfo) setParcelInfo(parsed.parcelInfo);
      if (parsed.fishingActivities) setFishingActivities(parsed.fishingActivities);
      if (parsed.fishingCheckboxes) setFishingCheckboxes(parsed.fishingCheckboxes);
    }
  } catch (error) {
    console.error('Error loading saved form data:', error);
  } finally {
    // Mark as initialized whether we loaded data or not
    setIsInitialized(true);
  }
}, []);

// Save form data to localStorage whenever it changes (but only after initialization)
React.useEffect(() => {
  // Don't save during initial load
  if (!isInitialized) return;
  
  const formData = {
    formInputs,
    registryType,
    civilStatus,
    religion,
    selectedBarangay,
    selectedPurok,
    selectedBarangayPresent,
    selectedPurokPresent,
    sameAsPermAddress,
    isHouseholdHead,
    isPwd,
    is4ps,
    isIndigenous,
    isMemberCoop,
    riceValue,
    cornValue,
    isRiceChecked,
    isCornChecked,
    cornType,
    otherCrops,
    livestock,
    poultry,
    farmParcels,
    parcelInfo,
    fishingActivities,
    fishingCheckboxes
  };
  
  localStorage.setItem('registerFormData', JSON.stringify(formData));
}, [
  isInitialized,
  formInputs, registryType, civilStatus, religion, selectedBarangay, selectedPurok,
  selectedBarangayPresent, selectedPurokPresent, sameAsPermAddress, isHouseholdHead,
  isPwd, is4ps, isIndigenous, isMemberCoop, riceValue, cornValue, isRiceChecked,
  isCornChecked, cornType, otherCrops, livestock, poultry, farmParcels, parcelInfo,
  fishingActivities, fishingCheckboxes
]);

  // <-- ADDED: Submission states (ONLY 2 LINES)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const getPurokOptions = (barangay) => {
    if (barangay === 'Upper Jasaan') {
      return ['Purok 5', 'Purok 6A', 'Purok 6B', 'Purok 7', 'Purok 8', 'Purok 9A', 'Purok 9B'];
    } else if (barangay === 'Lower Jasaan') {
      return ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 10', 'Purok 11'];
    }
    return [];
  };

  const addFormItem = (setter, currentArray) => {
    if (currentArray.length < 3) {
      const newId = Math.max(...currentArray.map(item => item.id)) + 1;
      const newItem = { id: newId };
      setter([...currentArray, newItem]);
      
      // If adding a farm parcel, also add a default parcel info entry
      if (setter === setFarmParcels) {
        const newParcelInfo = {
          id: Date.now() + Math.random(), // Ensure unique ID
          parcel_id: newId,
          crop_commodity: 'Crops',
          crop_name: '',
          corn_type: '',
          animal_name: '',
          size: '',
          head_count: '',
          farm_type: '',
          organic: '',
          remarks: ''
        };
        setParcelInfo(prev => [...prev, newParcelInfo]);
      }
    }
  };

  const removeFormItem = (setter, currentArray, id) => {
    if (currentArray.length > 1) {
      setter(currentArray.filter(item => item.id !== id));
      
      // If removing a farm parcel, also remove its parcel info entries
      if (setter === setFarmParcels) {
        setParcelInfo(prev => prev.filter(info => info.parcel_id !== id));
      }
    }
  };

  const addParcelInfo = (parcelId) => {
    const existingForParcel = parcelInfo.filter(p => p.parcel_id === parcelId);
    if (existingForParcel.length < 5) {
      setParcelInfo([
        ...parcelInfo,
        {
          id: Date.now(),
          parcel_id: parcelId,
          crop_commodity: 'Crops',
          crop_name: '',
          corn_type: '',
          animal_name: '',
          size: '',
          head_count: '',
          farm_type: '',
          organic: '',
          remarks: ''
        }
      ]);
    }
  };

const removeParcelInfo = (id) => {
  if (parcelInfo.length > 1) {
    setParcelInfo(parcelInfo.filter(item => item.id !== id));
  }
};


// Load sample data function - for testing


const handleSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // Validate Reference Number format (10-43-11-000-000000)
    const refNoPattern = /^\d{2}-\d{2}-\d{2}-\d{3}-\d{6}$/;
    if (!formInputs.reference_no || !refNoPattern.test(formInputs.reference_no)) {
      setSubmitError('Reference Number must be in format: 10-43-11-000-000000');
      setIsSubmitting(false);
      return;
    }

    // // Check for duplicate registration (Reference Number or Mobile Number)
    // const { data: existingRegistrant } = await ApiService.supabase
    //   .from('registrants')
    //   .select('id, reference_no, mobile_number')
    //   .or(`reference_no.eq.${formInputs.reference_no},mobile_number.eq.${formInputs.mobile_number}`)
    //   .limit(1);
    
    // if (existingRegistrant && existingRegistrant.length > 0) {
    //   setSubmitError('A registrant with this Reference Number or Mobile Number already exists.');
    //   setIsSubmitting(false);
    //   return;
    // }

    // Validate phone number format (+63 - 0000000000 or similar)
    const phonePattern = /^\+63[\s-]*\d{10}$/;
    if (formInputs.mobile_number && !phonePattern.test(formInputs.mobile_number.replace(/\s/g, ''))) {
      setSubmitError('Mobile Number must be in format: +63 - 0000000000 (10 digits after +63)');
      setIsSubmitting(false);
      return;
    }

    // Validate name fields (min 2 characters, no special characters)
    const namePattern = /^[A-Za-z\s]{2,}$/;
    const nameFields = {
      'Surname': formInputs.surname,
      'First Name': formInputs.first_name,
      'Middle Name': formInputs.middle_name
    };
    
    for (const [fieldName, value] of Object.entries(nameFields)) {
      if (value && !namePattern.test(value)) {
        setSubmitError(`${fieldName} must be at least 2 characters and contain only letters (no special characters like .,/*@-_)`);
        setIsSubmitting(false);
        return;
      }
    }

    // Validate required personal fields
    const requiredFields = {
      'Reference Number': formInputs.reference_no,
      'Surname': formInputs.surname,
      'First Name': formInputs.first_name,
      'Middle Name': formInputs.middle_name,
      'Sex': formInputs.sex,
      'Mobile Number': formInputs.mobile_number,
      'Date of Birth': formInputs.date_of_birth,
      'Civil Status': civilStatus,
      'Mother\'s Maiden Name': formInputs.mother_full_name,
      'Emergency Contact Name': formInputs.emergency_contact_name,
      'Emergency Contact Phone': formInputs.emergency_contact_phone,
      'Government ID Type': formInputs.government_id_type,
      'Government ID Number': formInputs.government_id_number
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field, value]) => !value || value.trim() === '')
      .map(([field]) => field);

    if (missingFields.length > 0) {
      setSubmitError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Validate required address fields (Barangay and Purok)
    if (!selectedBarangay || !selectedPurok) {
      setSubmitError('Please select Barangay and Purok in the Address section');
      setIsSubmitting(false);
      return;
    }

    // Validate farm parcel fields (for farmers only)
    if (registryType === 'farmer') {
      for (const parcel of farmParcels) {
        if (!parcel.farmer_rotation || !parcel.farm_location || !parcel.ownership_doc || !parcel.ownership_doc_no || !parcel.ownership_type) {
          setSubmitError('Please fill in all required Farm Parcel fields: Farmer\'s in Rotation, Farm Location, Ownership Document, Document No., and Ownership Type');
          setIsSubmitting(false);
          return;
        }
      }

      // Validate parcel info fields
      for (const info of parcelInfo) {
        if (info.crop_commodity === 'Crops') {
          if (!info.crop_name || !info.size || !info.farm_type) {
            setSubmitError('Please fill in all required Parcel Info fields: Crop Name, Size (ha), and Farm Type');
            setIsSubmitting(false);
            return;
          }
          if (info.crop_name === 'Corn' && !info.corn_type) {
            setSubmitError('Please select Corn Type (Yellow or White) for Corn crops');
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    // 1. CREATE REGISTRANT
    const registrantData = {
      user_id: null,
      registry: registryType,
      reference_no: formInputs.reference_no || null,
      surname: formInputs.surname || null,
      first_name: formInputs.first_name || null,
      middle_name: formInputs.middle_name || null,
      extension_name: formInputs.extension_name || null,
      sex: formInputs.sex || null,
      mobile_number: formInputs.mobile_number || null,
      landline_number: formInputs.landline_number || null,
      date_of_birth: formInputs.date_of_birth || null,
      place_of_birth: formInputs.place_of_birth || null,
      religion: religion || null,
      civil_status: civilStatus || null,
      spouse_name: civilStatus === 'Married' ? formInputs.spouse_name || null : null,
      mother_full_name: formInputs.mother_full_name || null,
      is_household_head: isHouseholdHead,
      household_members_count: !isHouseholdHead ? parseInt(formInputs.household_members_count) || null : null,
      household_males: !isHouseholdHead ? parseInt(formInputs.household_males) || null : null,
      household_females: !isHouseholdHead ? parseInt(formInputs.household_females) || null : null,
      is_pwd: isPwd,
      is_4ps: is4ps,
      is_indigenous: isIndigenous,
      indigenous_group_name: isIndigenous ? formInputs.indigenous_group_name || null : null,
      has_government_id: true,
      government_id_type: formInputs.government_id_type || null,
      government_id_number: formInputs.government_id_number || null,
      is_member_coop: isMemberCoop,
      coop_name: isMemberCoop ? formInputs.coop_name || null : null,
      emergency_contact_name: formInputs.emergency_contact_name || null,
      emergency_contact_phone: formInputs.emergency_contact_phone || null,
      highest_education: formInputs.highest_education || null
    };
    const registrant = await ApiService.createRegistrant(registrantData);
    
    // 2. CREATE ADDRESSES
    const addresses = [
      {
        registrant_id: registrant.id,
        kind: 'permanent',
        barangay: selectedBarangay || null,
        purok: selectedPurok || null,
        municipality_city: formInputs.perm_municipality_city || null,
        province: formInputs.perm_province || null,
        region: formInputs.perm_region || null
      }
    ];
    // Always create present address
    // If same as permanent, use permanent address values; otherwise use present address values
    addresses.push({
      registrant_id: registrant.id,
      kind: 'present',
      barangay: sameAsPermAddress ? (selectedBarangay || null) : (selectedBarangayPresent || null),
      purok: sameAsPermAddress ? (selectedPurok || null) : (selectedPurokPresent || null),
      municipality_city: sameAsPermAddress ? (formInputs.perm_municipality_city || null) : (formInputs.pres_municipality_city || null),
      province: sameAsPermAddress ? (formInputs.perm_province || null) : (formInputs.pres_province || null),
      region: sameAsPermAddress ? (formInputs.perm_region || null) : (formInputs.pres_region || null)
    });
    await ApiService.createAddress(addresses);

    // 3. CREATE FINANCIAL INFO
    const financialData = {
      registrant_id: registrant.id,
      rsbsa_reference_no: formInputs.rsbsa_reference_no || null,
      tin_number: formInputs.tin_number || null,
      profession: formInputs.profession || null,
      source_of_funds: formInputs.source_of_funds || null,
      income_farming: formInputs.income_farming ? parseFloat(formInputs.income_farming) : null,
      income_non_farming: formInputs.income_non_farming ? parseFloat(formInputs.income_non_farming) : null
    };
    await ApiService.createFinancialInfo(financialData);

    // 4. CREATE FARM PARCELS & PARCEL INFOS (with proper linking)
    // Initialize arrays to collect crops/livestock/poultry from parcel info
    const cropsFromParcels = [];
    const livestockFromParcels = [];
    const poultryFromParcels = [];

    // Loop through farm parcels
    for (const parcel of farmParcels) {
      if (parcel.farm_location) {
        // Get parcel infos associated with THIS specific parcel (by parcel_id)
        const parcelInfosForThisParcel = parcelInfo.filter(info => 
          info.parcel_id === parcel.id
        );
        
        // Calculate total farm area for THIS parcel only (not all parcels combined)
        const totalFarmAreaForThisParcel = parcelInfosForThisParcel
          .filter(info => info.crop_commodity === 'Crops' && info.size)
          .reduce((sum, info) => sum + parseFloat(info.size || 0), 0);
        
        // Create farm parcel with its own total area
        const parcelData = {
          registrant_id: registrant.id,
          farmers_in_rotation: parcel.farmer_rotation || null,
          farm_location: parcel.farm_location || null,
          total_farm_area_ha: totalFarmAreaForThisParcel > 0 ? totalFarmAreaForThisParcel : null,
          ownership_document: parcel.ownership_doc || null,
          ownership_document_no: parcel.ownership_doc_no || null,
          ownership: parcel.ownership_type || null,
          within_ancestral_domain: parcel.ancestral_domain === 'yes',
          agrarian_reform_beneficiary: parcel.agrarian_reform === 'yes',
          latitude: null,  // Will be set by SetFarmLocationPage
          longitude: null, // Will be set by SetFarmLocationPage
          image_url: null  // Will be set by SetFarmLocationPage
        };
        const savedParcel = await ApiService.createFarmParcel(parcelData);
        
        // Process each parcel info for this farm parcel
        for (const info of parcelInfosForThisParcel) {
          if (!info.crop_commodity) continue;
          
          // Create parcel_info record FIRST to get the ID
          const parcelInfoData = {
            parcel_id: savedParcel.id,
            farm_kind: info.farm_type || null,
            is_organic_practitioner: info.organic === 'yes',
            remarks: info.remarks || null
          };
          
          const savedParcelInfos = await ApiService.createParcelInfos([parcelInfoData]);
          const parcelInfoId = savedParcelInfos[0].id;
          
          // Now create commodity records WITH parcel_info_id linking
          if (info.crop_commodity === 'Crops' && info.crop_name) {
            cropsFromParcels.push({
              registrant_id: registrant.id,
              parcel_info_id: parcelInfoId,  // ✅ Links to parcel_info
              name: info.crop_name,
              value_text: info.size ? `${info.size} ha` : null,
              corn_type: info.crop_name === 'Corn' && info.corn_type ? info.corn_type.toLowerCase() : null
            });
          } else if (info.crop_commodity === 'Livestock' && info.animal_name) {
            livestockFromParcels.push({
              registrant_id: registrant.id,
              parcel_info_id: parcelInfoId,  // ✅ Links to parcel_info
              animal: info.animal_name,
              head_count: info.head_count ? parseInt(info.head_count) : null
            });
          } else if (info.crop_commodity === 'Poultry' && info.animal_name) {
            poultryFromParcels.push({
              registrant_id: registrant.id,
              parcel_info_id: parcelInfoId,  // ✅ Links to parcel_info
              bird: info.animal_name,
              head_count: info.head_count ? parseInt(info.head_count) : null
            });
          }
        }
      }
    }

    // 5. CREATE CROPS (now includes both manual entries and parcel-derived crops)
    const cropsToSave = [];

    // Add crops from manual entry (Rice, Corn, Other Crops)
    if (isRiceChecked && riceValue) {
      cropsToSave.push({
        registrant_id: registrant.id,
        name: 'Rice',
        value_text: riceValue,
        corn_type: null
      });
    }
    if (isCornChecked && cornValue) {
      cropsToSave.push({
        registrant_id: registrant.id,
        name: 'Corn',
        value_text: cornValue,
        corn_type: cornType ? cornType.toLowerCase() : null
      });
    }
    otherCrops.forEach(crop => {
      if (crop.name) {
        cropsToSave.push({
          registrant_id: registrant.id,
          name: crop.name,
          value_text: crop.value || null,
          corn_type: null
        });
      }
    });

    // Add crops derived from parcelInfo
    cropsFromParcels.forEach(c => cropsToSave.push(c));

    if (cropsToSave.length > 0) {
      await ApiService.createCrops(cropsToSave);
    }

    // 6. CREATE LIVESTOCK (now includes both manual entries and parcel-derived livestock)
    const livestockToSave = [
      ...livestock
        .filter(item => item.animal)
        .map(item => ({
          registrant_id: registrant.id,
          animal: item.animal,
          head_count: item.head_count ? parseInt(item.head_count) : null
        })),
      ...livestockFromParcels
    ];

    if (livestockToSave.length > 0) {
      await ApiService.createLivestock(livestockToSave);
    }

    // 7. CREATE POULTRY (now includes both manual entries and parcel-derived poultry)
    const poultryToSave = [
      ...poultry
        .filter(item => item.bird)
        .map(item => ({
          registrant_id: registrant.id,
          bird: item.bird,
          head_count: item.head_count ? parseInt(item.head_count) : null
        })),
      ...poultryFromParcels
    ];

    if (poultryToSave.length > 0) {
      await ApiService.createPoultry(poultryToSave);
    }

    // 8. CREATE FISHING ACTIVITIES
    const fishingActivitiesToSave = [];
    Object.keys(fishingCheckboxes).forEach(key => {
      if (fishingCheckboxes[key]) {
        const activityName = key.replace(/_/g, ' ').replace(/^./, l => l.toUpperCase());
        fishingActivitiesToSave.push({
          registrant_id: registrant.id,
          activity: activityName
        });
      }
    });
    fishingActivities.forEach(activity => {
      if (activity.activity) {
        fishingActivitiesToSave.push({
          registrant_id: registrant.id,
          activity: activity.activity
        });
      }
    });
    if (fishingActivitiesToSave.length > 0) {
      await ApiService.createFishingActivities(fishingActivitiesToSave);
    }

    // 9. CREATE WORK TYPES
    if (workTypes.length > 0) {
      const workTypesToSave = workTypes.map(work => ({
        registrant_id: registrant.id,
        work
      }));
      await ApiService.createWorkTypes(workTypesToSave);
    }

    // 10. CREATE INVOLVEMENT TYPES
    if (involvementTypes.length > 0) {
      const involvementTypesToSave = involvementTypes.map(involvement => ({
        registrant_id: registrant.id,
        involvement
      }));
      await ApiService.createInvolvementTypes(involvementTypesToSave);
    }

    // 11. LOG ACTIVITY
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = currentUser.role || 'user';
      const userName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Unknown User';
      await ApiService.createActivityLog(
        currentUser.id,
        userName,
        'Add Registrant',
        `${registrant.reference_no} (${registrant.first_name} ${registrant.surname}) - Registry: ${registryType} - Role: ${userRole}`,
        await ApiService.getUserIpAddress()
      );
    } catch (logError) {
      // Don't fail the registration if logging fails
      console.error('Failed to log activity:', logError);
    }

    // 12. RESET FORM
    setFormInputs({
      reference_no: '', surname: '', first_name: '', middle_name: '', extension_name: '', sex: '',
      mobile_number: '', landline_number: '', date_of_birth: '', place_of_birth: '', mother_full_name: '', spouse_name: '',
      perm_municipality_city: '', perm_province: '', perm_region: '',
      pres_municipality_city: '', pres_province: '', pres_region: '',
      highest_education: '', rsbsa_reference_no: '', tin_number: '', profession: '', source_of_funds: '', income_farming: '', income_non_farming: ''
    });
    setReligion('');
    setCivilStatus('');
    setSelectedBarangay('');
    setSelectedPurok('');
    setSelectedBarangayPresent('');
    setSelectedPurokPresent('');
    setSameAsPermAddress(false);
    setIsHouseholdHead(true);
    // Government ID is now required - no need to reset hasGovId
    setIsPwd(false);
    setIs4ps(false);
    setIsIndigenous(false);
    setIsMemberCoop(false);
    setRiceValue('');
    setCornValue('');
    setIsRiceChecked(false);
    setIsCornChecked(false);
    setCornType('');
    setOtherCrops([{ id: Date.now(), name: '', value: '' }]);
    setLivestock([{ id: Date.now(), animal: '', head_count: '' }]);
    setPoultry([{ id: Date.now(), bird: '', head_count: '' }]);
    setFarmParcels([{
      id: Date.now(), farmer_rotation: '', farm_location: '', total_area: '', ownership_doc: '', ownership_doc_no: '',
      ownership_type: '', ancestral_domain: '', agrarian_reform: ''
    }]);
    setParcelInfo([
  {
    id: Date.now(),
    crop_commodity: 'Crops',
    crop_name: '',
    animal_name: '',
    size: '',
    head_count: '',
    farm_type: '',
    organic: '',
    remarks: ''
  }
]);
    setFishingActivities([{ id: Date.now(), activity: '' }]);
    setFishingCheckboxes({
      fish_capture: false, aquaculture: false, gleaning: false, fish_processing: false, fish_vending: false
    });
    setActiveTab('personal');
    setShowSuccessModal(true);
    setIsSubmitting(false);
    
    // Clear localStorage after successful submission
    localStorage.removeItem('registerFormData');

  } catch (error) {
    console.error('ERROR:', error);
    setSubmitError(error.message || 'Registration failed');
    setIsSubmitting(false);
  }
};

  // Clear all form fields
  const clearAllFields = () => {
    setFormInputs({
      reference_no: '', surname: '', first_name: '', middle_name: '', extension_name: '', sex: '',
      mobile_number: '', landline_number: '', date_of_birth: '', place_of_birth: '', mother_full_name: '', spouse_name: '',
      perm_municipality_city: '', perm_province: '', perm_region: '',
      pres_municipality_city: '', pres_province: '', pres_region: '',
      highest_education: '', rsbsa_reference_no: '', tin_number: '', profession: '', source_of_funds: '', income_farming: '', income_non_farming: '',
      emergency_contact_name: '', emergency_contact_phone: '', government_id_type: '', government_id_number: '', coop_name: '', indigenous_group_name: ''
    });
    setReligion('');
    setCivilStatus('');
    setSelectedBarangay('');
    setSelectedPurok('');
    setSelectedBarangayPresent('');
    setSelectedPurokPresent('');
    setSameAsPermAddress(false);
    setIsHouseholdHead(true);
    setIsPwd(false);
    setIs4ps(false);
    setIsIndigenous(false);
    setIsMemberCoop(false);
    setRiceValue('');
    setCornValue('');
    setIsRiceChecked(false);
    setIsCornChecked(false);
    setCornType('');
    setOtherCrops([{ id: Date.now(), name: '', value: '' }]);
    setLivestock([{ id: Date.now(), animal: '', head_count: '' }]);
    setPoultry([{ id: Date.now(), bird: '', head_count: '' }]);
    const initialParcelId = Date.now();
    setFarmParcels([{
      id: initialParcelId, 
      farmer_rotation: '', 
      farm_location: '', 
      total_area: '', 
      ownership_doc: '', 
      ownership_doc_no: '',
      ownership_type: '', 
      ancestral_domain: '', 
      agrarian_reform: ''
    }]);
    setParcelInfo([{
      id: Date.now(),
      parcel_id: initialParcelId,
      crop_commodity: 'Crops',
      crop_name: '',
      corn_type: '',
      animal_name: '',
      size: '',
      head_count: '',
      farm_type: '',
      organic: '',
      remarks: ''
    }]);
    setFishingActivities([{ id: Date.now(), activity: '' }]);
    setFishingCheckboxes({
      fish_capture: false, aquaculture: false, gleaning: false, fish_processing: false, fish_vending: false
    });
    setActiveTab('personal');
    setSubmitError(null);
    
    // Clear localStorage
    localStorage.removeItem('registerFormData');
  };
  
  const closeModal = () => {
    setShowSuccessModal(false);
    setActiveTab('personal'); // Reset to first tab after successful submission
  };

  const extensionOptions = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
  const religionOptions = ['Roman Catholic', 'Protestant', 'Iglesia ni Cristo', 'Islam', 'Seventh-day Adventist', 'Aglipayan', 'Bible Baptist Church', 'United Church of Christ', 'Jehovah\'s Witness', 'Church of Christ', 'Born Again Christian', 'Buddhist', 'Hindu'];
  const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated'];
  const educationOptions = ['Pre-School', 'Elementary', 'High School (non-K12)', 'Junior High School (K-12)', 'Senior High School (K-12)', 'College', 'Vocational', 'Post-Graduate', 'None'];
  const ownershipDocOptions = ['Certificate of Land Transfer', 'Emancipation Patent', 'Individual Certificate of Land Ownership Award (CLOA)', 'Collective CLOA', 'Co-ownership CLOA', 'Agricultural Sales Patent', 'Homestead Patent', 'Free Patent', 'Certificate of Title or Regular Title', 'Certificate of Ancestral Domain Title', 'Certificate of Ancestral Land Title', 'Tax Declaration'];
  const ownershipTypeOptions = ['Registered Owner', 'Tenant', 'Lessee', 'Mortgage'];
  const farmTypeOptions = ['Irrigated', 'Rainfed Upland', 'Rainfed Lowland'];
  const cropCommodityOptions = ['Crops', 'Poultry', 'Livestock'];
  
  // Comprehensive crop list - Vegetables, Fruits, Plantation Crops
  const cropNameOptions = [
    // Vegetables & Legumes
    'Ampalaya', 'Broccoli', 'Cabbage', 'Carrot', 'Cauliflower', 'Eggplant (Talong)', 'Ginger', 'Gourd (Upo/Patola)', 'Lettuce', 'Okra', 
    'Pechay (Native)', 'Pechay (Chinese/Bok choy)', 'Pepper (Chili/Bell)', 'Squash (Kalabasa)', 'String beans/Sitaw', 'Tomato', 
    'Sweet potato (Kamote)', 'Cassava', 'Ube (Purple yam)', 'Gabi (Taro)', 'Singkamas', 'Spring onions', 'Celery', 'Mustard (Mustasa)', 
    'Onion', 'Onion (bunching)', 'Cucumber', 'Radish (Labanos)', 'Spinach', 'Corn', 'Peas/Sweet peas', 'Beans (bush/pole)', 
    'Peanut', 'Mung bean (Munggo)', 'Garlic (Bawang)', 'Kangkong (Water spinach)', 'Alugbati (Malabar spinach)', 'Patola (Sponge gourd)', 
    'Sayote (Chayote)',
    // Fruits
    'Banana', 'Mango', 'Pineapple', 'Papaya', 'Rambutan', 'Lanzones', 'Durian', 'Guava', 'Pomelo', 'Citrus (Calamansi/Oranges)', 
    'Mangosteen', 'Watermelon', 'Melon (Cantaloupe)', 'Coconut (Niyog)', 'Jackfruit (Langka)', 'Calamansi', 'Avocado', 
    'Guyabano (Soursop)', 'Atis (Sugar apple)', 'Chico (Sapodilla)', 'Dalandan (Orange)',
    // Industrial / Plantation Crops
    'Coffee', 'Rubber', 'Cashew', 'Sugarcane', 'Rice', 'Abaca', 'Cacao', 'Tobacco'
  ];
  
  
  const cornTypeOptions = [
    { value: 'yellow', label: 'Yellow' },
    { value: 'white', label: 'White' }
  ];
  const governmentIdOptions = ['PhilID / ePhilID', 'GSIS', 'SSS', 'PhilHealth', 'Voter\'s ID', 'Driver\'s License', 'PRC License', 'Passport', 'Senior Citizen ID', 'PWD ID', 'Postal ID', 'TIN ID', 'Barangay ID', 'Company ID', 'School ID'];
  const sourceFundsOptions = ['Personal Savings', 'Family Support', 'Agricultural Income', 'Remittance', 'Loan', 'Government Assistance', 'Pension', 'Business Income'];
  
  // Poultry animals
  const poultryOptions = ['Chicken', 'Duck', 'Turkey', 'Gamefowl'];
  
  // Livestock animals
  const livestockOptions = ['Carabao', 'Cattle/Cow', 'Goat', 'Pig/Swine', 'Sheep', 'Horse'];
  
  // Region options
  const regionOptions = ['Region 1 - Ilocos', 'Region 2 - Cagayan Valley', 'Region 3 - Central Luzon', 'Region 4A - CALABARZON', 'Region 4B - MIMAROPA', 'Region 5 - Bicol', 'Region 6 - Western Visayas', 'Region 7 - Central Visayas', 'Region 8 - Eastern Visayas', 'Region 9 - Zamboanga Peninsula', 'Region 10 - Northern Mindanao', 'Region 11 - Davao', 'Region 12 - SOCCSKSARGEN', 'Region 13 - Caraga', 'NCR - National Capital Region', 'CAR - Cordillera', 'BARMM - Bangsamoro'];

  const renderRegistrySelector = () => (
    
    
    <div className="bg-card p-4 rounded-md border border-gray-700/30 dark:border-gray-700/30 mb-6">
      <h3 className="text-foreground font-medium mb-4">Select Registry Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {[
          { value: 'farmer', label: 'Farmer', desc: 'Register as a farmer with crop and animal production details', color: '#3366CC' },
          { value: 'fisherfolk', label: 'Fisherfolk', desc: 'Register as a fisherfolk with fishing activities', color: '#33CC33' },
                  ].map((type) => (
          <div
            key={type.value}
            className={`border rounded-md p-4 cursor-pointer transition-colors ${
              registryType === type.value
                ? 'border-blue-600 dark:border-blue-600/50 bg-blue-600/10'
                : 'border border-gray-700/30 dark:border-gray-700/30 bg-card hover:bg-muted'
            }`}
            onClick={() => setRegistryType(type.value)}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                checked={registryType === type.value}
                onChange={() => setRegistryType(type.value)}
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 text-foreground font-medium">{type.label}</label>
            </div>
            <p className="text-muted-foreground text-sm">{type.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );


  // ========== COMPLETE MODIFIED PERSONAL INFO TAB ==========
// Copy and paste this to replace your renderPersonalInfoTab function

const renderPersonalInfoTab = () => (
  <div className="space-y-6">
    {/* Reference Number */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Reference Number <span className="text-red-500">*</span></label>
      <div className="flex">
        <span className="inline-flex items-center px-2 min-w-[85px] text-sm text-muted-foreground bg-muted/50 border border-r-0 border border-gray-700/30 dark:border-gray-700/30 rounded-l-md">
            10-43-11-
        </span>
        <Input 
          name="reference_no"
          value={formInputs.reference_no?.replace('10-43-11-', '') || ''}
          onChange={(e) => {
            // Remove all non-digits
            let digits = e.target.value.replace(/\D/g, '');
            // Limit to (3+6 = 9 digits? user said 10-43-11-000-000000 which is 3+6=9 after prefix?)
            // Previous placeholder: 10-43-11-000-000000
            // Prefix: 10-43-11- (8 chars)
            // Remaining: 000-000000 (3 + 6 = 9 digits)
            
            // User request: "make the Reference Number has limits and has prefix which is 10-43-11-"
            // And: "12 numbers with auto insert '-' if i type 3 characters like 123 then generate - then 123 and so on also on reference number"
            
            // If I assume 3-6 format (XXX-XXXXXX):
            digits = digits.slice(0, 9);
            
            let formatted = '';
            if (digits.length > 0) formatted += digits.slice(0, 3);
            if (digits.length > 3) formatted += '-' + digits.slice(3, 9);
            
            setFormInputs(prev => ({
              ...prev,
              reference_no: digits ? `10-43-11-${formatted}` : ''
            }));
          }}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground rounded-l-none" 
          placeholder="000-000000" 
          maxLength={10} // 3+1+6
          required
        />
      </div>
    </div>

    {/* Name Fields */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Surname <span className="text-red-500">*</span></label>
        <Input 
          name="surname"
          value={formInputs.surname}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="Surname" 
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">First Name <span className="text-red-500">*</span></label>
        <Input 
          name="first_name"
          value={formInputs.first_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="First Name" 
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Middle Name <span className="text-red-500">*</span></label>
        <Input 
          name="middle_name"
          value={formInputs.middle_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="Middle Name" 
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Extension Name</label>
        <select 
          name="extension_name"
          value={formInputs.extension_name}
          onChange={handleInputChange}
          className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
        >
          <option value="">Select</option>
          {extensionOptions.map(ext => (
            <option key={ext} value={ext}>{ext}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Sex */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Sex <span className="text-red-500">*</span></label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="sex" 
            value="male"
            checked={formInputs.sex === 'male'}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600" 
            required
          />
          <span className="ml-2 text-muted-foreground">Male</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="sex" 
            value="female"
            checked={formInputs.sex === 'female'}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600" 
            required
          />
          <span className="ml-2 text-muted-foreground">Female</span>
        </label>
      </div>
    </div>

    {/* Contact Numbers */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Mobile Number <span className="text-red-500">*</span></label>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted/50 border border-r-0 border border-gray-700/30 dark:border-gray-700/30 rounded-l-md">
            +63 
          </span>
          <Input 
            name="mobile_number"
            value={formInputs.mobile_number?.replace('+63 - ', '').replace('+63-', '').replace('+63', '') || ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormInputs(prev => ({
                ...prev,
                mobile_number: digits ? `+63 - ${digits}` : ''
              }));
            }}
            className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground rounded-l-none" 
            placeholder="0000000000"
            maxLength={10}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Landline Number (Optional)</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted/50 border border-r-0 border border-gray-700/30 dark:border-gray-700/30 rounded-l-md">
            +63 
          </span>
          <Input 
            name="landline_number"
            value={formInputs.landline_number?.replace('+63 - ', '').replace('+63-', '').replace('+63', '') || ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormInputs(prev => ({
                ...prev,
                landline_number: digits ? `+63 - ${digits}` : ''
              }));
            }}
            className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground rounded-l-none" 
            placeholder="0000000000"
            maxLength={10}
          />
        </div>
      </div>
    </div>

    {/* Birth Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Date of Birth <span className="text-red-500">*</span></label>
        <Input 
          name="date_of_birth"
          value={formInputs.date_of_birth}
          onChange={handleInputChange}
          type="date"
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Place of Birth</label>
        <Input 
          name="place_of_birth"
          value={formInputs.place_of_birth}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="City/Municipality, Province" 
        />
      </div>
    </div>

    {/* Religion */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Religion</label>
      <select 
        value={religion}
        onChange={(e) => setReligion(e.target.value)}
        className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
      >
        <option value="">Select</option>
        {religionOptions.map(rel => (
          <option key={rel} value={rel}>{rel}</option>
        ))}
      </select>
      {religion === 'Others' && (
        <Input 
          name="religion_other"
          value={formInputs.religion_other}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground mt-2" 
          placeholder="Specify religion" 
        />
      )}
    </div>

    {/* Civil Status */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Civil Status <span className="text-red-500">*</span></label>
      <select 
        value={civilStatus}
        onChange={(e) => setCivilStatus(e.target.value)}
        className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
        required
      >
        <option value="">Select</option>
        {civilStatusOptions.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </div>

    {/* Spouse Name (conditional) */}
    {civilStatus === 'Married' && (
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Name of Spouse</label>
        <Input 
          name="spouse_name"
          value={formInputs.spouse_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="Spouse's full name" 
        />
      </div>
    )}

    {/* Mother's Maiden Name */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Mother's Maiden Full Name <span className="text-red-500">*</span></label>
      <Input 
        name="mother_full_name"
        value={formInputs.mother_full_name}
        onChange={handleInputChange}
        className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
        placeholder="Mother's full maiden name" 
        required
      />
    </div>

    {/* Household Head */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Household Head</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="householdHead" 
            checked={isHouseholdHead === true}
            onChange={() => setIsHouseholdHead(true)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">Yes</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="householdHead" 
            checked={isHouseholdHead === false}
            onChange={() => setIsHouseholdHead(false)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">No</span>
        </label>
      </div>
    </div>

    {/* Household Head Info (conditional) */}
    {!isHouseholdHead && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Name of Household Head</label>
            <Input 
              name="household_head_name"
              value={formInputs.household_head_name}
              onChange={handleInputChange}
              className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
              placeholder="Full name" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Relationship to Household Head</label>
            <Input 
              name="household_head_relationship"
              value={formInputs.household_head_relationship}
              onChange={handleInputChange}
              className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
              placeholder="e.g., Son, Daughter" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">No. of Living Household Members</label>
            <Input 
              name="household_members_count"
              value={formInputs.household_members_count}
              onChange={handleInputChange}
              type="number"
              className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
              placeholder="0" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">No. of Males</label>
            <Input 
              name="household_males"
              value={formInputs.household_males}
              onChange={handleInputChange}
              type="number"
              className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
              placeholder="0" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">No. of Females</label>
            <Input 
              name="household_females"
              value={formInputs.household_females}
              onChange={handleInputChange}
              type="number"
              className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
              placeholder="0" 
            />
          </div>
        </div>
      </>
    )}

    {/* Highest Formal Education */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Highest Formal Education</label>
      <select 
        name="highest_education"
        value={formInputs.highest_education}
        onChange={handleInputChange}
        className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
      >
        <option value="">Select</option>
        {educationOptions.map(edu => (
          <option key={edu} value={edu}>{edu}</option>
        ))}
      </select>
    </div>

    {/* PWD */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Person with Disability (PWD)</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="pwd" 
            checked={isPwd === true}
            onChange={() => setIsPwd(true)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">Yes</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="pwd" 
            checked={isPwd === false}
            onChange={() => setIsPwd(false)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">No</span>
        </label>
      </div>
    </div>

    {/* 4Ps */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">4Ps Beneficiary</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="fourps" 
            checked={is4ps === true}
            onChange={() => setIs4ps(true)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">Yes</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="fourps" 
            checked={is4ps === false}
            onChange={() => setIs4ps(false)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">No</span>
        </label>
      </div>
    </div>

    {/* Indigenous */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Member of Indigenous Group</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="indigenous" 
            checked={isIndigenous === true}
            onChange={() => setIsIndigenous(true)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">Yes</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="indigenous" 
            checked={isIndigenous === false}
            onChange={() => setIsIndigenous(false)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">No</span>
        </label>
      </div>
      {isIndigenous && (
        <Input 
          name="indigenous_group_name"
          value={formInputs.indigenous_group_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground mt-2" 
          placeholder="Specify indigenous group name" 
        />
      )}
    </div>

    {/* Government ID - Always Required */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Government ID <span className="text-red-500">*</span></label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <select 
          name="government_id_type"
          value={formInputs.government_id_type}
          onChange={handleInputChange}
          className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
          required
        >
          <option value="">Select ID Type</option>
          {governmentIdOptions.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <Input 
          name="government_id_number"
          value={formInputs.government_id_number}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="ID Number" 
          disabled={!formInputs.government_id_type}
          required
        />
      </div>
    </div>

    {/* Member of Coop */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Member of Association/Cooperative</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input 
            type="radio" 
            name="coop" 
            checked={isMemberCoop === true}
            onChange={() => setIsMemberCoop(true)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">Yes</span>
        </label>
        <label className="flex items-center">
          <input 
            type="radio" 
            name="coop" 
            checked={isMemberCoop === false}
            onChange={() => setIsMemberCoop(false)}
            className="h-4 w-4 text-blue-600" 
          />
          <span className="ml-2 text-muted-foreground">No</span>
        </label>
      </div>
      {isMemberCoop && (
        <Input 
          name="coop_name"
          value={formInputs.coop_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground mt-2" 
          placeholder="Specify association/cooperative name" 
        />
      )}
    </div>

    {/* Emergency Contact */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Person to Notify in Case of Emergency <span className="text-red-500">*</span></label>
        <Input 
          name="emergency_contact_name"
          value={formInputs.emergency_contact_name}
          onChange={handleInputChange}
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="Full name" 
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Contact Number <span className="text-red-500">*</span></label>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted/50 border border-r-0 border border-gray-700/30 dark:border-gray-700/30 rounded-l-md">
            +63 
          </span>
          <Input 
            name="emergency_contact_phone"
            value={formInputs.emergency_contact_phone?.replace('+63 ', '').replace('+63-', '').replace('+63', '') || ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormInputs(prev => ({
                ...prev,
                emergency_contact_phone: digits ? `+63 ${digits}` : ''
              }));
            }}
            className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground rounded-l-none" 
            placeholder="0000000000"
            maxLength={10}
            disabled={!formInputs.emergency_contact_name}
            required
          />
        </div>
      </div>
    </div>
  </div>
);

  // ========== SIMPLIFIED ADDRESS TAB (Single Address) ==========

const renderAddressTab = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-foreground mb-4">Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Barangay <span className="text-red-500">*</span></label>
          <select 
            value={selectedBarangay}
            onChange={(e) => {
              setSelectedBarangay(e.target.value);
              setSelectedPurok('');
            }}
            className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
            required
          >
            <option value="">Select Barangay</option>
            <option value="Upper Jasaan">Upper Jasaan</option>
            <option value="Lower Jasaan">Lower Jasaan</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Purok/Sitio <span className="text-red-500">*</span></label>
          <select 
            value={selectedPurok}
            onChange={(e) => setSelectedPurok(e.target.value)}
            disabled={!selectedBarangay}
            className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
            required
          >
            <option value="">Select Purok</option>
            {getPurokOptions(selectedBarangay).map(purok => (
              <option key={purok} value={purok}>{purok}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Municipality/City</label>
          <Input 
            name="perm_municipality_city"
            value={formInputs.perm_municipality_city}
            onChange={handleInputChange}
            className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Province</label>
          <Input 
            name="perm_province"
            value={formInputs.perm_province}
            onChange={handleInputChange}
            className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Region</label>
          <select 
            name="perm_region"
            value={formInputs.perm_region}
            onChange={handleInputChange}
            className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
          >
            {regionOptions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </div>
);
  // ========== COMPLETE FARM DATA TAB WITH PARCELS CODE ==========

const renderFarmDataTab = () => (
  <div className="space-y-6">
    {/* Farm Parcel Forms ONLY – farming activity removed */}
    <div className="bg-card p-4 rounded-md border border-gray-700/30 dark:border-gray-700/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-medium">Farm Parcels (Max 3)</h3>
        <Button
          type="button"
          onClick={() => addFormItem(setFarmParcels, farmParcels)}
          disabled={farmParcels.length >= 3}
          className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-3 py-1 text-xs disabled:opacity-50"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Parcel
        </Button>
      </div>

      {farmParcels.map((parcel, index) => (
        <div
          key={parcel.id}
          className="border border-gray-700/30 dark:border-gray-700/30 rounded-md p-4 mb-4 bg-muted/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-muted-foreground font-medium">Farm Parcel {index + 1}</h4>
            {farmParcels.length > 1 && (
              <Button
                type="button"
                onClick={() => removeFormItem(setFarmParcels, farmParcels, parcel.id)}
                className="bg-red-600 hover:bg-red-600/80 text-foreground px-2 py-1 text-xs"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Name of Farmer's in Rotation <span className="text-red-500">*</span>
              </label>
              <Input
                className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground"
                placeholder="Name of Farmer's in Rotation"
                value={parcel.farmer_rotation || ''}
                onChange={(e) => {
                  const newParcels = farmParcels.map((p) =>
                    p.id === parcel.id ? { ...p, farmer_rotation: e.target.value } : p
                  );
                  setFarmParcels(newParcels);
                }}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Farm Location <span className="text-red-500">*</span>
              </label>
              <Input
                className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground"
                placeholder="Barangay, City/Municipality"
                value={parcel.farm_location || ''}
                onChange={(e) => {
                  const newParcels = farmParcels.map((p) =>
                    p.id === parcel.id ? { ...p, farm_location: e.target.value } : p
                  );
                  setFarmParcels(newParcels);
                }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Ownership Document <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full h-10 px-3 py-2 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
                  value={parcel.ownership_doc || ''}
                  onChange={(e) => {
                    const newParcels = farmParcels.map((p) =>
                      p.id === parcel.id ? { ...p, ownership_doc: e.target.value, ownership_doc_no: '', ownership_type: '' } : p
                    );
                    setFarmParcels(newParcels);
                  }}
                  required
                >
                  <option value="">Select Document</option>
                  {ownershipDocOptions.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Ownership Document No. <span className="text-red-500">*</span>
                </label>
                <Input
                  className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground"
                  placeholder="Document Number"
                  value={parcel.ownership_doc_no || ''}
                  onChange={(e) => {
                    const newParcels = farmParcels.map((p) =>
                      p.id === parcel.id ? { ...p, ownership_doc_no: e.target.value } : p
                    );
                    setFarmParcels(newParcels);
                  }}
                  disabled={!parcel.ownership_doc}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Ownership Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full h-10 px-3 py-2 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
                value={parcel.ownership_type || ''}
                onChange={(e) => {
                  const newParcels = farmParcels.map((p) =>
                    p.id === parcel.id ? { ...p, ownership_type: e.target.value } : p
                  );
                  setFarmParcels(newParcels);
                }}
                disabled={!parcel.ownership_doc}
                required
              >
                <option value="">Select Ownership Type</option>
                {ownershipTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Within Ancestral Domain
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`ancestral_${parcel.id}`}
                      checked={parcel.ancestral_domain === 'yes'}
                      onChange={() => {
                        const newParcels = farmParcels.map((p) =>
                          p.id === parcel.id ? { ...p, ancestral_domain: 'yes' } : p
                        );
                        setFarmParcels(newParcels);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label className="ml-2 text-muted-foreground">Yes</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`ancestral_${parcel.id}`}
                      checked={parcel.ancestral_domain === 'no'}
                      onChange={() => {
                        const newParcels = farmParcels.map((p) =>
                          p.id === parcel.id ? { ...p, ancestral_domain: 'no' } : p
                        );
                        setFarmParcels(newParcels);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label className="ml-2 text-muted-foreground">No</label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Agrarian Reform Beneficiary
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`reform_${parcel.id}`}
                      checked={parcel.agrarian_reform === 'yes'}
                      onChange={() => {
                        const newParcels = farmParcels.map((p) =>
                          p.id === parcel.id ? { ...p, agrarian_reform: 'yes' } : p
                        );
                        setFarmParcels(newParcels);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label className="ml-2 text-muted-foreground">Yes</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`reform_${parcel.id}`}
                      checked={parcel.agrarian_reform === 'no'}
                      onChange={() => {
                        const newParcels = farmParcels.map((p) =>
                          p.id === parcel.id ? { ...p, agrarian_reform: 'no' } : p
                        );
                        setFarmParcels(newParcels);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label className="ml-2 text-muted-foreground">No</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Parcel Information */}
            <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-muted-foreground font-medium">
                  Farm Parcel Information (Max 5)
                </h5>
                <Button
                  type="button"
                  onClick={() => addParcelInfo(parcel.id)}
                  disabled={parcelInfo.filter(p => p.parcel_id === parcel.id).length >= 5}
                  className="bg-blue-600/20 hover:bg-blue-600/80 text-foreground px-2 py-1 text-xs disabled:opacity-50"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Info
                </Button>
              </div>

              {parcelInfo.filter(p => p.parcel_id === parcel.id).map((info, infoIndex) => (
                <div
                  key={info.id}
                  className="border border-gray-700/30 dark:border-gray-700/30 rounded-md p-3 mb-3 bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      Parcel Info {infoIndex + 1}
                    </span>
                    {parcelInfo.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeParcelInfo(info.id)}
                        className="bg-red-600 hover:bg-red-600/80 text-foreground px-1 py-1 text-xs"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Row 1: Crop/Commodity + conditional fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Crop/Commodity
                      </label>
                      <select
                        className="w-full h-8 px-2 py-1 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded text-foreground text-sm"
                        value={info.crop_commodity || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newParcelInfo = parcelInfo.map((pi) =>
                            pi.id === info.id
                              ? {
                                  ...pi,
                                  crop_commodity: value,
                                  crop_name: '',
                                  animal_name: '',
                                  size: '',
                                  head_count: '',
                                  farm_type: '',
                                  organic: '',
                                  remarks: ''
                                }
                              : pi
                          );
                          setParcelInfo(newParcelInfo);
                        }}
                      >
                        {cropCommodityOptions.map((crop) => (
                          <option key={crop} value={crop}>
                            {crop}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CROPS fields */}
                    {info.crop_commodity === 'Crops' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Crop Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            list={`cropList-${info.id}`}
                            className="w-full h-8 px-2 py-1 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded text-foreground text-sm"
                            placeholder="Search or type crop name..."
                            value={info.crop_name || ''}
                            onChange={(e) => {
                              const newParcelInfo = parcelInfo.map((pi) =>
                                pi.id === info.id
                                  ? { ...pi, crop_name: e.target.value, corn_type: e.target.value.includes('Corn') ? pi.corn_type : '' }
                                  : pi
                              );
                              setParcelInfo(newParcelInfo);
                            }}
                            required
                          />
                          <datalist id={`cropList-${info.id}`}>
                            {cropNameOptions.map((crop) => (
                              <option key={crop} value={crop} />
                            ))}
                          </datalist>
                        </div>
                        {/* Corn Type - only show when Crop Name is Corn */}
                        {info.crop_name === 'Corn' && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Corn Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full h-8 px-2 py-1 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded text-foreground text-sm"
                              value={info.corn_type || ''}
                              onChange={(e) => {
                                const newParcelInfo = parcelInfo.map((pi) =>
                                  pi.id === info.id
                                    ? { ...pi, corn_type: e.target.value }
                                    : pi
                                );
                                setParcelInfo(newParcelInfo);
                              }}
                              required
                            >
                              <option value="">Select Type</option>
                              {cornTypeOptions.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Size (ha) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground h-8 text-sm"
                            type="number"
                            step="0.01"
                            value={info.size || ''}
                            onChange={(e) => {
                              const newParcelInfo = parcelInfo.map((pi) =>
                                pi.id === info.id
                                  ? { ...pi, size: e.target.value }
                                  : pi
                              );
                              setParcelInfo(newParcelInfo);
                            }}
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* LIVESTOCK / POULTRY fields */}
                    {(info.crop_commodity === 'Livestock' ||
                      info.crop_commodity === 'Poultry') && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Animal Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            list={`animalList-${info.id}`}
                            className="w-full h-8 px-2 py-1 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded text-foreground text-sm"
                            placeholder="Search or type animal name..."
                            value={info.animal_name || ''}
                            onChange={(e) => {
                              const newParcelInfo = parcelInfo.map((pi) =>
                                pi.id === info.id
                                  ? { ...pi, animal_name: e.target.value }
                                  : pi
                              );
                              setParcelInfo(newParcelInfo);
                            }}
                            required
                          />
                          <datalist id={`animalList-${info.id}`}>
                            {(info.crop_commodity === 'Poultry' ? poultryOptions : livestockOptions).map((animal) => (
                              <option key={animal} value={animal} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            No. of Heads
                          </label>
                          <Input
                            className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground h-8 text-sm"
                            type="number"
                            value={info.head_count || ''}
                            onChange={(e) => {
                              const newParcelInfo = parcelInfo.map((pi) =>
                                pi.id === info.id
                                  ? { ...pi, head_count: e.target.value }
                                  : pi
                              );
                              setParcelInfo(newParcelInfo);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Row 2: Crops – Farm type, organic, remarks */}
                  {info.crop_commodity === 'Crops' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Farm Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full h-8 px-2 py-1 bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 rounded text-foreground text-sm"
                          value={info.farm_type || ''}
                          onChange={(e) => {
                            const newParcelInfo = parcelInfo.map((pi) =>
                              pi.id === info.id
                                ? { ...pi, farm_type: e.target.value }
                                : pi
                            );
                            setParcelInfo(newParcelInfo);
                          }}
                        >
                          <option value="">Select</option>
                          {farmTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Organic Practitioner
                        </label>
                        <div className="flex gap-3 h-8 items-center">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name={`organic_${info.id}`}
                              checked={info.organic === 'yes'}
                              onChange={() => {
                                const newParcelInfo = parcelInfo.map((pi) =>
                                  pi.id === info.id
                                    ? { ...pi, organic: 'yes' }
                                    : pi
                                );
                                setParcelInfo(newParcelInfo);
                              }}
                              className="h-3 w-3 text-blue-600"
                            />
                            <label className="ml-1 text-muted-foreground text-sm">Y</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name={`organic_${info.id}`}
                              checked={info.organic === 'no'}
                              onChange={() => {
                                const newParcelInfo = parcelInfo.map((pi) =>
                                  pi.id === info.id
                                    ? { ...pi, organic: 'no' }
                                    : pi
                                );
                                setParcelInfo(newParcelInfo);
                              }}
                              className="h-3 w-3 text-blue-600"
                            />
                            <label className="ml-1 text-muted-foreground text-sm">N</label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Remarks
                        </label>
                        <Input
                          className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground h-8 text-sm"
                          placeholder="Remarks"
                          value={info.remarks || ''}
                          onChange={(e) => {
                            const newParcelInfo = parcelInfo.map((pi) =>
                              pi.id === info.id
                                ? { ...pi, remarks: e.target.value }
                                : pi
                            );
                            setParcelInfo(newParcelInfo);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Livestock / Poultry: Remarks only */}
                  {(info.crop_commodity === 'Livestock' ||
                    info.crop_commodity === 'Poultry') && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Remarks
                      </label>
                      <Input
                        className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground h-8 text-sm"
                        placeholder="Remarks"
                        value={info.remarks || ''}
                        onChange={(e) => {
                          const newParcelInfo = parcelInfo.map((pi) =>
                            pi.id === info.id
                              ? { ...pi, remarks: e.target.value }
                              : pi
                          );
                          setParcelInfo(newParcelInfo);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

 // ========== FISH DATA TAB ==========
 const renderFishDataTab = () => (
  <div className="space-y-6">
    <div className="bg-card p-4 rounded-md border border-gray-700/30 dark:border-gray-700/30">
      <h3 className="text-foreground font-medium mb-4">Type of Fishing Activity</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Fish Capture', key: 'fish_capture' },
          { label: 'Aquaculture', key: 'aquaculture' },
          { label: 'Gleaning', key: 'gleaning' },
          { label: 'Fish Processing', key: 'fish_processing' },
          { label: 'Fish Vending', key: 'fish_vending' }
        ].map((activity) => (
          <div key={activity.key} className="flex items-center">
            <input 
              type="checkbox" 
              name={`fishing_${activity.key}`}
              checked={fishingCheckboxes[activity.key]}
              onChange={(e) => {
                setFishingCheckboxes({
                  ...fishingCheckboxes,
                  [activity.key]: e.target.checked
                });
              }}
              className="h-4 w-4 text-green-600" 
            />
            <label className="ml-2 text-muted-foreground">{activity.label}</label>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-muted-foreground font-medium">Other Activities</h4>
          <Button 
            type="button"
            onClick={() => addFormItem(setFishingActivities, fishingActivities)}
            className="bg-green-600/20 hover:bg-green-600/20/80 text-foreground px-3 py-1 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Activity
          </Button>
        </div>
        {fishingActivities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 mb-2">
            <Input 
              className="bg-muted/50 border border-gray-700/30 dark:border-gray-700/30 text-foreground flex-1" 
              placeholder="Specify Activity"
              value={activity.activity || ''}
              onChange={(e) => {
                const newActivities = fishingActivities.map(a => 
                  a.id === activity.id ? {...a, activity: e.target.value} : a
                );
                setFishingActivities(newActivities);
              }}
            />
            <Button 
              type="button"
              onClick={() => removeFormItem(setFishingActivities, fishingActivities, activity.id)}
              className="bg-red-600 hover:bg-red-600/80 text-foreground px-2 py-1"
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

  // ========== COMPLETE MODIFIED FINANCIAL TAB ==========
// Copy and paste this to replace your renderFinancialTab function

const renderFinancialTab = () => (
  <div className="space-y-6">
  

    {/* TIN Number */}
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">Tax Identification Number (TIN)</label>
      <Input 
        name="tin_number"
        value={formInputs.tin_number?.replace('XXX-XXX-XXX-XXX', '') || ''}
        onChange={(e) => {
          let digits = e.target.value.replace(/\D/g, '');
          digits = digits.slice(0, 12); // 12 digits max
          
          let formatted = '';
          if (digits.length > 0) formatted += digits.slice(0, 3);
          if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
          if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
          if (digits.length > 9) formatted += '-' + digits.slice(9, 12);
          
          setFormInputs(prev => ({ ...prev, tin_number: formatted }));
        }}
        className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
        placeholder="000-000-000-000" 
        maxLength={15}
      />
    </div>

    

    {/* Source of Funds */}
<div>
  <label className="text-sm font-medium text-muted-foreground mb-1 block">Source of Funds</label>
  <select 
    name="source_of_funds"
    value={formInputs.source_of_funds}
    onChange={handleInputChange}
    className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
  >
    <option value="">Select</option>
    <option value="salary">Salary</option>
    <option value="business">Business</option>
    <option value="remittance">Remittance</option>
    <option value="pension">Pension</option>
    <option value="investment">Investment</option>
    <option value="other">Other</option>
  </select>
</div>


    {/* Income */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Farming Income (Annual)</label>
        <Input 
          name="income_farming"
          value={formInputs.income_farming}
          onChange={handleInputChange}
          type="number"
          step="0.01"
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="0.00" 
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Non-Farming Income (Annual)</label>
        <Input 
          name="income_non_farming"
          value={formInputs.income_non_farming}
          onChange={handleInputChange}
          type="number"
          step="0.01"
          className="bg-card border border-gray-700/30 dark:border-gray-700/30 text-foreground" 
          placeholder="0.00" 
        />
      </div>
    </div>

    {/* Total Annual Income (calculated) */}
    <div className="bg-card p-4 rounded-md border border-gray-700/30 dark:border-gray-700/30">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground font-medium">Total Annual Income:</span>
        <span className="text-foreground font-semibold text-lg">
          ₱ {(
            (parseFloat(formInputs.income_farming) || 0) + 
            (parseFloat(formInputs.income_non_farming) || 0)
          ).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </span>
      </div>
    </div>
  </div>
);

  // Add this helper function before renderPreviewTab
const getFormValue = (name) => {
  const element = document.querySelector(`[name="${name}"]`);
  return element ? element.value : '';
};

const getRadioValue = (name) => {
  const element = document.querySelector(`input[name="${name}"]:checked`);
  return element ? element.value : '';
};

// Replace your entire renderPreviewTab function with this COMPLETE version:
const renderPreviewTab = () => {
  // Collect all form values from DOM
  const fullName = [
    getFormValue('first_name'), 
    getFormValue('middle_name'), 
    getFormValue('surname'), 
    getFormValue('extension_name')
  ].filter(Boolean).join(' ') || 'Not provided';
  
  const permAddress = [
    selectedBarangay,
    selectedPurok,
    getFormValue('perm_municipality_city'),
    getFormValue('perm_province'),
    getFormValue('perm_region')
  ].filter(Boolean).join(', ') || 'Not provided';
  
  const presAddress = sameAsPermAddress ? permAddress : 
    [
      selectedBarangayPresent,
      selectedPurokPresent,
      getFormValue('pres_municipality_city'),
      getFormValue('pres_province'),
      getFormValue('pres_region')
    ].filter(Boolean).join(', ') || 'Not provided';

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-md border border-gray-700/30 dark:border-gray-700/30">
        <h3 className="text-foreground font-medium mb-4">Review Registration Information</h3>
        <div className="space-y-4">
          
          {/* Personal Information - READ FROM formInputs STATE */}
<div>
  <h4 className="text-muted-foreground font-medium mb-2">Personal Information</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <div className="flex">
      <span className="text-muted-foreground w-36">Registry Type:</span>
      <span className="text-foreground capitalize">{registryType}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Reference Number:</span>
      <span className="text-foreground">{formInputs.reference_no || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Full Name:</span>
      <span className="text-foreground">
        {[formInputs.surname, formInputs.first_name, formInputs.middle_name, formInputs.extension_name]
          .filter(Boolean).join(' ') || 'Not provided'}
      </span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Sex:</span>
      <span className="text-foreground capitalize">{formInputs.sex || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Birthdate:</span>
      <span className="text-foreground">{formInputs.date_of_birth || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Place of Birth:</span>
      <span className="text-foreground">{formInputs.place_of_birth || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Mobile Number:</span>
      <span className="text-foreground">{formInputs.mobile_number || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Landline:</span>
      <span className="text-foreground">{formInputs.landline_number || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Mother's Name:</span>
      <span className="text-foreground">{formInputs.mother_full_name || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Civil Status:</span>
      <span className="text-foreground">{civilStatus || 'Not provided'}</span>
    </div>
    {civilStatus === 'Married' && (
      <div className="flex">
        <span className="text-muted-foreground w-36">Spouse Name:</span>
        <span className="text-foreground">{formInputs.spouse_name || 'Not provided'}</span>
      </div>
    )}
    <div className="flex">
      <span className="text-muted-foreground w-36">Religion:</span>
      <span className="text-foreground">{religion === 'Others' ? formInputs.religion_other : religion || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Education:</span>
      <span className="text-foreground">{formInputs.highest_education || 'Not provided'}</span>
    </div>
  </div>
</div>

          {/* Address Information - READ FROM STATE */}
<div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
  <h4 className="text-muted-foreground font-medium mb-2">Address Information</h4>
  <div>
    <h5 className="text-muted-foreground text-sm mb-1">Permanent Address</h5>
    <p className="text-foreground">
      {[
        selectedPurok,
        selectedBarangay,
        formInputs.perm_municipality_city,
        formInputs.perm_province,
        formInputs.perm_region
      ].filter(Boolean).join(', ') || 'Not provided'}
    </p>
  </div>
</div>

{/* Household Information - READ FROM STATE */}
<div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
  <h4 className="text-muted-foreground font-medium mb-2">Household Information</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <div className="flex">
      <span className="text-muted-foreground w-36">Household Head:</span>
      <span className="text-foreground">{isHouseholdHead ? 'Yes' : 'No'}</span>
    </div>
    {!isHouseholdHead && (
      <>
        <div className="flex">
          <span className="text-muted-foreground w-36">Head's Name:</span>
          <span className="text-foreground">{formInputs.household_head_name || 'Not provided'}</span>
        </div>
        <div className="flex">
          <span className="text-muted-foreground w-36">Relationship:</span>
          <span className="text-foreground">{formInputs.household_head_relationship || 'Not provided'}</span>
        </div>
        <div className="flex">
          <span className="text-muted-foreground w-36">Members Count:</span>
          <span className="text-foreground">{formInputs.household_members_count || 'Not provided'}</span>
        </div>
        <div className="flex">
          <span className="text-muted-foreground w-36">Males:</span>
          <span className="text-foreground">{formInputs.household_males || 'Not provided'}</span>
        </div>
        <div className="flex">
          <span className="text-muted-foreground w-36">Females:</span>
          <span className="text-foreground">{formInputs.household_females || 'Not provided'}</span>
        </div>
      </>
    )}
  </div>
</div>

{/* Status Information - READ FROM STATE */}
<div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
  <h4 className="text-muted-foreground font-medium mb-2">Status Information</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <div className="flex">
      <span className="text-muted-foreground w-36">PWD:</span>
      <span className="text-foreground">{isPwd ? 'Yes' : 'No'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">4Ps Beneficiary:</span>
      <span className="text-foreground">{is4ps ? 'Yes' : 'No'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Indigenous:</span>
      <span className="text-foreground">{isIndigenous ? 'Yes' : 'No'}</span>
    </div>
    {isIndigenous && (
      <div className="flex">
        <span className="text-muted-foreground w-36">Group Name:</span>
        <span className="text-foreground">{formInputs.indigenous_group_name || 'Not provided'}</span>
      </div>
    )}
    <div className="flex">
      <span className="text-muted-foreground w-36">ID Type:</span>
      <span className="text-foreground">{formInputs.government_id_type || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">ID Number:</span>
      <span className="text-foreground">{formInputs.government_id_number || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Coop Member:</span>
      <span className="text-foreground">{isMemberCoop ? 'Yes' : 'No'}</span>
    </div>
    {isMemberCoop && (
      <div className="flex">
        <span className="text-muted-foreground w-36">Coop Name:</span>
        <span className="text-foreground">{formInputs.coop_name || 'Not provided'}</span>
      </div>
    )}
  </div>
</div>


          {/* Emergency Contact - READ FROM formInputs STATE */}
<div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
  <h4 className="text-muted-foreground font-medium mb-2">Emergency Contact</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <div className="flex">
      <span className="text-muted-foreground w-36">Contact Person:</span>
      <span className="text-foreground">{formInputs.emergency_contact_name || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Contact Number:</span>
      <span className="text-foreground">{formInputs.emergency_contact_phone || 'Not provided'}</span>
    </div>
  </div>
</div>

{/* Farm/Registry-Specific Information */}
{(registryType === 'farmer' ||
  registryType === 'farmworker' ||
  registryType === 'agriyouth') && (
  <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
    <h4 className="text-muted-foreground font-medium mb-2">Farm Information</h4>

    <div className="space-y-3">
      {/* Farm / Parcel Information */}
      {registryType === 'farmer' && farmParcels.length > 0 && (
        <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
          <h4 className="text-muted-foreground font-medium mb-2">Farm Parcel Information</h4>
          
          {/* Total Hectares */}
          <div className="mb-3 p-3 bg-muted/50 rounded-md border border-gray-700/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total Farm Area:</span>
              <span className="text-blue-400 font-semibold text-lg">
                {parcelInfo
                  .filter(info => info.crop_commodity === 'Crops' && info.size)
                  .reduce((sum, info) => sum + parseFloat(info.size || 0), 0)
                  .toFixed(2)} ha
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {farmParcels.map((parcel, index) => (
              <div
                key={parcel.id}
                className="border border-gray-700/30 dark:border-gray-700/30 rounded-md p-3 bg-muted/50"
              >
                <h5 className="text-muted-foreground font-medium mb-2">
                  Parcel {index + 1}
                </h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rotation:</span>
                    <span className="text-foreground">
                      {parcel.farmer_rotation || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground">
                      {parcel.farm_location || 'N/A'}
                    </span>
                  </div>
                  {parcel.ownership_doc && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ownership Doc:</span>
                      <span className="text-foreground">
                        {parcel.ownership_doc}
                      </span>
                    </div>
                  )}
                  {parcel.ownership_doc_no && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doc No:</span>
                      <span className="text-foreground">
                        {parcel.ownership_doc_no}
                      </span>
                    </div>
                  )}
                  {parcel.ownership_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ownership:</span>
                      <span className="text-foreground">
                        {parcel.ownership_type}
                      </span>
                    </div>
                  )}
                  {parcel.ancestral_domain && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ancestral Domain:</span>
                      <span className="capitalize">
                        {parcel.ancestral_domain}
                      </span>
                    </div>
                  )}
                  {parcel.agrarian_reform && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agrarian Reform:</span>
                      <span className="capitalize">
                        {parcel.agrarian_reform}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parcel Crop / Commodity Details */}
      {parcelInfo.length > 0 && parcelInfo.some((p) => p.crop_commodity) && (
        <div>
          <h5 className="text-muted-foreground text-sm mb-2">
            Parcel Crop / Commodity Details
          </h5>
          <div className="flex flex-wrap gap-2">
            {parcelInfo.map((info, index) => {
              if (!info.crop_commodity) return null;

              if (info.crop_commodity === 'Crops') {
                return (
                  <Badge
                    key={info.id || index}
                    className="bg-green-600/20 text-green-400 text-xs"
                  >
                    Crop: {info.crop_name || 'N/A'}
                    {info.size && ` – ${info.size} ha`}
                    {info.farm_type && ` – ${info.farm_type}`}
                    {info.organic === 'yes' && ' – Organic'}
                    {info.remarks && ` – ${info.remarks}`}
                  </Badge>
                );
              }

              // Livestock or Poultry
              return (
                <Badge
                  key={info.id || index}
                  className="bg-orange-600/20 text-orange-400 text-xs"
                >
                  {info.crop_commodity}: {info.animal_name || 'N/A'}
                  {info.head_count && ` – ${info.head_count} heads`}
                  {info.remarks && ` – ${info.remarks}`}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* No info message */}
      {(!farmParcels.length ||
        !parcelInfo.some((p) => p.crop_commodity)) && (
        <span className="text-muted-foreground text-sm">
          No farm parcel information added
        </span>
      )}
    </div>
  </div>
)}


{/* Fishing Activities (for fisherfolk) */}
{registryType === 'fisherfolk' && (
  <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
    <h4 className="text-muted-foreground font-medium mb-2">Fishing Activities</h4>
    <div className="flex flex-wrap gap-2">
      {fishingActivities.length > 0 ? (
        fishingActivities.map((item, index) => (
          item.activity && <Badge key={index} className="bg-blue-600/20 text-blue-400">{item.activity}</Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-sm">No activities added</span>
      )}
    </div>
  </div>
)}

{/* Work Types (for farmworker) */}
{registryType === 'farmworker' && (
  <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
    <h4 className="text-muted-foreground font-medium mb-2">Kind of Work</h4>
    <div className="flex flex-wrap gap-2">
      {workTypes.length > 0 ? (
        workTypes.map((item, index) => (
          item.work && <Badge key={index} className="bg-yellow-600/20 text-yellow-400">{item.work}</Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-sm">No work types added</span>
      )}
    </div>
  </div>
)}

{/* Involvement Types (for agriyouth) */}
{registryType === 'agriyouth' && (
  <div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
    <h4 className="text-muted-foreground font-medium mb-2">Type of Involvement</h4>
    <div className="flex flex-wrap gap-2">
      {involvementTypes.length > 0 ? (
        involvementTypes.map((item, index) => (
          item.type && <Badge key={index} className="bg-purple-600/20 text-purple-400">{item.type}</Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-sm">No involvement types added</span>
      )}
    </div>
  </div>
)}

          {/* Financial Information - READ FROM formInputs STATE */}
<div className="border-t border-border/10 dark:border border-gray-700/30 dark:border-gray-700/30 dark:border border-gray-700/30 dark:border-gray-700/30/20 dark:border border-gray-700/30 dark:border-gray-700/30 pt-4">
  <h4 className="text-muted-foreground font-medium mb-2">Financial Information</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <div className="flex">
      <span className="text-muted-foreground w-36">TIN Number:</span>
      <span className="text-foreground">{formInputs.tin_number || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Source of Funds:</span>
      <span className="text-foreground capitalize">{formInputs.source_of_funds || 'Not provided'}</span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Farming Income:</span>
      <span className="text-foreground">
        {formInputs.income_farming ? `₱ ${parseFloat(formInputs.income_farming).toLocaleString('en-PH', {minimumFractionDigits: 2})}` : 'Not provided'}
      </span>
    </div>
    <div className="flex">
      <span className="text-muted-foreground w-36">Non-Farming Income:</span>
      <span className="text-foreground">
        {formInputs.income_non_farming ? `₱ ${parseFloat(formInputs.income_non_farming).toLocaleString('en-PH', {minimumFractionDigits: 2})}` : 'Not provided'}
      </span>
    </div>
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

  

  const renderSuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Registration Successful!</h3>
          <p className="text-muted-foreground mb-6">Your registration has been successfully submitted. You will receive a confirmation soon.</p>
          <Button 
            onClick={closeModal}
            className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  const getDataTabContent = () => {
    switch (registryType) {
      case 'fisherfolk':
        return renderFishDataTab();
      case 'farmworker':
        return renderFarmWorkerTab();
      case 'agriyouth':
        return renderAgriYouthTab();
      default:
        return renderFarmDataTab();
    }
  };

  const getDataTabLabel = () => {
    switch (registryType) {
      case 'fisherfolk':
        return 'Fish Data';
      case 'farmworker':
        return 'Work Data';
      case 'agriyouth':
        return 'Youth Data';
      default:
        return 'Farm Data';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {renderRegistrySelector()}
      
      <Card className="bg-card border border-gray-700/30 dark:border-gray-700/30 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground text-xl">Register New RSBSA - {registryType.charAt(0).toUpperCase() + registryType.slice(1)}</CardTitle>
              <CardDescription className="text-muted-foreground">Fill in the details to register a new {registryType}</CardDescription>
            </div>
            <Button
              type="button"
              onClick={clearAllFields}
              variant="outline"
              className="border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300"
            >
              <i className="fas fa-trash mr-2"></i> Clear Fields
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 bg-muted/20 dark:bg-muted/5 mb-6 gap-2 p-1.5 rounded-lg">
              <TabsTrigger value="personal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/30 text-muted-foreground transition-all font-medium">
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="address" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/30 text-muted-foreground transition-all font-medium">
                Address
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/30 text-muted-foreground transition-all font-medium">
                {getDataTabLabel()}
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/30 text-muted-foreground transition-all font-medium">
                Financial
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/30 text-muted-foreground transition-all font-medium">
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              {renderPersonalInfoTab()}
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => setActiveTab('address')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="address" className="mt-0">
              {renderAddressTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('personal')}
                  variant="outline" 
                  className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted/50 text-muted-foreground px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('data')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              {getDataTabContent()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('address')}
                  variant="outline" 
                  className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted/50 text-muted-foreground px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('financial')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-0">
              {renderFinancialTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('data')}
                  variant="outline" 
                  className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted/50 text-muted-foreground px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('preview')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              {renderPreviewTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('financial')}
                  variant="outline" 
                  className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted/50 text-muted-foreground px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <div className="flex flex-col items-end gap-2">
                  {submitError && (
                    <div className="text-red-500 text-sm mb-2">
                      {submitError}
                    </div>
                  )}
                <Button 
  onClick={handleSubmit}
  className="bg-blue-600/20 hover:bg-blue-600/80 text-foreground px-6 py-2 rounded-md"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <i className="fas fa-spinner fa-spin mr-2"></i> Submitting...
    </>
  ) : (
    <>
      <i className="fas fa-check mr-2"></i> Submit Registration
    </>
  )}
</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showSuccessModal && renderSuccessModal()}
    </div>
  );
};



export default RegisterPage;
