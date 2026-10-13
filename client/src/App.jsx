import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import SidebarLayout from './components/dashboard/SidebarLayout';
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

  // Allow all users to access compose, sender repository, and inbox
  const effectiveView = activeView;

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
      <div className="min-h-screen bg-[#060a12] flex flex-col items-center justify-center text-cyan-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Initializing Secure Enhanced Geolocking cryptographic subsystem...</span>
      </div>
    );
  }

  // If user is not authenticated and no direct verification link is being accessed, show the cinematic landing + auth view
  if (!user && !targetVerifyToken) {
    return (
      <>
        <AuthView onOpenDeliverables={() => setIsDeliverablesOpen(true)} />
        <DeliverablesModal
          isOpen={isDeliverablesOpen}
          onClose={() => setIsDeliverablesOpen(false)}
        />
      </>
    );
  }

  // Authenticated Application Dashboard (or direct token recipient)
  return (
    <>
      <SidebarLayout
        activeView={effectiveView}
        setActiveView={setActiveView}
        onOpenDeliverables={() => setIsDeliverablesOpen(true)}
      >
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
            onComposeClick={() => setActiveView('compose')}
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
      </SidebarLayout>

      <DeliverablesModal
        isOpen={isDeliverablesOpen}
        onClose={() => setIsDeliverablesOpen(false)}
      />
    </>
  );
}
