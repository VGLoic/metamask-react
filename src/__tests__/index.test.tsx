import { act, renderHook } from "@testing-library/react-hooks";
import { setupEthTesting } from "eth-testing";

import { useMetaMask, MetaMaskProvider } from "../";

describe("MetaMask provider", () => {
  const addChainPrams = {
    chainId: "0x64",
    chainName: "xDAI Chain",
    rpcUrls: ["https://dai.poa.network"],
    iconUrls: [
      "https://xdaichain.com/fake/example/url/xdai.svg",
      "https://xdaichain.com/fake/example/url/xdai.png",
    ],
    nativeCurrency: {
      name: "xDAI",
      symbol: "xDAI",
      decimals: 18,
    },
  };
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

    test("calling `addChain` should immediately return and warn the developer", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementationOnce(() => {});
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      await act(async () => {
        await result.current.addChain(addChainPrams);
      });

      expect(warn).toHaveBeenCalledTimes(1);
    });

    test("calling `switchChain` should immediately return and warn the developer", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementationOnce(() => {});
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      await act(async () => {
        await result.current.switchChain("0x1");
      });

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

    describe("chain utils", () => {
      beforeEach(() => {
        testingUtils.mockAccounts([]);
        testingUtils.mockChainId("0x1");
      });

      test("calling `addChain` should trigger the expected RPC request", async () => {
        testingUtils.lowLevel.mockRequest("wallet_addEthereumChain", undefined);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await act(async () => {
          return result.current.addChain(addChainPrams).then(() => {
            testingUtils.mockChainChanged(addChainPrams.chainId);
          });
        });

        expect(result.current.chainId).toEqual(addChainPrams.chainId);
      });

      test("calling `addChain` when a current request is pending should return", async () => {
        const error = {
          code: -32002,
        };
        testingUtils.lowLevel.mockRequest("wallet_addEthereumChain", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await act(async () => {
          return result.current.addChain(addChainPrams).then(() => {
            testingUtils.mockChainChanged(addChainPrams.chainId);
          });
        });

        expect(result.current.chainId).toEqual(addChainPrams.chainId);
      });

      test("calling `addChain` should throw if the underlying request throws with a unhandled code", async () => {
        const error = {
          code: -32003,
        };
        testingUtils.lowLevel.mockRequest("wallet_addEthereumChain", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await expect(() =>
          result.current.addChain(addChainPrams)
        ).rejects.toEqual(error);
      });

      test("calling `switchChain` should trigger the expected RPC request", async () => {
        const newChainId = "0x2";
        testingUtils.lowLevel.mockRequest(
          "wallet_switchEthereumChain",
          undefined
        );

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await act(async () => {
          return result.current.switchChain(newChainId).then(() => {
            testingUtils.mockChainChanged(newChainId);
          });
        });

        expect(result.current.chainId).toEqual(newChainId);
      });

      test("calling `switchChain` when a current request is pending should return", async () => {
        const newChainId = "0x2";
        const error = {
          code: -32002,
        };
        testingUtils.lowLevel.mockRequest("wallet_switchEthereumChain", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await act(async () => {
          return result.current.switchChain(newChainId).then(() => {
            testingUtils.mockChainChanged(newChainId);
          });
        });

        expect(result.current.chainId).toEqual(newChainId);
      });

      test("calling `switchChain` should throw if the underlying request throws with a unhandled code", async () => {
        const error = {
          code: -32003,
        };
        testingUtils.lowLevel.mockRequest("wallet_switchEthereumChain", error, {
          shouldThrow: true,
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");

        await expect(() => result.current.switchChain("0x2")).rejects.toEqual(
          error
        );
      });
    });

    describe("when MetaMask is not connected", () => {
      beforeEach(() => {
        testingUtils.mockAccounts([]);
        testingUtils.mockChainId("0x1");
      });

      test("when no account is connected, it should end up in the `notConnected` status", async () => {
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
        testingUtils.clearAllMocks();
        testingUtils.lowLevel.mockRequest("eth_accounts", []);

        testingUtils.lowLevel.mockRequest("eth_requestAccounts", error, {
          shouldThrow: true,
        });

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

        act(() => {
          testingUtils.lowLevel.mockRequest("eth_accounts", []);
          testingUtils.lowLevel.mockRequest("eth_accounts", [address]);
        });

        await waitForNextUpdate();

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(address);
      });

      test("calling `connect` method should end in the `notConnected` status if the request fails", async () => {
        const error = { code: -21 };
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
