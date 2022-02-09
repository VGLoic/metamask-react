import * as React from 'react';
import './App.css';
import { useConnectedMetaMask, useMetaMask } from 'metamask-react';

function ConnectedApp() {
  const { account, chainId } = useConnectedMetaMask();

  return (
    <div className='App'>
      <div>Account: {account}</div>
      <div>Chain ID: {chainId}</div>
    </div>
  )
}

function App() {
  const { status, connect } = useMetaMask();

  if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

  if (status === "unavailable") return <div>MetaMask not available :(</div>

  if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>

  if (status === "connecting") return <div>Connecting...</div>

  return <ConnectedApp />
}

export default App;
