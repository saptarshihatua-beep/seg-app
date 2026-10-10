# Academic Assignment Deliverables Report
**Project 4a: Design and Analysis of Secure Data Delivery Based on Geo Information**  
**Course Reference:** UCCS CS6910 / Advanced Security Systems  
**Author:** Graduate Student Research Submission  
**System Title:** Secure Enhanced Geolocking (SEG 2.0) Architecture

---

## Deliverable 1: Procedure for Creating & Geolocking Documents

### 1. Overview
Secure Enhanced Geolocking (SEG) extends classical symmetric cryptography (AES-256) by enforcing geographical access boundaries. In this procedure, a sender encrypts confidential data before transmission, defines an authorized polygonal boundary around a physical structure (such as the UCCS Engineering Building), and generates a time-limited, single-use cryptographic access token.

### 2. Step-by-Step Procedure (Matching Assignment Figure 1)

1. **Authentication & Session Initiation:**
   - Access the SEG platform and log in with sender credentials (`alice.sender@uccs.edu` or `edward@chow-s.com`).
   - Navigate to the **"Compose & Lock"** tab.

2. **Receiver Specification:**
   - In the **"1. Fill in Receiver's Email"** field, designate the authorized recipient identity (e.g., `edward@chow-s.com` or `bob.receiver@uccs.edu`).
   - The system associates the document record and subsequent token verification requests strictly with this identity.

3. **Document Ingestion & Client-Side Preparation:**
   - Under **"2. Specify Document to Geolock"**, select a local document (e.g., `fyi.txt`) or input confidential text into the secure payload field.
   - The file is converted into an ArrayBuffer / base64 byte stream for zero-knowledge client-side encryption.

4. **Cryptographic Key Configuration:**
   - In **"3. Enter AES Encryption Key"**, specify the symmetric passphrase (e.g., `myvoice`), or utilize the built-in cryptographic generator for a high-entropy 256-bit passphrase.
   - Using CryptoJS with a customized `JsonFormatter` (matching lines 65–93 of `geoloc.js`), the document is encrypted into a JSON cipher parameter object:
     ```json
     {
       "ct": "F7t3zF7HFODr1YlQorbPezf46meAUtMnnrCQ6fkpaEQ=",
       "iv": "77cbe96d8d6e95dd62c6de2666af80c4",
       "s": "5c125bc7bf0f8170"
     }
     ```
   - **Key Delivery Strategy:** The sender selects whether the key is delivered *Out-of-Band* (communicated directly by the sender) or stored in *Automated Escrow* (released automatically by the server only after certified physical verification).

5. **Target Geolocation Specification:**
   - In **"Specify Geolocation Where Document Should Be Retrieved"**, enter the target address:  
     `Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918`
   - Click the **"Show Map"** button to geocode the address and focus the interactive GIS map viewport.

6. **Boundary Delineation (Access Boundaries Phase):**
   - Click the **"Access Boundaries"** button to enter vertex placement mode.
   - Click the map in clockwise or counter-clockwise order to outline the perimeter of the UCCS Engineering Building:
     - **Point 1 (North-West):** `38.894143, -104.800769`
     - **Point 2 (South-West):** `38.893867, -104.801091`
     - **Point 3 (South-East):** `38.893178, -104.799760`
     - **Point 4 (North-East):** `38.893445, -104.799589`
   - The system connects the vertices, renders a shaded cyan polygonal region, and serializes the coordinates.

7. **Multi-Factor Verification Configuration (Optional):**
   - Specify an authorized Campus Wi-Fi AP BSSID (e.g., `00:14:22:01:23:45`) or in-building BLE Beacon UUID (`e2c56db5-dffb-48d2-b060-d0f5a71096e0`) for high-assurance environments.

8. **Encryption, KML Generation, & Dispatch:**
   - Click **"Encrypt the file & key and Send!"**.
   - The backend validates the closed polygon geometry, generates a standard Keyhole Markup Language (`.kml`) boundary file for Google Earth inspection, stores metadata in MySQL, and generates a cryptographically random, single-use access link:  
     `http://localhost:5173/access?token=<64-char-hex>&docId=<id>`

---

## Deliverable 2: Application Architecture & Analysis Questions (a – e)

### System Architecture Comparison

| Architectural Aspect | Original Ashish Korpe Prototype (PDF) | SEG 2.0 Enhanced Application |
| :--- | :--- | :--- |
| **Frontend Framework** | Plain HTML5, basic DOM JS (`geoloc.js`, `geoloc2.js`) | Modern React (Vite, Tailwind CSS, Lucide icons, Cybersecurity dark theme) |
| **Mapping Engine** | Google Maps JavaScript API v3 (strictly required) | Dual-Engine: Google Maps API + Leaflet/OpenStreetMap fallback (zero billing required) |
| **Encryption Standard** | Client-side CryptoJS AES-CBC (`JsonFormatter`) | Client-side & server-side CryptoJS AES-256-CBC with PBKDF2 salt and random IV |
| **Backend Architecture** | PHP procedural script (`finalNewMail.php`, `inbox.php`) | Modular Node.js / Express.js REST API with rate limiting and Helmet headers |
| **Database Engine** | MySQL (`projectAshish.files`) | Unified MySQL + SQLite automatic abstraction layer |
| **Access Token Design** | Symmetric encryption of `"email"+"receiver"` using static key `GeolockFiles` | Cryptographically random 256-bit token (`crypto.randomBytes(32)`), stored as SHA-256 hash |
| **Replay Defense** | None (static URL query parameter in email) | Single-use consumption flag (`used_at`), 60s freshness window, challenge nonce |
| **Boundary Standard** | OGC KML 2.2 XML file attachment | Dynamic KML generation, instant GIS preview, and on-demand file download |

---

### Detailed Answers to Questions a – e

#### Question a: Will Google provide Google Maps service and geocoding service without an API key?
**Answer:**  
**No.** Google no longer provides Google Maps JavaScript API or Geocoding API services without a valid API key.  
In 2018, Google transitioned Google Maps Platform to a mandatory Google Cloud billing account model. Any request sent without an API key, or with an invalid key, triggers an immediate error (such as `MissingKeyMapError` or HTTP `REQUEST_DENIED`) and overlays a dark watermark ("For development purposes only") across the canvas.  
*SEG 2.0 Resolution:* To prevent dependency on Google billing accounts during local student development and grading, our application provides an automated dual-engine architecture: if an API key is provided, it loads Google Maps; otherwise, it loads high-performance Leaflet with OpenStreetMap tiles.

#### Question b: What library is used in the JavaScript implementation to encrypt the file?
**Answer:**  
The library used is **CryptoJS** (specifically `CryptoJS.AES` operating in Cipher Block Chaining (CBC) mode with PKCS#7 padding).  
*Implementation details from PDF:* In `geoloc.js` (lines 65–93), the author implemented a custom `JsonFormatter` object containing two key functions:
1. `stringify(cipherParams)`: Extracts the raw ciphertext WordArray (`cipherParams.ciphertext`) and converts it to a base64 string `ct`, along with the hex-encoded initialization vector `iv` and cryptographic salt `s`.
2. `parse(jsonStr)`: Ingests the JSON string and reconstructs the internal CryptoJS `CipherParams` structure required for decryption.

#### Question c: What encryption approach or library is used to create the secure token in the backend?
**Answer:**  
In the original prototype (`finalNewMail.php` lines 103–110), the backend created the secure token using **PHP's OpenSSL / mcrypt library** configured with AES in CBC mode. The plaintext was composed by concatenating the receiver's email address with the string `"receiver"`, encrypted using a hardcoded static key `GeolockFiles` and an initialization vector.  
*Critique & Enhancement in SEG 2.0:* Hardcoding the token key (`GeolockFiles`) in source code allowed anyone who read the PHP file to forge tokens for any recipient. SEG 2.0 generates cryptographically random 256-bit tokens (`crypto.randomBytes(32)`), applies a one-way `SHA-256` hash prior to database storage, and destroys access validity upon the first successful decryption.

#### Question d: What language is used to specify the boundary of the geolocking area?
**Answer:**  
The language used is **Keyhole Markup Language (KML)**, which is an XML-based specification standard maintained by the Open Geospatial Consortium (OGC).  
*XML Structure:*
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Engineering Building Boundary</name>
    <Placemark>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -104.800769,38.894143,0
              -104.801091,38.893867,0
              -104.799760,38.893178,0
              -104.799589,38.893445,0
              -104.800769,38.894143,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
```
Note that KML coordinate order is strictly `longitude,latitude,altitude` (separated by commas), which closes back to the first vertex to form a valid linear ring.

#### Question e: What content are saved in the file table? List the fields of the table.
**Answer:**  
According to Page 6 of the assignment PDF, the original MySQL table `files` in the `projectAshish` database contained the following fields:
1. `Id`: Integer primary key identifier.
2. `sender`: Sender email or identifier (e.g., `''`).
3. `receiver`: Authorized recipient email address (e.g., `'edward@chow-s.com'`).
4. `file`: JSON-formatted string storing the AES encryption parameters: `{"ct":"...","iv":"...","s":"..."}`.
5. `enc_key`: Plaintext AES encryption key (e.g., `'cs6910'`).
6. `address`: Human-readable location address string (e.g., `'Engineering Building, 1420 Austin Bluffs Parkway, '`).
7. `boundaries`: Comma-delimited list of latitude and longitude coordinates defining the polygon perimeter.
8. `seen`: Single-character access status flag (`'N'` for unaccessed, `'Y'` for accessed).

*SEG 2.0 Normalized Schema:*  
In SEG 2.0, this table is expanded into a normalized relational model:
- `users`: Normalized user identities with bcrypt-hashed passwords.
- `documents`: Stores encrypted references, MIME types, address, polygon coordinates, and KML references.
- `access_tokens`: Isolates token hashes and expiration times from document contents.
- `location_verifications`: Dedicated audit log recording verification method, coordinates, and pass/fail verdicts.
- `audit_logs`: Full chronological security event stream.

---

## Deliverable 3: One-Page Technical Proposal for Trustworthy Location Verification

### Title: Multi-Layer Trustworthy Geolocation Verification Subsystem for High-Assurance Data Delivery

### 1. Problem Statement & Threat Vector Analysis
Traditional GeoEncryption systems rely on client-reported coordinates from the browser's W3C `navigator.geolocation` API. However, client-side execution environments cannot be trusted in adversarial scenarios. Attackers can effortlessly spoof their location using:
1. **Software Mocking:** Chrome DevTools Sensors tab, mock GPS developer options on mobile operating systems, or modified browser binaries.
2. **RF Signal Synthesis (GPS Spoofing):** Low-cost Software-Defined Radios (such as HackRF One) capable of broadcasting counterfeit GPS L1 C/A signals to deceive hardware GNSS receivers.
3. **Replay & Relay Attacks:** Capturing previously legitimate location claims and transmitting them from unauthorized remote networks, or routing traffic through physical relays stationed inside the geofence.

Therefore, **browser GPS readings alone cannot prove physical presence**. A high-assurance geolocking architecture requires independent, multi-sensor corroboration.

---

### 2. Multi-Layer Verification Architecture

```
[ Receiver Client ] ──(1) Browser GPS + Timestamp + Freshness Nonce ──> [ Layer 1: Geofence PIP ]
         │                                                                   │ (Ray-Casting Algorithm)
         ├──(2) 802.11mc Wi-Fi FTM / Campus AP BSSID Correlation ───────> [ Layer 2: Network Validation ]
         │                                                                   │ (Enterprise RADIUS / IT Controller)
         └──(3) Cryptographic Rolling BLE Beacon (Eddystone EID) ────────> [ Layer 3: Physical Proximity ]
                                                                             │ (Hardware Attestation)
                                                                             ▼
                                                                  [ Cryptographic Token Release ]
```

#### Layer 1: Browser GPS with Strict Topological Verification
- **Ray-Casting Point-in-Polygon (PIP):** Coordinates are evaluated mathematically on the server against the polygon vertices defined by the sender.
- **Accuracy Threshold Filtering:** Any reading with horizontal accuracy exceeding 150 meters is rejected to prevent coarse IP/cellular-tower approximations from satisfying fine-grained building perimeters.
- **Temporal Freshness Window:** Client readings must be submitted within 60 seconds of sensor capture (`|t_server - t_client| ≤ 60s`).

#### Layer 2: Independent Enterprise Wi-Fi Infrastructure Verification
- Rather than trusting client claims, the verification server interfaces with the local enterprise network controller (e.g., Cisco DNA / Aruba AirWave / UCCS Campus IT RADIUS).
- When a user requests document decryption, the verification server queries the controller for the user's current wireless association:
  - Validates that the device MAC address is actively associated with an access point located within the designated building.
  - Utilizes IEEE 802.11mc Fine Timing Measurement (Wi-Fi Round Trip Time - RTT) to measure physical propagation delay, yielding sub-meter indoor positioning that cannot be spoofed by external GPS transmitters.

#### Layer 3: Ephemeral Cryptographic BLE Beacons
- Fixed Bluetooth Low Energy beacons are deployed within confidential reading areas.
- Rather than broadcasting static UUIDs (which can be cloned), beacons utilize **Ephemeral Identifiers (Eddystone-EID)**. Every few minutes, a cryptographically pseudo-random identifier is generated using AES-128 and an internal time counter synchronized with the verification server.
- The receiver's client detects the current rolling beacon broadcast; the server validates that the transmitted beacon code matches the exact time slot, eliminating distance extension and replay attacks.

---

### 3. Replay-Resistant Challenge-Response Protocol
To prevent session replay:
1. When opening the access link, the receiver requests a single-use cryptographic challenge nonce from `/api/verify/challenge`.
2. The server binds this nonce to the document token with a 60-second expiration.
3. The receiver bundles their sensor readings with the nonce and submits the verification payload.
4. Upon successful validation, the access token is immediately marked `used_at = CURRENT_TIMESTAMP`, preventing any secondary reuse.

---

### 4. Privacy-Preserving Zero-Knowledge Spatial Verification
Continuous physical tracking introduces severe employee and student surveillance concerns. The SEG verification subsystem enforces privacy-by-design:
- **Zero Coordinate Persistence:** Exact latitude and longitude coordinates are held strictly in volatile RAM during point-in-polygon computation and are immediately purged from memory.
- **Discrete Audit Trail:** The database stores only a discrete Boolean audit verdict (`GRANTED` or `DENIED_OUT_OF_BOUNDS`) alongside an HMAC signature, ensuring that historical movement logs are never accumulated.
- **User Consent:** Sensor queries are strictly on-demand, requiring explicit user activation at the exact moment of decryption.
