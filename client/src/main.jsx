import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Global error logger for debugging
window.addEventListener('error', (event) => {
  console.error('[Global Window Error Caught]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Unhandled Rejection Caught]:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
