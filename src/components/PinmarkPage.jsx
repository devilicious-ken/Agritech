// src/components/PinMarkMap.jsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/api';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for farmers
const createFarmerIcon = (isSelected = false) => {
  const color = isSelected ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${isSelected ? '36px' : '30px'};
        height: ${isSelected ? '36px' : '30px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          color: white;
          font-size: ${isSelected ? '16px' : '14px'};
          font-weight: bold;
        ">🌾</div>
      </div>
    `,
    iconSize: isSelected ? [36, 48] : [30, 42],
    iconAnchor: isSelected ? [18, 48] : [15, 42],
    popupAnchor: [0, isSelected ? -48 : -42],
  });
};

// Component to handle map zoom
function MapZoomHandler({ selectedMarkerId, markers }) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarkerId) {
      const marker = markers.find(m => m.id === selectedMarkerId);
      if (marker && marker.position) {
        map.flyTo(marker.position, 18, {
          duration: 1.5,
          easeLinearity: 0.5
        });
      }
    }
  }, [selectedMarkerId, markers, map]);

  return null;
}

export default function PinMarkMap({ onMarkerClick, selectedFarmerId, searchTerm }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  const fetchFarmersData = async () => {
    try {
      setLoading(true);

      // Fetch only farmers (not fisherfolk)
      const { data: registrants, error: regError } = await supabase
        .from('registrants')
        .select(`
          id,
          reference_no,
          registry,
          surname,
          first_name,
          middle_name,
          mobile_number,
          created_at,
          addresses (
            barangay,
            purok
          ),
          crops (
            name
          ),
          farm_parcels (
            total_farm_area_ha,
            latitude,
            longitude,
            image_url
          )
        `)
        .eq('registry', 'farmer')
        .is('deleted_at', null);

      if (regError) {
        console.error('Supabase error:', regError);
        throw regError;
      }

      console.log('✅ Fetched farmers:', registrants);

      const farmersWithPositions = [];

      registrants?.forEach((registrant) => {
        // ✅ Iterate through ALL farm parcels with valid coordinates
        registrant.farm_parcels?.forEach((parcel, parcelIndex) => {
          // SKIP parcels without valid location
          if (!parcel.latitude || !parcel.longitude) return;

          const position = {
            lat: parcel.latitude,
            lng: parcel.longitude
          };

          const address = registrant.addresses?.[0];
          const purok = address?.purok || 'Unknown Purok';
          const barangay = address?.barangay || 'Unknown Barangay';
          const purokKey = `${purok}, ${barangay}`;

          const crops = registrant.crops?.map(c => c.name) || [];
          const farmSize = parcel.total_farm_area_ha
            ? `${parcel.total_farm_area_ha} ha`
            : 'N/A';

          // Create unique ID for each parcel marker
          const markerId = `${registrant.reference_no || registrant.id}-parcel-${parcelIndex}`;

          farmersWithPositions.push({
            id: markerId, // Unique ID for this parcel
            registrantId: registrant.reference_no || registrant.id, // Original registrant ID
            name: `${registrant.first_name} ${registrant.middle_name || ''} ${registrant.surname}`.trim(),
            position: position,
            purok: purok,
            barangay: barangay,
            purokKey: purokKey,
            address: `${purok}, ${barangay}`, // Added address property
            crops: crops.length > 0 ? crops : ['N/A'],
            size: farmSize,
            imageUrl: parcel.image_url, // Pass image URL from this parcel
            contact: registrant.mobile_number || 'N/A',
            dateRegistered: new Date(registrant.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            status: 'Active',
            parcelIndex: parcelIndex, // Track which parcel this is
            fullData: registrant
          });
        });
      });

      console.log(`✅ Generated ${farmersWithPositions.length} real farmer markers`);
      setMarkers(farmersWithPositions);

    } catch (err) {
      console.error('❌ Error fetching farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmersData();
  }, []);

  const handleMarkerClick = (marker) => {
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([8.650788, 124.750792], 15, { animate: true });
    }
  };

  // ✅ Auto-reset view when selection is cleared
  useEffect(() => {
    if (!selectedFarmerId) {
      handleResetView();
    }
  }, [selectedFarmerId]);

  // ✅ Filter markers based on search term
  const visibleMarkers = markers.filter(marker => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      marker.name.toLowerCase().includes(term) ||
      marker.id.toString().toLowerCase().includes(term) ||
      marker.purok.toLowerCase().includes(term) ||
      (marker.crops && marker.crops.join(' ').toLowerCase().includes(term))
    );
  });

  return (
    <div className="relative h-full w-full">
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        .farm-marker-tooltip {
          background-color: rgba(0, 0, 0, 0.85) !important;
          border: 2px solid #10b981 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
          pointer-events: none !important;
        }

        .leaflet-popup-content-wrapper {
          background-color: #1e1e1e !important;
          color: white !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }

        .leaflet-popup-content {
          margin: 12px !important;
          font-size: 13px !important;
        }

        .leaflet-popup-tip {
          background-color: #1e1e1e !important;
        }
      `}</style>

      <MapContainer
        center={[8.650788, 124.750792]}
        zoom={15}
        style={{ height: '600px', width: '100%' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        ref={mapRef}
        attributionControl={false}
      >
        <LayersControl position="bottomleft">
          {/* Satellite base layer (Esri World Imagery) */}
          <LayersControl.BaseLayer checked name="Satellite (ESRI)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>

          {/* OpenStreetMap */}
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
          </LayersControl.BaseLayer>

          {/* Dark Mode (CartoDB Dark Matter) */}
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
            />
          </LayersControl.BaseLayer>

          {/* Heat Map Style (OpenTopoMap) */}
          <LayersControl.BaseLayer name="Heat Map (Terrain)">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='http://viewfinderpanoramas.org'>SRTM</a> | Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (<a href='https://creativecommons.org/licenses/by-sa/3.0/'>CC-BY-SA</a>)"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Zoom handler */}
        <MapZoomHandler selectedMarkerId={selectedFarmerId} markers={markers} />

        {/* Render visible farmer markers */}
        {visibleMarkers.map((marker) => {
          const isSelected = marker.id === selectedFarmerId;
          const icon = createFarmerIcon(isSelected);

          return (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick({ ...marker, imageUrl: marker.imageUrl }) // ← parent (MapPage) now receives the object
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -42]}
                className="farm-marker-tooltip"
                opacity={0.95}
              >
                <div className="text-xs space-y-1 min-w-[160px]">
                  {/* line 1 – farmer name */}
                  <div className="font-bold text-white truncate">{marker.name}</div>

                  {/* line 2 – ID + size */}
                  <div className="flex justify-between text-gray-300">
                    <span>RSBSA</span>
                    <span className="font-mono text-green-400">{marker.id}</span>
                  </div>
                  {marker.size !== 'N/A' && (
                    <div className="flex justify-between text-gray-300">
                      <span>Size</span>
                      <span className="text-green-400 font-semibold">{marker.size}</span>
                    </div>
                  )}

                  {/* line 3 – first two crops */}
                  {marker.crops?.[0] !== 'N/A' && (
                    <div className="pt-1 border-t border-gray-700 text-gray-300 truncate">
                      {marker.crops.slice(0, 2).join(', ')}
                      {marker.crops.length > 2 && <span className="text-gray-500"> +{marker.crops.length - 2}</span>}
                    </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-[#1e1e1e] px-6 py-4 rounded-lg shadow-xl">
            <i className="fas fa-spinner fa-spin text-2xl text-green-500 mr-3"></i>
            <span className="text-white">Loading farm locations...</span>
          </div>
        </div>
      )}

      {/* Reset View Button */}
      {selectedFarmerId && (
        <button
          onClick={handleResetView}
          className="absolute top-4 right-4 z-[1000] bg-green-600 hover:bg-green-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
          title="Reset Map View"
        >
          <i className="fas fa-compress-arrows-alt text-sm"></i>
        </button>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-black/85 text-white px-4 py-3 rounded-lg shadow-lg border border-green-600/30">
        <div className="text-xs font-bold mb-2 text-green-400 flex items-center gap-2">
          <span>🌾</span>
          <span>Farm Locations</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              border: '2px solid white'
            }}></div>
            <span>Farmer Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{
              width: '14px',
              height: '14px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              border: '2px solid white'
            }}></div>
            <span>Selected Farmer</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
          Total Farmers: <span className="text-green-400 font-semibold">{visibleMarkers.length}</span>
        </div>
      </div>

      {/* Selected Farmer Indicator */}
      {selectedFarmerId && (
        <div className="absolute top-4 left-4 z-[1000] bg-black/85 text-white px-4 py-2 rounded-lg shadow-lg border border-orange-600/30">
          <div className="flex items-center gap-2 text-sm">
            <i className="fas fa-map-marker-alt text-orange-400"></i>
            <span className="font-medium">
              Viewing: {markers.find(m => m.id === selectedFarmerId)?.name || 'Farmer'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}