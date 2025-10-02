import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from 'components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'components/ui/table';
import ClientOnly from './ClientOnly';
import PolygonMap from './PolygonMap';

const MapPage = () => {
  const [selectedPurok, setSelectedPurok] = useState('No Polygon Clicked');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [isZoomed, setIsZoomed] = useState(false);

  // Mock data for all puroks
  const purokData = {
    // Barangay Lower Jasaan (Left side)
    'Purok 1, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0001', name: 'Juan Dela Cruz', type: 'Farmer', size: '2.5 ha', crops: ['Rice', 'Corn'], contact: '09123456789', address: 'Purok 1, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-15', status: 'Active', coordinates: '8.3644° N, 124.6319° E' },
        { id: 'RS-2025-0002', name: 'Maria Santos', type: 'Farmer', size: '1.8 ha', crops: ['Coconut', 'Banana'], contact: '09234567890', address: 'Purok 1, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-02-03', status: 'Active', coordinates: '8.3650° N, 124.6325° E' }
      ]
    },
    'Purok 2, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0003', name: 'Pedro Reyes', type: 'Fisherfolk', size: 'N/A', crops: ['Fish Catch'], contact: '09345678901', address: 'Purok 2, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-28', status: 'Active', coordinates: '8.3635° N, 124.6330° E' },
        { id: 'RS-2025-0004', name: 'Ana Lim', type: 'Fisherfolk', size: 'N/A', crops: ['Fish Catch', 'Seaweed'], contact: '09456789012', address: 'Purok 2, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-02-10', status: 'Active', coordinates: '8.3620° N, 124.6280° E' },
        { id: 'RS-2025-0005', name: 'Roberto Cruz', type: 'Farmer', size: '2.1 ha', crops: ['Rice', 'Fruit Trees'], contact: '09567890123', address: 'Purok 2, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-20', status: 'Active', coordinates: '8.3615° N, 124.6275° E' }
      ]
    },
    'Purok 3, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0006', name: 'Elena Rodriguez', type: 'Fisherfolk', size: 'N/A', crops: ['Fish Catch'], contact: '09678901234', address: 'Purok 3, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-02-05', status: 'Active', coordinates: '8.3610° N, 124.6270° E' },
        { id: 'RS-2025-0007', name: 'Miguel Torres', type: 'Farmer', size: '1.5 ha', crops: ['Corn', 'Cassava'], contact: '09789012345', address: 'Purok 3, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-25', status: 'Active', coordinates: '8.3605° N, 124.6265° E' }
      ]
    },
    'Purok 4, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0008', name: 'Carmen Dela Cruz', type: 'Farmer', size: '3.0 ha', crops: ['Rice', 'Vegetables'], contact: '09890123456', address: 'Purok 4, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-02-12', status: 'Active', coordinates: '8.3600° N, 124.6260° E' }
      ]
    },
    'Purok 10, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0009', name: 'Diego Santos', type: 'Fisherfolk', size: 'N/A', crops: ['Fish Catch', 'Crab'], contact: '09901234567', address: 'Purok 10, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-18', status: 'Active', coordinates: '8.3595° N, 124.6255° E' },
        { id: 'RS-2025-0010', name: 'Sofia Martinez', type: 'Farmer', size: '2.3 ha', crops: ['Coconut', 'Banana'], contact: '09012345678', address: 'Purok 10, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-02-08', status: 'Active', coordinates: '8.3590° N, 124.6250° E' }
      ]
    },
    'Purok 11, Lower Jasaan': {
      farmers: [
        { id: 'RS-2025-0011', name: 'Antonio Garcia', type: 'Farmer', size: '1.9 ha', crops: ['Rice', 'Corn'], contact: '09123456780', address: 'Purok 11, Lower Jasaan, Misamis Oriental', dateRegistered: '2025-01-30', status: 'Active', coordinates: '8.3585° N, 124.6245° E' }
      ]
    },
    // Barangay Upper Jasaan (Right side)
    'Purok 5, Upper Jasaan': {
      farmers: [
        { id: 'RS-2025-0012', name: 'Isabella Cruz', type: 'Farmer', size: '2.8 ha', crops: ['Rice', 'Vegetables'], contact: '09234567801', address: 'Purok 5, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-01', status: 'Active', coordinates: '8.3680° N, 124.6380° E' },
        { id: 'RS-2025-0013', name: 'Fernando Reyes', type: 'Farmer', size: '3.5 ha', crops: ['Corn', 'Cassava'], contact: '09345678902', address: 'Purok 5, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-22', status: 'Active', coordinates: '8.3685° N, 124.6385° E' }
      ]
    },
    'Purok 6, Upper Jasaan': {
      farmers: [
        { id: 'RS-2025-0014', name: 'Lucia Torres', type: 'Farmer', size: '2.2 ha', crops: ['Rice', 'Fruit Trees'], contact: '09456789013', address: 'Purok 6, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-15', status: 'Active', coordinates: '8.3690° N, 124.6390° E' },
        { id: 'RS-2025-0015', name: 'Manuel Lopez', type: 'Farmer', size: '1.7 ha', crops: ['Coconut', 'Banana'], contact: '09567890124', address: 'Purok 6, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-12', status: 'Active', coordinates: '8.3695° N, 124.6395° E' },
        { id: 'RS-2025-0016', name: 'Rosa Villanueva', type: 'Farmer', size: '2.9 ha', crops: ['Rice', 'Vegetables'], contact: '09678901235', address: 'Purok 6, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-20', status: 'Active', coordinates: '8.3700° N, 124.6400° E' }
      ]
    },
    'Purok 7, Upper Jasaan': {
      farmers: [
        { id: 'RS-2025-0017', name: 'Carlos Morales', type: 'Farmer', size: '4.1 ha', crops: ['Rice', 'Corn'], contact: '09789012346', address: 'Purok 7, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-08', status: 'Active', coordinates: '8.3705° N, 124.6405° E' },
        { id: 'RS-2025-0018', name: 'Patricia Silva', type: 'Farmer', size: '1.6 ha', crops: ['Vegetables', 'Herbs'], contact: '09890123457', address: 'Purok 7, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-18', status: 'Active', coordinates: '8.3710° N, 124.6410° E' }
      ]
    },
    'Purok 8, Upper Jasaan': {
      farmers: [
        { id: 'RS-2025-0019', name: 'Eduardo Ramos', type: 'Farmer', size: '3.3 ha', crops: ['Rice', 'Coconut'], contact: '09901234568', address: 'Purok 8, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-05', status: 'Active', coordinates: '8.3715° N, 124.6415° E' },
        { id: 'RS-2025-0020', name: 'Gloria Mendoza', type: 'Farmer', size: '2.0 ha', crops: ['Corn', 'Root Crops'], contact: '09012345679', address: 'Purok 8, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-25', status: 'Active', coordinates: '8.3720° N, 124.6420° E' },
        { id: 'RS-2025-0021', name: 'Raul Fernandez', type: 'Farmer', size: '2.7 ha', crops: ['Rice', 'Fruit Trees'], contact: '09123456781', address: 'Purok 8, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-27', status: 'Active', coordinates: '8.3725° N, 124.6425° E' }
      ]
    },
    'Purok 9, Upper Jasaan': {
      farmers: [
        { id: 'RS-2025-0022', name: 'Valentina Cortez', type: 'Farmer', size: '1.4 ha', crops: ['Vegetables', 'Spices'], contact: '09234567802', address: 'Purok 9, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-02-28', status: 'Active', coordinates: '8.3730° N, 124.6430° E' },
        { id: 'RS-2025-0023', name: 'Alejandro Jimenez', type: 'Farmer', size: '3.8 ha', crops: ['Rice', 'Corn'], contact: '09345678903', address: 'Purok 9, Upper Jasaan, Misamis Oriental', dateRegistered: '2025-01-10', status: 'Active', coordinates: '8.3735° N, 124.6435° E' }
      ]
    }
  };

  // Handler for polygon clicks from PolygonMap
  const handlePolygonClick = (purokName) => {
    setSelectedPurok(purokName);
    setIsZoomed(true);
    // Reset filter when changing purok
    setFilterType('all');
  };

  // Handler to exit zoom mode
  const handleExitZoom = () => {
    setIsZoomed(false);
  };

  const currentData = purokData[selectedPurok] || { farmers: [] };
  const filteredFarmers = filterType === 'all' 
    ? currentData.farmers 
    : currentData.farmers.filter(farmer => farmer.type.toLowerCase() === filterType);

  const handleViewFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setShowViewModal(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleImport = () => {
    if (selectedFile) {
      alert(`Importing ${selectedFile.name}...`);
      setShowImportModal(false);
      setSelectedFile(null);
    }
  };

  const handleExport = (type) => {
    alert(`Exporting data as ${type}...`);
    setShowExportModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column – Map */}
          <Card className="bg-[#1e1e1e] border-0 shadow-md h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-xl">GIS Map</CardTitle>
              
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[600px] w-full rounded-b-md overflow-hidden z-0">
                <ClientOnly>
                  <PolygonMap 
                    onPolygonClick={handlePolygonClick}
                    selectedPurok={selectedPurok}
                    isZoomed={isZoomed}
                    onExitZoom={handleExitZoom}
                  />
                </ClientOnly>
                {/* Optional: overlay, but allow map clicks */}
                <div className="absolute inset-0 bg-[#121212]/20 pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          {/* Right Column – Display Data */}
          <Card className="bg-[#1e1e1e] border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-lg">Display Data</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                <i className="fas fa-filter mr-1"></i> Filter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <h3 className="text-white font-medium">
                  {isZoomed && selectedPurok ? selectedPurok : ""}
                </h3>

                {isZoomed ? (
                  <Badge className="bg-orange-900/50 text-orange-300 text-xs">
                    <i className="fas fa-search-plus mr-1"></i>
                    Zoomed
                  </Badge>
                ) : (
                  <Badge className="bg-gray-800/50 text-gray-400 text-xs">
                    <i className="fas fa-search-minus mr-1"></i>
                    Not Zoomed
                  </Badge>
                )}
                </div>

                {selectedPurok ? (
                  <Badge className={
                    !isZoomed
                      ? "bg-gray-900/50 text-gray-400"
                      : filteredFarmers.some(f => f.type === 'Farmer') && filteredFarmers.some(f => f.type === 'Fisherfolk')
                        ? "bg-purple-900/50 text-purple-300"
                        : filteredFarmers.some(f => f.type === 'Fisherfolk')
                        ? "bg-blue-900/50 text-blue-300"
                        : "bg-green-900/50 text-green-300"
                  }>
                    {isZoomed ? (
                      <>
                        {filteredFarmers.length} {filteredFarmers.length === 1 ? 'Registrant' : 'Registrants'}
                      </>
                    ) : (
                      "0 Registrants"
                    )}
                  </Badge>                  
                ) : (
                  <Badge className="bg-gray-900/50 text-gray-400">No Data</Badge>
                )}
              </div>


                {isZoomed && (
                  <div className="bg-[#252525] border border-[#333333] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-300">
                        <i className="fas fa-map-pin"></i>
                        <span className="text-sm font-medium">Focused on {selectedPurok}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleExitZoom}
                        className="text-gray-400 hover:text-white hover:bg-[#333333] h-6 px-2"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </Button>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">Click the X button to return to full map view</p>
                  </div>
                )}

                <div className="border-t border-[#333333] pt-4 mt-4">
                  <h4 className="text-gray-300 font-medium mb-3">Registered {filterType === 'all' ? 'Farmers & Fisherfolk' : filterType === 'farmer' ? 'Farmers' : 'Fisherfolk'}</h4>
                  <div className="rounded-md border border-[#333333] overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#252525]">
                        <TableRow>
                          <TableHead className="text-gray-300 w-[100px]">RSBSA No.</TableHead>
                          <TableHead className="text-gray-300">Name</TableHead>
                          <TableHead className="text-gray-300">Type</TableHead>
                          <TableHead className="text-gray-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!isZoomed ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                              <i className="fas fa-mouse-pointer mr-2"></i>
                              Click a Polygon First to Display Data on this Table
                            </TableCell>
                          </TableRow>
                        ) : filteredFarmers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                              <i className="fas fa-info-circle mr-2"></i>
                              No registrants found for {selectedPurok}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredFarmers.map((farmer) => (
                            <TableRow key={farmer.id} className="border-t border-[#333333] hover:bg-[#252525]">
                              <TableCell className="text-gray-400 font-mono text-sm">{farmer.id}</TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-200">{farmer.name}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  farmer.type === 'Farmer' 
                                    ? 'bg-green-900/50 text-green-300' 
                                    : 'bg-blue-900/50 text-blue-300'
                                }>
                                  {farmer.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewFarmer(farmer)}
                                  className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
                                >
                                  <i className="fas fa-eye mr-1 text-xs"></i> View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card className="bg-[#1e1e1e] border-0 shadow-md col-span-2">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                <i className="fas fa-upload mr-2"></i>
                Import CSV/XLSX
              </CardTitle>
              <CardDescription className="text-gray-400">
                Import CSV or XLSX files for bulk migration and store to database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center hover:border-[#444444] transition-colors">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-300 mb-2">Drag & drop your files here</p>
                    <p className="text-gray-500 text-sm mb-4">or</p>
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('file-upload').click()}
                      className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                    >
                      Browse Files
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-[#252525] rounded border border-[#333333]">
                        <p className="text-green-300 text-sm">
                          <i className="fas fa-file mr-2"></i>
                          {selectedFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Import Instructions:</h4>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li><i className="fas fa-check text-green-400 mr-2"></i>Supported formats: CSV, XLSX, XLS</li>
                    <li><i className="fas fa-check text-green-400 mr-2"></i>Maximum file size: 10MB</li>
                    <li><i className="fas fa-check text-green-400 mr-2"></i>Required columns: RSBSA No., Name, Type</li>
                    <li><i className="fas fa-check text-green-400 mr-2"></i>Data will be validated before import</li>
                  </ul>
                  <Button 
                    onClick={() => setShowImportModal(true)}
                    disabled={!selectedFile}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export CSV/XLSX */}
          <Card className="bg-[#1e1e1e] border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                <i className="fas fa-download mr-2"></i>
                Export as CSV/XLSX
              </CardTitle>
              <CardDescription className="text-gray-400">
                Export database backup in formatted structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#252525] rounded border border-[#333333]">
                  <div>
                    <p className="text-white font-medium">All Registry Data</p>
                    <p className="text-gray-400 text-sm">Complete database export</p>
                  </div>
                  <Badge className="bg-blue-900/50 text-blue-300">1,234 records</Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleExport('CSV')}
                  variant="outline"
                  className="flex-1 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                >
                  <i className="fas fa-file-csv mr-2"></i>
                  Export CSV
                </Button>
                <Button 
                  onClick={() => handleExport('XLSX')}
                  variant="outline"
                  className="flex-1 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                >
                  <i className="fas fa-file-excel mr-2"></i>
                  Export XLSX
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export PDF */}
          <Card className="bg-[#1e1e1e] border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                <i className="fas fa-file-pdf mr-2"></i>
                Export as PDF
              </CardTitle>
              <CardDescription className="text-gray-400">
                Export dashboard summary with KPIs, charts, and tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-[#252525] rounded border border-[#333333]">
                  <p className="text-white font-medium">Dashboard Summary</p>
                  <p className="text-gray-400 text-sm">KPIs, Metrics, Charts & Graphs</p>
                </div>
              </div>
              <Button 
                onClick={() => handleExport('PDF')}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <i className="fas fa-file-pdf mr-2"></i>
                Generate PDF Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Filter Options</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Registrant Type</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-[#252525] border border-[#333333] text-white p-2 rounded"
                >
                  <option value="all">All Types</option>
                  <option value="farmer">Farmers Only</option>
                  <option value="fisherfolk">Fisherfolk Only</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Location</label>
                <select 
                  value={selectedPurok}
                  onChange={(e) => setSelectedPurok(e.target.value)}
                  className="w-full bg-[#252525] border border-[#333333] text-white p-2 rounded"
                >
                  {Object.keys(purokData).map((purok) => (
                    <option key={purok} value={purok}>{purok}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-[#333333] hover:bg-[#404040] text-white"
              >
                Apply Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilterModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Farmer/Fisherfolk Modal */}
      {showViewModal && selectedFarmer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                {selectedFarmer.type} Details
              </h3>
              <Badge className={
                selectedFarmer.type === 'Farmer' 
                  ? 'bg-green-900/50 text-green-300' 
                  : 'bg-blue-900/50 text-blue-300'
              }>
                {selectedFarmer.type}
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">RSBSA No.</label>
                  <p className="text-white font-mono">{selectedFarmer.id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <p className="text-green-400">{selectedFarmer.status}</p>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Full Name</label>
                <p className="text-white font-medium">{selectedFarmer.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Contact Number</label>
                <p className="text-white">{selectedFarmer.contact}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Address</label>
                <p className="text-white">{selectedFarmer.address}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Coordinates</label>
                <p className="text-white font-mono text-sm">{selectedFarmer.coordinates}</p>
              </div>
              {selectedFarmer.size !== 'N/A' && (
                <div>
                  <label className="text-gray-400 text-sm">Farm Size</label>
                  <p className="text-white">{selectedFarmer.size}</p>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-sm">
                  {selectedFarmer.type === 'Farmer' ? 'Crops/Livestock' : 'Activities'}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedFarmer.crops.map((crop, index) => (
                    <Badge key={index} className="bg-gray-900/50 text-gray-300">
                      {crop}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Date Registered</label>
                <p className="text-white">{selectedFarmer.dateRegistered}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Details
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowViewModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {showImportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Confirm Import</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to import the selected file? This will add new records to the database.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleImport}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <i className="fas fa-upload mr-2"></i>
                Import
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowImportModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;