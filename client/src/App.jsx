import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import ComposeDocument from './components/ComposeDocument';
import SenderDashboard from './components/SenderDashboard';
import ReceiverDashboard from './components/ReceiverDashboard';
import AccessVerificationPage from './components/AccessVerificationPage';
import AuditLogViewer from './components/AuditLogViewer';
import DeliverablesModal from './components/DeliverablesModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('compose');
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);
  const [targetVerifyToken, setTargetVerifyToken] = useState(null);
  const [targetVerifyDocId, setTargetVerifyDocId] = useState(null);

  // Check URL parameters for direct access links: ?token=...&docId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const docId = params.get('docId');

    if (token) {
      setTargetVerifyToken(token);
      setTargetVerifyDocId(docId);
      setActiveView('verify');
    }
  }, []);

  // Update default view based on user role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'sender' || user.role === 'admin') {
        setActiveView('compose');
      } else {
        setActiveView('receiver_dash');
      }
    }
  }, [user?.role]);

  const effectiveView = (user && user.role === 'receiver' && (activeView === 'compose' || activeView === 'sender_dash'))
    ? 'receiver_dash'
    : activeView;

  // Handler when receiver clicks "Verify & Unlock" on a document from ReceiverDashboard
  const handleOpenVerification = (doc) => {
    setTargetVerifyDocId(doc.id);
    setActiveView('verify');
  };

  // Handler when sender finishes creating a document
  const handleDocumentCreated = () => {
    setActiveView('sender_dash');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing Secure Enhanced Geolocking cryptographic subsystem...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        activeView={effectiveView}
        setActiveView={setActiveView}
        onOpenDeliverables={() => setIsDeliverablesOpen(true)}
      />

      {/* Main App Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {!user && !targetVerifyToken ? (
          <AuthView onOpenDeliverables={() => setIsDeliverablesOpen(true)} />
        ) : (
          <>
            {effectiveView === 'compose' && (
              <ComposeDocument onDocumentCreated={handleDocumentCreated} />
            )}

            {effectiveView === 'sender_dash' && (
              <SenderDashboard
                onComposeClick={() => setActiveView('compose')}
                onInspectDoc={(doc) => handleOpenVerification(doc)}
              />
            )}

            {effectiveView === 'receiver_dash' && (
              <ReceiverDashboard
                onOpenVerification={(doc) => handleOpenVerification(doc)}
              />
            )}

            {effectiveView === 'verify' && (
              <AccessVerificationPage
                initialToken={targetVerifyToken}
                initialDocId={targetVerifyDocId}
              />
            )}

            {effectiveView === 'audit' && (
              <AuditLogViewer />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Project 4a: Secure Enhanced Geolocking (SEG 2.0) • UCCS CS6910</span>
          <span>CryptoJS AES-256 • OGC KML 2.2 • Ray-Casting PIP • Single-Use Tokens</span>
        </div>
      </footer>

      {/* Deliverables Report Modal */}
      <DeliverablesModal
        isOpen={isDeliverablesOpen}
        onClose={() => setIsDeliverablesOpen(false)}
      />
    </div>
  );
}
