import * as React from "react";
import { MetamaskContext } from "./metamask-context";

export function useMetaMask() {
  const context = React.useContext(MetamaskContext);

  if (!context) {
    throw new Error("`useMetamask` should be used within a `MetaMaskProvider`");
  }

  return context;
}
