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

function deriveInitialState(): MetaMaskState {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;
  const isMetaMaskAvailable = Boolean(ethereum) && ethereum.isMetaMask;

  return {
    status: isMetaMaskAvailable ? "initializing" : "unavailable",
    account: null,
    chainId: null,
  };
}

export function MetaMaskProvider(props: any) {
  const [state, unsafeDispatch] = React.useReducer(
    reducer,
    undefined,
    deriveInitialState
  );
  const dispatch = useSafeDispatch(unsafeDispatch);

  const { status } = state;

  React.useEffect(() => {
    if (status === "initializing") {
      synchronize(dispatch);
    }
  }, [dispatch, status]);

  const isConnected = status === "connected";
  React.useEffect(() => {
    if (!isConnected) return () => {};
    const unsubscribe = subsribeToAccountsChanged(dispatch);
    return unsubscribe;
  }, [dispatch, isConnected]);

  const isUnavailable = status === "unavailable";
  React.useEffect(() => {
    if (isUnavailable) return () => {};
    const unsubscribe = subscribeToChainChanged(dispatch);
    return unsubscribe;
  }, [dispatch, isUnavailable]);

  const connect = React.useCallback(() => {
    if (isUnavailable) {
      console.warn(
        "`enable` method has been called while MetaMask is not available. Nothing will be done in this case."
      );
      return Promise.resolve([]);
    }
    return requestAccounts(dispatch);
  }, [dispatch, isUnavailable]);

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
