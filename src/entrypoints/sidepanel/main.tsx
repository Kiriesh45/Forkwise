import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './style.css';

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Forkwise: the panel is missing its root element');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
