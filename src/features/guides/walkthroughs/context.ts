import { createContext, useContext } from "react";

import { requestWalkthroughStart } from "./engine";

export type WalkthroughRuntimeValue = {
  start: (walkthroughId: string) => void;
};

export const WalkthroughRuntimeContext = createContext<WalkthroughRuntimeValue>({
  start: requestWalkthroughStart,
});

export function useWalkthrough() {
  return useContext(WalkthroughRuntimeContext);
}
