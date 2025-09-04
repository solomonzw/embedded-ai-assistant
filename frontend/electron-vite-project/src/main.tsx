// src/main.tsx (最终正确版)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ReactFlowProvider } from 'reactflow';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // 为排除干扰，暂时移除 StrictMode
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);