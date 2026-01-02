import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const ExportModal = ({ show, onClose, onExport, availableColumns, allRegistrants }) => {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [registryFilter, setRegistryFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [matchingRecords, setMatchingRecords] = useState(0);

  // Get unique crop names from all registrants
  const uniqueCrops = React.useMemo(() => {
    const crops = new Set();
    allRegistrants.forEach(reg => {
      reg.crops?.forEach(crop => {
        if (crop.name) crops.add(crop.name);
      });
    });
    return Array.from(crops).sort();
  }, [allRegistrants]);

  // Calculate matching records based on filters
  useEffect(() => {
    let filtered = allRegistrants;

    // Apply registry filter
    if (registryFilter !== 'all') {
      filtered = filtered.filter(r => r.registry === registryFilter);
    }

    // Apply crop filter
    if (cropFilter !== 'all') {
      filtered = filtered.filter(r => 
        r.crops?.some(c => c.name === cropFilter)
      );
    }

    setMatchingRecords(filtered.length);
  }, [registryFilter, cropFilter, allRegistrants]);

  // Initialize with all columns selected
  useEffect(() => {
    if (show && selectedColumns.length === 0) {
      setSelectedColumns(availableColumns.map(col => col.key));
    }
  }, [show]);

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = () => {
    onExport({
      selectedColumns,
      registryFilter,
      cropFilter
    });
    onClose();
  };

  if (!show) return null;

  // Group columns by category
  const columnGroups = {
    'Basic Information': availableColumns.filter(c => ['reference_id', 'first_name', 'middle_name', 'surname', 'extension_name', 'sex', 'date_of_birth', 'civil_status', 'religion'].includes(c.key)),
    'Contact Information': availableColumns.filter(c => ['mobile_number', 'landline'].includes(c.key)),
    'Address': availableColumns.filter(c => ['purok', 'barangay', 'municipality', 'province', 'region'].includes(c.key)),
    'Farm Data': availableColumns.filter(c => ['farm_size', 'crops', 'livestock', 'poultry'].includes(c.key)),
    'Registration': availableColumns.filter(c => ['registry_type', 'status', 'registered_date'].includes(c.key))
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="bg-card border-0 shadow-2xl rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <CardHeader className="border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-xl">Configure CSV Export</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Filters Section */}
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold text-lg">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registry Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Registry Type
                  </label>
                  <select
                    value={registryFilter}
                    onChange={(e) => setRegistryFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
                  >
                    <option value="all">All Types</option>
                    <option value="farmer">Farmer</option>
                    <option value="fisherfolk">Fisherfolk</option>
                  </select>
                </div>

                {/* Crop Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Crop Type
                  </label>
                  <select
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-card border border-gray-700/30 dark:border-gray-700/30 rounded-md text-foreground"
                  >
                    <option value="all">All Crops</option>
                    {uniqueCrops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <i className="fas fa-info-circle mr-2"></i>
                  {matchingRecords} record(s) match your filters | {selectedColumns.length} column(s) selected
                </p>
              </div>
            </div>

            {/* Column Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-semibold text-lg">Select Columns to Export</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted text-foreground !rounded-button"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted text-foreground !rounded-button"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-64 border border-gray-700/30 dark:border-gray-700/30 rounded-md p-4">
                <div className="space-y-4">
                  {Object.entries(columnGroups).map(([groupName, columns]) => (
                    <div key={groupName}>
                      <h4 className="text-foreground font-medium mb-2 text-sm">{groupName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                        {columns.map(column => (
                          <label
                            key={column.key}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(column.key)}
                              onChange={() => handleColumnToggle(column.key)}
                              className="w-4 h-4 rounded border-gray-600 dark:bg-gray-700 focus:ring-blue-500"
                            />
                            <span className="text-sm text-foreground">{column.header}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t border-border/50 p-4 flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border border-gray-700/30 dark:border-gray-700/30 bg-transparent hover:bg-muted text-foreground !rounded-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.length === 0 || matchingRecords === 0}
            className="bg-green-600 hover:bg-green-700 text-white !rounded-button disabled:opacity-50"
          >
            <i className="fas fa-file-export mr-2"></i>
            Export {matchingRecords} Record(s)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ExportModal;
