import { mockApi } from './mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = localStorage.getItem('seg_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    }
    // Return null if server returned HTML or non-JSON (e.g. 404/405 static SPA rewrite)
    return null;
  } catch (err) {
    // If it's a specific validation or business error from backend, throw it
    if (err.message && !err.message.includes('Unexpected') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('JSON')) {
      throw err;
    }
    return null;
  }
}

export const api = {
  // Auth
  async login(email, password) {
    const data = await tryFetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (data) return data;
    return mockApi.login(email, password);
  },

  async register(name, email, password, role) {
    const data = await tryFetchJson(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (data) return data;
    return mockApi.register(name, email, password, role);
  },

  async getMe() {
    const data = await tryFetchJson(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getMe();
  },

  async listReceivers() {
    const data = await tryFetchJson(`${API_BASE}/auth/receivers`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.listReceivers();
  },

  // Documents
  async createDocument(formData) {
    const data = await tryFetchJson(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    if (data) return data;
    return mockApi.createDocument(formData);
  },

  async getSenderDocuments() {
    const data = await tryFetchJson(`${API_BASE}/documents/sender`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getSenderDocuments();
  },

  async getReceiverDocuments() {
    const data = await tryFetchJson(`${API_BASE}/documents/receiver`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getReceiverDocuments();
  },

  async generateToken(docId) {
    const data = await tryFetchJson(`${API_BASE}/documents/${docId}/token`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.generateToken(docId);
  },

  async getDocumentDetails(docId) {
    const data = await tryFetchJson(`${API_BASE}/documents/${docId}`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getDocumentDetails(docId);
  },

  async validateToken(token, docId) {
    const data = await tryFetchJson(`${API_BASE}/documents/token/validate?token=${encodeURIComponent(token)}&docId=${docId || ''}`);
    if (data) return data;
    return mockApi.validateToken(token, docId);
  },

  // Verification & Access
  async requestChallenge(token) {
    const data = await tryFetchJson(`${API_BASE}/verify/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (data) return data;
    return mockApi.requestChallenge(token);
  },

  async authorizeLocation(payload) {
    const data = await tryFetchJson(`${API_BASE}/verify/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });
    if (data) return data;
    return mockApi.authorizeLocation(payload);
  },

  // Telemetry & Logs
  async getAuditLogs() {
    const data = await tryFetchJson(`${API_BASE}/audit/logs`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getAuditLogs();
  },

  async getSystemStats() {
    const data = await tryFetchJson(`${API_BASE}/audit/stats`, {
      headers: { ...getAuthHeader() }
    });
    if (data) return data;
    return mockApi.getSystemStats();
  },

  kmlDownloadUrl(filename) {
    if (API_BASE && API_BASE !== '/api') {
      return `${API_BASE}/documents/kml/${filename}`;
    }
    return mockApi.kmlDownloadUrl(filename);
  }
};
