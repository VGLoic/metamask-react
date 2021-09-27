# MetaMask React

Simplistic Context provider and consumer hook in order to manage MetaMask in the browser.

## Installation

The recommend way to use MetaMask React with a React app is to install it as a dependency:
```shell
# If you use npm:
npm install metamask-react

# Or if you use Yarn:
yarn add metamask-react
```

## Example

The first step is to wrap you `App` or any React subtree with the `MetaMaskProvider`
```javascript
// index.js
import { MetaMaskProvider } from "metamask-react";

...

ReactDOM.render(
  <React.StrictMode>
    <MetaMaskProvider>
      <App />
    </MetaMaskProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

In any React child of the provider, one can use the `useMetaMask` hook in order to access the state and methods.
```javascript
// app.js
import { useMetaMask } from "metamask-react";

...

function App() {
    const { status, connect, account } = useMetaMask();

    if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

    if (status === "unavailable") return <div>MetaMask not available :(</div>

    if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>

    if (status === "connecting") return <div>Connecting...</div>

    if (status === "connected") return <div>Connected account: {account}</div>

    return null;
}
```

## Statuses and behaviour

The `MetaMaskProvider` will first initialise the state with `initializing` status, the `account` and `chainId` will be `null`. A synchronization is performed in order to derive the MetaMask state.

If the `ethereum` object is not present or if it is the one associated to MetaMask, the synchronisation will change the status to `unavailable`.

Otherwise, a check is performed in order to detect if MetaMask has already connected accounts for the application.

In case of no connected accounts, the status will be `unabled`, otherwise the status will be `enabled`.

Here is an abstract on the different statuses:
- `initializing`: the provider is currently initializing by synchronizing with MetaMask
- `unavailable`: MetaMask is not available, nothing will be done
- `notConnected`: MetaMask is available but not connected to the application
- `connected`: MetaMask is connected to the application
- `connecting`: the connection of your accounts to the application is ongoing

