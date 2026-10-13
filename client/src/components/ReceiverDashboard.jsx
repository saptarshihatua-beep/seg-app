import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldAlert, ShieldCheck, MapPin, Navigation, Key, 
  Download, Eye, RefreshCw, Lock, Unlock, ExternalLink
} from 'lucide-react';
import { api } from '../utils/api';
import InteractiveMap from './InteractiveMap';

export default function ReceiverDashboard({ onOpenVerification, onComposeClick }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMapDoc, setSelectedMapDoc] = useState(null);

  const fetchReceiverDocs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getReceiverDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load receiver documents:', err);
      setError(err.message || 'Failed to load receiver documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiverDocs();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Receiver Security Inbox</h1>
            <p className="text-slate-400 text-sm">
              Documents shared with your cryptographic identity. Decryption requires physical presence in the authorized geofence.
            </p>
          </div>
        </div>
      </div>

      {/* Receiver Documents Repository */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Incoming Geolocked Documents</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              To retrieve and decrypt, proceed to the authorized physical area.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onComposeClick && (
              <button
                onClick={onComposeClick}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Send a Document</span>
              </button>
            )}
            <button
              onClick={fetchReceiverDocs}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 p-4 bg-red-950/40 border border-red-500 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between">
            <div>⚠️ {error}</div>
            <button
              onClick={fetchReceiverDocs}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-sm">
            Retrieving assigned confidential documents...
          </div>
        ) : error ? null : documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Shared Documents</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              You do not have any incoming geolocked documents yet. You can also encrypt and send documents to any recipient across custom geofences.
            </p>
            {onComposeClick && (
              <button
                onClick={onComposeClick}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition shadow-lg shadow-cyan-500/20"
              >
                <Lock className="w-4 h-4" />
                <span>Compose & Geolock a Document</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Asset</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Required Perimeter</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                            {(doc.file_size / 1024).toFixed(1)} KB • Encrypted
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{doc.sender_name}</div>
                      <div className="text-[10px] text-slate-500">{doc.sender_email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="flex items-center gap-1.5 text-cyan-300 truncate" title={doc.location_address}>
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{doc.location_address}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {doc.polygon_coordinates?.length || 0} GPS polygon bounds
                      </span>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMapDoc(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                          title="Preview Geofence Perimeter"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenVerification(doc)}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Verify & Unlock
                        </button>
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
              <span className="text-slate-400">Boundary vertices: {selectedMapDoc.polygon_coordinates?.length || 0}</span>
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
    </div>
  );
}
