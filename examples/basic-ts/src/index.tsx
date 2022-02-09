import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { MetaMaskProvider } from "metamask-react";

ReactDOM.render(
  <React.StrictMode>
    <MetaMaskProvider>
      <App />
    </MetaMaskProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
