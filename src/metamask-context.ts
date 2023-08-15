import * as React from "react";

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
  status: "initializing";
};

type MetaMaskUnavailable = {
  account: null;
  chainId: null;
  status: "unavailable";
};

type MetaMaskNotConnected = {
  account: null;
  chainId: string;
  status: "notConnected";
};

type MetaMaskConnecting = {
  account: null;
  chainId: string;
  status: "connecting";
};

type MetaMaskConnected = {
  account: string;
  chainId: string;
  status: "connected";
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
   * Request addition of a new chain to MetaMask
   * @dev See [MetaMask API](https://docs.metamask.io/wallet/reference/rpc-api/#wallet_addethereumchain) or [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085) for full description
   * @param parameters The chain parameters
   * @example ```typescript
   * const { addChain } = useMetaMask();
   * const GNOSIS_MAINNET_PARAMS = {
   *  chainId: "0x64",
   *  chainName: "Gnosis",
   *  nativeCurrency: {
   *    name: "xDai",
   *    symbol: "XDAI",
   *    decimals: 18,
   *  },
   *  rpcUrls: ["https://rpc.gnosischain.com/"],
   *  blockExplorerUrls: ["https://gnosisscan.io/"],
   * }
   * const onClick = () => addChain(GNOSIS_MAINNET_PARAMS);
   * ```
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
