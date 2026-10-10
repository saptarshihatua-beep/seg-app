# Secure Enhanced Geolocking (SEG) — Project 4a

> **A Full-Stack Cybersecurity Web Application for Geofenced Cryptographic Data Delivery**  
> Based on the Master's Thesis research by Ashish Korpe and academic specification *"Project 4a: Design and Analysis of Secure Data Delivery Based on Geo Information"* (UCCS CS6910).

---

## 🛡️ Executive Summary

Secure Enhanced Geolocking (SEG) demonstrates how **GeoEncryption** and **Physical Spatial Access Control** augment classical symmetric ciphers. The system allows an authorized sender to encrypt files using **AES-256-CBC**, delineate a permitted geographic boundary on an interactive GIS map, and securely distribute the payload to a receiver who must satisfy multi-layer physical location verification before obtaining the cryptographic key and decrypting the document.

---

## 🌟 Key Features

1. **Client-Side & Server-Side AES-256-CBC Encryption:**
   - Adheres to the exact `JsonFormatter` specification (`{"ct":"...","iv":"...","s":"..."}`) utilizing CryptoJS with 1000-round PBKDF2 key derivation, random salts, and unpredictable initialization vectors.
2. **Interactive GIS Map & Polygon Boundary Delineator:**
   - Mark arbitrary multi-point perimeter boundaries on an interactive dark cybersecurity map.
   - Includes quick-load preset for the **UCCS Engineering Building** from Figure 1 of the assignment PDF (`38.894143, -104.800769` etc.).
   - Dual-engine support: Google Maps JavaScript API (when API key is present) and instant fallback to Leaflet / OpenStreetMap (100% offline & zero billing required).
3. **Keyhole Markup Language (KML) Generator & Exporter:**
   - Automatically generates valid OGC KML 2.2 XML files for Google Earth visualization and boundary exchange.
4. **Server-Side Ray-Casting Point-in-Polygon (PIP) Verification:**
   - Mathematically verifies whether receiver coordinates fall strictly within the sender-specified polygon.
5. **Multi-Layer Physical Presence Assurance:**
   - W3C Geolocation API acquisition with high-accuracy enforcement (`≤ 150m`).
   - Anti-replay freshness window (`≤ 60s`).
   - Ephemeral cryptographic challenge nonces.
   - Secondary verification signals: Authorized Enterprise Wi-Fi BSSID and In-Building BLE Beacon UUID.
6. **Single-Use Access Token System:**
   - 256-bit cryptographically random tokens (`crypto.randomBytes(32)`), stored as one-way SHA-256 hashes in the database with instant single-use invalidation.
7. **Role-Based Access Control & Cybersecurity SaaS Dashboard:**
   - Full JWT session management with distinct Sender and Receiver roles.
   - Comprehensive Security Audit Log and live telemetry tracker.

---

## 📂 Project Architecture

```
seg-app/
├── package.json                   # Root orchestrator
├── DELIVERABLES.md                # Complete Academic Deliverables (1, 2, 3)
├── README.md                      # Documentation & Execution Guide
│
├── server/                        # Node.js Express.js Backend API
│   ├── package.json
│   ├── server.js                  # Entry point, Helmet, CORS, Rate Limiters
│   ├── .env.example               # Environment variables template
│   ├── config/
│   │   └── env.js                 # Unified configuration
│   ├── db/
│   │   ├── schema.sql             # Official MySQL schema
│   │   ├── db.js                  # Unified MySQL + SQLite database adapter
│   │   └── seg_local.sqlite       # Auto-created zero-config database
│   ├── utils/
│   │   ├── cryptoUtils.js         # Token generation, SHA-256 hashing, AES helpers
│   │   ├── geoPolygon.js          # Ray-casting PIP algorithm & Haversine distance
│   │   └── kmlGenerator.js        # OGC KML 2.2 XML generator
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication & RBAC
│   │   ├── rateLimiter.js         # Rate limiting for auth & verification
│   │   └── uploadMiddleware.js    # Multer secure file handling
│   ├── controllers/
│   │   ├── authController.js      # Register, login, user listing
│   │   ├── documentController.js  # Geolocked doc creation, KML export, listing
│   │   ├── tokenController.js     # Single-use link generation & validation
│   │   ├── verifyController.js    # Multi-layer geoverification engine
│   │   └── auditController.js     # Security audit logging & statistics
│   ├── routes/                    # Express route definitions
│   └── tests/
│       ├── run-tests.js           # Unit tests (AES, PIP, Tokens, Centroid)
│       └── e2e-test.js            # End-to-end integration test suite
│
└── client/                        # React Frontend (Vite + Tailwind CSS)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx                # Router, view coordinator, and modal manager
        ├── main.jsx               # React entry point
        ├── context/
        │   └── AuthContext.jsx    # Session state & persona switcher
        ├── utils/
        │   ├── api.js             # Backend API client
        │   └── cryptoClient.js    # CryptoJS client-side AES engine (JsonFormatter)
        └── components/
            ├── Navbar.jsx         # Navigation bar & quick persona switcher
            ├── AuthView.jsx       # Cybersecurity SaaS sign-in & hero landing
            ├── ComposeDocument.jsx# Compose & geolock interface (matching compose2.html)
            ├── InteractiveMap.jsx # Leaflet / Google Maps GIS polygon editor
            ├── SenderDashboard.jsx# Sender document repository & share generator
            ├── ReceiverDashboard.jsx# Receiver inbox & geofence preview
            ├── AccessVerificationPage.jsx # Receiver GPS unlock & decryptor
            ├── AuditLogViewer.jsx # Security audit log stream
            └── DeliverablesModal.jsx # Interactive Deliverables 1, 2, 3 viewer
```

---

## 🚀 Quick Start Guide (Windows 11)

### 1. Prerequisites
- **Node.js** v18+ installed (tested on Node.js v24.18.0)
- **Git / PowerShell**

### 2. Automated One-Command Installation
Navigate to the root directory and install both dependencies:
```powershell
cd C:\Users\SAPTARSHI\Desktop\ignite\seg-app

# Install server packages
cd server
npm install

# Install client packages
cd ..\client
npm install
cd ..
```

### 3. Run Backend Server
In a terminal window:
```powershell
cd C:\Users\SAPTARSHI\Desktop\ignite\seg-app\server
npm start
```
*The server will start on `http://localhost:5000`.*  
*(Note: If MySQL is not running on localhost:3306, the database layer automatically switches to SQLite without any errors, creating tables and test users seamlessly).*

### 4. Run Frontend Client
In a second terminal window:
```powershell
cd C:\Users\SAPTARSHI\Desktop\ignite\seg-app\client
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

---

## 🔑 Default Test Credentials

The database automatically seeds test accounts:

| Role | Name | Email | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Sender** | Alice Vance | `alice.sender@uccs.edu` | `Sender123!` | Primary Sender demonstration |
| **Receiver** | Bob Miller | `bob.receiver@uccs.edu` | `Receiver123!` | Primary Receiver demonstration |
| **Sender** | Dr. Edward Chow | `edward@chow-s.com` | `Edward123!` | Assignment PDF example sender |
| **Receiver** | Ashish Korpe | `ashish@uccs.edu` | `Ashish123!` | Assignment PDF prototype author |

*(Clicking any of the quick login buttons on the sign-in page will autofill these credentials immediately).*

---

## 🧪 Running Automated Tests

Run the unit test suite verifying AES-256 encryption, token hashing, Point-in-Polygon geometry, and Centroid calculation:
```powershell
cd C:\Users\SAPTARSHI\Desktop\ignite\seg-app\server
npm test
```

Run the complete end-to-end integration test exercising document creation, negative out-of-bounds rejection, positive inside authorization, and replay blocking:
```powershell
cd C:\Users\SAPTARSHI\Desktop\ignite\seg-app\server
node tests/e2e-test.js
```

---

## 🗺️ Google Maps API Configuration (Optional)

SEG 2.0 features a dual-engine mapping architecture:
1. **Default Mode (Zero API Key Needed):** Automatically runs Leaflet with CartoDB Voyager tiles. Full polygon drawing, marker placement, address search, and vertex inspection work right out of the box with zero external dependencies.
2. **Google Maps API Mode:** To switch to Google Maps, set your key in `client/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
   ```
   Ensure the following APIs are enabled in your Google Cloud Console:
   - *Maps JavaScript API*
   - *Geocoding API*

---

## 🗄️ MySQL Database Setup (Optional)

To connect SEG to a live MySQL / MariaDB server:
1. Open `server/.env` and configure your credentials:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=seg_geolocking
   ```
2. Import the schema:
   ```powershell
   mysql -u root -p < server/db/schema.sql
   ```
3. Restart the backend server.

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register a new sender or receiver.
- `POST /api/auth/login` — Authenticate and receive a JWT token.
- `GET /api/auth/me` — Retrieve active profile.
- `GET /api/auth/receivers` — List registered receivers for quick address selection.

### Documents & Tokens
- `POST /api/documents` — Compose, encrypt (AES-256), and geolock a document with KML export.
- `GET /api/documents/sender` — Retrieve all documents created by the logged-in sender.
- `GET /api/documents/receiver` — Retrieve all documents designated for the logged-in receiver.
- `POST /api/documents/:docId/token` — Generate a single-use access token link.
- `GET /api/documents/token/validate` — Validate a single-use token and retrieve boundary metadata.
- `GET /api/documents/kml/:filename` — Download the OGC KML boundary file.

### Verification Gateway
- `POST /api/verify/challenge` — Request an ephemeral cryptographic challenge nonce.
- `POST /api/verify/authorize` — Submit coordinates, accuracy, timestamp, and optional Wi-Fi/BLE signals for multi-layer geoverification.

### Audit & Telemetry
- `GET /api/audit/logs` — Retrieve chronological security events and access logs.
- `GET /api/audit/stats` — Retrieve aggregated telemetry.

---

## 📜 Academic Deliverables

For the full detailed responses to **Deliverables 1, 2, and 3** (including detailed answers to Questions a–e and the complete one-page technical verification proposal), view:
- In-App: Click the **"Academic Deliverables"** button in the top navigation bar.
- On-Disk: Consult [DELIVERABLES.md](file:///C:/Users/SAPTARSHI/Desktop/ignite/seg-app/DELIVERABLES.md).
