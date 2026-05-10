import { useEffect } from "react";

let _activeCount = 0;

export function useLoadingCursor(isLoading: boolean) {
  useEffect(() => {
    if (isLoading) {
      _activeCount++;
      document.body.style.cursor = "wait";
    }
    return () => {
      if (isLoading) {
        _activeCount = Math.max(0, _activeCount - 1);
        if (_activeCount === 0) {
          document.body.style.cursor = "";
        }
      }
    };
  }, [isLoading]);
}
