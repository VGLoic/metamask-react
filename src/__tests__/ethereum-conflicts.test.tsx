import { renderHook } from "@testing-library/react-hooks";
import { generateTestingUtils } from "eth-testing";

import { useMetaMask, MetaMaskProvider } from "../";

describe("`window.ethereum` conflict tests", () => {
  describe("when the `ethereum` object has a `providerMap` field", () => {
    test("when the `providers` does not have a `MetaMask` provider, it should synchronise in `unavailable` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const ethereum = {
        providers: [coinbaseProvider],
      };
      (window as any).ethereum = ethereum;

      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      expect(result.current.status).toEqual("unavailable");

      (window as any).ethereum = originalEth;
    });

    test("when the `providers` does have a valid MetaMask provider, it should synchronise in `notConnected` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const metaMaskTestingUtils = generateTestingUtils({
        providerType: "MetaMask",
      });
      const braveWalletTestingUtils = generateTestingUtils({
        providerType: "MetaMask",
      });
      const braveWalletProvider = braveWalletTestingUtils.getProvider();
      (braveWalletProvider as any).isBraveWallet = true;

      const metaMaskProvider = metaMaskTestingUtils.getProvider();
      const ethereum = {
        providers: [coinbaseProvider, braveWalletProvider, metaMaskProvider],
      };
      (window as any).ethereum = ethereum;

      metaMaskTestingUtils.mockNotConnectedWallet();

      const { result, waitForNextUpdate } = renderHook(useMetaMask, {
        wrapper: MetaMaskProvider,
      });

      expect(result.current.status).toEqual("initializing");

      await waitForNextUpdate();

      expect(result.current.status).toEqual("notConnected");

      (window as any).ethereum = originalEth;
    });

    test("when the `providers` does have a valid Brave Wallet provider, it should synchronise in `notConnected` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const braveWalletTestingUtils = generateTestingUtils({
        providerType: "MetaMask",
      });
      const braveWalletProvider = braveWalletTestingUtils.getProvider();
      (braveWalletProvider as any).isBraveWallet = true;
      const ethereum = {
        providers: [coinbaseProvider, braveWalletProvider],
      };
      (window as any).ethereum = ethereum;

      braveWalletTestingUtils.mockNotConnectedWallet();

      const { result, waitForNextUpdate } = renderHook(useMetaMask, {
        wrapper: MetaMaskProvider,
      });

      expect(result.current.status).toEqual("initializing");

      await waitForNextUpdate();

      expect(result.current.status).toEqual("notConnected");

      (window as any).ethereum = originalEth;
    });
  });

  test("when the `MetaMask` provider is corrupted or removed in the meantime, it should throw", async () => {
    let originalEth = (window as any).ethereum;
    const testingUtils = generateTestingUtils();
    const coinbaseProvider = testingUtils.getProvider();
    const metaMaskTestingUtils = generateTestingUtils({
      providerType: "MetaMask",
    });
    const metaMaskProvider = metaMaskTestingUtils.getProvider();
    const providers = [coinbaseProvider, metaMaskProvider];
    const ethereum = { providers };
    (window as any).ethereum = ethereum;

    metaMaskTestingUtils.mockNotConnectedWallet();

    const { result, waitForNextUpdate } = renderHook(useMetaMask, {
      wrapper: MetaMaskProvider,
    });

    expect(result.current.status).toEqual("initializing");

    await waitForNextUpdate();

    expect(result.current.status).toEqual("notConnected");

    providers.pop();

    expect(() => result.current.connect()).toThrowError(
      "MetaMask provider must be present in order to use this method"
    );

    (window as any).ethereum = originalEth;
  });
});
