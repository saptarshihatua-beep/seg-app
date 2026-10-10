import React, { useState } from 'react';
import { BookOpen, FileCheck, HelpCircle, Layers, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export default function DeliverablesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('d1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/70 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded-xl text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Project 4a Academic Deliverables Report</h2>
              <p className="text-xs text-slate-400 font-mono">
                UCCS CS6910: Design and Analysis of Secure Data Delivery Based on Geo Information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-xl px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('d1')}
            className={`py-3 px-4 border-b-2 font-bold transition flex items-center gap-2 ${activeTab === 'd1' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <FileCheck className="w-4 h-4" /> Deliverable 1: Geolocking Procedure
          </button>
          <button
            onClick={() => setActiveTab('d2')}
            className={`py-3 px-4 border-b-2 font-bold transition flex items-center gap-2 ${activeTab === 'd2' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <HelpCircle className="w-4 h-4" /> Deliverable 2: Architecture & Questions (a–e)
          </button>
          <button
            onClick={() => setActiveTab('d3')}
            className={`py-3 px-4 border-b-2 font-bold transition flex items-center gap-2 ${activeTab === 'd3' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Cpu className="w-4 h-4" /> Deliverable 3: Technical Verification Proposal
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* DELIVERABLE 1 */}
          {activeTab === 'd1' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                <h3 className="text-base font-bold text-cyan-300 mb-1">
                  Deliverable 1: Procedure for Creating & Geolocking a Document
                </h3>
                <p className="text-xs text-slate-300">
                  Step-by-step demonstration matching and advancing Figure 1 of the assignment specification.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 1: Fill in Receiver's Email Address</b>
                  <p className="text-slate-400 mt-1">
                    Enter the authorized recipient email (e.g., <code className="text-white">edward@chow-s.com</code>). The system binds the geolocked asset's access control to this cryptographic identity.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 2: Specify Document to Encrypt and Geolock</b>
                  <p className="text-slate-400 mt-1">
                    Select a local document file (e.g., <code className="text-white">fyi.txt</code>) or enter confidential text. The document is pre-processed as a base64 byte stream for zero-leakage client-side ciphering.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 3: Enter AES Encryption Key</b>
                  <p className="text-slate-400 mt-1">
                    Provide the secret symmetric key (e.g., <code className="text-white">myvoice</code>) or click auto-generate for a 256-bit entropy passphrase. The client derives a 256-bit key via PBKDF2 with random salt and IV.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 4: Specify Geolocation & Load Map</b>
                  <p className="text-slate-400 mt-1">
                    Input the target address: <code className="text-white">Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918</code>. Click <b>"Show Map"</b> to geocode and center the GIS coordinate viewport.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 5: Define Access Boundaries</b>
                  <p className="text-slate-400 mt-1">
                    Click <b>"Access Boundaries"</b> to initiate interactive polygon delineation. Mark 4 corner points around the UCCS Engineering Building in counter-clockwise or clockwise order:
                    <br/>
                    • Vertex 1: <code className="text-cyan-300">38.894143, -104.800769</code><br/>
                    • Vertex 2: <code className="text-cyan-300">38.893867, -104.801091</code><br/>
                    • Vertex 3: <code className="text-cyan-300">38.893178, -104.799760</code><br/>
                    • Vertex 4: <code className="text-cyan-300">38.893445, -104.799589</code>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <b className="text-cyan-400">Step 6: Encrypt and Send!</b>
                  <p className="text-slate-400 mt-1">
                    Click <b>"Encrypt the file & key and Send!"</b>. Client-side CryptoJS encrypts the file into <code className="text-white">{"{ ct, iv, s }"}</code>. The backend verifies coordinate topology, generates the official KML boundary file, stores metadata in MySQL, and provisions a time-limited single-use access link.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERABLE 2 */}
          {activeTab === 'd2' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                <h3 className="text-base font-bold text-cyan-300 mb-1">
                  Deliverable 2: Architecture & Analysis Questions (a – e)
                </h3>
                <p className="text-xs text-slate-300">
                  Comprehensive technical answers comparing Ashish Korpe's prototype with SEG 2.0.
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {/* Question a */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold">
                    Question a: Will Google provide Google Maps service and geocoding service without a key?
                  </span>
                  <p className="text-slate-300 font-sans">
                    <b>No.</b> Since Google Cloud Platform's major policy update in 2018, Google Maps JavaScript API and Geocoding API strictly require a valid API key linked to a billing-enabled GCP account. Requests without an API key result in a watermark ("For development purposes only") or return an HTTP <code className="text-cyan-300">REQUEST_DENIED</code> error with the status message <code className="text-cyan-300">"MissingKeyMapError"</code>.
                  </p>
                  <p className="text-slate-400 font-sans text-[11px]">
                    <i>SEG 2.0 Improvement:</i> To ensure resilient offline and academic demonstration without forcing external billing dependencies, SEG 2.0 incorporates a dual-engine architecture: it integrates Google Maps JavaScript API when an API key is supplied, and automatically falls back to Leaflet with CartoDB/OpenStreetMap tiles for zero-configuration, reliable execution.
                  </p>
                </div>

                {/* Question b */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold">
                    Question b: What library is used in the geoloc.js to encrypt the file?
                  </span>
                  <p className="text-slate-300 font-sans">
                    The library used is <b>CryptoJS</b> (specifically <code className="text-cyan-300">CryptoJS.AES</code> with CBC operating mode).
                  </p>
                  <p className="text-slate-400 font-sans text-[11px]">
                    <i>Implementation Details:</i> In <code className="text-white">geoloc.js</code> (lines 65–93), a custom <code className="text-white">JsonFormatter</code> object provides <code className="text-white">stringify()</code> and <code className="text-white">parse()</code> handlers. This serializes CryptoJS's internal <code className="text-white">CipherParams</code> structure into a JSON object containing three fields: <code className="text-cyan-300">ct</code> (ciphertext base64), <code className="text-cyan-300">iv</code> (initialization vector hex string), and <code className="text-cyan-300">s</code> (cryptographic salt hex string).
                  </p>
                </div>

                {/* Question c */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold">
                    Question c: What library is used on finalNewMail.php to create a secure token?
                  </span>
                  <p className="text-slate-300 font-sans">
                    In the original PHP prototype (<code className="text-white">finalNewMail.php</code> lines 103–110), the secure token was created using PHP's native <b>OpenSSL / mcrypt library</b> or a PHP AES wrapper. It encrypted a string combining the receiver email address concatenated with <code className="text-white">"receiver"</code> as plaintext, using a static key <code className="text-white">GeolockFiles</code> under CBC mode with an IV.
                  </p>
                  <p className="text-slate-400 font-sans text-[11px]">
                    <i>SEG 2.0 Security Upgrade:</i> Using a hardcoded static key (<code className="text-white">GeolockFiles</code>) in source code creates severe vulnerabilities. SEG 2.0 generates cryptographically random 256-bit tokens via Node.js <code className="text-cyan-300">crypto.randomBytes(32)</code>, hashes the token with <code className="text-cyan-300">SHA-256</code> before storing in the database, enforces single-use consumption, and maintains zero raw token exposure.
                  </p>
                </div>

                {/* Question d */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold">
                    Question d: What language is used to specify the boundary of the geolocking area?
                  </span>
                  <p className="text-slate-300 font-sans">
                    The language is <b>KML (Keyhole Markup Language)</b>, an XML-based schema standard managed by the Open Geospatial Consortium (OGC) and natively supported by Google Earth and Google Maps.
                  </p>
                  <p className="text-slate-400 font-sans text-[11px]">
                    <i>Structure:</i> KML models the geofence perimeter using a <code className="text-white">&lt;Polygon&gt;</code> element containing an <code className="text-white">&lt;outerBoundaryIs&gt;</code> tag and a closed <code className="text-white">&lt;LinearRing&gt;</code> with <code className="text-white">&lt;coordinates&gt;</code> expressed as <code className="text-cyan-300">longitude,latitude,altitude</code> space-separated tuples.
                  </p>
                </div>

                {/* Question e */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold">
                    Question e: What content are saved in the file table? List the fields of the table.
                  </span>
                  <div className="text-slate-300 font-sans space-y-2">
                    <p>In the original <code className="text-white">files</code> table shown on Page 6 of the PDF, the schema consists of:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                      <li><code className="text-white">Id</code> (Primary key integer, e.g., 2)</li>
                      <li><code className="text-white">sender</code> (Sender identifier or email, e.g., '')</li>
                      <li><code className="text-white">receiver</code> (Receiver email, e.g., 'edward@chow-s.com')</li>
                      <li><code className="text-white">file</code> (JSON string containing <code className="text-cyan-300">ct</code>, <code className="text-cyan-300">iv</code>, and <code className="text-cyan-300">s</code>)</li>
                      <li><code className="text-white">enc_key</code> (Encryption key string, e.g., 'cs6910')</li>
                      <li><code className="text-white">address</code> (Human-readable address string, e.g., 'Engineering Building, 1420 Austin Bluffs Parkway, ')</li>
                      <li><code className="text-white">boundaries</code> (Comma-separated latitude/longitude coordinate sequence)</li>
                      <li><code className="text-white">seen</code> (Single-character status flag, e.g., 'N' or 'Y')</li>
                    </ul>
                    <p className="text-[11px] text-slate-400 mt-2">
                      <i>SEG 2.0 Normalized Schema:</i> SEG 2.0 separates confidential keys from database records, hashes single-use tokens into an <code className="text-white">access_tokens</code> table, normalizes users into a <code className="text-white">users</code> table, and records multi-factor verification events in dedicated <code className="text-white">location_verifications</code> and <code className="text-white">audit_logs</code> tables.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERABLE 3 */}
          {activeTab === 'd3' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                <h3 className="text-base font-bold text-cyan-300 mb-1">
                  Deliverable 3: One-Page Technical Proposal for Trustworthy Location Verification
                </h3>
                <p className="text-xs text-slate-300">
                  Comprehensive security evaluation, threat modeling, and multi-sensor architectural design.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
                
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                    1. Executive Summary & Problem Formulation
                  </h4>
                  <p>
                    In traditional GeoEncryption systems (such as SEG 1.0), data decryption is conditioned upon the receiver reporting GPS coordinates that fall within a defined boundary polygon. However, browser-based Geolocation relies upon client-supplied data from the W3C <code className="text-cyan-300">navigator.geolocation</code> API. Because the client environment is fundamentally untrusted, malicious actors can effortlessly forge coordinates using browser Developer Tools (Sensors tab), mock-location Android developer options, VPNs, or reverse-engineered HTTP POST payloads. Therefore, <b>raw browser GPS alone cannot guarantee physical presence</b>.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                    2. Multi-Layer Verification Subsystem Architecture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <b className="text-cyan-300 block">Layer 1: GPS + PIP Ray-Casting</b>
                      <p className="text-slate-400">
                        Evaluates coordinate topology using the Ray-Casting algorithm against stored KML boundaries. Enforces maximum allowable accuracy (≤ 150m) and temporal freshness (≤ 60s) to mitigate stale replay attacks.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <b className="text-emerald-300 block">Layer 2: Enterprise Wi-Fi BSSID / RTT</b>
                      <p className="text-slate-400">
                        Correlates client presence with physical campus wireless access points (802.11mc Wi-Fi Round Trip Time / FTM). Requires client connection to authorized AP BSSIDs detected by managed network controllers.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <b className="text-yellow-300 block">Layer 3: Cryptographic BLE Beacons</b>
                      <p className="text-slate-400">
                        Deploys battery-powered Bluetooth Low Energy beacons (Eddystone / iBeacon) with rolling, time-synchronized cryptographic ephemeral identifiers (EID). Prevents beacon replay and range extension.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                    3. Analysis of Vulnerabilities, Accuracy, & Threat Vectors
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <b className="text-red-400">GPS Spoofing & Emulation:</b> Software spoofing is trivial via headless browser manipulation. Hardware RF GPS spoofing (e.g., HackRF SDR transmitting fake L1 C/A signals) can manipulate physical receivers. Mitigated by demanding corroborating local RF network signals (Wi-Fi/BLE).
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <b className="text-red-400">Replay & Relay Attacks:</b> An attacker recorded legitimate location tokens earlier or establishes an encrypted tunnel between an unauthorized remote user and an accomplice inside the geofence. Mitigated by single-use token consumption, cryptographic server challenge nonces, and sub-minute freshness windows.
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <b className="text-red-400">Wi-Fi MAC / BSSID Cloner:</b> Wi-Fi BSSIDs are broadcast unencrypted and can be spoofed by rogue APs. Mitigated by 802.1X RADIUS authentication logs, where the enterprise server independently verifies client association.
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                    4. Privacy-Preserving Location Design
                  </h4>
                  <p>
                    Continuous location tracking presents significant surveillance risks. The proposed SEG architecture follows the principle of <b>Zero-Knowledge Verification with Ephemeral Spatial Checking</b>:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Location coordinates are evaluated strictly in ephemeral memory for polygon intersection and are never stored in historical tracking logs.</li>
                    <li>Only a discrete Boolean audit verdict (<code className="text-emerald-400">GRANTED</code> or <code className="text-red-400">DENIED</code>) is persisted alongside a cryptographic hash.</li>
                    <li>Users retain explicit authorization control via standard browser permission dialogs and can opt-out at any time without compromising past audit logs.</li>
                  </ul>
                </section>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
