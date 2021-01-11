import * as React from "react";
import { useSafeDispatch } from "./useSafeDispatch";

type WindowInstanceWithEthereum = Window & typeof globalThis & { ethereum?: any };

interface MetamaskState {
    account: null | string;
    status: "initializing" | "unavailable" | "unabled" | "enabled"  | "connecting"
}

interface IMetamaskContext extends MetamaskState {
    enable: () => Promise<void>;
    ethereum: any;
}

const initialState: MetamaskState = {
    account: null,
    status: "initializing"
}

interface Action {
    type: "metamaskNotDetected" | "metamaskLocked" | "metamaskUnlocked" | "metamaskEnabled" | "metamaskConnecting" | "accountsChanged";
    payload?: string[];
}

function reducer(state: MetamaskState, action: Action): MetamaskState {



    
    switch (action.type) {
        case "metamaskNotDetected":
            return {
                account: null,
                status: "unavailable"
            }
        case "metamaskLocked":
            return {
                account: null,
                status: "unabled"
            }
        case "metamaskUnlocked":
            return {
                account: null,
                status: "unabled"
            }
        case "metamaskEnabled":
            const unlockedAccounts = action.payload as string[];
            return {
                account: unlockedAccounts[0],
                status: "enabled"
            }
        case "metamaskConnecting":
            return {
                account: null,
                status: "connecting"
            }
        case "accountsChanged":
            const accounts = action.payload as string[];
            console.log("on accounts changed: ", accounts);
            if (accounts.length === 0) {
                return {
                    account: null,
                    status: "unabled"
                }
            }
            return {
                ...state,
                account: accounts[0]
            }
        default:
            throw new Error("Unreachable case in MetamaskProvider reducer");
    }
}

const MetamaskContext = React.createContext<IMetamaskContext | undefined>(undefined);

async function deriveInitialState(dispatch: (action: Action) => void) {
    const ethereum = (window as WindowInstanceWithEthereum).ethereum;
    const isMetaMaskAvailable = Boolean(ethereum) && ethereum.isMetaMask;

    if (!isMetaMaskAvailable) {
        dispatch({ type: "metamaskNotDetected" });
        return
    }
    const isUnlocked = await ethereum._metamask.isUnlocked();

    if (!isUnlocked) {
        dispatch({ type: "metamaskLocked" })
        return;
    }

    const accessibleAccounts: string[] = await ethereum.request({ method: "eth_accounts" });

    if (accessibleAccounts.length === 0) {
        dispatch({ type: "metamaskUnlocked" })
    } else {
        dispatch({ type: "metamaskEnabled", payload: accessibleAccounts })
    }
}

export function MetaMaskProvider(props: any) {

    const [state, unsafeDispatch] = React.useReducer(reducer, initialState);
    const dispatch = useSafeDispatch(unsafeDispatch);

    React.useEffect(() => {
        deriveInitialState(dispatch)
    }, [dispatch]);


    const { status } = state;
    React.useEffect(() => {
        const subscribe = (dispatch: (a: Action) => void) => {
            if (status !== "enabled") return () => {};
            const ethereum = (window as WindowInstanceWithEthereum).ethereum;
            const onAccountsChanged = (accounts: string[]) => dispatch({ type: "accountsChanged", payload: accounts });
            ethereum.on("accountsChanged", onAccountsChanged);
            return () => {
                ethereum.removeListener("accountsChanged", onAccountsChanged)
            }
        }
        const unsubscribe = subscribe(dispatch)
        return unsubscribe
    }, [dispatch, status])
    
    const enable = React.useCallback(async () => {
        const ethereum = (window as WindowInstanceWithEthereum).ethereum;
        const isMetaMaskAvailable = Boolean(ethereum) && ethereum.isMetaMask;
        if (!isMetaMaskAvailable) return;
        dispatch({ type: "metamaskConnecting" })
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        dispatch({ type: "metamaskEnabled", payload: accounts })
    }, [dispatch]);


    const value: IMetamaskContext = React.useMemo(() => ({
        ...state,
        enable,
        ethereum: (window as WindowInstanceWithEthereum).ethereum
    }), [enable, state])
    return <MetamaskContext.Provider value={value} {...props} />
}

export function useMetaMask() {
    const context = React.useContext(MetamaskContext);

    if (!context) {
        throw new Error("useMetamask should be used within a MetaMaskProvider");
    }

    return context;
}