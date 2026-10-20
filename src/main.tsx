import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// A missing picture shows a neutral placeholder instead of its alt text spilling over the card
const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1f5f9"/>' +
      '<path d="M150 160h100v80H150z" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round"/>' +
      '<circle cx="178" cy="186" r="9" fill="#cbd5e1"/><path d="M158 232l30-28 22 20 14-12 18 20" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round"/></svg>'
  );
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.src !== IMAGE_PLACEHOLDER) {
      img.removeAttribute('srcset');
      img.src = IMAGE_PLACEHOLDER;
    }
  },
  true
);

// Offline cache for mobile shoppers (production only, so development always sees fresh code)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // unsupported or blocked: the site works normally without it
    });
  });
}
