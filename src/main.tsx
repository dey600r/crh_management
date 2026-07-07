import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic fetch interceptor for GitHub Pages deployments.
// When the app is hosted on github.io or VITE_API_URL is provided,
// we automatically rewrite relative /api/ calls to the deployed Cloud Run service.
if (typeof window !== 'undefined' && (window.location.hostname.endsWith('github.io') || import.meta.env.VITE_API_URL)) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ais-pre-2djltc2kdspn4uqryrjo26-166825522426.europe-west1.run.app';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      return originalFetch(cleanBase + input, init);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
