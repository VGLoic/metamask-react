import { MetaMaskState } from "./metamask-context";
interface MetaMaskLocked {
  type: "metaMaskLocked";
}
interface MetaMaskUnlocked {
  type: "metaMaskUnlocked";
}
interface MetaMaskEnabled {
  type: "metaMaskEnabled";
  payload: string[];
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
  | MetaMaskLocked
  | MetaMaskUnlocked
  | MetaMaskEnabled
  | MetaMaskConnecting
  | PermissionRejected
  | AccountsChanged
  | ChainChanged;

export function reducer(state: MetaMaskState, action: Action): MetaMaskState {
  switch (action.type) {
    case "metaMaskLocked":
      return {
        ...state,
        account: null,
        status: "unabled",
      };
    case "metaMaskUnlocked":
      return {
        ...state,
        account: null,
        status: "unabled",
      };
    case "metaMaskEnabled":
      const unlockedAccounts = action.payload;
      return {
        ...state,
        account: unlockedAccounts[0],
        status: "enabled",
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
        status: "unabled",
      };
    case "metaMaskAccountsChanged":
      const accounts = action.payload;
      if (accounts.length === 0) {
        return {
          ...state,
          account: null,
          status: "unabled",
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
