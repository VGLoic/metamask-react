import { MetaMaskState } from "./metamask-context";
import { Status } from "./constants";

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
        status: Status.UNAVAILABLE,
      };
    case "metaMaskNotConnected":
      return {
        chainId: action.payload.chainId,
        account: null,
        status: Status.NOT_CONNECTED,
      };
    case "metaMaskConnected":
      const unlockedAccounts = action.payload.accounts;
      return {
        chainId: action.payload.chainId,
        account: unlockedAccounts[0],
        status: Status.CONNECTED,
      };
    case "metaMaskConnecting":
      if (
        state.status === Status.INITIALIZING ||
        state.status === Status.UNAVAILABLE
      ) {
        console.warn(
          `Invalid state transition from "${state.status}" to "connecting". Please, file an issue.`
        );
        return state;
      }
      return {
        ...state,
        account: null,
        status: Status.CONNECTING,
      };
    case "metaMaskPermissionRejected":
      if (
        state.status === Status.INITIALIZING ||
        state.status === Status.UNAVAILABLE
      ) {
        console.warn(
          `Invalid state transition from "${state.status}" to "connecting". Please, file an issue.`
        );
        return state;
      }
      return {
        ...state,
        account: null,
        status: Status.NOT_CONNECTED,
      };
    case "metaMaskAccountsChanged":
      if (state.status !== Status.CONNECTED) {
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
          status: Status.NOT_CONNECTED,
        };
      }
      return {
        ...state,
        account: accounts[0],
      };
    case "metaMaskChainChanged":
      if (
        state.status === Status.INITIALIZING ||
        state.status === Status.UNAVAILABLE
      ) {
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
