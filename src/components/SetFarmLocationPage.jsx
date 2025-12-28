import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Using react-router-dom based on AppRoutes.jsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Import Input
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../services/api';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={pinIcon}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

// Component to fix map rendering issues (grey tiles)
const MapFixer = () => {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after mount to ensure tiles render correctly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const SetFarmLocationPage = () => {
  const { id } = useParams(); // Should be the registrant's ID (dbId)
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registrant, setRegistrant] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [selectedParcelId, setSelectedParcelId] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [imageUrl, setImageUrl] = useState(''); // New state for image URL
  const [isUploading, setIsUploading] = useState(false);
  const [existingMarkers, setExistingMarkers] = useState([]); // All other farm parcels
  // const [mapType, setMapType] = useState('satellite'); // Removed custom state
  // const [mapType, setMapType] = useState('satellite'); // Removed custom state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false); // ✅ Toggle for guide overlay

  useEffect(() => {
    fetchAllParcels();
  }, []);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (registrantId) => {
    try {
      setLoading(true);

      // Fetch Registrant
      const { data: regData, error: regError } = await supabase
        .from('registrants')
        .select(`
            *,
            addresses (*)
        `)
        .eq('id', registrantId)
        .single();

      if (regError) throw regError;
      setRegistrant(regData);

      // Fetch Parcels
      const { data: parcelData, error: parcelError } = await supabase
        .from('farm_parcels')
        .select('*')
        .eq('registrant_id', registrantId);

      if (parcelError) throw parcelError;
      setParcels(parcelData || []);

      if (parcelData && parcelData.length > 0) {
        setSelectedParcelId(parcelData[0].id);
        // If the parcel already has coordinates, set the marker
        // Assuming columns 'latitude' and 'longitude' exist or similar.
        // If simpler, we might check 'farm_location' if it stored JSON, but likely not.
        // We'll try to read lat/long if they exist, or just start blank.
        if (parcelData[0].latitude && parcelData[0].longitude) {
          setMarkerPosition({ lat: parcelData[0].latitude, lng: parcelData[0].longitude });
        }
        if (parcelData[0].image_url) {
          setImageUrl(parcelData[0].image_url);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParcels = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_parcels')
        .select('id, latitude, longitude, farm_location, total_farm_area_ha, registrant_id')
        .not('latitude', 'is', null);

      if (error) throw error;
      setExistingMarkers(data || []);
    } catch (err) {
      console.error('Error fetching all parcels:', err);
    }
  };

  const handleParcelSelect = (parcel) => {
    setSelectedParcelId(parcel.id);
    if (parcel.latitude && parcel.longitude) {
      setMarkerPosition({ lat: parcel.latitude, lng: parcel.longitude });
    } else {
      setMarkerPosition(null);
    }
    setImageUrl(parcel.image_url || '');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, JPG, and PNG are allowed.');
      return;
    }

    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      alert('File size exceeds the 3MB limit.');
      return;
    }

    // 2. Convert to Base64
    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      setImageUrl(reader.result); // Set base64 string
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('Failed to read file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedParcelId || !markerPosition) {
      alert("Please select a parcel and set a location on the map.");
      return;
    }

    try {
      setSaving(true);
      // Update the parcel with coordinates
      const { error } = await supabase
        .from('farm_parcels')
        .update({
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
          image_url: imageUrl // Save image URL
          // Also update farm_location text if you want it to be human readable?
          // farm_location: `${markerPosition.lat.toFixed(6)}, ${markerPosition.lng.toFixed(6)}` 
        })
        .eq('id', selectedParcelId);

      if (error) throw error;

      // Update local state to reflect saved status (optional)
      const updatedParcels = parcels.map(p =>
        p.id === selectedParcelId
          ? { ...p, latitude: markerPosition.lat, longitude: markerPosition.lng, image_url: imageUrl }
          : p
      );
      setParcels(updatedParcels);
      alert("Location saved successfully!");

    } catch (err) {
      console.error("Error saving location:", err);
      alert("Failed to save location: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Set Farm Location</h1>
        <Button variant="outline" onClick={() => navigate('/records')} className="text-gray-300 border-gray-600">
          <i className="fas fa-arrow-left mr-2"></i> Back to Records
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,3fr] gap-6 flex-1 h-full overflow-hidden">
        {/* Sidebar: Farmer Info & Parcels */}
        <Card className="bg-[#1e1e1e] border-0 shadow-md flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {registrant?.first_name} {registrant?.surname}
            </CardTitle>
            <CardDescription>
              RSBSA: {registrant?.reference_no}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1">
            <h3 className="text-gray-400 font-medium mb-3 text-sm uppercase tracking-wider">Select Parcel</h3>
            <div className="space-y-3">
              {parcels.length === 0 && <p className="text-gray-500 italic">No farm parcels found.</p>}
              {parcels.map(parcel => (
                <div
                  key={parcel.id}
                  onClick={() => handleParcelSelect(parcel)}
                  className={`
                                p-4 rounded-lg border cursor-pointer transition-all
                                ${selectedParcelId === parcel.id
                      ? 'bg-orange-900/20 border-orange-500/50'
                      : 'bg-[#252525] border-[#333] hover:border-gray-500'}
                            `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={selectedParcelId === parcel.id ? 'bg-orange-600' : 'bg-gray-700'}>
                      {parcel.total_farm_area_ha} ha
                    </Badge>
                    {parcel.latitude && <i className="fas fa-check-circle text-green-500"></i>}
                  </div>
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="text-gray-500">Location:</span> {parcel.farm_location || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Ownership:</span> {parcel.ownership || 'N/A'}
                  </p>

                  {/* Image Upload Input */}
                  {selectedParcelId === parcel.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs text-gray-400 mb-1 block">Farm Image (Max 3MB, PNG/JPG)</label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="bg-[#1e1e1e] border-[#444] text-white h-9 text-xs file:bg-gray-700 file:text-white file:border-0 file:rounded-sm"
                        />
                      </div>
                      {isUploading && <p className="text-xs text-orange-400 mt-1">Uploading...</p>}
                      {imageUrl && (
                        <div className="mt-2 h-20 w-full rounded overflow-hidden border border-gray-700 relative">
                          <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageUrl('');
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 border-t border-[#333]">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!selectedParcelId || !markerPosition || saving}
              onClick={handleSave}
            >
              {saving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
              Save Location
            </Button>
          </div>
        </Card>

        {/* Map Area */}
        <Card className="bg-[#1e1e1e] border-0 shadow-md h-full overflow-hidden">
          <CardContent className="p-0 h-full relative">
            <MapContainer
              center={[8.650788, 124.750792]} // Default Jasaan center
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              attributionControl={false} // ✅ Remove default Leaflet watermark
            >
              <MapFixer /> {/* ✅ Fix half-rendered map */}

              <LayersControl position="bottomleft">
                <LayersControl.BaseLayer checked name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri'
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Street (OSM)">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Heat Map (Terrain)">
                  <TileLayer
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution="Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='http://viewfinderpanoramas.org'>SRTM</a> | Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (<a href='https://creativecommons.org/licenses/by-sa/3.0/'>CC-BY-SA</a>)"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {/* Note: Labels overlay for satellite can be added as an Overlay if needed, but LayersControl makes it tricky to auto-bind to just one BaseLayer without custom logic. Kept simple for now. */}

              <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />

              {/* ✅ Display All Existing Parcels as Blue Markers */}
              {existingMarkers.map(marker => {
                // Don't show the currently selected parcel as a blue marker if it's being edited
                if (marker.id === selectedParcelId && markerPosition) return null;

                return (
                  <Marker
                    key={marker.id}
                    position={[marker.latitude, marker.longitude]}
                    icon={blueIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">Existing Farm</p>
                        <p>Area: {marker.total_farm_area_ha} ha</p>
                        <p>Location: {marker.farm_location}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Instructions Overlay Toggle Button */}
            <div className="absolute top-4 right-4 z-[1000]">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition-colors border border-gray-600"
                title="Show Instructions"
              >
                <i className={`fas ${showGuide ? 'fa-times' : 'fa-info'}`}></i>
              </button>
            </div>

            {/* Instructions Overlay */}
            {showGuide && (
              <div className="absolute top-14 right-4 bg-black/80 text-white p-3 rounded-md max-w-xs z-[1000] text-sm border border-gray-700">
                <p className="font-semibold mb-1"><i className="fas fa-info-circle text-orange-400 mr-2"></i>How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>Select a parcel from the sidebar.</li>
                  <li>Click on the map to set the farm location pin (Red).</li>
                  <li>Blue pins indicate existing farms.</li>
                  <li>Click <strong>Save Location</strong> to update.</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetFarmLocationPage;
