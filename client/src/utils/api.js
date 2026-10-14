const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

function getAuthHeader() {
  const token = localStorage.getItem('seg_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error(
      `Cannot connect to backend server at ${url}. Please verify that the backend API server is running or configure VITE_API_BASE_URL. (${netErr.message})`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Server returned error (${res.status})`);
    }
    return data;
  }

  // Handle static SPA rewrites or unexpected non-JSON responses
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  }

  throw new Error(
    `Backend API at ${url} returned non-JSON content (${contentType || 'HTML SPA rewrite'}). Please check that API routes are deployed and accessible.`
  );
}

export const api = {
  // Auth
  async login(email, password) {
    return fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  async register(name, email, password, role) {
    return fetchJson(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
  },

  async getMe() {
    return fetchJson(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
  },

  async listReceivers() {
    return fetchJson(`${API_BASE}/auth/receivers`, {
      headers: { ...getAuthHeader() }
    });
  },

  async deleteReceiver(idOrEmail) {
    return fetchJson(`${API_BASE}/auth/receivers/${encodeURIComponent(idOrEmail)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
  },

  // Documents
  async createDocument(formData) {
    return fetchJson(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
  },

  async getSenderDocuments() {
    return fetchJson(`${API_BASE}/documents/sender`, {
      headers: { ...getAuthHeader() }
    });
  },

  async getReceiverDocuments() {
    return fetchJson(`${API_BASE}/documents/receiver`, {
      headers: { ...getAuthHeader() }
    });
  },

  async generateToken(docId) {
    return fetchJson(`${API_BASE}/documents/${docId}/token`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
  },

  async getDocumentDetails(docId) {
    return fetchJson(`${API_BASE}/documents/${docId}`, {
      headers: { ...getAuthHeader() }
    });
  },

  async validateToken(token, docId) {
    return fetchJson(`${API_BASE}/documents/token/validate?token=${encodeURIComponent(token || '')}&docId=${encodeURIComponent(docId || '')}`);
  },

  // Verification & Access
  async requestChallenge(token) {
    return fetchJson(`${API_BASE}/verify/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  },

  async authorizeLocation(payload) {
    return fetchJson(`${API_BASE}/verify/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });
  },

  // Telemetry & Logs
  async getAuditLogs() {
    return fetchJson(`${API_BASE}/audit/logs`, {
      headers: { ...getAuthHeader() }
    });
  },

  async getSystemStats() {
    return fetchJson(`${API_BASE}/audit/stats`, {
      headers: { ...getAuthHeader() }
    });
  },

  kmlDownloadUrl(filename) {
    if (API_BASE && API_BASE !== '/api') {
      return `${API_BASE}/documents/kml/${filename}`;
    }
    return `/api/documents/kml/${filename}`;
  }
};
