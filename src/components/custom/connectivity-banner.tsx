import { useState, useSyncExternalStore } from "react";
import { Loader2, ServerOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getConnectivityServerSnapshot,
  getConnectivityStatus,
  retryConnectivityNow,
  subscribeToConnectivity,
} from "@/utils/connectivity";

/**
 * Losing the connection is a STATE, not an event, so it gets a bar that stays
 * put rather than a toast that slides away while the problem is still there.
 * Bottom-centre keeps it clear of the header, the top progress bar and the
 * top-centre toasters. Mounted once at the app root, so it also covers the auth
 * and public vendor screens.
 */
export function ConnectivityBanner() {
  const status = useSyncExternalStore(
    subscribeToConnectivity,
    getConnectivityStatus,
    getConnectivityServerSnapshot,
  );
  const [retrying, setRetrying] = useState(false);

  // Never unmounts - it just renders nothing while all is well - so the retry
  // state below is safe to settle after the await.
  if (status === "online") return null;

  const offline = status === "offline";

  const retry = async () => {
    setRetrying(true);
    try {
      await retryConnectivityNow();
    } finally {
      setRetrying(false);
    }
  };

  // --workspace-center is published by the dashboard shell so the bar lines up
  // with the toasts and the content rather than the raw viewport (which would
  // slide it under the sidebar). The 50% fallback is what the auth and public
  // screens want anyway, since they have no sidebar.
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="connectivity-banner"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:inset-x-auto sm:left-[var(--workspace-center,50%)] sm:w-[400px] sm:max-w-none sm:-translate-x-1/2"
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${
          offline ? "bg-error-01/10 text-error-01" : "bg-yellow-01/10 text-yellow-01"
        }`}
      >
        {offline ? <WifiOff className="size-4.5" /> : <ServerOff className="size-4.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-black-01">
          {offline ? "You're offline" : "Can't reach the server"}
        </p>
        <p className="text-xs text-gray-01">
          {offline
            ? "We'll reconnect and refresh this page automatically."
            : "Your connection is fine. We'll keep trying."}
        </p>
      </div>

      <Button
        variant="white"
        size="sm"
        onClick={retry}
        disabled={retrying}
        className="shrink-0 border border-gray-200"
      >
        {retrying ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {retrying ? "Checking" : "Try again"}
      </Button>
    </div>
  );
}
