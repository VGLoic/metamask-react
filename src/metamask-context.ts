import * as React from "react";
export interface MetaMaskState {
  account: null | string;
  chainId: null | string;
  status:
    | "initializing"
    | "unavailable"
    | "notConnected"
    | "connected"
    | "connecting";
}

export interface IMetaMaskContext extends MetaMaskState {
  connect: () => Promise<string[] | null>;
  ethereum: any;
}

export const MetamaskContext = React.createContext<
  IMetaMaskContext | undefined
>(undefined);
