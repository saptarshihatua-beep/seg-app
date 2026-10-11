import React, { useState, useEffect } from 'react';
import { 
  FileText, Shield, Key, Share2, Download, CheckCircle2, 
  XCircle, Clock, MapPin, Eye, RefreshCw, Plus, ExternalLink, Copy
} from 'lucide-react';
import { api } from '../utils/api';
import InteractiveMap from './InteractiveMap';

export default function SenderDashboard({ onComposeClick, onInspectDoc }) {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocs: 0, verifiedCount: 0, failedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMapDoc, setSelectedMapDoc] = useState(null);
  const [shareModalDoc, setShareModalDoc] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [docsRes, statsRes] = await Promise.all([
        api.getSenderDocuments(),
        api.getSystemStats()
      ]);
      setDocuments(docsRes.documents || []);
      if (statsRes.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to load sender dashboard:', err);
      setError(err.message || 'Failed to load sender documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateShareLink = async (doc) => {
    try {
      const res = await api.generateToken(doc.id);
      setGeneratedLink(res.shareUrl);
      setShareModalDoc(doc);
      setCopied(false);
    } catch (err) {
      alert('Error generating share link: ' + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>TOTAL GEOLOCKED ASSETS</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{documents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Encrypted with AES-256-CBC</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>AUTHENTICATED ACCESSES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{stats.verifiedCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified within geofence</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>REJECTED INTRUSIONS</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400 font-mono">{stats.failedCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Out-of-bounds / stale GPS</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-800/60 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center text-cyan-300 text-xs font-mono">
            <span>NEW SECURE DOCUMENT</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <button
            onClick={onComposeClick}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Compose & Geolock
          </button>
        </div>
      </div>

      {/* Documents Table Card */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Geolocked Documents Repository</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Active encrypted records managed by your sender credentials.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="m-5 p-4 bg-red-950/40 border border-red-500 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between">
            <div>⚠️ {error}</div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-sm">
            Loading encrypted documents repository...
          </div>
        ) : error ? null : documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Geolocked Documents Yet</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Create your first AES-encrypted document and lock it to a geographic perimeter.
            </p>
            <button
              onClick={onComposeClick}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono"
            >
              Compose Document Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Asset</th>
                  <th className="py-3 px-4">Authorized Receiver</th>
                  <th className="py-3 px-4">Geofence Location</th>
                  <th className="py-3 px-4">Verification Audit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div>
                          <span>{doc.original_filename}</span>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {(doc.file_size / 1024).toFixed(1)} KB • AES-256
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-cyan-300">
                      {doc.receiver_email}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="flex items-center gap-1.5 text-slate-300" title={doc.location_address}>
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{doc.location_address}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {doc.polygon_coordinates?.length || 0} polygon boundary vertices
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[10px]">
                          ✓ {doc.successful_verifications || 0} Passed
                        </span>
                        {(doc.failed_verifications > 0) && (
                          <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/50 text-[10px]">
                            ✗ {doc.failed_verifications} Denied
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'accessed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' :
                        doc.status === 'active' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMapDoc(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                          title="View Boundary on Map"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGenerateShareLink(doc)}
                          className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition"
                          title="Generate Access Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {doc.kml_reference && (
                          <a
                            href={api.kmlDownloadUrl(doc.kml_reference)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Download KML Boundary File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View Boundary on Map */}
      {selectedMapDoc && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedMapDoc.original_filename}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedMapDoc.location_address}</p>
              </div>
              <button
                onClick={() => setSelectedMapDoc(null)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <InteractiveMap
              polygonPoints={selectedMapDoc.polygon_coordinates || []}
              center={selectedMapDoc.polygon_coordinates?.[0] || { lat: 38.893765, lng: -104.801055 }}
              zoom={17}
              height="380px"
              readOnly={true}
            />

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Vertices: {selectedMapDoc.polygon_coordinates?.length || 0}</span>
              {selectedMapDoc.kml_reference && (
                <a
                  href={api.kmlDownloadUrl(selectedMapDoc.kml_reference)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download KML File
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Share Link Generator */}
      {shareModalDoc && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Share2 className="w-4 h-4" />
                <span>Single-Use Access Link Ready</span>
              </div>
              <button
                onClick={() => setShareModalDoc(null)}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Send this single-use link to <b>{shareModalDoc.receiver_email}</b>. The link requires real-time physical presence within the geofenced area before decrypting.
            </p>

            <div className="space-y-2">
              <input
                readOnly
                value={generatedLink}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-300 text-xs font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(generatedLink)}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied to Clipboard!' : 'Copy Share Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
