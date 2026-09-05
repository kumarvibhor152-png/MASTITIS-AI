import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './i18n.js';
import './index.css';
// Google Translate DOM reconciliation guard for React 18
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('React translation guard: prevented mismatched child removal', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('React translation guard: prevented mismatched insertBefore', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1C1C1E',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            maxWidth: '360px',
          },
          success: {
            iconTheme: { primary: '#2D6A4F', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#E63946', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </ErrorBoundary>
</React.StrictMode>
);
