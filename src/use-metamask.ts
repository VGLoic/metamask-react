import * as React from "react";
import { MetamaskContext } from "./metamask-context";
import { Status } from "./constants";

export function useMetaMask() {
  const context = React.useContext(MetamaskContext);

  if (!context) {
    throw new Error("`useMetamask` should be used within a `MetaMaskProvider`");
  }

  return context;
}

export function useConnectedMetaMask() {
  const context = useMetaMask();

  if (context.status !== Status.CONNECTED) {
    throw new Error(
      "`useConnectedMetaMask` can only be used when the user is connected"
    );
  }

  return context;
}
