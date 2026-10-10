const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = localStorage.getItem('seg_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(name, email, password, role) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  },

  async listReceivers() {
    const res = await fetch(`${API_BASE}/auth/receivers`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Documents
  async createDocument(formData) {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create document');
    return data;
  },

  async getSenderDocuments() {
    const res = await fetch(`${API_BASE}/documents/sender`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getReceiverDocuments() {
    const res = await fetch(`${API_BASE}/documents/receiver`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async generateToken(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/token`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate token');
    return data;
  },

  async getDocumentDetails(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve document details');
    return data;
  },

  async validateToken(token, docId) {
    const res = await fetch(`${API_BASE}/documents/token/validate?token=${encodeURIComponent(token)}&docId=${docId || ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired token');
    return data;
  },

  // Verification & Access
  async requestChallenge(token) {
    const res = await fetch(`${API_BASE}/verify/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return res.json();
  },

  async authorizeLocation(payload) {
    const res = await fetch(`${API_BASE}/verify/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification rejected');
    return data;
  },

  // Telemetry & Logs
  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit/logs`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getSystemStats() {
    const res = await fetch(`${API_BASE}/audit/stats`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  kmlDownloadUrl(filename) {
    return `${API_BASE}/documents/kml/${filename}`;
  }
};
