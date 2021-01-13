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
    test("when there is no `ethereum` object in the window, it should start in unavailable status", async () => {
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      expect(result.current.status).toEqual("unavailable");
    });

    test("calling `enable` should return an empty array and warn the developer", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementationOnce(() => {});
      const { result } = renderHook(useMetaMask, { wrapper: MetaMaskProvider });

      let accounts;
      await act(async () => {
        accounts = await result.current.enable();
      });

      expect(accounts).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("when MetaMask is available", () => {
    const isUnlocked = jest.fn();
    const request = jest.fn();
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

    describe("when MetaMask is not enabled", () => {
      test("when MetaMask is unlocked but no account is enabled, it should end up in the unlocked status", async () => {
        isUnlocked.mockResolvedValue(true);
        request.mockResolvedValue([]);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("unabled");
      });

      test("calling `enable` method should end in a successful connection", async () => {
        isUnlocked.mockResolvedValue(false);
        request.mockResolvedValue([address]);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("unabled");

        act(() => {
          result.current.enable();
        });

        expect(result.current.status).toEqual("connecting");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("enabled");
        expect(result.current.account).toEqual(address);
      });

      test("calling `enable` method should end in the `unabled` status if the request fails", async () => {
        const error = new Error("Test Error");

        isUnlocked.mockResolvedValue(false);
        request.mockRejectedValue(error);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("unabled");

        let thrownError;
        act(() => {
          result.current.enable().catch((err) => (thrownError = err));
        });

        expect(result.current.status).toEqual("connecting");

        await waitForNextUpdate();

        expect(thrownError).toEqual(error);

        expect(result.current.status).toEqual("unabled");
        expect(result.current.account).toEqual(null);
      });
    });

    describe("when MetaMask is already enabled", () => {
      test("synchronisation should successfully connect to the account", async () => {
        isUnlocked.mockResolvedValue(true);
        request.mockResolvedValue([address]);

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        expect(result.current.status).toEqual("initializing");

        await waitForNextUpdate();

        expect(result.current.status).toEqual("enabled");
        expect(result.current.account).toEqual(address);
      });

      test("when account changes, it should reflect on the state", async () => {
        isUnlocked.mockResolvedValue(true);
        request.mockResolvedValue([address]);

        const otherAddress = "0x19F7Fa0a30d5829acBD9B35bA2253a759a37EfC6";

        const { promise, resolve } = deferred();

        on.mockImplementation((_, callback) => promise.then(callback));

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        resolve([otherAddress]);
        await waitForNextUpdate();

        expect(result.current.status).toEqual("enabled");
        expect(result.current.account).toEqual(otherAddress);
      });

      test("when account changes with empty account, it should lead to unabled status", async () => {
        isUnlocked.mockResolvedValue(true);
        request.mockResolvedValue([address]);

        const { promise, resolve } = deferred();

        on.mockImplementation((_, callback) => promise.then(callback));

        const { result, waitForNextUpdate } = renderHook(useMetaMask, {
          wrapper: MetaMaskProvider,
        });

        await waitForNextUpdate();

        expect(result.current.account).toEqual(address);

        resolve([]);
        await waitForNextUpdate();

        expect(result.current.status).toEqual("unabled");
        expect(result.current.account).toEqual(null);
      });
    });
  });
});
