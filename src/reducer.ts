import { MetaMaskState } from "./metamask-context";
interface MetaMaskUnavailable {
  type: "metaMaskUnavailable";
}
interface MetaMaskLocked {
  type: "metaMaskLocked";
  payload: {
    chainId: string;
  };
}
interface MetaMaskUnlocked {
  type: "metaMaskUnlocked";
  payload: {
    chainId: string;
  };
}
interface MetaMaskConnected {
  type: "metaMaskConnected";
  payload: {
    accounts: string[];
    chainId?: string;
  };
}
interface MetaMaskConnecting {
  type: "metaMaskConnecting";
}
interface PermissionRejected {
  type: "metaMaskPermissionRejected";
}
interface AccountsChanged {
  type: "metaMaskAccountsChanged";
  payload: string[];
}
interface ChainChanged {
  type: "metaMaskChainChanged";
  payload: string;
}

export type Action =
  | MetaMaskUnavailable
  | MetaMaskLocked
  | MetaMaskUnlocked
  | MetaMaskConnected
  | MetaMaskConnecting
  | PermissionRejected
  | AccountsChanged
  | ChainChanged;

export function reducer(state: MetaMaskState, action: Action): MetaMaskState {
  switch (action.type) {
    case "metaMaskUnavailable":
      return {
        chainId: null,
        account: null,
        status: "unavailable",
      };
    case "metaMaskLocked":
      return {
        ...state,
        chainId: action.payload.chainId,
        account: null,
        status: "notConnected",
      };
    case "metaMaskUnlocked":
      return {
        ...state,
        chainId: action.payload.chainId,
        account: null,
        status: "notConnected",
      };
    case "metaMaskConnected":
      const unlockedAccounts = action.payload.accounts;
      return {
        chainId: action.payload.chainId || state.chainId,
        account: unlockedAccounts[0],
        status: "connected",
      };
    case "metaMaskConnecting":
      return {
        ...state,
        account: null,
        status: "connecting",
      };
    case "metaMaskPermissionRejected":
      return {
        ...state,
        account: null,
        status: "notConnected",
      };
    case "metaMaskAccountsChanged":
      const accounts = action.payload;
      if (accounts.length === 0) {
        return {
          ...state,
          account: null,
          status: "notConnected",
        };
      }
      return {
        ...state,
        account: accounts[0],
      };
    case "metaMaskChainChanged":
      return {
        ...state,
        chainId: action.payload,
      };
    // no default
  }
}
