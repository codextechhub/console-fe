import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook} from "react-redux";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import localStorage from "redux-persist/es/storage";
import { baseApi } from "./services/base-api";
import rootReducer, { type RootState } from "./features/root-reducer";
import { bindTenantStore } from "@/utils/tenant-context";
import {
  bindConnectivityReconnect,
  startConnectivityMonitor,
} from "@/utils/connectivity";

const persistConfig = {
  key: "root",
  storage: localStorage,
  whitelist: ["auth", "financeEntity"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  // import.meta.env.NODE_ENV does not exist under Vite - only MODE/DEV/PROD.
  // Using it left DevTools enabled in production builds.
  devTools: import.meta.env.DEV,
  // Both dev tripwires are back on (RTK no-ops them in production builds). The
  // serializable check ignores redux-persist's own lifecycle actions, which
  // legitimately carry non-serializable payloads - the documented allow-list.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

// Tracks window focus/online state so queries can use skipPollingIfUnfocused /
// refetchOnFocus, and drives the api-wide refetchOnReconnect.
//
// The custom handler exists for one reason: the browser only fires `online` when
// the LINK returns. When the connection was fine all along and the API host was
// the thing that was down, there is no such event, so the connectivity monitor
// has to be able to announce recovery itself. `onOnline` is not exported from
// the package, but setupListeners hands it to a custom handler - so we replicate
// the default listeners and keep a reference for the monitor to call.
setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost, onOnline, onOffline }) => {
  const handleFocus = () => dispatch(onFocus());
  const handleFocusLost = () => dispatch(onFocusLost());
  const handleOnline = () => dispatch(onOnline());
  const handleOffline = () => dispatch(onOffline());
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") handleFocus();
    else handleFocusLost();
  };

  window.addEventListener("visibilitychange", handleVisibilityChange, false);
  window.addEventListener("focus", handleFocus, false);
  window.addEventListener("online", handleOnline, false);
  window.addEventListener("offline", handleOffline, false);

  bindConnectivityReconnect(handleOnline);

  return () => {
    window.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
});

startConnectivityMonitor();

// Let non-hook call sites (tenant-scoped RBAC URL paths) read the asserted
// tenant slug straight from the live store.
bindTenantStore(store.getState);

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export type RootStateType = ReturnType<typeof rootReducer>;
export const persistor = persistStore(store);
