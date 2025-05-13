import React from 'react';
import ReactDOM from 'react-dom/client'; // 👈 This is important
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root')); // 👈 createRoot instead of render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional service worker
serviceWorker.unregister();
