import { renderHook } from "@testing-library/react-hooks";
import { generateTestingUtils } from "eth-testing";

import { useMetaMask, MetaMaskProvider } from "../";

describe("`window.ethereum` conflict tests", () => {
  describe("when the `ethereum` object has a `providerMap` field", () => {
    test("when the `providerMap` does not have a `MetaMask` value, it should synchronise in `unavailable` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const ethereum = {
        providerMap: new Map([["CoinbaseWallet", coinbaseProvider]]),
      };
      (window as any).ethereum = ethereum;

      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      expect(result.current.status).toEqual("unavailable");

      (window as any).ethereum = originalEth;
    });

    test("when the `providerMap` does have a `MetaMask` value but with an invalid provider, it should synchronise in `unavailable` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const unknownTestingUtils = generateTestingUtils();
      const unknownProvider = unknownTestingUtils.getProvider();
      const ethereum = {
        providerMap: new Map([
          ["CoinbaseWallet", coinbaseProvider],
          ["MetaMask", unknownProvider],
        ]),
      };
      (window as any).ethereum = ethereum;

      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      expect(result.current.status).toEqual("unavailable");

      (window as any).ethereum = originalEth;
    });

    test("when the `providerMap` does have a `MetaMask` value with a valid provider, it should synchronise in `notConnected` status", async () => {
      let originalEth = (window as any).ethereum;
      const testingUtils = generateTestingUtils();
      const coinbaseProvider = testingUtils.getProvider();
      const metaMaskTestingUtils = generateTestingUtils({
        providerType: "MetaMask",
      });
      const metaMaskProvider = metaMaskTestingUtils.getProvider();
      const ethereum = {
        providerMap: new Map([
          ["CoinbaseWallet", coinbaseProvider],
          ["MetaMask", metaMaskProvider],
        ]),
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
  });

  test("when the `ethereum` object is corrupted in the meantime, it should throw", async () => {
    let originalEth = (window as any).ethereum;
    const testingUtils = generateTestingUtils();
    const coinbaseProvider = testingUtils.getProvider();
    const metaMaskTestingUtils = generateTestingUtils({
      providerType: "MetaMask",
    });
    const metaMaskProvider = metaMaskTestingUtils.getProvider();
    const unknownTestingUtils = generateTestingUtils();
    const unknownProvider = unknownTestingUtils.getProvider();
    const providerMap = new Map([
      ["CoinbaseWallet", coinbaseProvider],
      ["MetaMask", metaMaskProvider],
    ]);
    const ethereum = { providerMap };
    (window as any).ethereum = ethereum;

    metaMaskTestingUtils.mockNotConnectedWallet();

    const { result, waitForNextUpdate } = renderHook(useMetaMask, {
      wrapper: MetaMaskProvider,
    });

    expect(result.current.status).toEqual("initializing");

    await waitForNextUpdate();

    expect(result.current.status).toEqual("notConnected");

    providerMap.set("MetaMask", unknownProvider);

    expect(() => result.current.connect()).toThrowError(
      "MetaMask provider must be present in order to use this method"
    );

    (window as any).ethereum = originalEth;
  });
});
