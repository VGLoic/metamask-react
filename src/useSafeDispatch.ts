import React from "react";

export function useSafeDispatch<T>(dispatch: React.Dispatch<T>) {
    const mountedRef = React.useRef(false);

    React.useLayoutEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false
        }
    }, []);

    const safeDispatch = React.useCallback((action: T) => {
        if (mountedRef.current) {
            dispatch(action);
        }
    }, [dispatch]);

    return safeDispatch;
}