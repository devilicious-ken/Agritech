import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import ClientOnly from './ClientOnly';
import PolygonMap from './PolygonMap';
import PinMarkMap from './PinmarkPage';
import { supabase } from '../services/api'; // ✅ Import supabase directly


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
  const [zoomedFarmerId, setZoomedFarmerId] = useState(null);
  const [purokData, setPurokData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPinFarmer, setSelectedPinFarmer] = useState(null); // ← NEW
  const [farmPhoto, setFarmPhoto] = useState(null); // ← NEW

  // ✅ Map mode state
  const [mapMode, setMapMode] = useState('purok'); // 'purok' or 'farm'
  const [searchTerm, setSearchTerm] = useState(''); // ← NEW: Search term for Farm Map

  useEffect(() => {
    fetchRegistrantsData();
  }, []);

  /* ---- callback passed to PinMarkMap ---- */
  const handlePinSelect = (farmer) => {
    setSelectedPinFarmer(farmer);
    setFarmPhoto(null); // reset photo
    /* you can fetch a real photo here if you have one */
  };

  const fetchRegistrantsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: registrants, error: regError } = await supabase
        .from('registrants')
        .select(`
          *,
          addresses (*),
          crops (*),
          livestock (*),
          poultry (*),
          fishing_activities (*),
          farm_parcels (*),
          financial_infos (*)
        `)
        .is('deleted_at', null);

      if (regError) {
        console.error('Supabase error:', regError);
        throw regError;
      }

      console.log('✅ Fetched registrants:', registrants);

      const transformedData = {};

      registrants?.forEach(registrant => {
        const address = registrant.addresses?.[0];
        if (!address || !address.purok || !address.barangay) {
          console.warn('⚠️ Skipping registrant without address:', registrant);
          return;
        }

        const barangay = address.barangay;
        const purok = address.purok;
        const key = `${purok}, ${barangay}`;

        if (!transformedData[key]) {
          transformedData[key] = {
            barangay,
            purok,
            farmers: []
          };
        }

        let cropsOrActivities = [];
        if (registrant.registry === 'farmer') {
          cropsOrActivities = registrant.crops?.map(c => c.name) || [];
        } else if (registrant.registry === 'fisherfolk') {
          cropsOrActivities = registrant.fishing_activities?.map(f => f.activity) || [];
        }

        const farmSize = registrant.farm_parcels?.[0]?.total_farm_area_ha
          ? `${registrant.farm_parcels[0].total_farm_area_ha} ha`
          : 'N/A';

        const formatRegistryType = (registry) => {
          const types = {
            'farmer': 'Farmer',
            'fisherfolk': 'Fisherfolk',
            'agri_youth': 'Agri-Youth',
            'farm_worker': 'Farm Worker/Laborer'
          };
          return types[registry] || registry;
        };

        // ✅ Check if farmer has valid coordinates in any farm parcel
        const parcelWithLocation = registrant.farm_parcels?.find(p => p.latitude && p.longitude);
        const hasValidCoordinates = !!(parcelWithLocation?.latitude && parcelWithLocation?.longitude);

        transformedData[key].farmers.push({
          id: registrant.reference_no || registrant.id,
          name: `${registrant.first_name} ${registrant.middle_name || ''} ${registrant.surname}`.trim(),
          type: formatRegistryType(registrant.registry),
          size: registrant.registry === 'farmer' ? farmSize : 'N/A',
          imageUrl: registrant.registry === 'farmer' && registrant.farm_parcels?.[0]?.image_url ? registrant.farm_parcels[0].image_url : null,
          crops: cropsOrActivities.length > 0 ? cropsOrActivities : ['N/A'],
          contact: registrant.mobile_number || 'N/A',
          address: `${purok}, ${barangay}, ${address.municipality_city}, ${address.province}`,
          dateRegistered: new Date(registrant.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          status: 'Active',
          coordinates: 'N/A',
          hasValidCoordinates: hasValidCoordinates,
          fullData: registrant
        });
      });

      console.log('✅ Transformed purokData:', transformedData);
      console.log(`✅ Total puroks: ${Object.keys(transformedData).length}`);
      console.log(`✅ Total registrants: ${registrants?.length || 0}`);

      setPurokData(transformedData);

    } catch (err) {
      console.error('❌ Error fetching registrants:', err);
      setError(err.message || 'Failed to load registrants data');
    } finally {
      setLoading(false);
    }
  };

  const handlePolygonClick = (purokName) => {
    setSelectedPurok(purokName);
    setIsZoomed(true);
    setZoomedFarmerId(null);
    setFilterType('all');
  };

  // ✅ Handler for marker clicks in PinMarkMap
  const handleMarkerClick = (marker) => {
    setSelectedFarmer({
      id: marker.id,
      name: marker.name,
      type: 'Farmer',
      size: marker.size,
      crops: marker.crops,
      contact: marker.contact,
      address: `${marker.purok}, ${marker.barangay}`,
      dateRegistered: marker.dateRegistered,
      status: marker.status,
      coordinates: `${marker.position[0].toFixed(6)}, ${marker.position[1].toFixed(6)}`
    });
    setShowViewModal(true);
  };

  const handleExitZoom = () => {
    setIsZoomed(false);
    setZoomedFarmerId(null);
  };

  const currentData = purokData[selectedPurok] || { farmers: [] };

  // ✅ Get all farmers for Farm Map mode - only those with valid coordinates
  const allFarmers = Object.values(purokData).flatMap(purok =>
    purok.farmers.filter(f => f.type === 'Farmer' && f.hasValidCoordinates === true)
  );

  // ✅ Filter based on mode and filter type
  const displayedFarmers = mapMode === 'farm'
    ? (filterType === 'all' ? allFarmers : allFarmers.filter(f => f.type.toLowerCase() === filterType))
    : (filterType === 'all' ? currentData.farmers : currentData.farmers.filter(f => f.type.toLowerCase() === filterType));

  const handleViewFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setShowViewModal(true);
  };

  const handleViewOnMap = () => {
    if (selectedFarmer && selectedFarmer.type === 'Farmer') {
      setShowViewModal(false);

      // ✅ Switch to Farm Map and Select the Farmer
      setMapMode('farm');
      setSelectedPinFarmer({
        ...selectedFarmer, // Pass all properties including address and imageUrl
        id: selectedFarmer.id,
        name: selectedFarmer.name,
      });
      setIsZoomed(false); // Exit purok zoom if active

      setTimeout(() => {
        document.querySelector('.map-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
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
      fetchRegistrantsData();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExport = (type) => {
    alert(`Exporting data as ${type}...`);
    setShowExportModal(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Loading registrants data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={fetchRegistrantsData} className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-sync mr-2"></i> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr,1fr] gap-6">
          <Card className="bg-card border-0 shadow-md h-full map-container">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-foreground text-xl">GIS Map - Jasaan, Misamis Oriental</CardTitle>

                {/* ✅ Map Mode Switcher */}
                <div className="flex gap-2 bg-muted rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={mapMode === 'purok' ? 'default' : 'ghost'}
                    onClick={() => {
                      setMapMode('purok');
                      setIsZoomed(false);
                      setZoomedFarmerId(null);
                    }}
                    className={mapMode === 'purok'
                      ? 'bg-orange-600 text-foreground hover:bg-orange-700'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                  >
                    <i className="fas fa-draw-polygon mr-2"></i> Purok Map
                  </Button>
                  <Button
                    size="sm"
                    variant={mapMode === 'farm' ? 'default' : 'ghost'}
                    onClick={() => setMapMode('farm')}
                    className={mapMode === 'farm'
                      ? 'bg-green-600 text-foreground hover:bg-green-700'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                  >
                    <i className="fas fa-map-marker-alt mr-2"></i> Farm Map
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[600px] w-full rounded-b-md overflow-hidden z-0">
                <ClientOnly>
                  {mapMode === 'purok' ? (
                    <PolygonMap
                      onPolygonClick={handlePolygonClick}
                      selectedPurok={selectedPurok}
                      isZoomed={isZoomed}
                      onExitZoom={handleExitZoom}
                      zoomedFarmerId={zoomedFarmerId}
                    />
                  ) : (
                    <PinMarkMap
                      onMarkerClick={handlePinSelect}   // ← new name to avoid clash
                      selectedFarmerId={selectedPinFarmer?.id}
                      searchTerm={searchTerm} // ← Pass search term to map
                    />
                  )}
                </ClientOnly>

                {isZoomed && mapMode === 'purok' && (
                  <div className="absolute top-4 left-4 bg-background/80 text-foreground px-4 py-2 rounded-md text-sm z-10">
                    <i className="fas fa-info-circle mr-2"></i>
                    Click the <strong>Exit Zoom</strong> button to return to full map view
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-md">
            <CardHeader className="flex flex-col gap-3">
              <div className="flex flex-row items-center justify-between w-full">
                <CardTitle className="text-foreground text-lg">Display Data</CardTitle>
                <div className="flex gap-2">
                  {/* Search input for Farm Map mode */}
                  {mapMode === 'farm' && (
                    <div className="relative w-full max-w-[180px]">
                      <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs"></i>
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-xs bg-muted border-[#444] text-foreground focus:ring-green-600 focus:border-green-600"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterModal(true)}
                    className="h-8 border-border bg-transparent hover:bg-accent text-muted-foreground"
                  >
                    <i className="fas fa-filter mr-1"></i>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/*  >>>  PIN SELECTED – FULL DETAIL  <<<  */}
              {mapMode === 'farm' && selectedPinFarmer && (
                <div className="space-y-4">
                  {/* Farm photo placeholder */}
                  <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted border border-border">
                    {selectedPinFarmer.imageUrl ? (
                      <img src={selectedPinFarmer.imageUrl} alt="Farm" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <i className="fas fa-image text-5xl" />
                      </div>
                    )}
                  </div>

                  {/* Same grid as the old modal */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">RSBSA Number</label>
                      <p className="text-foreground font-mono">{selectedPinFarmer.id}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Status</label>
                      <p>
                        <Badge className="bg-green-900/50 text-green-300">Active</Badge>
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="text-muted-foreground">Full Name</label>
                      <p className="text-foreground">{selectedPinFarmer.name}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-muted-foreground">Address</label>
                      <p className="text-foreground">{selectedPinFarmer.address}</p>
                    </div>

                    <div>
                      <label className="text-muted-foreground">Contact</label>
                      <p className="text-foreground">{selectedPinFarmer.contact}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Farm Size</label>
                      <p className="text-foreground">{selectedPinFarmer.size}</p>
                    </div>

                    <div className="col-span-2">
                      <label className="text-muted-foreground">Crops</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPinFarmer.crops?.[0] !== 'N/A'
                          ? selectedPinFarmer.crops.map((c, i) => (
                            <Badge key={i} className="bg-[#333] text-muted-foreground">
                              {c}
                            </Badge>
                          ))
                          : <span className="text-muted-foreground">No crops listed</span>}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-muted-foreground">Date Registered</label>
                      <p className="text-foreground">{selectedPinFarmer.dateRegistered}</p>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPinFarmer(null);
                        // Verify if we need to manually trigger map reset via ref or prop
                      }}
                      className="border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground"
                    >
                      <i className="fas fa-arrow-left mr-2" />
                      Back to list
                    </Button>
                    <Button
                      onClick={() => {
                        // Open comprehensive view modal with full data
                        setSelectedFarmer({
                          ...selectedPinFarmer.fullData,
                          id: selectedPinFarmer.registrantId || selectedPinFarmer.id,
                          name: selectedPinFarmer.name,
                          type: 'Farmer',
                          phone: selectedPinFarmer.contact,
                          address: selectedPinFarmer.address,
                          dateRegistered: selectedPinFarmer.dateRegistered
                        });
                        setShowViewModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-foreground"
                    >
                      <i className="fas fa-eye mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() =>
                        document.querySelector('.map-container')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        })
                      }
                      className="bg-orange-600 hover:bg-orange-700 text-foreground"
                    >
                      <i className="fas fa-map-marker-alt mr-2" />
                      View on map
                    </Button>
                  </div>
                </div>
              )}

              {/*  >>>  NORMAL LIST / TABLE  <<<  */}
              {!(mapMode === 'farm' && selectedPinFarmer) && (
                <div className="space-y-4">
                  {/* ----- header row ----- */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground font-medium">
                        {mapMode === 'farm'
                          ? 'All Farmers'
                          : isZoomed
                            ? selectedPurok
                            : 'Click a polygon to view data'}
                      </h3>
                      {mapMode === 'purok' &&
                        (isZoomed ? (
                          <Badge className="bg-orange-900/50 text-orange-300 text-xs">
                            <i className="fas fa-search-plus mr-1" />
                            Zoomed
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-800/50 text-muted-foreground text-xs">
                            <i className="fas fa-search-minus mr-1" />
                            Not Zoomed
                          </Badge>
                        ))}
                    </div>
                    <Badge
                      className={
                        mapMode === 'farm'
                          ? 'bg-green-900/50 text-green-300'
                          : !isZoomed
                            ? 'bg-gray-900/50 text-muted-foreground'
                            : 'bg-green-900/50 text-green-300'
                      }
                    >
                      {mapMode === 'farm'
                        ? `${allFarmers.length} Total Farmers`
                        : isZoomed
                          ? `${displayedFarmers.length} ${displayedFarmers.length === 1 ? 'Registrant' : 'Registrants'}`
                          : '0 Registrants'}
                    </Badge>
                  </div>

                  {/* ----- filter pills ----- */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterType('all')}
                      className={
                        filterType === 'all'
                          ? 'bg-[#444] text-foreground hover:bg-[#555]'
                          : 'border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground'
                      }
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={filterType === 'farmer' ? 'default' : 'outline'}
                      onClick={() => setFilterType('farmer')}
                      className={
                        filterType === 'farmer'
                          ? 'bg-green-700 text-foreground hover:bg-green-800'
                          : 'border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground'
                      }
                    >
                      Farmers
                    </Button>
                    {mapMode === 'purok' && (
                      <Button
                        size="sm"
                        variant={filterType === 'fisherfolk' ? 'default' : 'outline'}
                        onClick={() => setFilterType('fisherfolk')}
                        className={
                          filterType === 'fisherfolk'
                            ? 'bg-blue-700 text-foreground hover:bg-blue-800'
                            : 'border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground'
                        }
                      >
                        Fisherfolk
                      </Button>
                    )}
                  </div>

                  {/* ----- table ----- */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="text-muted-foreground font-medium mb-3">
                      {mapMode === 'farm'
                        ? 'Registered Farmers'
                        : `Registered ${filterType === 'all'
                          ? 'Farmers & Fisherfolk'
                          : filterType === 'farmer'
                            ? 'Farmers'
                            : 'Fisherfolk'
                        }`}
                    </h4>
                    <div className="rounded-md border border-border overflow-hidden max-h-[400px] overflow-y-auto scrollbar-hide">
                      <Table>
                        <TableHeader className="bg-muted sticky top-0">
                          <TableRow>
                            <TableHead className="text-muted-foreground w-[120px]">RSBSA No.</TableHead>
                            <TableHead className="text-muted-foreground">Name</TableHead>
                            <TableHead className="text-muted-foreground">Type</TableHead>
                            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mapMode === 'farm'
                            ? displayedFarmers.length
                              ? displayedFarmers.map((f) => (
                                <TableRow
                                  key={f.id}
                                  className="border-t border-border hover:bg-muted"
                                >
                                  <TableCell className="text-muted-foreground font-mono text-sm">{f.id}</TableCell>
                                  <TableCell>
                                    <div className="font-medium text-foreground">{f.name}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-green-900/50 text-green-300">{f.type}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePinSelect(f)}
                                      className="h-8 border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground whitespace-nowrap"
                                    >
                                      <i className="fas fa-eye mr-1 text-xs" />
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                              : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8"><i className="fas fa-info-circle mr-2" />No farmers found in database</TableCell></TableRow>
                            : !isZoomed || selectedPurok === 'No Polygon Clicked'
                              ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8"><i className="fas fa-mouse-pointer mr-2" />Click a Polygon First to Display Data on this Table...</TableCell></TableRow>
                              : displayedFarmers.length
                                ? displayedFarmers.map((f) => (
                                  <TableRow
                                    key={f.id}
                                    className="border-t border-border hover:bg-muted"
                                  >
                                    <TableCell className="text-muted-foreground font-mono text-sm">{f.id}</TableCell>
                                    <TableCell>
                                      <div className="font-medium text-foreground">{f.name}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          f.type === 'Farmer'
                                            ? 'bg-green-900/50 text-green-300'
                                            : 'bg-blue-900/50 text-blue-300'
                                        }
                                      >
                                        {f.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewFarmer(f)}
                                        className="h-8 border-[#444] bg-transparent hover:bg-[#333] text-muted-foreground whitespace-nowrap"
                                      >
                                        <i className="fas fa-eye mr-1 text-xs" />
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                                : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8"><i className="fas fa-info-circle mr-2" />No registrants found for {selectedPurok}</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'table' && (
        <Card className="bg-card border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">All Registrants</CardTitle>
            <CardDescription className="text-muted-foreground">
              Complete list of all farmers and fisherfolk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-muted-foreground">RSBSA No.</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Location</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(purokData).flatMap(purok => purok.farmers).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No registrants found in database
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(purokData).flatMap(purok => purok.farmers).map((farmer) => (
                      <TableRow key={farmer.id} className="border-t border-border hover:bg-muted">
                        <TableCell className="text-muted-foreground font-mono text-sm">{farmer.id}</TableCell>
                        <TableCell className="text-foreground">{farmer.name}</TableCell>
                        <TableCell>
                          <Badge className={farmer.type === 'Farmer' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}>
                            {farmer.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{farmer.address}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFarmer(farmer)}
                            className="h-8 border-border bg-transparent hover:bg-accent text-muted-foreground"
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
          </CardContent>
        </Card>
      )}

      {showViewModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="bg-card border-0 shadow-xl max-w-6xl w-full my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-foreground">Registrant Details - {selectedFarmer.id || selectedFarmer.reference_no}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="border-border bg-transparent hover:bg-accent text-muted-foreground"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Personal Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-user mr-2"></i> Personal Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Reference ID</label>
                    <p className="text-foreground font-mono">{selectedFarmer.id || selectedFarmer.reference_no}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Registry Type</label>
                    <p>
                      <Badge className="bg-green-900/50 text-green-300">
                        {selectedFarmer.type || 'Farmer'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <p>
                      <Badge className="bg-green-900/50 text-green-300">
                        {selectedFarmer.status || 'Active'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Surname</label>
                    <p className="text-foreground">{selectedFarmer.surname || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">First Name</label>
                    <p className="text-foreground">{selectedFarmer.first_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Middle Name</label>
                    <p className="text-foreground">{selectedFarmer.middle_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Extension Name</label>
                    <p className="text-foreground">{selectedFarmer.extension_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Sex</label>
                    <p className="text-foreground">{selectedFarmer.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">
                      {selectedFarmer.date_of_birth ? formatDate(selectedFarmer.date_of_birth) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Place of Birth</label>
                    <p className="text-foreground">{selectedFarmer.place_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Civil Status</label>
                    <p className="text-foreground">{selectedFarmer.civil_status || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Religion</label>
                    <p className="text-foreground">{selectedFarmer.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Spouse Name</label>
                    <p className="text-foreground">{selectedFarmer.spouse_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Mother's Maiden Name</label>
                    <p className="text-foreground">{selectedFarmer.mother_full_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-phone mr-2"></i> Contact Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Mobile Number</label>
                    <p className="text-foreground">{selectedFarmer.mobile_number || selectedFarmer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Landline Number</label>
                    <p className="text-foreground">{selectedFarmer.landline_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Emergency Contact Name</label>
                    <p className="text-foreground">{selectedFarmer.emergency_contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Emergency Contact Phone</label>
                    <p className="text-foreground">{selectedFarmer.emergency_contact_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i> Address
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Barangay</label>
                    <p className="text-foreground">{selectedFarmer.addresses?.[0]?.barangay || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Purok/Sitio</label>
                    <p className="text-foreground">{selectedFarmer.addresses?.[0]?.purok || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Municipality/City</label>
                    <p className="text-foreground">{selectedFarmer.addresses?.[0]?.municipality_city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Province</label>
                    <p className="text-foreground">{selectedFarmer.addresses?.[0]?.province || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Region</label>
                    <p className="text-foreground">{selectedFarmer.addresses?.[0]?.region || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Household Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-users mr-2"></i> Household Information
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Household Head</label>
                    <p className="text-foreground">{selectedFarmer.is_household_head ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Total Members</label>
                    <p className="text-foreground">{selectedFarmer.household_members_count || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Male Members</label>
                    <p className="text-foreground">{selectedFarmer.household_males || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Female Members</label>
                    <p className="text-foreground">{selectedFarmer.household_females || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Government IDs & Benefits Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-id-card mr-2"></i> Government IDs & Benefits
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Has Government ID</label>
                    <p className="text-foreground">{selectedFarmer.has_government_id ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">ID Type</label>
                    <p className="text-foreground">{selectedFarmer.government_id_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">ID Number</label>
                    <p className="text-foreground">{selectedFarmer.government_id_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">PWD</label>
                    <p className="text-foreground">{selectedFarmer.is_pwd ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">4Ps Beneficiary</label>
                    <p className="text-foreground">{selectedFarmer.is_4ps ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Indigenous</label>
                    <p className="text-foreground">{selectedFarmer.is_indigenous ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Indigenous Group</label>
                    <p className="text-foreground">{selectedFarmer.indigenous_group_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Member of Cooperative</label>
                    <p className="text-foreground">{selectedFarmer.is_member_coop ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cooperative Name</label>
                    <p className="text-foreground">{selectedFarmer.coop_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Farm Data Section (for Farmers) */}
              {(selectedFarmer.type === 'Farmer' || selectedFarmer.registry === 'farmer') && (
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                    <i className="fas fa-tractor mr-2"></i> Farm Data
                  </h4>

                  {/* Farm Parcels - Separate Cards */}
                  {selectedFarmer.farm_parcels && selectedFarmer.farm_parcels.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      <h5 className="font-semibold text-foreground">Farm Parcels</h5>
                      {selectedFarmer.farm_parcels.map((parcel, index) => (
                        <div key={index} className="p-4 rounded-lg border border-border bg-muted/30">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-semibold text-foreground">
                              <i className="fas fa-map mr-2"></i>Parcel #{index + 1}
                            </h6>
                            {parcel.latitude && parcel.longitude ? (
                              <Badge className="bg-green-500/10 text-green-600 border-0">
                                <i className="fas fa-map-pin mr-1"></i> Pinmark Set
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-0">
                                <i className="fas fa-map-pin mr-1"></i> No Pinmark
                              </Badge>
                            )}
                          </div>

                          {/* Parcel Details */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Farmers in Rotation</label>
                              <p className="text-foreground">{parcel.farmers_in_rotation || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Farm Location</label>
                              <p className="text-foreground">{parcel.farm_location || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Total Farm Area</label>
                              <p className="text-foreground">{parcel.total_farm_area_ha ? `${parcel.total_farm_area_ha} ha` : 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Ownership Document</label>
                              <p className="text-foreground">{parcel.ownership_document || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Document Number</label>
                              <p className="text-foreground">{parcel.ownership_document_no || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Ownership Type</label>
                              <p className="text-foreground">{parcel.ownership || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Within Ancestral Domain</label>
                              <p className="text-foreground">{parcel.within_ancestral_domain ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Agrarian Reform Beneficiary</label>
                              <p className="text-foreground">{parcel.agrarian_reform_beneficiary ? 'Yes' : 'No'}</p>
                            </div>
                            {parcel.latitude && parcel.longitude && (
                              <div>
                                <label className="text-sm text-muted-foreground">Coordinates</label>
                                <p className="text-foreground font-mono text-sm">
                                  {parcel.latitude}, {parcel.longitude}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Crops for this Parcel - Only show for first parcel */}
                          {index === 0 && selectedFarmer.crops && selectedFarmer.crops.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h6 className="font-semibold text-foreground mb-2">
                                <i className="fas fa-seedling mr-2"></i>Crops
                              </h6>
                              <p className="text-foreground">
                                {selectedFarmer.crops.map((c) => `${c.name}${c.value_text ? ` (${c.value_text})` : ''}${c.corn_type ? ` - ${c.corn_type}` : ''}`).join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Livestock for this Parcel - Only show for first parcel */}
                          {index === 0 && selectedFarmer.livestock && selectedFarmer.livestock.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h6 className="font-semibold text-foreground mb-2">
                                <i className="fas fa-horse mr-2"></i>Livestock
                              </h6>
                              <p className="text-foreground">
                                {selectedFarmer.livestock.map((l) => `${l.animal} (${l.head_count} heads)`).join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Poultry for this Parcel - Only show for first parcel */}
                          {index === 0 && selectedFarmer.poultry && selectedFarmer.poultry.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h6 className="font-semibold text-foreground mb-2">
                                <i className="fas fa-dove mr-2"></i>Poultry
                              </h6>
                              <p className="text-foreground">
                                {selectedFarmer.poultry.map((p) => `${p.bird} (${p.head_count} heads)`).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No farm parcels recorded</p>
                  )}
                </div>
              )}

              {/* Financial Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                  <i className="fas fa-money-bill mr-2"></i> Financial Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">TIN Number</label>
                    <p className="text-foreground">{selectedFarmer.financial_infos?.[0]?.tin_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Source of Funds</label>
                    <p className="text-foreground">{selectedFarmer.financial_infos?.[0]?.source_of_funds || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Income from Farming</label>
                    <p className="text-foreground">
                      {selectedFarmer.financial_infos?.[0]?.income_farming
                        ? `₱${parseFloat(selectedFarmer.financial_infos[0].income_farming).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Income from Non-Farming</label>
                    <p className="text-foreground">
                      {selectedFarmer.financial_infos?.[0]?.income_non_farming
                        ? `₱${parseFloat(selectedFarmer.financial_infos[0].income_non_farming).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Highest Education</label>
                    <p className="text-foreground">{selectedFarmer.highest_education || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                {(selectedFarmer.type === 'Farmer' || selectedFarmer.registry === 'farmer') && (
                  <Button
                    onClick={handleViewOnMap}
                    className="bg-orange-600 hover:bg-orange-700 text-foreground"
                  >
                    <i className="fas fa-map-marker-alt mr-2"></i> View on Map
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-0 shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">Import Data</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground mb-2">Drag & drop your files here</p>
                <p className="text-muted-foreground text-sm mb-4">or</p>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                    as="span"
                  >
                    <i className="fas fa-folder-open mr-2"></i> Browse Files
                  </Button>
                </label>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-muted-foreground text-sm">
                      <i className="fas fa-file mr-2"></i> {selectedFile.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile}
                  className="bg-blue-600 hover:bg-blue-700 text-foreground disabled:opacity-50"
                >
                  <i className="fas fa-upload mr-2"></i> Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-0 shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">Export Data</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-border bg-transparent hover:bg-accent text-muted-foreground justify-start"
                  onClick={() => handleExport('CSV')}
                >
                  <i className="fas fa-file-csv mr-3 text-green-400"></i>
                  <div className="text-left">
                    <div>Export as CSV</div>
                    <div className="text-xs text-muted-foreground">Comma-separated values</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border bg-transparent hover:bg-accent text-muted-foreground justify-start"
                  onClick={() => handleExport('Excel')}
                >
                  <i className="fas fa-file-excel mr-3 text-green-600"></i>
                  <div className="text-left">
                    <div>Export as Excel</div>
                    <div className="text-xs text-muted-foreground">Microsoft Excel format</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border bg-transparent hover:bg-accent text-muted-foreground justify-start"
                  onClick={() => handleExport('PDF')}
                >
                  <i className="fas fa-file-pdf mr-3 text-red-400"></i>
                  <div className="text-left">
                    <div>Export as PDF</div>
                    <div className="text-xs text-muted-foreground">Portable document format</div>
                  </div>
                </Button>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFilterModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-0 shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">Filter Options</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setFilterType('all');
                    setShowFilterModal(false);
                  }}
                >
                  <i className="fas fa-users mr-3"></i> All Registrants
                </Button>
                <Button
                  variant={filterType === 'farmer' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setFilterType('farmer');
                    setShowFilterModal(false);
                  }}
                >
                  <i className="fas fa-tractor mr-3"></i> Farmers Only
                </Button>
                <Button
                  variant={filterType === 'fisherfolk' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setFilterType('fisherfolk');
                    setShowFilterModal(false);
                  }}
                >
                  <i className="fas fa-fish mr-3"></i> Fisherfolk Only
                </Button>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterModal(false)}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapPage;