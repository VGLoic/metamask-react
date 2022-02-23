import { renderHook } from "@testing-library/react-hooks";
import { setupEthTesting } from "eth-testing";
import { MetaMaskProvider } from "..";
import { useConnectedMetaMask, useMetaMask } from "../use-metamask";

describe("useMetaMask", () => {
  test("calling useMetaMask from a component without the MetaMask provider should throw", () => {
    function useTest() {
      try {
        useMetaMask();
        return false;
      } catch (err) {
        return err;
      }
    }
    const { result } = renderHook(useTest);
    expect(result.current).toEqual(
      new Error("`useMetamask` should be used within a `MetaMaskProvider`")
    );
  });

  test("calling useConnectedMetaMask when the status is not `connected should throw", () => {
    function useTest() {
      try {
        useConnectedMetaMask();
        return false;
      } catch (err) {
        return err;
      }
    }
    const { result } = renderHook(useTest, { wrapper: MetaMaskProvider });
    expect(result.current).toEqual(
      new Error(
        "`useConnectedMetaMask` can only be used when the user is connected"
      )
    );
  });

  test("calling useConnectedMetaMask when the status is `connected should return the expected values", async () => {
    const { provider: ethereum, testingUtils } = setupEthTesting({
      providerType: "MetaMask",
    });

    let originalEth = (window as any).ethereum;
    (window as any).ethereum = ethereum;

    testingUtils.mockConnectedWallet([
      "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC6",
    ]);

    function useTest() {
      try {
        const connectedMetaMask = useConnectedMetaMask();
        return connectedMetaMask;
      } catch (err) {
        return err;
      }
    }

    const { result, waitForNextUpdate } = renderHook(useTest, {
      wrapper: MetaMaskProvider,
    });

    await waitForNextUpdate();

    expect(result.current.account).toEqual(
      "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC6"
    );
    expect(result.current.chainId).toEqual("0x1");

    (window as any).ethereum = originalEth;
  });
});
