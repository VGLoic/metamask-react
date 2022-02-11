import { MetaMaskState } from "./metamask-context";

type MetaMaskUnavailable = {
  type: "metaMaskUnavailable";
};
type MetaMaskNotConnected = {
  type: "metaMaskNotConnected";
  payload: {
    chainId: string;
  };
};
type MetaMaskConnected = {
  type: "metaMaskConnected";
  payload: {
    accounts: string[];
    chainId: string;
  };
};
type MetaMaskConnecting = {
  type: "metaMaskConnecting";
};
type PermissionRejected = {
  type: "metaMaskPermissionRejected";
};
type AccountsChanged = {
  type: "metaMaskAccountsChanged";
  payload: string[];
};
type ChainChanged = {
  type: "metaMaskChainChanged";
  payload: string;
};

export type Action =
  | MetaMaskUnavailable
  | MetaMaskNotConnected
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
    case "metaMaskNotConnected":
      return {
        chainId: action.payload.chainId,
        account: null,
        status: "notConnected",
      };
    case "metaMaskConnected":
      const unlockedAccounts = action.payload.accounts;
      return {
        chainId: action.payload.chainId,
        account: unlockedAccounts[0],
        status: "connected",
      };
    case "metaMaskConnecting":
      if (state.status === "initializing" || state.status === "unavailable") {
        console.warn(
          `Invalid state transition from "${state.status}" to "connecting". Please, file an issue.`
        );
        return state;
      }
      return {
        ...state,
        account: null,
        status: "connecting",
      };
    case "metaMaskPermissionRejected":
      if (state.status === "initializing" || state.status === "unavailable") {
        console.warn(
          `Invalid state transition from "${state.status}" to "connecting". Please, file an issue.`
        );
        return state;
      }
      return {
        ...state,
        account: null,
        status: "notConnected",
      };
    case "metaMaskAccountsChanged":
      if (state.status !== "connected") {
        console.warn(
          `Invalid accounts change in "${state.status}". Please, file an issue.`
        );
        return state;
      }
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
      if (state.status === "initializing" || state.status === "unavailable") {
        console.warn(
          `Invalid chain ID change in "${state.status}". Please, file an issue.`
        );
        return state;
      }
      return {
        ...state,
        chainId: action.payload,
      };
    // no default
  }
}
