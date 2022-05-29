# MetaMask React

[![Coverage Status](https://coveralls.io/repos/github/VGLoic/metamask-react/badge.svg?branch=main)](https://coveralls.io/github/VGLoic/metamask-react?branch=main)

Simplistic Context provider and consumer hook in order to manage MetaMask in the browser.

## Installation

The recommend way to use MetaMask React with a React app is to install it as a dependency.

If you use `npm`:
```console
npm install metamask-react
```

Or if you use `yarn`:
```console
yarn add metamask-react
```

## Quick Start

The first step is to wrap you `App` or any React subtree with the `MetaMaskProvider`
```TypeScript
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
```TypeScript
// app.js
import { useMetaMask } from "metamask-react";

...

function App() {
    const { status, connect, account, chainId, ethereum } = useMetaMask();

    if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

    if (status === "unavailable") return <div>MetaMask not available :(</div>

    if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>

    if (status === "connecting") return <div>Connecting...</div>

    if (status === "connected") return <div>Connected account {account} on chain ID {chainId}</div>

    return null;
}
```

## Statuses and behaviour

The `MetaMaskProvider` will first initialise the state with `initializing` status, the `account` and `chainId` will be `null`. A synchronization is performed in order to derive the MetaMask state.

If the `ethereum` object is not present or if it is not the one associated to MetaMask, the synchronisation will change the status to `unavailable`.

Otherwise, a check is performed in order to detect if MetaMask has already connected accounts for the application.

In case of no connected accounts, the status will be `notConnected`, otherwise the status will be `connected`.

Here is an abstract on the different statuses:
- `initializing`: the provider is currently initializing by synchronizing with MetaMask
- `unavailable`: MetaMask is not available, nothing will be done
- `notConnected`: MetaMask is available but not connected to the application
- `connected`: MetaMask is connected to the application
- `connecting`: the connection of your accounts to the application is ongoing

## Chain utils

The context exposes two methods in order to facilitate the management of the networks. These methods are wrappers around the JSON RPC requests handled by MetaMask, see [MetaMask documentation](https://docs.metamask.io/guide/rpc-api.html#table-of-contents) for additonal informations.

The first one is to request a switch to a different network
```TypeScript
function WrongNetwork() {
  const { switchChain } = useMetaMask();
  // Request a switch to Ethereum Mainnet
  return (
    <button onClick={() => switchChain("0x1")}>Switch to Ethereum Mainnet</button>
  )
}
```

The second one is a request to add to MetaMask a network and then connect to it
```TypeScript
function WrongNetwork() {
  const { addChain } = useMetaMask();
  const gnosisChainNetworkParams = {
    chainId: "0x64",
    chainName: "Gnosis Chain",
    rpcUrls: ["https://rpc.gnosischain.com/"],
    nativeCurrency: {
      name: "xDAI",
      symbol: "xDAI",
      decimals: 18,
    },
    blockExplorerUrls: ["https://blockscout.com/xdai/mainnet/"]
  };
  // Request to add Gnosis chain and then switch to it
  return (
    <button onClick={() => addChain(gnosisChainNetworkParams)}>Add Gnosis chain</button>
  )
}
```

Finally, here is a non exhaustive list of the networks and their chain IDs
```TypeScript
const networks = {
  mainnet: "0x1", // 1
  // Test nets
  goerli: "0x5", // 5
  ropsten: "0x3", // 3
  rinkeby: "0x4", // 4
  kovan: "0x2a", // 42
  mumbai: "0x13881", // 80001
  // Layers 2
  arbitrum: "0xa4b1", // 42161
  optimism: "0xa", // 10
  // Side chains
  polygon: "0x89", // 137
  gnosisChain: "0x64", // 100
  // Alt layer 1
  binanceSmartChain: "0x38", // 56
  avalanche: "0xa86a", // 43114
  cronos: "0x19", // 25
  fantom: "0xfa" // 250
}
```
## Type safe hook

Most of the time, the application will use the state when the user is connected, i.e. with status `connected`. Therefore the hook `useConnectedMetaMask` is additionally exposed, it is the same hook as `useMetaMask` but is typed with the connected state, e.g. the `account` or the `chainId` are necessarily not `null`. This hook is only usable when the status is equal to `connected`, it will throw otherwise.
```TypeScript
function MyComponent() {
  const {
    // typed as string - can not be null
    account,
    // typed as string - can not be null
    chainId
  } = useConnectedMetaMask();

  return <div>Connected account {account} on chain ID {chainId}</div>
}
```
## Contributing :rocket:

Contributions are welcome! Please follow the guidelines in the [contributing document](/CONTRIBUTING.md).