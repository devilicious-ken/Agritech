import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';
import ApiService from '../services/api';
import ExportModal from './ExportModal';
import PDFExportModal from './PDFExportModal';

const ImportPage = () => {
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [allRegistrants, setAllRegistrants] = useState([]);

  // Import states
  const [importStep, setImportStep] = useState('upload'); // 'upload', 'preview', 'importing', 'results'
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importResults, setImportResults] = useState({ success: [], failed: [] });
  const [importProgress, setImportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  const ROWS_PER_PAGE = 10;
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  // Expected CSV headers (40 columns - aligned with Excel format)
  const EXPECTED_HEADERS = [
    'REGISTRY_TYPE', 'REFERENCE_NO', 'SURNAME', 'FIRST_NAME', 'MIDDLE_NAME', 'EXTENSION_NAME',
    'SEX', 'DATE_OF_BIRTH', 'PLACE_OF_BIRTH', 'RELIGION', 'CIVIL_STATUS', 'SPOUSE_NAME',
    'MOBILE_NUMBER', 'LANDLINE_NUMBER', 'MOTHER_MAIDEN_NAME', 'IS_HOUSEHOLD_HEAD',
    'HOUSEHOLD_MEMBERS', 'HOUSEHOLD_MALES', 'HOUSEHOLD_FEMALES', 'IS_PWD', 'IS_4PS',
    'IS_INDIGENOUS', 'INDIGENOUS_GROUP', 'GOVERNMENT_ID_TYPE', 'GOVERNMENT_ID_NO',
    'BARANGAY', 'PUROK', 'EMERGENCY_CONTACT_NAME', 'EMERGENCY_CONTACT_PHONE',
    // Crop columns (area in hectares)
    'RICE_HA', 'CORN_HA', 'CORN_TYPE', 'OTHER_CROPS',
    // Livestock/Poultry counts
    'CATTLE_COUNT', 'SWINE_COUNT', 'GOAT_COUNT', 'CHICKEN_COUNT', 'DUCK_COUNT',
    // Financial info
    'TIN_NUMBER', 'PROFESSION'
  ];

  // Valid enum values
  const VALID_ENUMS = {
    REGISTRY_TYPE: ['farmer', 'fisherfolk'],
    SEX: ['Male', 'Female'],
    CIVIL_STATUS: ['Single', 'Married', 'Widowed', 'Separated'],
    BARANGAY: ['Upper Jasaan', 'Lower Jasaan'],
    PUROK_UPPER: ['Purok 5', 'Purok 6A', 'Purok 6B', 'Purok 7', 'Purok 8', 'Purok 9A', 'Purok 9B'],
    PUROK_LOWER: ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 10', 'Purok 11'],
    GOVERNMENT_ID_TYPE: ['PhilID / ePhilID', 'GSIS', 'SSS', 'PhilHealth', "Voter's ID", "Driver's License", 'PRC License', 'Passport', 'Senior Citizen ID', 'PWD ID', 'Postal ID', 'TIN ID', 'Barangay ID', 'Company ID', 'School ID'],
    RELIGION: ['Roman Catholic', 'Protestant', 'Iglesia ni Cristo', 'Islam', 'Seventh-day Adventist', 'Aglipayan', 'Bible Baptist Church', 'United Church of Christ', "Jehovah's Witness", 'Church of Christ', 'Born Again Christian', 'Buddhist', 'Hindu'],
    YES_NO: ['Yes', 'No', 'yes', 'no', 'YES', 'NO', '']
  };

  // Export column definitions
  const AVAILABLE_COLUMNS = [
    { key: 'reference_id', header: 'RSBSA No', getValue: (r) => r.reference_no },
    { key: 'first_name', header: 'First Name', getValue: (r) => r.first_name },
    { key: 'middle_name', header: 'Middle Name', getValue: (r) => r.middle_name },
    { key: 'surname', header: 'Last Name', getValue: (r) => r.surname },
    { key: 'extension_name', header: 'Extension Name', getValue: (r) => r.extension_name },
    { key: 'sex', header: 'Sex', getValue: (r) => r.sex },
    { key: 'date_of_birth', header: 'Date of Birth', getValue: (r) => r.date_of_birth },
    { key: 'civil_status', header: 'Civil Status', getValue: (r) => r.civil_status },
    { key: 'religion', header: 'Religion', getValue: (r) => r.religion },
    { key: 'mobile_number', header: 'Mobile Number', getValue: (r) => r.mobile_number },
    { key: 'landline', header: 'Landline', getValue: (r) => r.landline_number },
    { key: 'purok', header: 'Purok', getValue: (r) => r.addresses?.[0]?.purok },
    { key: 'barangay', header: 'Barangay', getValue: (r) => r.addresses?.[0]?.barangay },
    { key: 'municipality', header: 'Municipality/City', getValue: (r) => r.addresses?.[0]?.municipality_city },
    { key: 'province', header: 'Province', getValue: (r) => r.addresses?.[0]?.province },
    { key: 'region', header: 'Region', getValue: (r) => r.addresses?.[0]?.region },
    { key: 'farm_size', header: 'Farm Size (ha)', getValue: (r) => {
      if (!r.farm_parcels || r.farm_parcels.length === 0) return '0';
      const total = r.farm_parcels.reduce((sum, p) => sum + (parseFloat(p.total_farm_area_ha) || 0), 0);
      return total.toFixed(2);
    }},
    { key: 'crops', header: 'Crops', getValue: (r) => r.crops?.map(c => c.name).join('; ') || '' },
    { key: 'livestock', header: 'Livestock', getValue: (r) => r.livestock?.map(l => `${l.name} (${l.count})`).join('; ') || '' },
    { key: 'poultry', header: 'Poultry', getValue: (r) => r.poultry?.map(p => `${p.name} (${p.count})`).join('; ') || '' },
    { key: 'registry_type', header: 'Registry Type', getValue: (r) => r.registry },
    { key: 'status', header: 'Status', getValue: (r) => r.status },
    { key: 'registered_date', header: 'Registered Date', getValue: (r) => r.created_at }
  ];

  // ========== CSV PARSING ==========
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toUpperCase());
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.some(v => v.trim())) { // Skip empty rows
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        row._rowIndex = i + 1; // 1-based row number
        rows.push(row);
      }
    }
    
    return { headers, rows };
  };

  // Parse a single CSV line, handling quoted fields
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  };

  // ========== VALIDATION ==========
  const validateRow = (row, rowIndex, existingReferenceNos = []) => {
    const errors = [];
    
    // Required field validation
    const requiredFields = [
      { field: 'REGISTRY_TYPE', label: 'Registry Type' },
      { field: 'REFERENCE_NO', label: 'Reference Number' },
      { field: 'SURNAME', label: 'Surname' },
      { field: 'FIRST_NAME', label: 'First Name' },
      { field: 'MIDDLE_NAME', label: 'Middle Name' },
      { field: 'SEX', label: 'Sex' },
      { field: 'DATE_OF_BIRTH', label: 'Date of Birth' },
      { field: 'CIVIL_STATUS', label: 'Civil Status' },
      { field: 'MOBILE_NUMBER', label: 'Mobile Number' },
      { field: 'MOTHER_MAIDEN_NAME', label: "Mother's Maiden Name" },
      { field: 'GOVERNMENT_ID_TYPE', label: 'Government ID Type' },
      { field: 'GOVERNMENT_ID_NO', label: 'Government ID Number' },
      { field: 'BARANGAY', label: 'Barangay' },
      { field: 'PUROK', label: 'Purok' },
      { field: 'EMERGENCY_CONTACT_NAME', label: 'Emergency Contact Name' },
      { field: 'EMERGENCY_CONTACT_PHONE', label: 'Emergency Contact Phone' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`${label} is required`);
      }
    });

    // Format validations
    if (row.REFERENCE_NO) {
      const refNoPattern = /^\d{2}-\d{2}-\d{2}-\d{3}-\d{6}$/;
      if (!refNoPattern.test(row.REFERENCE_NO)) {
        errors.push('Reference Number must be in format: 10-43-11-XXX-XXXXXX');
      }
      // Check for duplicates in existing database
      if (existingReferenceNos.includes(row.REFERENCE_NO)) {
        errors.push('Reference Number already exists in database');
      }
    }

    if (row.MOBILE_NUMBER) {
      const phonePattern = /^\+63\d{10}$/;
      const cleanPhone = row.MOBILE_NUMBER.replace(/[\s-]/g, '');
      if (!phonePattern.test(cleanPhone)) {
        errors.push('Mobile Number must be in format: +63XXXXXXXXXX (10 digits after +63)');
      }
    }

    // Name field validations (min 2 chars, letters only)
    const nameFields = ['SURNAME', 'FIRST_NAME', 'MIDDLE_NAME'];
    nameFields.forEach(field => {
      if (row[field]) {
        const namePattern = /^[A-Za-z\s]{2,}$/;
        if (!namePattern.test(row[field])) {
          errors.push(`${field.replace('_', ' ')} must be at least 2 characters and contain only letters`);
        }
      }
    });

    // Date validation
    if (row.DATE_OF_BIRTH) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(row.DATE_OF_BIRTH)) {
        errors.push('Date of Birth must be in format: YYYY-MM-DD');
      } else {
        const date = new Date(row.DATE_OF_BIRTH);
        if (isNaN(date.getTime())) {
          errors.push('Date of Birth is not a valid date');
        }
      }
    }

    // Enum validations
    if (row.REGISTRY_TYPE && !VALID_ENUMS.REGISTRY_TYPE.includes(row.REGISTRY_TYPE.toLowerCase())) {
      errors.push('Registry Type must be "farmer" or "fisherfolk"');
    }

    if (row.SEX && !VALID_ENUMS.SEX.includes(row.SEX)) {
      errors.push('Sex must be "Male" or "Female"');
    }

    if (row.CIVIL_STATUS && !VALID_ENUMS.CIVIL_STATUS.includes(row.CIVIL_STATUS)) {
      errors.push('Civil Status must be Single, Married, Widowed, or Separated');
    }

    if (row.BARANGAY && !VALID_ENUMS.BARANGAY.includes(row.BARANGAY)) {
      errors.push('Barangay must be "Upper Jasaan" or "Lower Jasaan"');
    }

    // Purok validation based on Barangay
    if (row.PUROK && row.BARANGAY) {
      const validPuroks = row.BARANGAY === 'Upper Jasaan' ? VALID_ENUMS.PUROK_UPPER : VALID_ENUMS.PUROK_LOWER;
      if (!validPuroks.includes(row.PUROK)) {
        errors.push(`Purok "${row.PUROK}" is not valid for ${row.BARANGAY}`);
      }
    }

    if (row.GOVERNMENT_ID_TYPE && !VALID_ENUMS.GOVERNMENT_ID_TYPE.includes(row.GOVERNMENT_ID_TYPE)) {
      errors.push('Government ID Type is not valid');
    }

    // Conditional validations
    if (row.CIVIL_STATUS === 'Married' && (!row.SPOUSE_NAME || row.SPOUSE_NAME.trim() === '')) {
      errors.push('Spouse Name is required when Civil Status is Married');
    }

    const isHouseholdHead = row.IS_HOUSEHOLD_HEAD?.toLowerCase() !== 'no';
    if (!isHouseholdHead && (!row.HOUSEHOLD_MEMBERS || row.HOUSEHOLD_MEMBERS.trim() === '')) {
      errors.push('Household Members count is required when not Household Head');
    }

    const isIndigenous = row.IS_INDIGENOUS?.toLowerCase() === 'yes';
    if (isIndigenous && (!row.INDIGENOUS_GROUP || row.INDIGENOUS_GROUP.trim() === '')) {
      errors.push('Indigenous Group is required when IS_INDIGENOUS is Yes');
    }

    return {
      rowIndex: row._rowIndex,
      isValid: errors.length === 0,
      errors,
      data: row
    };
  };

  // ========== FILE HANDLING ==========
  const handleFileSelect = useCallback(async (file) => {
    setFileError(null);
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isXLSX) {
      setFileError('Please upload a CSV or XLSX file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 20MB limit. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    setSelectedFile(file);

    try {
      let headers = [];
      let rows = [];

      if (isCSV) {
        const text = await file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        // Parse XLSX file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (jsonData.length < 2) {
          setFileError('File is empty or has no data rows');
          return;
        }

        headers = jsonData[0].map(h => String(h).trim().toUpperCase());
        rows = jsonData.slice(1).filter(row => row.some(cell => cell !== '')).map((row, idx) => {
          const rowObj = {};
          headers.forEach((header, colIdx) => {
            rowObj[header] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
          });
          rowObj._rowIndex = idx + 2;
          return rowObj;
        });
      }

      // Validate headers
      const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setFileError(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      setParsedData(rows);

      // Fetch existing reference numbers for duplicate checking
      let existingRefNos = [];
      try {
        const existingRegistrants = await ApiService.getRegistrants();
        existingRefNos = existingRegistrants.map(r => r.reference_no).filter(Boolean);
      } catch (e) {
        console.warn('Could not fetch existing registrants for duplicate check');
      }

      // Check for duplicates within CSV
      const csvRefNos = rows.map(r => r.REFERENCE_NO);
      const duplicatesInCsv = csvRefNos.filter((item, index) => csvRefNos.indexOf(item) !== index);

      // Validate each row
      const results = rows.map((row, idx) => {
        const result = validateRow(row, idx, existingRefNos);
        // Add duplicate in CSV check
        if (duplicatesInCsv.includes(row.REFERENCE_NO)) {
          result.errors.push('Duplicate Reference Number found in CSV file');
          result.isValid = false;
        }
        return result;
      });

      setValidationResults(results);
      setImportStep('preview');
      setPreviewPage(1);

    } catch (error) {
      console.error('Error parsing CSV:', error);
      setFileError('Error reading CSV file. Please ensure it is a valid CSV format.');
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  // ========== IMPORT EXECUTION ==========
  const executeImport = async () => {
    setShowConfirmModal(false);
    setImportStep('importing');
    setImportProgress(0);

    const validRows = validationResults.filter(r => r.isValid);
    const results = { success: [], failed: [] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Helper to convert empty strings to null
        const toNull = (val) => (val && val.trim() !== '') ? val.trim() : null;
        const toInt = (val) => {
          const num = parseInt(val);
          return isNaN(num) ? null : num;
        };

        // Transform row data to registrant format
        const isHouseholdHead = row.data.IS_HOUSEHOLD_HEAD?.toLowerCase() !== 'no';
        const isPwd = row.data.IS_PWD?.toLowerCase() === 'yes';
        const is4ps = row.data.IS_4PS?.toLowerCase() === 'yes';
        const isIndigenous = row.data.IS_INDIGENOUS?.toLowerCase() === 'yes';

        const registrantData = {
          user_id: null,
          registry: row.data.REGISTRY_TYPE?.toLowerCase() || 'farmer',
          reference_no: toNull(row.data.REFERENCE_NO),
          surname: toNull(row.data.SURNAME),
          first_name: toNull(row.data.FIRST_NAME),
          middle_name: toNull(row.data.MIDDLE_NAME),
          extension_name: toNull(row.data.EXTENSION_NAME),
          sex: toNull(row.data.SEX)?.toLowerCase(),
          mobile_number: toNull(row.data.MOBILE_NUMBER?.replace(/[\s-]/g, '')),
          landline_number: toNull(row.data.LANDLINE_NUMBER),
          date_of_birth: toNull(row.data.DATE_OF_BIRTH),
          place_of_birth: toNull(row.data.PLACE_OF_BIRTH),
          religion: toNull(row.data.RELIGION),
          civil_status: toNull(row.data.CIVIL_STATUS),
          spouse_name: row.data.CIVIL_STATUS === 'Married' ? toNull(row.data.SPOUSE_NAME) : null,
          mother_full_name: toNull(row.data.MOTHER_MAIDEN_NAME),
          is_household_head: isHouseholdHead,
          household_members_count: !isHouseholdHead ? toInt(row.data.HOUSEHOLD_MEMBERS) : null,
          household_males: !isHouseholdHead ? toInt(row.data.HOUSEHOLD_MALES) : null,
          household_females: !isHouseholdHead ? toInt(row.data.HOUSEHOLD_FEMALES) : null,
          is_pwd: isPwd,
          is_4ps: is4ps,
          is_indigenous: isIndigenous,
          indigenous_group_name: isIndigenous ? toNull(row.data.INDIGENOUS_GROUP) : null,
          has_government_id: true,
          government_id_type: toNull(row.data.GOVERNMENT_ID_TYPE),
          government_id_number: toNull(row.data.GOVERNMENT_ID_NO),
          is_member_coop: false,
          coop_name: null,
          emergency_contact_name: toNull(row.data.EMERGENCY_CONTACT_NAME),
          emergency_contact_phone: toNull(row.data.EMERGENCY_CONTACT_PHONE),
          highest_education: null
        };

        // Create registrant
        const registrant = await ApiService.createRegistrant(registrantData);
        console.log('Registrant created successfully:', registrant.id);

        // Create addresses (permanent and present)
        const addressData = [
          {
            registrant_id: registrant.id,
            kind: 'permanent',
            barangay: toNull(row.data.BARANGAY),
            purok: toNull(row.data.PUROK),
            municipality_city: 'Jasaan',
            province: 'Misamis Oriental',
            region: 'Region 10 - Northern Mindanao'
          },
          {
            registrant_id: registrant.id,
            kind: 'present',
            barangay: toNull(row.data.BARANGAY),
            purok: toNull(row.data.PUROK),
            municipality_city: 'Jasaan',
            province: 'Misamis Oriental',
            region: 'Region 10 - Northern Mindanao'
          }
        ];
        await ApiService.createAddress(addressData);

        results.success.push({
          rowIndex: row.rowIndex,
          referenceNo: row.data.REFERENCE_NO,
          name: `${row.data.FIRST_NAME} ${row.data.SURNAME}`
        });

      } catch (error) {
        console.error(`Error importing row ${row.rowIndex}:`, error);
        // Capture detailed error info
        let errorMsg = 'Database error';
        if (error.message) errorMsg = error.message;
        if (error.details) errorMsg += ` - ${error.details}`;
        if (error.hint) errorMsg += ` (Hint: ${error.hint})`;
        if (error.code) errorMsg += ` [Code: ${error.code}]`;
        
        results.failed.push({
          rowIndex: row.rowIndex,
          referenceNo: row.data.REFERENCE_NO,
          name: `${row.data.FIRST_NAME} ${row.data.SURNAME}`,
          error: errorMsg
        });
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    // Log import activity
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Unknown User';
      await ApiService.createActivityLog(
        currentUser.id,
        userName,
        'Bulk Import',
        `Imported ${results.success.length} records (${results.failed.length} failed) from CSV`,
        await ApiService.getUserIpAddress()
      );
    } catch (e) {
      console.warn('Failed to log import activity');
    }

    setImportResults(results);
    setImportStep('results');
  };

  // ========== TEMPLATE DOWNLOAD ==========
  const downloadTemplate = () => {
    const headers = EXPECTED_HEADERS.join(',');
    const sampleRow = [
      'farmer',
      '10-43-11-001-000001',
      'Dela Cruz',
      'Juan',
      'Santos',
      '',
      'Male',
      '1985-06-15',
      'Jasaan',
      'Roman Catholic',
      'Married',
      'Maria Dela Cruz',
      '+639123456789',
      '',
      'Maria Santos',
      'Yes',
      '',
      '',
      '',
      'No',
      'No',
      'No',
      '',
      "Voter's ID",
      '123456789',
      'Upper Jasaan',
      'Purok 5',
      'Pedro Cruz',
      '+639987654321',
      // Crop columns
      '0.5',      // RICE_HA
      '1.0',      // CORN_HA
      'Yellow',   // CORN_TYPE
      'Banana;Coconut', // OTHER_CROPS (semicolon-separated)
      // Livestock/Poultry counts
      '2',        // CATTLE_COUNT
      '5',        // SWINE_COUNT
      '3',        // GOAT_COUNT
      '10',       // CHICKEN_COUNT
      '5',        // DUCK_COUNT
      // Financial info
      '123-456-789-000', // TIN_NUMBER
      'Farmer'    // PROFESSION
    ].join(',');

    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'RSBSA_Import_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ========== FAILED RECORDS EXPORT ==========
  const downloadFailedRecords = () => {
    const invalidFromValidation = validationResults.filter(r => !r.isValid);
    const failedFromImport = importResults.failed;

    const headers = ['ROW_NUMBER', 'REFERENCE_NO', 'NAME', 'ERROR_REASON'];
    const rows = [
      ...invalidFromValidation.map(r => [
        r.rowIndex,
        r.data.REFERENCE_NO || '',
        `${r.data.FIRST_NAME || ''} ${r.data.SURNAME || ''}`,
        r.errors.join('; ')
      ]),
      ...failedFromImport.map(r => [
        r.rowIndex,
        r.referenceNo,
        r.name,
        r.error
      ])
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Failed_Records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ========== RESET ==========
  const resetImport = () => {
    setImportStep('upload');
    setSelectedFile(null);
    setParsedData([]);
    setValidationResults([]);
    setImportResults({ success: [], failed: [] });
    setImportProgress(0);
    setFileError(null);
    setPreviewPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== EXPORT HANDLERS ==========
  const handleOpenExportModal = async () => {
    try {
      setExportError(null);
      const registrants = await ApiService.getRegistrants();
      setAllRegistrants(registrants || []);
      setShowExportModal(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setExportError('Failed to load data for export');
    }
  };

  const handleOpenPDFExportModal = async () => {
    try {
      setExportError(null);
      const registrants = await ApiService.getRegistrants();
      setAllRegistrants(registrants || []);
      setShowPDFExportModal(true);
    } catch (error) {
      console.error('Error fetching data for PDF export:', error);
      setExportError('Failed to load data for PDF export');
    }
  };

  const handleExportCSV = async ({ selectedColumns, registryFilter, cropFilter }) => {
    try {
      setIsExporting(true);
      setExportError(null);

      let filteredData = allRegistrants;

      if (registryFilter !== 'all') {
        filteredData = filteredData.filter(r => r.registry === registryFilter);
      }

      if (cropFilter !== 'all') {
        filteredData = filteredData.filter(r => 
          r.crops?.some(c => c.name === cropFilter)
        );
      }

      if (filteredData.length === 0) {
        throw new Error('No records match the selected filters');
      }

      const selectedColumnDefs = AVAILABLE_COLUMNS.filter(col => 
        selectedColumns.includes(col.key)
      );

      const headers = selectedColumnDefs.map(col => col.header.toUpperCase());

      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const str = String(field).toUpperCase();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US');
      };

      const rows = filteredData.map(reg => {
        return selectedColumnDefs.map(colDef => {
          let value = colDef.getValue(reg);
          if (colDef.key === 'date_of_birth' || colDef.key === 'registered_date') {
            value = formatDate(value);
          }
          return escapeCSV(value);
        }).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      
      let filename = 'RSBSA_Records';
      if (registryFilter !== 'all') filename += `_${registryFilter}`;
      if (cropFilter !== 'all') filename += `_${cropFilter}`;
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setExportError(error.message || 'Failed to export CSV');
      setIsExporting(false);
    }
  };

  // ========== RENDER HELPERS ==========
  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;
  const totalPages = Math.ceil(validationResults.length / ROWS_PER_PAGE);
  const paginatedResults = validationResults.slice(
    (previewPage - 1) * ROWS_PER_PAGE,
    previewPage * ROWS_PER_PAGE
  );

  // ========== RENDER UPLOAD STEP ==========
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-border bg-muted hover:border-blue-400 hover:bg-muted/80'
        }`}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="mx-auto h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
          <i className={`fas ${isDragging ? 'fa-cloud-upload-alt text-blue-400' : 'fa-file-upload text-muted-foreground'} text-2xl`}></i>
        </div>
        <h3 className="text-foreground font-medium mb-2">Upload CSV or Excel File</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Drag and drop your file here, or click to browse
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap">
          <i className="fas fa-folder-open mr-2"></i> Browse Files
        </Button>
        <p className="text-muted-foreground text-xs mt-4">Supported formats: .CSV, .XLSX, .XLS (max 20MB)</p>
      </div>

      {/* Error Message */}
      {fileError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
          <div>
            <p className="text-red-400 font-medium">Upload Error</p>
            <p className="text-red-400/80 text-sm">{fileError}</p>
          </div>
        </div>
      )}

      {/* Template Download */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <i className="fas fa-file-csv text-green-400"></i>
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">Need the correct format?</p>
            <p className="text-muted-foreground text-xs">Download our CSV template with sample data</p>
          </div>
        </div>
        <Button 
          onClick={downloadTemplate}
          variant="outline" 
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <i className="fas fa-download mr-2"></i> Download Template
        </Button>
      </div>

      {/* Format Guide */}
      <div className="bg-muted rounded-lg p-4">
        <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
          <i className="fas fa-info-circle text-blue-400"></i> CSV Format Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-2"><strong className="text-foreground">Required Fields:</strong></p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Registry Type (farmer/fisherfolk)</li>
              <li>• Reference No (10-43-11-XXX-XXXXXX)</li>
              <li>• Surname, First Name, Middle Name</li>
              <li>• Sex, Date of Birth, Civil Status</li>
              <li>• Mobile Number (+63XXXXXXXXXX)</li>
              <li>• Government ID Type & Number</li>
              <li>• Barangay, Purok</li>
              <li>• Emergency Contact</li>
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground mb-2"><strong className="text-foreground">Valid Values:</strong></p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Barangay: Upper Jasaan, Lower Jasaan</li>
              <li>• Sex: Male, Female</li>
              <li>• Civil Status: Single, Married, Widowed, Separated</li>
              <li>• Date Format: YYYY-MM-DD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== RENDER PREVIEW STEP ==========
  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* File Info & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <i className="fas fa-file-csv text-green-400 text-xl"></i>
          <div>
            <p className="text-foreground font-medium">{selectedFile?.name}</p>
            <p className="text-muted-foreground text-xs">
              {(selectedFile?.size / 1024).toFixed(1)} KB • {validationResults.length} rows
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-background rounded-lg">
            <p className="text-2xl font-bold text-foreground">{validationResults.length}</p>
            <p className="text-xs text-muted-foreground">Total Rows</p>
          </div>
          <div className="text-center px-4 py-2 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{validCount}</p>
            <p className="text-xs text-green-400/80">Valid</p>
          </div>
          <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg">
            <p className="text-2xl font-bold text-red-400">{invalidCount}</p>
            <p className="text-xs text-red-400/80">Invalid</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="bg-muted sticky top-0">
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead>Reference No</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Registry</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead className="w-[300px]">Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((result) => (
                <TableRow key={result.rowIndex} className={!result.isValid ? 'bg-red-500/5' : ''}>
                  <TableCell className="font-mono text-xs">{result.rowIndex}</TableCell>
                  <TableCell>
                    {result.isValid ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <i className="fas fa-check mr-1"></i> Valid
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <i className="fas fa-times mr-1"></i> Invalid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{result.data.REFERENCE_NO || '-'}</TableCell>
                  <TableCell>
                    {result.data.FIRST_NAME} {result.data.MIDDLE_NAME} {result.data.SURNAME}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{result.data.REGISTRY_TYPE || '-'}</Badge>
                  </TableCell>
                  <TableCell>{result.data.BARANGAY || '-'}</TableCell>
                  <TableCell>
                    {result.isValid ? (
                      <span className="text-green-400 text-xs">Ready to import</span>
                    ) : (
                      <div className="text-red-400 text-xs max-h-16 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <div key={i}>• {err}</div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={previewPage === 1}
            onClick={() => setPreviewPage(p => p - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {previewPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={previewPage === totalPages}
            onClick={() => setPreviewPage(p => p + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={resetImport}>
          <i className="fas fa-arrow-left mr-2"></i> Back
        </Button>
        <div className="flex gap-3">
          {invalidCount > 0 && (
            <Button variant="outline" onClick={downloadFailedRecords} className="text-yellow-400 border-yellow-500/30">
              <i className="fas fa-download mr-2"></i> Download Invalid Rows
            </Button>
          )}
          <Button 
            onClick={() => setShowConfirmModal(true)}
            disabled={validCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <i className="fas fa-upload mr-2"></i> Import {validCount} Records
          </Button>
        </div>
      </div>
    </div>
  );

  // ========== RENDER IMPORTING STEP ==========
  const renderImportingStep = () => (
    <div className="text-center py-12">
      <div className="mx-auto h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
        <i className="fas fa-sync fa-spin text-blue-400 text-3xl"></i>
      </div>
      <h3 className="text-foreground text-xl font-medium mb-2">Importing Records...</h3>
      <p className="text-muted-foreground mb-6">
        Processing {validCount} records. Please don't close this page.
      </p>
      <div className="max-w-md mx-auto">
        <Progress value={importProgress} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">{importProgress}% Complete</p>
      </div>
    </div>
  );

  // ========== RENDER RESULTS STEP ==========
  const renderResultsStep = () => (
    <div className="text-center py-8">
      <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 ${
        importResults.failed.length === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'
      }`}>
        <i className={`fas ${importResults.failed.length === 0 ? 'fa-check-circle text-green-400' : 'fa-exclamation-triangle text-yellow-400'} text-3xl`}></i>
      </div>
      
      <h3 className="text-foreground text-xl font-medium mb-2">
        {importResults.failed.length === 0 ? 'Import Completed Successfully!' : 'Import Completed with Issues'}
      </h3>
      
      <div className="flex justify-center gap-6 my-6">
        <div className="text-center px-6 py-4 bg-green-500/10 rounded-lg">
          <p className="text-3xl font-bold text-green-400">{importResults.success.length}</p>
          <p className="text-sm text-green-400/80">Successfully Imported</p>
        </div>
        <div className="text-center px-6 py-4 bg-red-500/10 rounded-lg">
          <p className="text-3xl font-bold text-red-400">{importResults.failed.length + invalidCount}</p>
          <p className="text-sm text-red-400/80">Failed / Skipped</p>
        </div>
      </div>

      {(importResults.failed.length > 0 || invalidCount > 0) && (
        <p className="text-muted-foreground text-sm mb-6">
          {invalidCount} rows were skipped due to validation errors.
          {importResults.failed.length > 0 && ` ${importResults.failed.length} rows failed during database insertion.`}
        </p>
      )}

      <div className="flex justify-center gap-4">
        {(importResults.failed.length > 0 || invalidCount > 0) && (
          <Button variant="outline" onClick={downloadFailedRecords}>
            <i className="fas fa-download mr-2"></i> Download Error Report
          </Button>
        )}
        <Button onClick={resetImport} className="bg-blue-600 hover:bg-blue-700 text-white">
          <i className="fas fa-redo mr-2"></i> Import Another File
        </Button>
      </div>
    </div>
  );

  // ========== RENDER CONFIRM MODAL ==========
  const renderConfirmModal = () => (
    showConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <i className="fas fa-upload text-blue-400 text-2xl"></i>
            </div>
            <h3 className="text-foreground text-lg font-medium">Confirm Import</h3>
            <p className="text-muted-foreground text-sm mt-2">
              You are about to import <strong className="text-foreground">{validCount}</strong> records to the database.
            </p>
            {invalidCount > 0 && (
              <p className="text-yellow-400 text-sm mt-2">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                {invalidCount} invalid rows will be skipped.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={executeImport}
            >
              <i className="fas fa-check mr-2"></i> Start Import
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="p-6 space-y-6">
      {/* Import Section */}
      <Card className="bg-card border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground text-xl flex items-center gap-2">
            <i className="fas fa-file-import text-blue-400"></i>
            Import Data
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload CSV files to bulk import farmer and fisherfolk records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importStep === 'upload' && renderUploadStep()}
          {importStep === 'preview' && renderPreviewStep()}
          {importStep === 'importing' && renderImportingStep()}
          {importStep === 'results' && renderResultsStep()}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="bg-card border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground text-xl">Export Data</CardTitle>
          <CardDescription className="text-muted-foreground">Generate reports and export data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <Card className="bg-muted border dark:border-border/10 border-border hover:bg-muted/80 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                  <i className="fas fa-file-pdf text-red-400 text-2xl"></i>
                </div>
                <h3 className="text-foreground font-medium mb-2">PDF Reports</h3>
                <p className="text-muted-foreground text-sm mb-4">Generate formatted reports with charts and tables</p>
                <Button 
                  onClick={handleOpenPDFExportModal}
                  className="bg-red-600 hover:bg-red-700 text-white !rounded-button whitespace-nowrap"
                >
                  <i className="fas fa-file-export mr-2"></i> Export PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted border dark:border-border/10 border-border hover:bg-muted/80 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                  <i className="fas fa-file-csv text-green-400 text-2xl"></i>
                </div>
                <h3 className="text-foreground font-medium mb-2">CSV Data</h3>
                <p className="text-muted-foreground text-sm mb-4">Export raw data for further analysis or backup</p>
                {exportError && (
                  <p className="text-red-500 text-xs mb-2">{exportError}</p>
                )}
                <Button 
                  onClick={handleOpenExportModal}
                  disabled={isExporting}
                  className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i> Exporting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-export mr-2"></i> Export CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      {renderConfirmModal()}

      {/* Export Configuration Modal */}
      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportCSV}
        availableColumns={AVAILABLE_COLUMNS}
        allRegistrants={allRegistrants}
      />

      {/* PDF Export Modal */}
      <PDFExportModal
        show={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        allRegistrants={allRegistrants}
      />
    </div>
  );
};

export default ImportPage;
