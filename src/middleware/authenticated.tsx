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

export default function Authenticated() {
  const [{ shouldRedirect, refreshExpired, idleTooLong }] = useState(evaluateGate);
  const user = useSelector(selectUser);
  const tenant = useSelector(selectTenant);

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
  });

  if (contextGateState === "redirect") return null;

  // Older persisted sessions pre-date tenant context in the auth slice. Do not
  // mount protected screens until /me has hydrated it: otherwise their first
  // requests omit the mandatory `?tenant=` assertion, fail with 400, and stay
  // failed even after the tenant arrives because their query args did not
  // change. This boundary protects every tenant-scoped screen and bulk flow.
  if (contextGateState !== "ready") {
    if (contextGateState === "loading") {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="flex items-center gap-2 text-sm text-gray-01" role="status">
            <LoaderCircle className="size-4 animate-spin" />
            Preparing your workspace…
          </div>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-md border border-gray-100 bg-white p-6 text-center shadow-sm">
          <TriangleAlert className="mx-auto mb-3 size-8 text-destructive/70" />
          <p className="font-mont text-sm font-semibold text-black-01">
            We couldn’t prepare your workspace
          </p>
          <p className="mt-1 text-xs text-gray-01">
            Refresh your account context, then try loading the page again.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => refetchContext()}
            disabled={isFetchingContext}
          >
            <RefreshCw className={isFetchingContext ? "size-4 animate-spin" : "size-4"} />
            {isContextError ? "Retry" : "Refresh context"}
          </Button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
