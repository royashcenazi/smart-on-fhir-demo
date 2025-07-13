import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

const container = document.getElementById('app');
if (!container) throw new Error('Root container missing');
const root = createRoot(container as HTMLElement);
root.render(<App />); 