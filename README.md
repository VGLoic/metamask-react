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

function App() {
    const { status, enable, account } = useMetaMask();

    if (status === "unavailable") return <div>MetaMask not available :(</div>

    if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

    if (status === "unabled") return <button onClick={enable}>Connect to MetaMask</button>

    if (status === "connecting") return <div>Connecting...</div>

    if (status === "enabled") return <div>Connected account: {account}</div>

    return null;
}
```

## Statuses and behaviour

The `MetaMaskProvider` will first derive its initial state based on the presence of correctly injected `ethereum` object.

If the `ethereum` object is not present, the initial status will be `unavailable` and no synchronisation is made.

Otherwise, the initial status will be `initializing` and a synchronisation is made in order to check if MetaMask has already connected accounts for the application.

In case of no accounts connected, the status will be `unabled`, otherwise the status will be `enabled`.

Here is an abstract on the different statuses:
- `unavailable`: MetaMask is not available, nothing will be done
- `initializing`: the provider is currently synchronizing with MetaMask
- `unabled`: MetaMask is available but not connected to the application
- `enabled`: MetaMask is connected to the application
- `connecting`: the connection of your accounts to the application is ongoing

