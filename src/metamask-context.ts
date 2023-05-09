import * as React from "react";

import { Status } from "./constants";

export type AddEthereumChainParameter = {
  chainId: string;
  blockExplorerUrls?: string[];
  chainName?: string;
  iconUrls?: string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls?: string[];
};

type MetaMaskInitializing = {
  account: null;
  chainId: null;
  status: Status.INITIALIZING;
};

type MetaMaskUnavailable = {
  account: null;
  chainId: null;
  status: Status.UNAVAILABLE;
};

type MetaMaskNotConnected = {
  account: null;
  chainId: string;
  status: Status.NOT_CONNECTED;
};

type MetaMaskConnecting = {
  account: null;
  chainId: string;
  status: Status.CONNECTING;
};

type MetaMaskConnected = {
  account: string;
  chainId: string;
  status: Status.CONNECTED;
};

export type MetaMaskState =
  | MetaMaskInitializing
  | MetaMaskUnavailable
  | MetaMaskNotConnected
  | MetaMaskConnecting
  | MetaMaskConnected;

export type IMetaMaskContext = MetaMaskState & {
  /**
   * Connect the application to MetaMask
   * @returns Array of connected accounts when connection is successful, `null` if method not ready to be used
   */
  connect: () => Promise<string[] | null>;
  /**
   * Request addition of a new network
   * @param parameters New chain parameters, see [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085) for full description
   */
  addChain: (parameters: AddEthereumChainParameter) => Promise<void>;
  /**
   * Request a switch of network
   * @param chainId Chain ID of the network in hexadecimal
   * @example ```ts
   * // Switch chain to Ethereum Mainnet
   * await context.switchChain("0x1");
   * ```
   */
  switchChain: (chainId: string) => Promise<void>;
  ethereum: any;
};

export const MetamaskContext = React.createContext<
  IMetaMaskContext | undefined
>(undefined);
