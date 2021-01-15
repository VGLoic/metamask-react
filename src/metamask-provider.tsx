import * as React from "react";
import {
  IMetaMaskContext,
  MetamaskContext,
  MetaMaskState,
} from "./metamask-context";
import { Action, reducer } from "./reducer";
import { useSafeDispatch } from "./utils/useSafeDispatch";

type WindowInstanceWithEthereum = Window &
  typeof globalThis & { ethereum?: any };

async function synchronize(dispatch: (action: Action) => void) {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;

  const isUnlocked = await ethereum._metamask.isUnlocked();

  if (!isUnlocked) {
    dispatch({ type: "metaMaskLocked" });
    return;
  }

  const accessibleAccounts: string[] = await ethereum.request({
    method: "eth_accounts",
  });

  if (accessibleAccounts.length === 0) {
    dispatch({ type: "metaMaskUnlocked" });
  } else {
    dispatch({ type: "metaMaskEnabled", payload: accessibleAccounts });
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
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    dispatch({ type: "metaMaskEnabled", payload: accounts });
    return accounts;
  } catch (err) {
    dispatch({ type: "metaMaskPermissionRejected" });
    throw err;
  }
}

function deriveInitialState(): MetaMaskState {
  const ethereum = (window as WindowInstanceWithEthereum).ethereum;
  const isMetaMaskAvailable = Boolean(ethereum) && ethereum.isMetaMask;

  if (isMetaMaskAvailable) {
    return {
      account: null,
      chainId: ethereum.chainId,
      status: "initializing",
    };
  }
  return {
    account: null,
    chainId: null,
    status: "unavailable",
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

  React.useEffect(() => {
    if (status !== "enabled") return () => {};
    const unsubscribe = subsribeToAccountsChanged(dispatch);
    return unsubscribe;
  }, [dispatch, status]);

  React.useEffect(() => {
    if (status === "unavailable") return () => {};
    const unsubscribe = subscribeToChainChanged(dispatch);
    return unsubscribe;
  }, [dispatch, status]);

  const enable = React.useCallback(() => {
    if (status === "unavailable") {
      console.warn(
        "`enable` method has been called while MetaMask is not available. Nothing will be done in this case."
      );
      return Promise.resolve([]);
    }
    return requestAccounts(dispatch);
  }, [dispatch, status]);

  const value: IMetaMaskContext = React.useMemo(
    () => ({
      ...state,
      enable,
      ethereum: (window as WindowInstanceWithEthereum).ethereum,
    }),
    [enable, state]
  );
  return <MetamaskContext.Provider value={value} {...props} />;
}
