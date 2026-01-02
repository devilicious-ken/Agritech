import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import ApiService from '../services/api';
import ExportModal from './ExportModal';

const ImportPage = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [allRegistrants, setAllRegistrants] = useState([]);

  // Define available columns for export
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

  // Open modal and fetch data
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

  // CSV Export Handler with filters and column selection
  const handleExportCSV = async ({ selectedColumns, registryFilter, cropFilter }) => {
    try {
      setIsExporting(true);
      setExportError(null);

      let filteredData = allRegistrants;

      // Apply registry filter
      if (registryFilter !== 'all') {
        filteredData = filteredData.filter(r => r.registry === registryFilter);
      }

      // Apply crop filter
      if (cropFilter !== 'all') {
        filteredData = filteredData.filter(r => 
          r.crops?.some(c => c.name === cropFilter)
        );
      }

      if (filteredData.length === 0) {
        throw new Error('No records match the selected filters');
      }

      // Get selected column definitions
      const selectedColumnDefs = AVAILABLE_COLUMNS.filter(col => 
        selectedColumns.includes(col.key)
      );

      // Build CSV headers (UPPERCASE)
      const headers = selectedColumnDefs.map(col => col.header.toUpperCase());

      // Helper function to escape and uppercase CSV fields
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const str = String(field).toUpperCase(); // Convert to uppercase
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Helper function to format date
      const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US');
      };

      // Build CSV rows with only selected columns
      const rows = filteredData.map(reg => {
        return selectedColumnDefs.map(colDef => {
          let value = colDef.getValue(reg);
          
          // Format dates
          if (colDef.key === 'date_of_birth' || colDef.key === 'registered_date') {
            value = formatDate(value);
          }
          
          return escapeCSV(value);
        }).join(',');
      });

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      
      // Create filename with filter info
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

  return (
    <div className="p-6 space-y-6">
        <Card className="bg-card border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">Import Data</CardTitle>
            <CardDescription className="text-muted-foreground">Upload CSV files to import farmer and fisherfolk records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                  <i className="fas fa-file-upload text-muted-foreground text-2xl"></i>
                </div>
                <h3 className="text-foreground font-medium mb-2">Upload CSV File</h3>
                <p className="text-muted-foreground text-sm mb-4">Drag and drop your file here, or click to browse</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap">
                  <i className="fas fa-folder-open mr-2"></i> Browse Files
                </Button>
                <p className="text-muted-foreground text-xs mt-4">Supported formats: .CSV, .XLS, .XLSX (max 10MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <Button className="bg-red-600 hover:bg-red-700 text-white !rounded-button whitespace-nowrap">
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

      {/* Export Configuration Modal */}
      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportCSV}
        availableColumns={AVAILABLE_COLUMNS}
        allRegistrants={allRegistrants}
      />
    </div>
  );
};

export default ImportPage;
