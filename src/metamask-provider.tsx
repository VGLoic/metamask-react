import * as React from "react";
import {
  IMetaMaskContext,
  MetaMaskState,
  MetamaskContext,
} from "./metamask-context";
import { Action, reducer } from "./reducer";
import { useSafeDispatch } from "./utils/useSafeDispatch";

type WindowInstanceWithEthereum = Window &
  typeof globalThis & { ethereum?: any };

async function synchronize(dispatch: (action: Action) => void) {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;
  const isMetaMaskAvailable = Boolean(ethereum) && ethereum.isMetaMask;
  if (!isMetaMaskAvailable) {
    dispatch({ type: "metaMaskUnavailable" });
    return;
  }

  const chainId: string = await ethereum.request({
    method: "eth_chainId",
  });

  const isUnlocked = await ethereum._metamask.isUnlocked();

  if (!isUnlocked) {
    dispatch({ type: "metaMaskLocked", payload: { chainId } });
    return;
  }

  const accessibleAccounts: string[] = await ethereum.request({
    method: "eth_accounts",
  });

  if (accessibleAccounts.length === 0) {
    dispatch({ type: "metaMaskUnlocked", payload: { chainId } });
  } else {
    dispatch({
      type: "metaMaskConnected",
      payload: { accounts: accessibleAccounts, chainId },
    });
  }
}

function subsribeToAccountsChanged(dispatch: (action: Action) => void) {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;
  const onAccountsChanged = (accounts: string[]) =>
    dispatch({ type: "metaMaskAccountsChanged", payload: accounts });
  ethereum.on("accountsChanged", onAccountsChanged);
  return () => {
    ethereum.removeListener("accountsChanged", onAccountsChanged);
  };
}

function subscribeToChainChanged(dispatch: (action: Action) => void) {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;
  const onChainChanged = (chainId: string) =>
    dispatch({ type: "metaMaskChainChanged", payload: chainId });
  ethereum.on("chainChanged", onChainChanged);
  return () => {
    ethereum.removeListener("chainChanged", onChainChanged);
  };
}

async function requestAccounts(
  dispatch: (action: Action) => void
): Promise<string[]> {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;

  dispatch({ type: "metaMaskConnecting" });
  try {
    const accounts: string[] = await ethereum.request({
      method: "eth_requestAccounts",
    });
    dispatch({ type: "metaMaskConnected", payload: { accounts } });
    return accounts;
  } catch (err) {
    dispatch({ type: "metaMaskPermissionRejected" });
    throw err;
  }
}

const initialState: MetaMaskState = {
  status: "initializing",
  account: null,
  chainId: null,
};

export function MetaMaskProvider(props: any) {
  const [state, unsafeDispatch] = React.useReducer(reducer, initialState);
  const dispatch = useSafeDispatch(unsafeDispatch);

  const { status } = state;

  const isInitializing = status === "initializing";
  React.useEffect(() => {
    if (isInitializing) {
      synchronize(dispatch);
    }
  }, [dispatch, isInitializing]);

  const isConnected = status === "connected";
  React.useEffect(() => {
    if (!isConnected) return () => {};
    const unsubscribe = subsribeToAccountsChanged(dispatch);
    return unsubscribe;
  }, [dispatch, isConnected]);

  const isAvailable = status !== "unavailable" && status !== "initializing";
  React.useEffect(() => {
    if (!isAvailable) return () => {};
    const unsubscribe = subscribeToChainChanged(dispatch);
    return unsubscribe;
  }, [dispatch, isAvailable]);

  const connect = React.useCallback(() => {
    if (!isAvailable) {
      console.warn(
        "`enable` method has been called while MetaMask is not available or synchronising. Nothing will be done in this case."
      );
      return Promise.resolve([]);
    }
    return requestAccounts(dispatch);
  }, [dispatch, isAvailable]);

  const value: IMetaMaskContext = React.useMemo(
    () => ({
      ...state,
      connect,
      ethereum: (window as WindowInstanceWithEthereum).ethereum,
    }),
    [connect, state]
  );
  return <MetamaskContext.Provider value={value} {...props} />;
}
