import React, { useState, useMemo } from 'react';
import { 
  Compass, MapPin, CheckCircle2, XCircle, Lock, 
  Unlock, ShieldAlert, Sparkles, Navigation, Info, RefreshCw
} from 'lucide-react';

export default function InteractiveDemonstrationSandbox() {
  // Preset Demonstration Locations
  const presets = [
    {
      id: 'inside_eng',
      label: 'Inside Geofence (UCCS Engineering Hall)',
      lat: 38.8936,
      lng: -104.8002,
      description: 'Authorized recipient physically situated in the engineering complex.'
    },
    {
      id: 'perimeter_edge',
      label: 'Geofence Perimeter (Austin Bluffs Pkwy)',
      lat: 38.8950,
      lng: -104.8020,
      description: 'Borderline position evaluating 150m geofence tolerance.'
    },
    {
      id: 'outside_downtown',
      label: 'Outside Geofence (Downtown C-Springs ~8km)',
      lat: 38.8338,
      lng: -104.8214,
      description: 'Attempted recipient access outside designated academic perimeter.'
    },
    {
      id: 'remote_denver',
      label: 'Remote Intrusion (Denver ~95km away)',
      lat: 39.7392,
      lng: -104.9903,
      description: 'Far-field access attempt simulating out-of-state or out-of-boundary access.'
    }
  ];

  // Geofence Boundary Polygon for Demo (UCCS Campus)
  const demoPolygon = useMemo(() => [
    { lat: 38.8970, lng: -104.8050 },
    { lat: 38.8970, lng: -104.7950 },
    { lat: 38.8900, lng: -104.7950 },
    { lat: 38.8900, lng: -104.8050 }
  ], []);

  const [activePin, setActivePin] = useState(presets[0]);
  const [customLat, setCustomLat] = useState(presets[0].lat);
  const [customLng, setCustomLng] = useState(presets[0].lng);

  // Exact Mathematical Ray-Casting Algorithm (Point-in-Polygon)
  const isInside = useMemo(() => {
    const lat = customLat;
    const lng = customLng;
    let inside = false;
    for (let i = 0, j = demoPolygon.length - 1; i < demoPolygon.length; j = i++) {
      const xi = demoPolygon[i].lng, yi = demoPolygon[i].lat;
      const xj = demoPolygon[j].lng, yj = demoPolygon[j].lat;
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, [customLat, customLng, demoPolygon]);

  // Haversine Distance to Polygon Centroid in meters
  const distanceToCenter = useMemo(() => {
    const centerLat = 38.8935;
    const centerLng = -104.8000;
    const R = 6371e3; // Earth radius in meters
    const phi1 = (customLat * Math.PI) / 180;
    const phi2 = (centerLat * Math.PI) / 180;
    const deltaPhi = ((centerLat - customLat) * Math.PI) / 180;
    const deltaLambda = ((centerLng - customLng) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [customLat, customLng]);

  const selectPreset = (preset) => {
    setActivePin(preset);
    setCustomLat(preset.lat);
    setCustomLng(preset.lng);
  };

  return (
    <section id="interactive-demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-900">
      
      {/* Prominent Demonstration Sandbox Disclaimer Label */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold">
          <Info className="w-4 h-4 text-amber-400" />
          <span>INTERACTIVE DEMONSTRATION SANDBOX • SIMULATED DATA FOR ARCHITECTURAL EVALUATION</span>
        </div>
      </div>

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Interactive Geofence Decryption Sandbox
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400">
          Test how physical GPS coordinates govern the mathematical release of decryption keys. Select preset locations or test simulated device positions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Preset Selector & Coordinates Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold block mb-3">
              1. Select Test Location Scenario:
            </span>

            <div className="space-y-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs font-mono flex flex-col gap-1 ${
                    activePin.id === preset.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-cyan-300">{preset.label}</span>
                    <span className="text-[10px] text-slate-500">[{preset.lat.toFixed(4)}, {preset.lng.toFixed(4)}]</span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-normal">{preset.description}</span>
                </button>
              ))}
            </div>

            {/* Custom Coordinates Adjustment */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-3 text-xs font-mono">
              <span className="text-slate-400 block font-bold">Manual Coordinate Simulation:</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={customLat}
                    onChange={(e) => {
                      setCustomLat(parseFloat(e.target.value) || 0);
                      setActivePin({ id: 'custom', label: 'Custom Coordinate' });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Longitude (°W)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={customLng}
                    onChange={(e) => {
                      setCustomLng(parseFloat(e.target.value) || 0);
                      setActivePin({ id: 'custom', label: 'Custom Coordinate' });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Mathematical Visualization & Decryption Terminal */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Simulated GIS Polygon Radar Visualization */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            
            {/* Header Telemetry */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white">Spatial Boundary Calculation</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${isInside ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                {isInside ? 'INSIDE BOUNDS' : 'OUTSIDE BOUNDS'}
              </span>
            </div>

            {/* Radar Canvas SVG */}
            <div className="relative w-full h-56 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full p-4" viewBox="0 0 200 120">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100, 116, 139, 0.15)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Geofence Polygon Box */}
                <polygon
                  points="50,20 150,20 150,90 50,90"
                  fill="rgba(0, 229, 255, 0.12)"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Polygon Label */}
                <text x="55" y="32" fill="#00e5ff" fontSize="7" fontFamily="monospace">
                  Authorized Geofence Perimeter (UCCS)
                </text>

                {/* Calculated Test Pin Placement */}
                {isInside ? (
                  /* Inside Position Pin */
                  <g transform="translate(100, 55)">
                    <circle r="14" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" style={{ transformOrigin: 'center' }} />
                    <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <text x="10" y="4" fill="#10b981" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      Pin: Legitimate Access
                    </text>
                  </g>
                ) : (
                  /* Outside Position Pin */
                  <g transform="translate(25, 95)">
                    <circle r="14" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" style={{ transformOrigin: 'center' }} />
                    <circle r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                    <text x="10" y="4" fill="#f43f5e" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      Pin: Access Blocked (~{distanceToCenter}m)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">PIP Status</span>
                <b className={isInside ? 'text-emerald-400' : 'text-rose-400'}>
                  {isInside ? 'CONTAINED (ODD)' : 'EXCLUDED (EVEN)'}
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Radial Distance</span>
                <b className="text-cyan-300">~{distanceToCenter.toLocaleString()}m</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">HTTP Decision</span>
                <b className={isInside ? 'text-emerald-400' : 'text-rose-400'}>
                  {isInside ? 'HTTP 200 OK' : 'HTTP 403 FORBIDDEN'}
                </b>
              </div>
            </div>

          </div>

          {/* Cryptographic Result Card */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isInside 
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-xl shadow-emerald-950/30' 
              : 'bg-rose-950/30 border-rose-500/60 shadow-xl shadow-rose-950/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {isInside ? (
                <div className="p-2 rounded-xl bg-emerald-900/80 text-emerald-300">
                  <Unlock className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-rose-900/80 text-rose-300">
                  <Lock className="w-5 h-5 text-rose-400" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-white">
                  {isInside ? 'Decryption Key Released from Escrow' : 'Zero-Trust Geofence Rejection Enforced'}
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  {isInside ? 'Mathematical coordinates intersect authorized polygon' : 'Device physical telemetry failed polygon containment'}
                </p>
              </div>
            </div>

            {/* Decrypted vs Blocked Payload Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              <span className="text-slate-500 text-[10px] uppercase block">
                {isInside ? 'Decrypted Payload Output (Simulated):' : 'Encrypted Ciphertext (Inaccessible):'}
              </span>
              {isInside ? (
                <p className="text-emerald-300 leading-relaxed">
                  "CONFIDENTIAL RESEARCH: UCCS Autonomous GeoLock Protocol v2.0 verified in Engineering Hall. Key: aes256_escrow_key_released"
                </p>
              ) : (
                <p className="text-rose-300/80 break-all leading-relaxed">
                  "U2FsdGVkX19x9Z9x0qA+wL3... [ACCESS DENIED: OUT_OF_BOUNDS (HTTP 403)]"
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
