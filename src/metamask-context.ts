import * as React from "react";

export interface MetaMaskState {
  account: null | string;
  chainId: string | null;
  status: "initializing" | "unavailable" | "unabled" | "enabled" | "connecting";
}

export interface IMetaMaskContext extends MetaMaskState {
  enable: () => Promise<string[] | null>;
  ethereum: any;
}

export const MetamaskContext = React.createContext<
  IMetaMaskContext | undefined
>(undefined);
