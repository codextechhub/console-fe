import { selectTenant, selectUser } from "@/redux/features/auth/auth-slice";
import { useGetMeQuery } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routes-path";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router";
import { evaluateGate } from "@/utils/session-gate";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";
import { Button } from "@/components/ui/button";
import { LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { getAuthContextGateState } from "@/utils/auth-context-gate";

const { LOGIN } = routesPath.AUTH;

// Auto-recovery for a transient /me failure (network glitch, server blip).
// Rather than stranding the user behind a manual button, we silently re-run the
// context query on an escalating backoff. Full page reloads are deliberately
// avoided — re-running the one failed query recovers just as well and stays
// invisible when it succeeds, instead of flashing a white screen and tearing
// down the store/cache. After MAX_AUTO_RETRIES failures the failure no longer
// looks transient, so we fall back to the manual retry card (the honest exit
// for a real outage rather than silent infinite retrying).
const MAX_AUTO_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 3000;
const RETRY_MAX_DELAY_MS = 24000;

export default function Authenticated() {
  const [{ shouldRedirect, refreshExpired, idleTooLong }] = useState(evaluateGate);
  const user = useSelector(selectUser);
  const tenant = useSelector(selectTenant);
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    if (!shouldRedirect) return;
    // Only show the expiry banner + clean up when there was an actual session
    // to end. A missing cookie just means "go log in" — no banner needed.
    if (refreshExpired || idleTooLong) {
      endSession(
        idleTooLong
          ? "Your session expired due to inactivity. Please log in to continue."
          : "Your session has expired. Please log in to continue."
      );
    }
    // Remember the page they were trying to reach so login can return them
    // there. Must run AFTER endSession (which clears sessionStorage).
    captureReturnTo();
    // Hard-redirect (full reload) rather than an in-SPA navigate so all the
    // stale in-memory state from the dead session — Redux store, RTK Query
    // cache, module-level refresh/logout flags — is torn down. This keeps every
    // logout path consistent and prevents a stale token leaking into the next
    // login attempt.
    window.location.replace(LOGIN);
  }, [shouldRedirect, refreshExpired, idleTooLong]);

  // Sync permissions on mount — catches role changes that happened while the
  // token was still valid. onQueryStarted in getMe dispatches updatePermissions.
  const {
    isLoading: isLoadingContext,
    isFetching: isFetchingContext,
    isError: isContextError,
    refetch: refetchContext,
  } = useGetMeQuery(undefined, { skip: shouldRedirect });

  useEffect(() => {
    document.title = user?.first_name
      ? `${user.first_name} - Intranet`
      : "CX - Intranet";
  }, [user?.first_name]);

  const contextGateState = getAuthContextGateState({
    shouldRedirect,
    hasTenant: !!tenant,
    isLoading: isLoadingContext,
    isFetching: isFetchingContext,
    isError: isContextError,
  });

  // "logout": /me succeeded but carried no tenant — the context is gone, so the
  // session is effectively logged out. Run the standard logout sequence rather
  // than stranding the user. (A transient /me error is "retry", handled below.)
  useEffect(() => {
    if (contextGateState !== "logout") return;
    endSession("Your session has ended. Please sign in again.");
    captureReturnTo();
    window.location.replace(LOGIN);
  }, [contextGateState]);

  // Auto-retry a transient /me failure on an escalating backoff (3s, 6s, 12s,
  // 24s) until the context arrives or we exhaust MAX_AUTO_RETRIES. Each failed
  // settle re-enters "retry", bumping the attempt count and lengthening the next
  // wait; once exhausted this effect no-ops and the manual card is shown.
  useEffect(() => {
    if (contextGateState !== "retry") return;
    if (retryAttempts >= MAX_AUTO_RETRIES) return;

    const delay = Math.min(
      RETRY_BASE_DELAY_MS * 2 ** retryAttempts,
      RETRY_MAX_DELAY_MS
    );
    const timer = setTimeout(() => {
      setRetryAttempts((n) => n + 1);
      refetchContext();
    }, delay);
    return () => clearTimeout(timer);
  }, [contextGateState, retryAttempts, refetchContext]);

  // Reconnecting is a strong recovery signal: when the browser regains
  // connectivity while we're waiting, retry immediately and reset the backoff so
  // the user gets a fresh set of attempts instead of waiting out the current tick.
  useEffect(() => {
    if (contextGateState !== "retry") return;
    const onOnline = () => {
      setRetryAttempts(0);
      refetchContext();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [contextGateState, refetchContext]);

  // A successful hydration clears the counter so a later glitch starts fresh.
  useEffect(() => {
    if (contextGateState === "ready" && retryAttempts !== 0) setRetryAttempts(0);
  }, [contextGateState, retryAttempts]);

  if (contextGateState === "redirect") return null;

  // Older persisted sessions pre-date tenant context in the auth slice. Do not
  // mount protected screens until /me has hydrated it: otherwise their first
  // requests omit the mandatory `?tenant=` assertion, fail with 400, and stay
  // failed even after the tenant arrives because their query args did not
  // change. This boundary protects every tenant-scoped screen and bulk flow.
  if (contextGateState !== "ready") {
    // A "retry" while auto-recovery is still in flight (attempts remaining), or a
    // refetch triggered by it, is a reconnection — not the initial load and not a
    // dead end. Show a quiet "Reconnecting…" spinner; the alarming card is
    // reserved for when every auto-retry has failed.
    const autoRetrying =
      retryAttempts < MAX_AUTO_RETRIES &&
      (contextGateState === "retry" ||
        (contextGateState === "loading" && retryAttempts > 0));

    if (contextGateState === "loading" || autoRetrying) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="flex items-center gap-2 text-sm text-gray-01" role="status">
            <LoaderCircle className="size-4 animate-spin" />
            {autoRetrying ? "Reconnecting…" : "Preparing your workspace…"}
          </div>
        </main>
      );
    }

    // "retry" with auto-recovery exhausted — the failure no longer looks
    // transient. Offer a manual retry (which restarts the backoff) rather than
    // logging out or retrying forever.
    if (contextGateState === "retry") {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-sm rounded-md border border-gray-100 bg-white p-6 text-center shadow-sm">
            <TriangleAlert className="mx-auto mb-3 size-8 text-destructive/70" />
            <p className="font-mont text-sm font-semibold text-black-01">
              We couldn’t prepare your workspace
            </p>
            <p className="mt-1 text-xs text-gray-01">
              We kept trying but couldn’t reconnect. Retry, or reload the page.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => {
                setRetryAttempts(0);
                refetchContext();
              }}
              disabled={isFetchingContext}
            >
              <RefreshCw className={isFetchingContext ? "size-4 animate-spin" : "size-4"} />
              Retry
            </Button>
          </div>
        </main>
      );
    }

    // "logout" → the logout sequence above is redirecting to login; render nothing.
    return null;
  }

  return <Outlet />;
}
