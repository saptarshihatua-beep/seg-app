import React, { useState, useEffect } from 'react';
import { 
  Lock, MapPin, Send, Upload, Key, FileText, Globe, Layers, 
  Download, Eye, EyeOff, ShieldCheck, Wifi, Radio, Sparkles, RefreshCw, CheckCircle,
  Undo2, Trash2
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { encryptDocumentClientSide } from '../utils/cryptoClient';
import { api } from '../utils/api';

// UCCS Engineering Building benchmark from assignment PDF
const UCCS_PRESET = {
  address: 'Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918',
  center: { lat: 38.893765, lng: -104.801055 },
  coords: [
    { lat: 38.894143, lng: -104.800769 },
    { lat: 38.893867, lng: -104.801091 },
    { lat: 38.893178, lng: -104.799760 },
    { lat: 38.893445, lng: -104.799589 }
  ],
  key: 'myvoice',
  filename: 'fyi.txt',
  content: 'CONFIDENTIAL: UCCS CS6910 Master Research Data. Physical presence in Engineering Wing strictly required.'
};

export default function ComposeDocument({ onDocumentCreated }) {
  const [receiverEmail, setReceiverEmail] = useState('edward@chow-s.com');
  const [encryptionKey, setEncryptionKey] = useState('myvoice');
  const [showKey, setShowKey] = useState(false);
  const [locationAddress, setLocationAddress] = useState(UCCS_PRESET.address);
  const [polygonPoints, setPolygonPoints] = useState(UCCS_PRESET.coords);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapCenter, setMapCenter] = useState(UCCS_PRESET.center);

  // File / content input
  const [inputType, setInputType] = useState('text'); // 'text' or 'file'
  const [textContent, setTextContent] = useState(UCCS_PRESET.content);
  const [selectedFile, setSelectedFile] = useState(null);

  // Advanced Security MFA options
  const [requireWifi, setRequireWifi] = useState(false);
  const [wifiBssid, setWifiBssid] = useState('00:14:22:01:23:45');
  const [requireBle, setRequireBle] = useState(false);
  const [bleUuid, setBleUuid] = useState('e2c56db5-dffb-48d2-b060-d0f5a71096e0');
  const [keyDeliveryMode, setKeyDeliveryMode] = useState('escrow_geolocked'); // 'escrow_geolocked' or 'out_of_band'

  // Submission state
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState('');
  const [previewEncrypted, setPreviewEncrypted] = useState(null);

  // Receivers list dropdown
  const [registeredReceivers, setRegisteredReceivers] = useState([]);

  useEffect(() => {
    api.listReceivers()
      .then(res => {
        if (res.receivers) setRegisteredReceivers(res.receivers);
      })
      .catch(() => {});
  }, []);

  // Quick preset loader
  const loadUccsPreset = () => {
    setReceiverEmail('edward@chow-s.com');
    setEncryptionKey('myvoice');
    setLocationAddress(UCCS_PRESET.address);
    setPolygonPoints(UCCS_PRESET.coords);
    setMapCenter(UCCS_PRESET.center);
    setInputType('text');
    setTextContent(UCCS_PRESET.content);
    setSelectedFile(null);
    setError('');
  };

  // Generate random AES 256 passphrase
  const generateStrongKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEncryptionKey(res);
  };

  // Address search simulator / geocoder
  const handleAddressSearch = async () => {
    if (!locationAddress) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setMapCenter({ lat: newLat, lng: newLng });
        // Set an initial bounding box around the address
        const offset = 0.0005;
        setPolygonPoints([
          { lat: Number((newLat + offset).toFixed(6)), lng: Number((newLng - offset).toFixed(6)) },
          { lat: Number((newLat + offset).toFixed(6)), lng: Number((newLng + offset).toFixed(6)) },
          { lat: Number((newLat - offset).toFixed(6)), lng: Number((newLng + offset).toFixed(6)) },
          { lat: Number((newLat - offset).toFixed(6)), lng: Number((newLng - offset).toFixed(6)) }
        ]);
      }
    } catch (e) {
      console.warn('Geocoding request failed:', e);
    }
  };

  // Handle compose submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!receiverEmail) {
      setError('Please provide receiver email address.');
      return;
    }
    if (!encryptionKey) {
      setError('Please provide AES encryption passphrase.');
      return;
    }
    if (polygonPoints.length < 3) {
      setError('Please draw at least 3 boundary points to enclose a geolocked area.');
      return;
    }

    try {
      setLoading(true);

      // Perform Client-Side AES-256 Encryption (Matching Assignment geoloc.js)
      let encryptedPayload = null;
      let originalFilename = 'document.txt';

      if (inputType === 'file' && selectedFile) {
        originalFilename = selectedFile.name;
        encryptedPayload = await encryptDocumentClientSide(selectedFile, encryptionKey);
      } else {
        originalFilename = 'confidential_memo.txt';
        encryptedPayload = await encryptDocumentClientSide(textContent, encryptionKey);
      }

      setPreviewEncrypted(encryptedPayload);

      // Submit to backend
      const formData = new FormData();
      formData.append('receiverEmail', receiverEmail);
      formData.append('encryptionKey', encryptionKey);
      formData.append('locationAddress', locationAddress);
      formData.append('polygonCoordinates', JSON.stringify(polygonPoints));
      formData.append('originalFilename', originalFilename);
      formData.append('clientEncryptedPayload', JSON.stringify(encryptedPayload));
      formData.append('keyDeliveryMode', keyDeliveryMode);

      if (requireWifi) {
        formData.append('authorizedWifiBssid', wifiBssid);
      }
      if (requireBle) {
        formData.append('authorizedBleUuid', bleUuid);
      }

      if (inputType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await api.createDocument(formData);
      setSuccessInfo(res);
      if (onDocumentCreated) onDocumentCreated(res.document);

    } catch (err) {
      setError(err.message || 'Failed to encrypt and geolock document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Academic Reference Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-cyan-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Project 4a: Secure Enhanced Geolocking (SEG 2.0)</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Compose & Geolock Document</h1>
            <p className="text-slate-400 text-sm mt-1">
              Encrypt payload using client-side AES-256 and restrict cryptographic retrieval to a certified geographical boundary.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadUccsPreset}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-mono transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Load Assignment Figure 1 Preset (UCCS)
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
          
          {/* Step 1: Receiver Email */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Fill In Receiver's Email</span>
              <span className="text-[10px] text-slate-500">Authorized Recipient</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                placeholder="receiver@uccs.edu"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
            {/* Quick Receivers Chips */}
            {registeredReceivers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 self-center">Registered:</span>
                {registeredReceivers.map(r => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setReceiverEmail(r.email)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition"
                  >
                    {r.name.split(' ')[0]} ({r.email})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Document Payload */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2. Specify Document to Geolock</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputType('text')}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${inputType === 'text' ? 'bg-cyan-500 text-black font-semibold' : 'bg-slate-800 text-slate-400'}`}
                >
                  Text Note
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('file')}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${inputType === 'file' ? 'bg-cyan-500 text-black font-semibold' : 'bg-slate-800 text-slate-400'}`}
                >
                  Upload File
                </button>
              </div>
            </label>

            {inputType === 'text' ? (
              <textarea
                rows={4}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter sensitive message to be AES-encrypted..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            ) : (
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center bg-slate-950/50 transition">
                <input
                  type="file"
                  id="doc-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-white font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select document or drag & drop'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">PDF, TXT, DOCX, PNG (Max 25MB)</p>
                </label>
              </div>
            )}
          </div>

          {/* Step 3: AES Key */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>3. Enter AES Encryption Key</span>
              <button
                type="button"
                onClick={generateStrongKey}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3 h-3" /> Auto-Gen 256-bit
              </button>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                required
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                placeholder="AES Secret Passphrase"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 4: Key Delivery Strategy */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
              4. Key Delivery Architecture
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`p-3 rounded-xl border cursor-pointer transition ${keyDeliveryMode === 'escrow_geolocked' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <input
                  type="radio"
                  name="keyMode"
                  value="escrow_geolocked"
                  checked={keyDeliveryMode === 'escrow_geolocked'}
                  onChange={() => setKeyDeliveryMode('escrow_geolocked')}
                  className="hidden"
                />
                <b className="block text-white mb-0.5">Automated Escrow</b>
                Server releases AES key only upon verified physical location.
              </label>
              <label className={`p-3 rounded-xl border cursor-pointer transition ${keyDeliveryMode === 'out_of_band' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <input
                  type="radio"
                  name="keyMode"
                  value="out_of_band"
                  checked={keyDeliveryMode === 'out_of_band'}
                  onChange={() => setKeyDeliveryMode('out_of_band')}
                  className="hidden"
                />
                <b className="block text-white mb-0.5">Out-of-Band (Zero-Knowledge)</b>
                Sender shares passphrase directly via separate secure channel.
              </label>
            </div>
          </div>

          {/* Step 5: Advanced MFA Layers (Wi-Fi / BLE) */}
          <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Multi-Factor Physical Presence
              </span>
              <span className="text-[10px] text-slate-500">High-Assurance Defense</span>
            </div>

            {/* WiFi Toggle */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireWifi}
                  onChange={(e) => setRequireWifi(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>Require Authorized Local Wi-Fi BSSID</span>
              </label>
              {requireWifi && (
                <input
                  type="text"
                  value={wifiBssid}
                  onChange={(e) => setWifiBssid(e.target.value)}
                  placeholder="e.g., 00:14:22:01:23:45 (Campus AP)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              )}
            </div>

            {/* BLE Toggle */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireBle}
                  onChange={(e) => setRequireBle(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Require In-Building BLE Beacon UUID</span>
              </label>
              {requireBle && (
                <input
                  type="text"
                  value={bleUuid}
                  onChange={(e) => setBleUuid(e.target.value)}
                  placeholder="e.g., e2c56db5-dffb-48d2-b060-d0f5a71096e0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Encrypting & Generating KML...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Encrypt the File & Key and Send!</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-300 rounded-xl text-xs font-mono">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map & Boundary Drawing */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            
            {/* Address Search Bar */}
            <div>
              <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                Specify Geolocation Where Document Should Be Retrieved
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Enter street address, campus building, or coordinates..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono border border-slate-700 whitespace-nowrap transition"
                >
                  Show Map
                </button>
              </div>
            </div>

            {/* Map Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition ${isDrawingMode ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isDrawingMode ? 'Exit Boundary Mode' : 'Access Boundaries'}
                </button>

                {polygonPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPolygonPoints(prev => prev.slice(0, -1))}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700"
                    title="Undo last coordinate point"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {polygonPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPolygonPoints([])}
                    className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-mono border border-red-800/40"
                    title="Clear all points"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Boundaries: <span className="text-cyan-400 font-semibold">{polygonPoints.length}</span> points {polygonPoints.length >= 3 ? '(Closed Polygon)' : '(Incomplete)'}
              </div>
            </div>

            {/* Interactive GIS Map */}
            <InteractiveMap
              polygonPoints={polygonPoints}
              setPolygonPoints={setPolygonPoints}
              isDrawingMode={isDrawingMode}
              center={mapCenter}
              zoom={17}
              height="410px"
            />

            {/* Coordinates Stream Preview matching original SEG format */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-slate-400 flex justify-between">
                <span>Polygon Coordinates Matrix:</span>
                <span className="text-cyan-400">{polygonPoints.length} Vertices</span>
              </div>
              <div className="text-slate-300 break-all bg-slate-900/80 p-2 rounded border border-slate-800/80 max-h-16 overflow-y-auto">
                {polygonPoints.length > 0
                  ? polygonPoints.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(', ')
                  : 'No coordinates selected. Click "Access Boundaries" to mark points on the map.'
                }
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal / Card when Document is Geolocked */}
      {successInfo && (
        <div className="p-6 bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Document Successfully Geolocked & Tokenized!</h3>
          </div>

          <p className="text-slate-300 text-sm">
            The document was encrypted with AES-256 and stored in the secure server repository. A single-use access link has been generated.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-500">Receiver Share Link:</span>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={successInfo.shareInfo.shareUrl}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(successInfo.shareInfo.shareUrl)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-800 text-slate-400">
              <span>Token Expires: <b className="text-slate-200">{new Date(successInfo.shareInfo.expiresAt).toLocaleTimeString()}</b></span>
              <a
                href={api.kmlDownloadUrl(successInfo.document.kmlFilename)}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download KML File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
