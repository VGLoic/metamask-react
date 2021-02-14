import { act, renderHook } from "@testing-library/react-hooks";

import { useMetaMask, MetaMaskProvider } from "../";

function deferred() {
  let resolve = (_: any) => {};
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("MetaMask provider", () => {
  const address = "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC5";

  describe("when MetaMask is not available", () => {
    test("when there is no `ethereum` object in the window, it should start in `unavailable` status", async () => {
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
    const isUnlocked = jest.fn();
    const fetchAccounts = jest.fn();
    const fetchChainId = jest.fn();
    const requestAccounts = jest.fn();
    const request = jest.fn(({ method }: { method: string }) => {
      if (method === "eth_chainId") return fetchChainId();
      if (method === "eth_accounts") return fetchAccounts();
      if (method === "eth_requestAccounts") return requestAccounts();
      return;
    });
    const on = jest.fn();
    const removeListener = jest.fn();
    const ethereum = {
      isMetaMask: true,
      _metamask: {
        isUnlocked,
      },
      request,
      on,
      removeListener,
    };

    beforeAll(() => {
      (window as any).ethereum = ethereum;
    });

    test("when chain changes, it should reflect on the state", async () => {
      isUnlocked.mockResolvedValue(true);
      fetchChainId.mockResolvedValue("0x1");
      fetchAccounts.mockResolvedValue([]);

      const otherChainId = "0x2";

      const { promise, resolve } = deferred();

      on.mockImplementation((key, callback) => {
        if (key === "chainChanged") {
          promise.then(callback);
        }
      });

      const { result, waitForNextUpdate } = renderHook(useMetaMask, {
        wrapper: MetaMaskProvider,
      });

      await waitForNextUpdate();

      expect(result.current.chainId).toEqual("0x1");

      resolve(otherChainId);
      await waitForNextUpdate();

      expect(result.current.chainId).toEqual(otherChainId);
    });

    describe("when MetaMask is not connected", () => {
      beforeEach(() => {
        isUnlocked.mockResolvedValue(true);
        fetchChainId.mockResolvedValue("0x1");
        fetchAccounts.mockResolvedValue([]);
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
        requestAccounts.mockResolvedValue([address]);

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

      test("calling `connect` method should end in the `notConnected` status if the request fails", async () => {
        const error = new Error("Test Error");
        requestAccounts.mockRejectedValue(error);

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
        isUnlocked.mockResolvedValue(true);
        fetchChainId.mockResolvedValue("0x1");
        fetchAccounts.mockResolvedValue([address]);
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
        isUnlocked.mockResolvedValue(true);
        fetchChainId.mockResolvedValue("0x1");
        fetchAccounts.mockResolvedValue([address]);

        const otherAddress = "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC6";

        const { promise, resolve } = deferred();

        on.mockImplementation((key, callback) => {
          if (key === "accountsChanged") {
            promise.then(callback);
          }
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        resolve([otherAddress]);
        await waitForNextUpdate();

        expect(result.current.status).toEqual("connected");
        expect(result.current.account).toEqual(otherAddress);
      });

      test("when account changes with empty account, it should lead to `notConnected` status", async () => {
        isUnlocked.mockResolvedValue(true);
        fetchChainId.mockResolvedValue("0x1");
        fetchAccounts.mockResolvedValue([address]);

        const { promise, resolve } = deferred();

        on.mockImplementation((key, callback) => {
          if (key === "accountsChanged") {
            promise.then(callback);
          }
        });

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        resolve([]);
        await waitForNextUpdate();

        expect(result.current.status).toEqual("notConnected");
        expect(result.current.account).toEqual(null);
      });
    });
  });
});
