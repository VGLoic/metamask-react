import * as React from "react";

// Hide `useLayoutEffect` warning with SSR
// See: https://medium.com/@alexandereardon/uselayouteffect-and-ssr-192986cdcf7a
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function useSafeDispatch<T>(dispatch: React.Dispatch<T>) {
  const mountedRef = React.useRef(false);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeDispatch = React.useCallback(
    (action: T) => {
      if (mountedRef.current) {
        dispatch(action);
      }
    },
    [dispatch]
  );

  return safeDispatch;
}
