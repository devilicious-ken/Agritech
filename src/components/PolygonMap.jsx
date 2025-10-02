// src/components/PolygonMap.jsx
'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';

export default function PolygonMap({ onPolygonClick, selectedPurok, isZoomed, onExitZoom }) {
  const [geoData, setGeoData] = useState(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const cesiumContainerRef = useRef(null);

  // Mock mapping between GeoJSON properties and our purok names
  const propertyToPurokMapping = {
    // These would need to match your actual GeoJSON properties
    'Purok 1': 'Purok 1, Lower Jasaan',
    'Purok 2': 'Purok 2, Lower Jasaan',
    'Purok 3': 'Purok 3, Lower Jasaan',
    'Purok 4': 'Purok 4, Lower Jasaan',
    'Purok 5': 'Purok 5, Upper Jasaan',
    'Purok 6': 'Purok 6, Upper Jasaan',
    'Purok 7': 'Purok 7, Upper Jasaan',
    'Purok 8': 'Purok 8, Upper Jasaan',
    'Purok 9': 'Purok 9, Upper Jasaan',
    'Purok 10': 'Purok 10, Lower Jasaan',
    'Purok 11': 'Purok 11, Lower Jasaan',
  };

  // fetch GeoJSON once the component mounts
  useEffect(() => {
    fetch('/geo/Untitled project.geojson')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Function to get purok name from feature properties
  const getPurokName = (properties) => {
    const props = properties || {};
    
    // Try different possible property names
    const rawName = props.Name || props.PUROK || props.Barangay || props.purok || props.name || props.id;
    
    // If we have a mapping, use it; otherwise use the raw name
    if (rawName && propertyToPurokMapping[rawName]) {
      return propertyToPurokMapping[rawName];
    }
    
    // Fallback: try to match partial names
    for (const [key, value] of Object.entries(propertyToPurokMapping)) {
      if (rawName && rawName.toString().toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return rawName || "Unnamed Purok";
  };

  // Default polygon style
  const getPolygonStyle = (feature) => {
    const purokName = getPurokName(feature.properties);
    const isSelected = purokName === selectedPurok && isZoomed;

    return {
      color: isSelected ? '#f59e0b' : '#ffffff',
      weight: isSelected ? 4 : 2,
      fillColor: isSelected ? '#f59e0b' : '#22d3ee',
      fillOpacity: isSelected ? 0.7 : 0.35,
    };
  };

  // Enhanced 3D Drone View Effect with right-side tilt
  const apply3DDroneView = (layer) => {
    const map = mapRef.current;
    if (!map || !layer.getBounds) return;

    const bounds = layer.getBounds();
    const center = bounds.getCenter();

    setIs3DMode(true);

    // Zoom in closer for better 3D effect
    map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 19,
      duration: 1.5
    });

    // Add enhanced 3D tilt effect from right side
    setTimeout(() => {
      const mapContainer = map.getContainer();
      const mapPane = mapContainer.querySelector('.leaflet-map-pane');
      
      mapContainer.style.transition = 'all 1.5s ease-out';
      mapContainer.style.transformOrigin = 'center center';
      
      // Create 3D perspective with right-side tilt
      mapContainer.style.transform = 'perspective(1500px) rotateX(60deg) rotateZ(-15deg) scale(1.2)';
      
      // Add 3D buildings overlay layer
      if (mapPane) {
        mapPane.style.transition = 'all 1.5s ease-out';
        // Add depth effect to the map pane
        mapPane.style.filter = 'contrast(1.1) saturate(1.2)';
      }
      
      // Add subtle continuous rotation
      let rotation = 0;
      const rotationInterval = setInterval(() => {
        rotation += 0.3;
        if (rotation >= 360) rotation = 0;
        const sway = Math.sin(rotation * Math.PI / 180) * 8;
        mapContainer.style.transform = `perspective(1500px) rotateX(60deg) rotateZ(${-15 + sway}deg) scale(1.2)`;
      }, 50);

      // Store interval to clear later
      mapContainer.dataset.rotationInterval = rotationInterval;

      // Create 3D buildings effect overlay
      create3DBuildingsOverlay(mapContainer);
    }, 800);
  };

  // Create 3D buildings and terrain overlay
  const create3DBuildingsOverlay = (mapContainer) => {
    // Remove existing overlay if any
    const existingOverlay = mapContainer.querySelector('.buildings-3d-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create 3D buildings overlay
    const overlay = document.createElement('div');
    overlay.className = 'buildings-3d-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 400;
      mix-blend-mode: multiply;
      opacity: 0;
      transition: opacity 1s ease-in;
    `;

    // Add building structures using canvas for better performance
    const canvas = document.createElement('canvas');
    canvas.width = mapContainer.offsetWidth;
    canvas.height = mapContainer.offsetHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    const ctx = canvas.getContext('2d');
    
    // Draw random 3D-looking buildings
    const drawBuildings = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Generate building clusters
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const width = 10 + Math.random() * 20;
        const height = 20 + Math.random() * 60;
        
        // Building shadow (3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 5, y + 5, width, height);
        
        // Building face
        ctx.fillStyle = `rgba(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${120 + Math.random() * 100}, 0.6)`;
        ctx.fillRect(x, y, width, height);
        
        // Building highlight (3D edge)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y, 2, height);
        
        // Building top
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width - 5, y - 10);
        ctx.lineTo(x - 5, y - 10);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }
    };
    
    drawBuildings();
    overlay.appendChild(canvas);
    mapContainer.appendChild(overlay);
    
    // Fade in the overlay
    setTimeout(() => {
      overlay.style.opacity = '0.7';
    }, 100);

    // Add terrain contours
    const terrainsOverlay = document.createElement('div');
    terrainsOverlay.className = 'terrain-overlay';
    terrainsOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 399;
      background: 
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 50px,
          rgba(255, 255, 255, 0.03) 50px,
          rgba(255, 255, 255, 0.03) 51px
        ),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 50px,
          rgba(255, 255, 255, 0.03) 50px,
          rgba(255, 255, 255, 0.03) 51px
        );
      opacity: 0;
      transition: opacity 1s ease-in;
    `;
    mapContainer.appendChild(terrainsOverlay);
    
    setTimeout(() => {
      terrainsOverlay.style.opacity = '1';
    }, 100);
  };

  // Reset 3D View back to 2D
  const reset3DView = () => {
    const map = mapRef.current;
    if (!map) return;

    setIs3DMode(false);

    const mapContainer = map.getContainer();
    const mapPane = mapContainer.querySelector('.leaflet-map-pane');
    
    // Clear rotation interval
    if (mapContainer.dataset.rotationInterval) {
      clearInterval(parseInt(mapContainer.dataset.rotationInterval));
      delete mapContainer.dataset.rotationInterval;
    }

    // Reset all transforms smoothly
    mapContainer.style.transition = 'all 1s ease-out';
    mapContainer.style.transform = 'none';
    
    if (mapPane) {
      mapPane.style.transition = 'all 1s ease-out';
      mapPane.style.filter = 'none';
    }

    // Remove 3D overlays
    const buildingsOverlay = mapContainer.querySelector('.buildings-3d-overlay');
    const terrainOverlay = mapContainer.querySelector('.terrain-overlay');
    
    if (buildingsOverlay) {
      buildingsOverlay.style.opacity = '0';
      setTimeout(() => buildingsOverlay.remove(), 1000);
    }
    
    if (terrainOverlay) {
      terrainOverlay.style.opacity = '0';
      setTimeout(() => terrainOverlay.remove(), 1000);
    }
  };

  // Handle feature interactions
  const onEachFeature = (feature, layer) => {
    const purokName = getPurokName(feature.properties);

    // Popup
    layer.bindPopup(`<strong>${purokName}</strong>`);

    // Events
    layer.on({
      click: (e) => {
        e.originalEvent.stopPropagation();
        
        if (onPolygonClick) {
          onPolygonClick(purokName);
        }

        // Apply enhanced 3D drone view effect
        apply3DDroneView(layer);
      },
      mouseover: (e) => {
        const currentStyle = getPolygonStyle(feature);
        const purokName = getPurokName(feature.properties);
        const isSelected = purokName === selectedPurok && isZoomed;
        
        if (!isSelected) {
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

  // Update styles when selection changes
  useEffect(() => {
    if (geoJsonLayerRef.current && geoData) {
      geoJsonLayerRef.current.eachLayer((layer) => {
        if (layer.feature) {
          const style = getPolygonStyle(layer.feature);
          layer.setStyle(style);
        }
      });
    }
  }, [selectedPurok, isZoomed]);

  // Handle exit zoom - reset map view to 2D
  const handleMapClick = () => {
    if (isZoomed && onExitZoom) {
      const map = mapRef.current;
      if (map) {
        reset3DView();
        setTimeout(() => {
          map.setView([8.650788, 124.750792], 15);
          onExitZoom();
        }, 1000);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset3DView();
    };
  }, []);

  // Reset to 2D when exiting zoom
  useEffect(() => {
    if (!isZoomed && is3DMode) {
      reset3DView();
    }
  }, [isZoomed]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[8.650788, 124.750792]}
        zoom={15}
        style={{ height: '600px', width: '100%' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        ref={mapRef}
        onClick={handleMapClick}
      >
        {/* Satellite base layer with 3D buildings support (Mapbox Satellite Streets) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
        />

        {/* Optional: Add OpenStreetMap buildings layer for more detail */}
        {is3DMode && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.2}
            attribution='&copy; OpenStreetMap'
          />
        )}

        {/* draw polygons once loaded */}
        {geoData && (
          <GeoJSON
          key={`geojson-${selectedPurok}-${isZoomed}`}
          data={geoData}
          style={getPolygonStyle}
          onEachFeature={onEachFeature}
          ref={geoJsonLayerRef}
          />        
        )}
      </MapContainer>

      {/* 3D Mode Indicator */}
      {is3DMode && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <i className="fas fa-cube"></i>
            <span>3D View Active</span>
          </div>
        </div>
      )}

      {/* Exit Zoom Button - positioned over the map */}
      {isZoomed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const map = mapRef.current;
            if (map) {
              reset3DView();
              setTimeout(() => {
                map.setView([8.650788, 124.750792], 15);
                onExitZoom();
              }, 1000);
            }
          }}
          className="absolute top-4 right-4 z-[1000] bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
          title="Exit to 2D View"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      )}

      {/* Selected Purok Indicator */}
      {isZoomed && selectedPurok && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <i className="fas fa-map-pin text-orange-400"></i>
            <span className="font-medium">Focused: {selectedPurok}</span>
          </div>
        </div>
      )}

      {/* Instructions overlay when not zoomed */}
      
    </div>
  );
}