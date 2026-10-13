import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, MapPin, Navigation, Key, Download, 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Wifi, Radio, Lock, Unlock, Eye, EyeOff, Sparkles
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { api } from '../utils/api';
import { decryptDocumentClientSide } from '../utils/cryptoClient';

export default function AccessVerificationPage({ initialToken, initialDocId }) {
  const [token, setToken] = useState(initialToken || '');
  const [docId, setDocId] = useState(initialDocId || '');
  const [manualTokenInput, setManualTokenInput] = useState(initialToken || '');
  const [docData, setDocData] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [initError, setInitError] = useState('');

  // Location readings
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationTimestamp, setLocationTimestamp] = useState(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Multi-factor signals
  const [detectedWifiBssid, setDetectedWifiBssid] = useState('');
  const [detectedBleUuid, setDetectedBleUuid] = useState('');

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Decryption state
  const [decryptionKey, setDecryptionKey] = useState('');
  const [showDecryptionKey, setShowDecryptionKey] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // Validate token and load document info, or generate token if docId is provided
  useEffect(() => {
    if (token) {
      setLoadingDoc(true);
      setInitError('');

      api.validateToken(token, docId)
        .then(res => {
          if (res.valid) {
            setDocData(res.document);
            if (res.document.authWifi) setDetectedWifiBssid(res.document.authWifi);
            if (res.document.authBle) setDetectedBleUuid(res.document.authBle);
          } else {
            setInitError(res.error || 'Token validation failed.');
          }
        })
        .catch(err => {
          setInitError(err.message || 'Token is invalid or expired.');
        })
        .finally(() => setLoadingDoc(false));
    } else if (docId) {
      // Auto-obtain single-use token for authenticated user (sender or receiver)
      setLoadingDoc(true);
      setInitError('');

      api.generateToken(docId)
        .then(tokenRes => {
          if (tokenRes.token) {
            setToken(tokenRes.token);
            setManualTokenInput(tokenRes.token);
          }
        })
        .catch(err => {
          // If token generation is not allowed, fallback to loading document boundary info
          api.getDocumentDetails(docId)
            .then(docRes => {
              if (docRes.document) {
                setDocData(docRes.document);
                if (docRes.document.authWifi) setDetectedWifiBssid(docRes.document.authWifi);
                if (docRes.document.authBle) setDetectedBleUuid(docRes.document.authBle);
              }
            })
            .catch(() => {
              setInitError('Please enter an access token or open via a secure shared link.');
            });
        })
        .finally(() => setLoadingDoc(false));
    }
  }, [token, docId]);

  // Request real device browser GPS
  const requestBrowserGps = () => {
    setLocating(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        setCoords({ lat, lng });
        setAccuracy(acc);
        setLocationTimestamp(pos.timestamp || Date.now());
        setLocating(false);
      },
      (err) => {
        setGpsError(`Browser GPS error: ${err.message}. (Firefox note: ensure geo.enabled is true).`);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Preset location triggers for instant testing
  const simulateInsideUccs = () => {
    setCoords({ lat: 38.893650, lng: -104.800200 }); // Centered inside UCCS Engineering building
    setAccuracy(12);
    setLocationTimestamp(Date.now());
    setGpsError('');
  };

  const simulateOutsideDenver = () => {
    setCoords({ lat: 39.739200, lng: -104.990300 }); // ~100 km away in Denver
    setAccuracy(15);
    setLocationTimestamp(Date.now());
    setGpsError('');
  };

  // Perform multi-layer verification
  const handleVerify = async () => {
    if (!coords) {
      setGpsError('Please acquire location reading first.');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // 1. Fetch challenge nonce for anti-replay
      const challenge = await api.requestChallenge(token);

      // 2. Authorize with backend
      const res = await api.authorizeLocation({
        token,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: accuracy,
        clientTimestamp: locationTimestamp || Date.now(),
        challengeNonce: challenge?.nonce,
        wifiBssid: detectedWifiBssid,
        bleBeaconUuid: detectedBleUuid
      });

      setVerificationResult(res);

      // If server provided escrow key (and sender chose automated escrow), auto-fill it
      if (res.granted && res.document.escrowKey) {
        setDecryptionKey(res.document.escrowKey);
      } else {
        setDecryptionKey('');
      }
    } catch (err) {
      setVerificationResult({
        granted: false,
        error: err.message
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle client-side decryption of authorized payload
  const handleDecrypt = () => {
    if (!verificationResult || !verificationResult.document) return;
    setDecrypting(true);
    setDecryptError('');

    try {
      const payload = verificationResult.document.encryptedPayload;
      const res = decryptDocumentClientSide(payload, decryptionKey);

      if (res.success) {
        setDecryptedResult(res);
        setDecryptedContent(res.content || '');
      } else {
        setDecryptError(res.error || 'Decryption failed. Please check your AES key.');
      }
    } catch (e) {
      setDecryptError('Decryption error: ' + e.message);
    } finally {
      setDecrypting(false);
    }
  };

  // Download decrypted file (handles both text and uncorrupted binary images)
  const handleDownloadDecryptedFile = () => {
    if (!decryptedResult || !verificationResult) return;
    const doc = verificationResult.document;
    const filename = doc.originalFilename || 'document.txt';
    const mimeType = doc.mimeType || 'application/octet-stream';

    let blob;
    if (decryptedResult.base64) {
      // Decode Base64 to Uint8Array bytes to guarantee images are 100% uncorrupted
      const binaryString = atob(decryptedResult.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
    } else {
      blob = new Blob([decryptedResult.content || ''], { type: 'text/plain;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decrypted_${filename}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-6 rounded-2xl border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Geofence Access Verification</h1>
            <p className="text-slate-400 text-sm">
              Physical boundary verification gateway. Access requires authenticated presence within the geolocked zone.
            </p>
          </div>
        </div>
      </div>

      {/* Token Input Bar (if opened manually) */}
      {!initialToken && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualTokenInput.trim()) setToken(manualTokenInput.trim());
          }}
          className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg flex gap-3"
        >
          <div className="flex-1">
            <input
              type="text"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              placeholder="Paste 64-character hex access token..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono transition"
          >
            Load Target
          </button>
        </form>
      )}

      {loadingDoc && (
        <div className="p-12 text-center text-cyan-400 font-mono text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Validating access token cryptographic credentials...
        </div>
      )}

      {initError && (
        <div className="p-6 bg-red-950/40 border border-red-500 rounded-2xl text-red-300 font-mono text-sm space-y-2">
          <div className="flex items-center gap-2 text-base font-bold text-red-200">
            <XCircle className="w-5 h-5 text-red-400" />
            Access Rejected
          </div>
          <p>{initError}</p>
        </div>
      )}

      {/* Target Document Details & Verification Gateway */}
      {docData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Verification Controls */}
          <div className="lg:col-span-5 space-y-5 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
            
            {/* Document Brief */}
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                Target Protected Asset
              </span>
              <h2 className="text-lg font-bold text-white break-words">{docData.originalFilename}</h2>
              <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
                <div>Sender: <span className="text-slate-200">{docData.senderName} ({docData.senderEmail})</span></div>
                <div>Permitted Zone: <span className="text-cyan-300">{docData.locationAddress}</span></div>
                <div>Vertices: <span className="text-slate-200">{docData.polygonCoordinates?.length || 0} Polygon Points</span></div>
              </div>
            </div>

            {/* Geolocation Acquisition Section */}
            <div className="space-y-3">
              <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                <span>1. Acquire Receiver Geolocation</span>
                <span className="text-[10px] text-slate-500">W3C Geolocation API</span>
              </label>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={requestBrowserGps}
                  disabled={locating}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Requesting GPS Satellite Fix...' : 'Query Device Browser Geolocation'}
                </button>

                {/* Instant Testing Presets */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={simulateInsideUccs}
                    className="py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 rounded-xl text-[11px] font-mono transition text-left flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Simulate Inside (UCCS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={simulateOutsideDenver}
                    className="py-2 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-200 rounded-xl text-[11px] font-mono transition text-left flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span>Simulate Outside (Denver)</span>
                  </button>
                </div>
              </div>

              {gpsError && (
                <div className="p-2.5 bg-red-950/50 border border-red-500/50 text-red-300 rounded-lg text-xs font-mono">
                  {gpsError}
                </div>
              )}

              {/* Acquired Coordinates Telemetry Box */}
              {coords && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Latitude:</span>
                    <span className="text-cyan-300 font-bold">{coords.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Current Longitude:</span>
                    <span className="text-cyan-300 font-bold">{coords.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sensor Accuracy:</span>
                    <span className="text-emerald-400">±{accuracy} meters</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-900">
                    <span>Reading Timestamp:</span>
                    <span>{new Date(locationTimestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Multi-Factor Presence Check (Wi-Fi / BLE) */}
            {(docData.authWifi || docData.authBle) && (
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                  Secondary Verification Signals
                </span>
                {docData.authWifi && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-cyan-400" />
                      Detected Wi-Fi BSSID:
                    </label>
                    <input
                      type="text"
                      value={detectedWifiBssid}
                      onChange={(e) => setDetectedWifiBssid(e.target.value)}
                      placeholder="e.g. 00:14:22:01:23:45"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
                {docData.authBle && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      Detected BLE Beacon UUID:
                    </label>
                    <input
                      type="text"
                      value={detectedBleUuid}
                      onChange={(e) => setDetectedBleUuid(e.target.value)}
                      placeholder="e.g. e2c56db5-dffb-48d2-b060-d0f5a71096e0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Authorize Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !coords}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Ray-Casting & Freshness...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify Geolocation & Unlock</span>
                </>
              )}
            </button>

            {/* Verification Result Banner */}
            {verificationResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${verificationResult.granted ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200' : 'bg-red-950/50 border-red-500 text-red-200'}`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verificationResult.granted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>PHYSICAL PRESENCE CERTIFIED!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span>ACCESS DENIED</span>
                    </>
                  )}
                </div>
                <p>{verificationResult.message || verificationResult.error}</p>
                {verificationResult.distanceMeters && (
                  <p className="text-yellow-300">
                    Estimated distance to boundary: ~{verificationResult.distanceMeters} meters away.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: GIS Map & Live Location Radar */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Authorized Zone Perimeter</span>
                <span className="text-cyan-400 font-semibold">{docData.locationAddress}</span>
              </div>

              {/* Map displaying polygon and receiver's live location */}
              <InteractiveMap
                polygonPoints={docData.polygonCoordinates || []}
                userLocation={coords}
                userAccuracy={accuracy}
                center={docData.polygonCoordinates?.[0] || { lat: 38.893765, lng: -104.801055 }}
                zoom={17}
                height="380px"
                readOnly={true}
              />

              {/* Legend & Telemetry Status */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-cyan-400 border border-white"></div>
                  <span className="text-slate-300">Cyan Zone: Authorized Geofence</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border border-white animate-pulse"></div>
                  <span className="text-slate-300">Green Pin: Receiver Live GPS</span>
                </div>
              </div>
            </div>

            {/* Decryption & Payload Download Card (Enabled only when Granted) */}
            {verificationResult && verificationResult.granted && (
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/80 p-6 rounded-2xl shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-900/60 rounded-xl text-emerald-400">
                    <Unlock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Cryptographic Decryption Gateway</h3>
                    <p className="text-slate-400 text-xs">
                      Server authorized download. Execute in-browser AES-256 decryption.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Status Banner explaining whether key is from escrow or requires sender passphrase */}
                  {verificationResult.document?.escrowKey ? (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs font-mono flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <b className="text-white block">Geofence Escrow Key Loaded:</b>
                        <span>Automated escrow key released by server boundary. Password is securely loaded (masked). Click <b>Decrypt Content</b> to view.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-mono flex items-start gap-2.5">
                      <Key className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <b className="text-white block">Sender Secret Passphrase Required:</b>
                        <span>The sender encrypted this document with a private password. The server will not reveal this password. Please enter the password communicated to you directly by the sender.</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-400 mb-1 flex items-center justify-between">
                      <span>AES Decryption Passphrase:</span>
                      <span className="text-[10px] text-slate-500">
                        {verificationResult.document?.escrowKey ? 'Auto-loaded from Escrow' : 'Must be provided by sender'}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showDecryptionKey ? 'text' : 'password'}
                          value={decryptionKey}
                          onChange={(e) => setDecryptionKey(e.target.value)}
                          placeholder="Enter secret password provided by sender..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDecryptionKey(!showDecryptionKey)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          title={showDecryptionKey ? "Hide password" : "Show password"}
                        >
                          {showDecryptionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleDecrypt}
                        disabled={decrypting || !decryptionKey}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl whitespace-nowrap transition disabled:opacity-50"
                      >
                        {decrypting ? 'Decrypting...' : 'Decrypt Content'}
                      </button>
                    </div>
                  </div>

                  {decryptError && (
                    <div className="p-2.5 bg-red-950/50 border border-red-500 text-red-300 rounded-lg">
                      {decryptError}
                    </div>
                  )}

                  {/* Decrypted Content Box */}
                  {(decryptedContent || (decryptedResult && decryptedResult.base64)) && (
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {verificationResult?.document && (
                            (verificationResult.document.mimeType && verificationResult.document.mimeType.startsWith('image/')) ||
                            /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(verificationResult.document.originalFilename || '')
                          ) ? 'Successfully Decrypted Image:' : 'Successfully Decrypted Plaintext:'}
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadDecryptedFile}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Download As File
                        </button>
                      </div>

                      {verificationResult?.document && (
                        (verificationResult.document.mimeType && verificationResult.document.mimeType.startsWith('image/')) ||
                        /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(verificationResult.document.originalFilename || '')
                      ) ? (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
                          <img
                            src={`data:${verificationResult.document.mimeType || 'image/png'};base64,${decryptedResult.base64}`}
                            alt="Decrypted Asset"
                            className="max-h-80 max-w-full rounded-lg object-contain border border-slate-700 shadow-xl"
                          />
                          <span className="text-[11px] text-slate-400 font-mono">
                            {verificationResult.document.originalFilename} • Binary image integrity preserved
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {decryptedContent}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
