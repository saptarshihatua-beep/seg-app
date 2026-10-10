import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileText, User, Clock, Terminal, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('SUCCESS') || action.includes('GRANTED')) {
      return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">SUCCESS</span>;
    }
    if (action.includes('FAIL') || action.includes('DENIED') || action.includes('OUT_OF_BOUNDS')) {
      return <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono">DENIED / ALERT</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">EVENT</span>;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">Security Audit Log & Telemetry</h2>
            <p className="text-slate-400 text-xs">Immutable chronological trail of cryptographic and physical presence operations.</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">Loading audit stream...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">No audit events recorded yet.</div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-[11px] text-white">{log.action}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-cyan-300">
                    {log.user_name || log.user_email || 'System'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-2.5 px-3 max-w-md truncate text-slate-300" title={log.details}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
