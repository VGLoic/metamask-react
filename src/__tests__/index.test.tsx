import { act, renderHook } from "@testing-library/react-hooks";
import { setupEthTesting } from "eth-testing";

import { useMetaMask, MetaMaskProvider } from "../";

describe("MetaMask provider", () => {
  const address = "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC5";

  describe("when MetaMask is not available", () => {
    test("when there is no `ethereum` object in the window, it should synchronise into `unavailable` status", async () => {
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      expect(result.current.status).toEqual("unavailable");
    });

    test("calling `connect` should return an empty array and warn the developer", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementationOnce(() => {});
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      let accounts;
      await act(async () => {
        accounts = await result.current.connect();
      });

      expect(accounts).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("when MetaMask is available", () => {
    let originalEth: any;
    const { provider: ethereum, testingUtils } = setupEthTesting({
      providerType: "MetaMask",
    });

    beforeAll(() => {
      originalEth = (window as any).ethereum;
      (window as any).ethereum = ethereum;
    });

    afterAll(() => {
      (window as any).ethereum = originalEth;
    });

    afterEach(() => {
      testingUtils.clearAllMocks();
    });

    test("when chain changes, it should reflect on the state", async () => {
      const otherChainId = "0x2";

      testingUtils.mockAccounts([]);
      testingUtils.mockChainId("0x1");

      const { result, waitForNextUpdate } = renderHook(useMetaMask, {
        wrapper: MetaMaskProvider,
      });

      await waitForNextUpdate();

      expect(result.current.chainId).toEqual("0x1");

      act(() => {
        testingUtils.mockChainChanged("0x2");
      });

      expect(result.current.chainId).toEqual(otherChainId);
    });

    describe("when MetaMask is not connected", () => {
      beforeEach(() => {
        testingUtils.mockAccounts([]);
        testingUtils.mockChainId("0x1");
      });

      test("when MetaMask is unlocked but no account is connected, it should end up in the `notConnected` status", async () => {
        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.chainId).toEqual("0x1");
        expect(result.current.status).toEqual("notConnected");
      });

      test("calling `connect` method should end in a successful connection", async () => {
        testingUtils.lowLevel.mockRequest("eth_requestAccounts", [address]);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        act(() => {
          result.current.connect();
        });

        expect(result.current.status).toEqual("connecting");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(address);
      });

      test("calling `connect` method while a pending Metamask request is pending should end in a successful connection", async () => {
        const error = {
          code: -32002,
        };
        testingUtils.lowLevel.mockRequest("eth_requestAccounts", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate, waitForValueToChange } = renderHook(
          useMetaMask,
          {
            wrapper: MetaMaskProvider,
          }
        );

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        act(() => {
          result.current.connect();
        });

        expect(result.current.status).toEqual("connecting");

        act(() => {
          testingUtils.mockAccounts([address]);
        });

        await waitForValueToChange(() => result.current.status);

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(address);
      });

      test("calling `connect` method should end in the `notConnected` status if the request fails", async () => {
        const error = new Error("Test Error");
        testingUtils.lowLevel.mockRequest("eth_requestAccounts", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        let thrownError;
        act(() => {
          result.current.connect().catch((err) => (thrownError = err));
        });

        expect(result.current.status).toEqual("connecting");

        await waitForNextUpdate();

        expect(thrownError).toEqual(error);

        expect(result.current.status).toEqual("notConnected");
        expect(result.current.account).toEqual(null);
      });
    });

    describe("when MetaMask is already connected", () => {
      beforeEach(() => {
        testingUtils.mockAccounts([address]);
        testingUtils.mockChainId("0x1");
      });

      test("initialization should successfully connect to the account", async () => {
        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(address);
      });

      test("when account changes, it should reflect on the state", async () => {
        const otherAddress = "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC6";

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        act(() => {
          testingUtils.mockAccountsChanged([otherAddress]);
        });

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(otherAddress);
      });

      test("when account changes with empty account, it should lead to `notConnected` status", async () => {
        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        act(() => {
          testingUtils.mockAccountsChanged([]);
        });

        expect(result.current.status).toEqual("notConnected");
        expect(result.current.account).toEqual(null);
      });
    });
  });
});
