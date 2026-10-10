import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Undo2, Trash2, CheckCircle2, AlertTriangle, Layers, Settings, Globe, Check } from 'lucide-react';

// Safely configure Leaflet default icon paths in bundler
if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (e) {
    console.warn('Leaflet icon config error:', e);
  }
}

// Leaflet vertex marker icon
const createVertexIcon = () => {
  return L.divIcon({
    className: 'custom-vertex-marker',
    html: `<div style="background-color: #00e5ff; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px #00e5ff;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Leaflet live receiver marker icon
const createUserLiveIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="position: relative; width: 20px; height: 20px;">
             <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: #10b981; border: 3px solid #fff; box-shadow: 0 0 12px #10b981;"></div>
             <div style="position: absolute; width: 40px; height: 40px; left: -10px; top: -10px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Dark Cyber styling for Google Maps
const googleMapsDarkTheme = [
  { elementType: "geometry", stylers: [{ color: "#060a12" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#060a12" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00e5ff" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#090d16" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0284c7" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0369a1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#021024" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0284c7" }] }
];

export default function InteractiveMap({
  polygonPoints = [],
  setPolygonPoints = null,
  isDrawingMode = false,
  userLocation = null,
  userAccuracy = null,
  center = { lat: 38.893765, lng: -104.801055 },
  zoom = 17,
  height = '420px',
  readOnly = false
}) {
  const mapContainerRef = useRef(null);
  const [initError, setInitError] = useState(null);

  // Map Provider Management (Leaflet vs Google Maps)
  const envGoogleKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY.trim()
    : '';

  const [apiKey, setApiKey] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('seg_google_maps_key')) || envGoogleKey || '';
  });

  const [activeEngine, setActiveEngine] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('seg_map_engine') : null;
    if (saved) return saved;
    const initialKey = (typeof window !== 'undefined' && localStorage.getItem('seg_google_maps_key')) || envGoogleKey;
    return initialKey ? 'google' : 'leaflet';
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // References for Leaflet
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef(null);
  const leafletPolygonRef = useRef(null);
  const leafletUserMarkerRef = useRef(null);
  const leafletUserCircleRef = useRef(null);

  // References for Google Maps
  const gmapInstanceRef = useRef(null);
  const gmapPolygonRef = useRef(null);
  const gmapMarkersRef = useRef([]);
  const gmapUserMarkerRef = useRef(null);
  const gmapUserCircleRef = useRef(null);
  const gmapClickListenerRef = useRef(null);

  // Dynamically load Google Maps script if activeEngine === 'google' and apiKey exists
  useEffect(() => {
    if (activeEngine !== 'google' || !apiKey) {
      setGoogleScriptLoaded(false);
      return;
    }

    if (window.google && window.google.maps) {
      setGoogleScriptLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script-seg';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleScriptLoaded(true);
      script.onerror = () => {
        console.warn('[Google Maps] Failed to load script with provided API key. Falling back to Leaflet.');
        setInitError('Google Maps API key rejected. Switched to Leaflet fallback.');
        setActiveEngine('leaflet');
      };
      document.head.appendChild(script);
    } else {
      script.onload = () => setGoogleScriptLoaded(true);
      if (window.google && window.google.maps) setGoogleScriptLoaded(true);
    }
  }, [activeEngine, apiKey]);

  // Clean up all maps before switching engines
  const cleanupAllMaps = () => {
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (e) {}
      leafletMapRef.current = null;
    }
    if (mapContainerRef.current) {
      mapContainerRef.current._leaflet_id = null;
      mapContainerRef.current.innerHTML = '';
    }
    if (gmapClickListenerRef.current) {
      window.google?.maps?.event?.removeListener(gmapClickListenerRef.current);
      gmapClickListenerRef.current = null;
    }
    gmapPolygonRef.current = null;
    gmapMarkersRef.current = [];
    gmapUserMarkerRef.current = null;
    gmapUserCircleRef.current = null;
    gmapInstanceRef.current = null;
  };

  // -------------------------------------------------------------
  // LEAFLET ENGINE INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeEngine !== 'leaflet') return;
    if (!mapContainerRef.current) return;

    cleanupAllMaps();

    try {
      const initialLat = center?.lat || 38.893765;
      const initialLng = center?.lng || -104.801055;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: zoom || 17,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO | SEG GIS System',
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      leafletMarkersRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      setInitError(null);
    } catch (err) {
      console.error('[Leaflet Init Error]:', err);
      setInitError(err.message);
    }

    return () => cleanupAllMaps();
  }, [activeEngine]);

  // Leaflet Pan
  useEffect(() => {
    if (activeEngine !== 'leaflet' || !leafletMapRef.current) return;
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      try {
        leafletMapRef.current.panTo([center.lat, center.lng]);
      } catch (e) {}
    }
  }, [center?.lat, center?.lng, activeEngine]);

  // Leaflet Click (Drawing Mode)
  useEffect(() => {
    if (activeEngine !== 'leaflet' || !leafletMapRef.current || readOnly) return;
    const map = leafletMapRef.current;

    const handleMapClick = (e) => {
      if (!isDrawingMode || !setPolygonPoints) return;
      const newPt = {
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      };
      setPolygonPoints(prev => [...prev, newPt]);
    };

    map.on('click', handleMapClick);
    return () => {
      try {
        map.off('click', handleMapClick);
      } catch (e) {}
    };
  }, [activeEngine, isDrawingMode, setPolygonPoints, readOnly]);

  // Leaflet Polygon & Marker Rendering
  useEffect(() => {
    if (activeEngine !== 'leaflet' || !leafletMapRef.current) return;
    const map = leafletMapRef.current;

    try {
      if (leafletMarkersRef.current) leafletMarkersRef.current.clearLayers();
      if (leafletPolygonRef.current) {
        map.removeLayer(leafletPolygonRef.current);
        leafletPolygonRef.current = null;
      }

      const validPoints = (polygonPoints || []).filter(
        p => p && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
      );

      if (validPoints.length > 0) {
        const latLngs = validPoints.map(p => [p.lat, p.lng]);
        const vertexIcon = createVertexIcon();

        validPoints.forEach((p, idx) => {
          const marker = L.marker([p.lat, p.lng], { icon: vertexIcon });
          marker.bindTooltip(`Point #${idx + 1}<br/>(${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`, {
            direction: 'top',
            className: 'bg-slate-900 text-cyan-300 font-mono text-xs px-2 py-1 rounded border border-cyan-500/50'
          });
          if (leafletMarkersRef.current) leafletMarkersRef.current.addLayer(marker);
        });

        if (validPoints.length >= 3) {
          leafletPolygonRef.current = L.polygon(latLngs, {
            color: '#00e5ff',
            weight: 3,
            opacity: 0.9,
            fillColor: '#0284c7',
            fillOpacity: 0.25,
            dashArray: isDrawingMode ? '6, 6' : undefined
          }).addTo(map);
        } else if (validPoints.length === 2) {
          leafletPolygonRef.current = L.polyline(latLngs, {
            color: '#00e5ff',
            weight: 2,
            dashArray: '4, 4'
          }).addTo(map);
        }
      }
    } catch (err) {
      console.warn('Leaflet render warning:', err);
    }
  }, [activeEngine, polygonPoints, isDrawingMode]);

  // Leaflet User Location Rendering
  useEffect(() => {
    if (activeEngine !== 'leaflet' || !leafletMapRef.current) return;
    const map = leafletMapRef.current;

    try {
      if (leafletUserMarkerRef.current) {
        map.removeLayer(leafletUserMarkerRef.current);
        leafletUserMarkerRef.current = null;
      }
      if (leafletUserCircleRef.current) {
        map.removeLayer(leafletUserCircleRef.current);
        leafletUserCircleRef.current = null;
      }

      if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        const userLiveIcon = createUserLiveIcon();
        leafletUserMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userLiveIcon }).addTo(map);

        if (userAccuracy) {
          leafletUserCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
            radius: userAccuracy,
            color: '#10b981',
            weight: 1,
            fillColor: '#10b981',
            fillOpacity: 0.12
          }).addTo(map);
        }
        map.setView([userLocation.lat, userLocation.lng], 18);
      }
    } catch (err) {}
  }, [activeEngine, userLocation, userAccuracy]);

  // -------------------------------------------------------------
  // GOOGLE MAPS ENGINE INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeEngine !== 'google' || !googleScriptLoaded || !window.google?.maps) return;
    if (!mapContainerRef.current) return;

    cleanupAllMaps();

    try {
      const initialLat = center?.lat || 38.893765;
      const initialLng = center?.lng || -104.801055;

      const gmap = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: zoom || 17,
        styles: googleMapsDarkTheme,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      gmapInstanceRef.current = gmap;
      setInitError(null);
    } catch (err) {
      console.error('[Google Maps Init Error]:', err);
      setInitError('Failed to initialize Google Maps. Falling back to Leaflet.');
      setActiveEngine('leaflet');
    }

    return () => cleanupAllMaps();
  }, [activeEngine, googleScriptLoaded]);

  // Google Maps Pan
  useEffect(() => {
    if (activeEngine !== 'google' || !gmapInstanceRef.current) return;
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      gmapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
    }
  }, [center?.lat, center?.lng, activeEngine]);

  // Google Maps Click (Drawing Mode)
  useEffect(() => {
    if (activeEngine !== 'google' || !gmapInstanceRef.current || readOnly) return;
    const gmap = gmapInstanceRef.current;

    if (gmapClickListenerRef.current) {
      window.google.maps.event.removeListener(gmapClickListenerRef.current);
    }

    gmapClickListenerRef.current = gmap.addListener('click', (e) => {
      if (!isDrawingMode || !setPolygonPoints) return;
      const newPt = {
        lat: Number(e.latLng.lat().toFixed(6)),
        lng: Number(e.latLng.lng().toFixed(6))
      };
      setPolygonPoints(prev => [...prev, newPt]);
    });

    return () => {
      if (gmapClickListenerRef.current) {
        window.google.maps.event.removeListener(gmapClickListenerRef.current);
      }
    };
  }, [activeEngine, isDrawingMode, setPolygonPoints, readOnly, googleScriptLoaded]);

  // Google Maps Polygon & Markers
  useEffect(() => {
    if (activeEngine !== 'google' || !gmapInstanceRef.current || !window.google?.maps) return;
    const gmap = gmapInstanceRef.current;

    try {
      // Clear existing markers & polygon
      gmapMarkersRef.current.forEach(m => m.setMap(null));
      gmapMarkersRef.current = [];
      if (gmapPolygonRef.current) {
        gmapPolygonRef.current.setMap(null);
        gmapPolygonRef.current = null;
      }

      const validPoints = (polygonPoints || []).filter(
        p => p && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
      );

      if (validPoints.length > 0) {
        const pathCoords = validPoints.map(p => ({ lat: p.lat, lng: p.lng }));

        // Place vertex markers
        validPoints.forEach((p, idx) => {
          const marker = new window.google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: gmap,
            title: `Point #${idx + 1} (${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#00e5ff",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
          gmapMarkersRef.current.push(marker);
        });

        if (validPoints.length >= 3) {
          gmapPolygonRef.current = new window.google.maps.Polygon({
            paths: pathCoords,
            strokeColor: "#00e5ff",
            strokeOpacity: 0.9,
            strokeWeight: 3,
            fillColor: "#0284c7",
            fillOpacity: 0.25,
            map: gmap
          });
        }
      }
    } catch (err) {
      console.warn('Google Maps polygon render warning:', err);
    }
  }, [activeEngine, polygonPoints, isDrawingMode, googleScriptLoaded]);

  // Google Maps User Live Location
  useEffect(() => {
    if (activeEngine !== 'google' || !gmapInstanceRef.current || !window.google?.maps) return;
    const gmap = gmapInstanceRef.current;

    try {
      if (gmapUserMarkerRef.current) {
        gmapUserMarkerRef.current.setMap(null);
        gmapUserMarkerRef.current = null;
      }
      if (gmapUserCircleRef.current) {
        gmapUserCircleRef.current.setMap(null);
        gmapUserCircleRef.current = null;
      }

      if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        gmapUserMarkerRef.current = new window.google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: gmap,
          title: `Receiver Position: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
          }
        });

        if (userAccuracy) {
          gmapUserCircleRef.current = new window.google.maps.Circle({
            map: gmap,
            center: { lat: userLocation.lat, lng: userLocation.lng },
            radius: userAccuracy,
            fillColor: "#10b981",
            fillOpacity: 0.15,
            strokeColor: "#10b981",
            strokeOpacity: 0.6,
            strokeWeight: 1
          });
        }

        gmap.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      }
    } catch (err) {}
  }, [activeEngine, userLocation, userAccuracy, googleScriptLoaded]);

  // Handle saving API key
  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('seg_google_maps_key', trimmed);
        localStorage.setItem('seg_map_engine', 'google');
        setActiveEngine('google');
      } else {
        localStorage.removeItem('seg_google_maps_key');
        localStorage.setItem('seg_map_engine', 'leaflet');
        setActiveEngine('leaflet');
      }
    }
    setShowConfigModal(false);
  };

  const handleSwitchEngine = (engine) => {
    setActiveEngine(engine);
    if (typeof window !== 'undefined') {
      localStorage.setItem('seg_map_engine', engine);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-cyan-900/40 shadow-2xl bg-slate-950">
      
      {/* Top Map Status Banner */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs shadow-lg">
        <span className={`w-2.5 h-2.5 rounded-full ${activeEngine === 'google' ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse`}></span>
        <span className="font-mono text-cyan-300 uppercase tracking-wider font-semibold">
          {activeEngine === 'google' ? 'Google Maps API Engine' : 'Leaflet GIS Engine'}
        </span>
        <span className="text-slate-400 text-[11px] ml-1">({(polygonPoints || []).length} vertices)</span>
      </div>

      {/* Top Right: Engine & API Key Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSwitchEngine(activeEngine === 'google' ? 'leaflet' : 'google')}
          disabled={!apiKey && activeEngine === 'leaflet'}
          title={!apiKey ? 'Add Google Maps API Key to activate' : `Switch to ${activeEngine === 'google' ? 'Leaflet' : 'Google Maps'}`}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg ${
            activeEngine === 'google'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          } ${!apiKey ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{activeEngine === 'google' ? 'Google Maps' : 'Leaflet (OSM)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          className={`p-1.5 rounded-lg text-xs font-mono border backdrop-blur-md transition flex items-center gap-1 shadow-lg ${
            apiKey
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900'
              : 'bg-slate-900/90 text-yellow-400 border-yellow-500/50 hover:bg-slate-800'
          }`}
          title="Configure Google Maps API Key"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">{apiKey ? 'API Key Active' : 'Add Google Key'}</span>
        </button>
      </div>

      {/* Main Map DOM Element */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {/* Drawing mode instructional overlay hint */}
      {isDrawingMode && (!polygonPoints || polygonPoints.length === 0) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-950/95 border border-cyan-500 text-cyan-200 px-4 py-2 rounded-lg text-xs shadow-xl flex items-center gap-2 font-mono pointer-events-none">
          <MapPin className="w-4 h-4 text-cyan-400 animate-bounce" />
          Click anywhere on the map to place boundary points (at least 3 to close polygon).
        </div>
      )}

      {/* Error Banner */}
      {initError && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-red-950/90 border border-red-500 text-red-200 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl flex items-center justify-between">
          <span>{initError}</span>
          <button onClick={() => setInitError(null)} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Google Maps API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Globe className="w-4 h-4" />
                <span>Google Maps API Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your <b>Google Maps JavaScript API Key</b> below. Once saved, the location access map will render via official Google Maps Platform with high-resolution satellite imagery and vectors.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-cyan-400 block uppercase tracking-wider">
                Google Maps API Key
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                Leave empty to use Leaflet / OpenStreetMap (100% free with zero billing).
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Save & Apply Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeyInput('');
                  setApiKey('');
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('seg_google_maps_key');
                    localStorage.setItem('seg_map_engine', 'leaflet');
                  }
                  setActiveEngine('leaflet');
                  setShowConfigModal(false);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
              >
                Reset to Leaflet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
