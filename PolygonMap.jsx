// src/components/PolygonMap.jsx
'use client';

import { MapContainer, TileLayer, GeoJSON, Polygon, Popup, Tooltip, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/api';

export default function PolygonMap({ onPolygonClick, selectedPurok, isZoomed, onExitZoom, zoomedFarmerId }) {
  const [geoData, setGeoData] = useState(null);
  const [focusedFarmParcel, setFocusedFarmParcel] = useState(null);
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  const propertyToPurokMapping = {
    'Purok 1': 'Purok 1, Lower Jasaan',
    'Purok 2': 'Purok 2, Lower Jasaan',
    'Purok 3': 'Purok 3, Lower Jasaan',
    'Purok 4': 'Purok 4, Lower Jasaan',
    'Purok 5': 'Purok 5, Upper Jasaan',
    'Purok 6A': 'Purok 6A, Upper Jasaan',
    'Purok 6B': 'Purok 6B, Upper Jasaan',
    'Purok 7': 'Purok 7, Upper Jasaan',
    'Purok 8': 'Purok 8, Upper Jasaan',
    'Purok 9A': 'Purok 9A, Upper Jasaan',
    'Purok 9B': 'Purok 9B, Upper Jasaan',
    'Purok 10': 'Purok 10, Lower Jasaan',
    'Purok 11': 'Purok 11, Upper Jasaan',
  };

  useEffect(() => {
    if (zoomedFarmerId) {
      fetchFarmerParcel(zoomedFarmerId);
    } else {
      setFocusedFarmParcel(null);
    }
  }, [zoomedFarmerId]);

  const fetchFarmerParcel = async (farmerId) => {
    try {
      console.log('Fetching parcel for farmer:', farmerId);

      const { data: parcels, error } = await supabase
        .from('farm_parcels')
        .select(`
          id,
          total_farm_area_ha,
          farm_location,
          registrant_id,
          registrants!inner (
            id,
            reference_no,
            first_name,
            surname,
            addresses!inner (
              barangay,
              purok
            )
          )
        `)
        .or(`registrants.reference_no.eq.${farmerId},registrant_id.eq.${farmerId}`)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching farm parcel:', error);
        return;
      }

      const registrant = parcels.registrants;
      const address = registrant.addresses?.[0];

      if (!address) {
        console.error('No address found for registrant');
        return;
      }

      const purok = address.purok;
      const barangay = address.barangay;
      const hectares = parcels.total_farm_area_ha || 1;

      const purokBounds = getPurokBounds(`${purok}, ${barangay}`);

      if (!purokBounds) {
        console.error('Could not find purok bounds');
        return;
      }

      const farmCoordinates = generateFarmPolygon(purokBounds, hectares);

      setFocusedFarmParcel({
        id: registrant.reference_no || registrant.id,
        name: `${registrant.first_name} ${registrant.surname}`,
        coordinates: farmCoordinates,
        size: `${hectares} ha`,
        purok: `${purok}, ${barangay}`,
        purokKey: `${purok}, ${barangay}`
      });

    } catch (err) {
      console.error('Error in fetchFarmerParcel:', err);
    }
  };

  const getPurokBounds = (purokName) => {
    if (!geoData || !geoData.features) return null;

    for (const feature of geoData.features) {
      const featurePurokName = getPurokName(feature.properties);
      if (featurePurokName === purokName && feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates[0];

        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);

        return {
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs),
          center: {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
          }
        };
      }
    }
    return null;
  };

  const generateFarmPolygon = (purokBounds, hectares) => {
    const sizeFactor = Math.sqrt(hectares) * 0.0008;

    const centerLat = purokBounds.center.lat;
    const centerLng = purokBounds.center.lng;

    const halfSize = sizeFactor / 2;

    return [
      [centerLat - halfSize, centerLng - halfSize],
      [centerLat - halfSize, centerLng + halfSize],
      [centerLat + halfSize, centerLng + halfSize],
      [centerLat + halfSize, centerLng - halfSize],
    ];
  };

  useEffect(() => {
    fetch('/geo/Untitled project.geojson')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const getPurokName = (properties) => {
    const props = properties || {};
    const rawName = props.Name || props.PUROK || props.Barangay || props.purok || props.name || props.id;

    if (rawName && propertyToPurokMapping[rawName]) {
      return propertyToPurokMapping[rawName];
    }

    for (const [key, value] of Object.entries(propertyToPurokMapping)) {
      if (rawName && rawName.toString().toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return rawName || "Unnamed Purok";
  };

  const getPolygonStyle = (feature) => {
    const purokName = getPurokName(feature.properties);
    const isSelected = purokName === selectedPurok && isZoomed;
    const isFocusedPurok = focusedFarmParcel && purokName === focusedFarmParcel.purokKey;

    return {
      color: isFocusedPurok ? '#f59e0b' : isSelected ? '#f59e0b' : '#ffffff',
      weight: isFocusedPurok ? 4 : isSelected ? 4 : 2,
      fillColor: isFocusedPurok ? '#fbbf24' : isSelected ? '#f59e0b' : '#22d3ee',
      fillOpacity: isFocusedPurok ? 0.5 : isSelected ? 0.7 : 0.35,
    };
  };

  // âœ… Updated onEachFeature with cursor-following tooltip
  const onEachFeature = (feature, layer) => {
    const purokName = getPurokName(feature.properties);

    // âœ… Tooltip that follows cursor (sticky: true)
    layer.bindTooltip(purokName, {
      permanent: false,
      sticky: true, // âœ… This makes it follow the cursor!
      direction: 'top',
      offset: [0, -10],
      className: 'purok-tooltip',
      opacity: 0.95
    });

    layer.bindPopup(`<strong>${purokName}</strong>`);

    layer.on({
      click: (e) => {
        e.originalEvent.stopPropagation();
        if (onPolygonClick) {
          onPolygonClick(purokName);
        }

        const map = mapRef.current;
        if (map && layer.getBounds) {
          const bounds = layer.getBounds();
          map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 18
          });
        }
      },
      mouseover: (e) => {
        const purokName = getPurokName(feature.properties);
        const isSelected = purokName === selectedPurok && isZoomed;
        const isFocusedPurok = focusedFarmParcel && purokName === focusedFarmParcel.purokKey;
        if (!isSelected && !isFocusedPurok) {
          layer.setStyle({
            color: '#fbbf24',
            weight: 3,
            fillOpacity: 0.5,
          });
        }
      },
      mouseout: (e) => {
        const currentStyle = getPolygonStyle(feature);
        layer.setStyle(currentStyle);
      },
    });
  };

  useEffect(() => {
    if (geoJsonLayerRef.current && geoData) {
      geoJsonLayerRef.current.eachLayer((layer) => {
        if (layer.feature) {
          const style = getPolygonStyle(layer.feature);
          layer.setStyle(style);
        }
      });
    }
  }, [selectedPurok, isZoomed, focusedFarmParcel]);

  useEffect(() => {
    if (focusedFarmParcel && focusedFarmParcel.coordinates) {
      const map = mapRef.current;

      if (map) {
        const purokBounds = getPurokBounds(focusedFarmParcel.purokKey);

        if (purokBounds) {
          map.fitBounds([
            [purokBounds.minLat, purokBounds.minLng],
            [purokBounds.maxLat, purokBounds.maxLng]
          ], {
            padding: [50, 50],
            maxZoom: 18,
            animate: true,
            duration: 1
          });
        }
      }
    }
  }, [focusedFarmParcel]);

  const handleMapClick = () => {
    if ((isZoomed || focusedFarmParcel) && onExitZoom) {
      const map = mapRef.current;
      if (map) {
        map.setView([8.650788, 124.750792], 15);
        setFocusedFarmParcel(null);
        onExitZoom();
      }
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* âœ… Custom CSS for cursor-following tooltip */}
      <style jsx global>{`
        .purok-tooltip {
          background-color: rgba(0, 0, 0, 0.85) !important;
          border: 2px solid #ffffff !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
          pointer-events: none !important;
        }
        
        .purok-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.85) !important;
        }

        .leaflet-tooltip-top:before {
          border-top-color: rgba(0, 0, 0, 0.85) !important;
        }

        .farm-tooltip {
          background-color: rgba(239, 68, 68, 0.9) !important;
          border: 2px solid #ffffff !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
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
        onClick={handleMapClick}
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


          {/* Heat Map Style (OpenTopoMap as a proxy for 'heat map' distinct style or Stamen Toner if available, let's use OpenTopoMap for terrain/heat context) */}
          <LayersControl.BaseLayer name="Heat Map (Terrain)">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='http://viewfinderpanoramas.org'>SRTM</a> | Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (<a href='https://creativecommons.org/licenses/by-sa/3.0/'>CC-BY-SA</a>)"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* draw polygons once loaded */}
        {geoData && (
          <GeoJSON
            key={`geojson-${selectedPurok}-${isZoomed}-${focusedFarmParcel?.id || ''}`}
            data={geoData}
            style={getPolygonStyle}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />
        )}

        {/* âœ… Render focused farmer's parcel */}
        {focusedFarmParcel && focusedFarmParcel.coordinates && (
          <Polygon
            positions={focusedFarmParcel.coordinates}
            pathOptions={{
              color: '#ef4444',
              weight: 3,
              fillColor: '#ef4444',
              fillOpacity: 0.6,
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -10]}
              className="farm-tooltip"
            >
              {focusedFarmParcel.name}
            </Tooltip>
            <Popup>
              <div>
                <strong>{focusedFarmParcel.name}</strong><br />
                <strong>ID:</strong> {focusedFarmParcel.id}<br />
                <strong>Size:</strong> {focusedFarmParcel.size}<br />
                <strong>Location:</strong> {focusedFarmParcel.purok}
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>

      {/* Exit Zoom Button */}
      {(isZoomed || focusedFarmParcel) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const map = mapRef.current;
            if (map) {
              map.setView([8.650788, 124.750792], 15);
            }
            setFocusedFarmParcel(null);
            onExitZoom();
          }}
          className="absolute top-4 right-4 z-[1000] bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
          title="Exit Zoom Mode"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      )}

      {/* Selected Purok Indicator */}
      {isZoomed && selectedPurok && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <i className="fas fa-map-pin text-orange-400"></i>
            <span className="font-medium">Focused: {selectedPurok}</span>
          </div>
        </div>
      )}
    </div>
  );
}