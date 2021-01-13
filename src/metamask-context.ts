import * as React from "react";

export interface MetaMaskState {
  account: null | string;
  status: "initializing" | "unavailable" | "unabled" | "enabled" | "connecting";
}

export interface IMetamaskContext extends MetaMaskState {
  enable: () => Promise<string[] | null>;
  ethereum: any;
}

export const MetamaskContext = React.createContext<
  IMetamaskContext | undefined
>(undefined);
