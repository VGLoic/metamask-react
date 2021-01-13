import { renderHook } from "@testing-library/react-hooks";
import { useMetaMask } from "../use-metamask";

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
});
