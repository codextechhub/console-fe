import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import {
  resetAuth,
  setAuthContext,
  setImpersonation,
  setToken,
  updatePermissions,
  updateTenant,
} from "../features/auth/auth-slice";
import type { ActiveImpersonation, AuthTenant } from "../features/auth/auth-types";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { routesPath } from "@/routes/routes-path";
import { refreshTokenSingleFlight } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";
import { clearSelectedEntity } from "../features/finance/entity-slice";

const getAccessToken = () => {
  const token = Cookies.get("token");
  return token && token !== "undefined" ? token : "";
};

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Endpoints that must never carry a (possibly stale) Bearer token. Sending one
// to the login/activation/reset routes makes the backend treat the request as
// already-authenticated, which can surface as a 500. Mirrors AUTH_URLS below;
// prepareHeaders only has the endpoint name to work with, not the URL.
const AUTH_ENDPOINTS = new Set([
  "login",
  "forgotPassword",
  "passwordResetPreview",
  "passwordResetConfirm",
  "activationPreview",
  "activateAccount",
  "specialLoginPreview",
]);

// Endpoints that operate purely on the caller and therefore must NOT carry the
// mandatory `?tenant=` assertion (the backend 400s if one is sent to these).
// Union of the unauthenticated auth routes plus the self-service `/me` family
// and logout. Mirrors the "Exempt" list in docs/tenants/frontend-migration.md.
const TENANT_EXEMPT_ENDPOINTS = new Set([
  ...AUTH_ENDPOINTS,
  "logout",
  "getMe",
  "getMySecurityStats",
  "getMyPasswordResets",
  "changeMyPassword",
]);

// Impersonation management endpoints act as the platform admin, never as the
// impersonated target — so they never receive the impersonation session header.
const IMPERSONATION_ENDPOINTS = new Set([
  "getImpersonations",
  "getProxyTargets",
  "startImpersonation",
  "endImpersonation",
]);

// Logout must always operate on the original token owner. Self-service `/me`
// endpoints are intentionally absent: while proxying they should behave
// exactly as they do for the effective target user.
const IMPERSONATION_HEADER_EXEMPT_ENDPOINTS = new Set([
  ...AUTH_ENDPOINTS,
  "logout",
]);

// ── Identity-swap gate ────────────────────────────────────────────────────
// While a proxy start/exit is hydrating the new identity, screens mounted for
// the OLD identity can refire their queries faster than React unmounts them
// (router.navigate resolves before the commit). Those requests would be
// discarded by the post-swap cache reset anyway — short-circuit them here so
// they never reach the network: no misleading permission toasts, and no false
// PROXY_ACTION_FAILED rows in the backend audit trail. The caller resets the
// api state AFTER the gate lifts so nothing is left in a dropped-error state.
let identitySwapInProgress = false;
export const runWithIdentitySwap = async <T>(work: () => Promise<T>): Promise<T> => {
  identitySwapInProgress = true;
  try {
    return await work();
  } finally {
    identitySwapInProgress = false;
  }
};

const readAuth = (getState: () => unknown): {
  tenantSlug: string;
  impersonation: ActiveImpersonation | null;
} => {
  const auth = (getState() as { auth?: {
    tenant?: { slug?: string } | null;
    impersonation?: ActiveImpersonation | null;
  } })?.auth;
  return {
    tenantSlug: auth?.tenant?.slug ?? "",
    impersonation: auth?.impersonation ?? null,
  };
};

export const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { endpoint, getState }) => {
    const accessToken = getAccessToken();
    if (accessToken && !AUTH_ENDPOINTS.has(endpoint)) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    // While an impersonation session is active, every data call (but not the
    // impersonation management endpoints themselves, nor self-service routes)
    // rides with the session header so the backend runs it as the target user.
    const { impersonation } = readAuth(getState);
    if (
      impersonation &&
      !IMPERSONATION_HEADER_EXEMPT_ENDPOINTS.has(endpoint) &&
      !IMPERSONATION_ENDPOINTS.has(endpoint)
    ) {
      headers.set("X-Impersonation-Session", String(impersonation.id));
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

// True when the request already carries an explicit `tenant` assertion (e.g.
// impersonation start targeting another tenant, or the config API targeting a
// school) — those must never be re-stamped with the caller's own tenant.
const hasTenantParam = (args: string | FetchArgs): boolean => {
  if (typeof args === "string") return /[?&]tenant=/.test(args);
  if (typeof args.url === "string" && /[?&]tenant=/.test(args.url)) return true;
  const params = (args as FetchArgs).params as Record<string, unknown> | undefined;
  return !!params && params.tenant != null && params.tenant !== "";
};

// Append `?tenant=<slug>` to a request unless it is exempt or already asserts a
// tenant. Handles both string and object (FetchArgs) forms.
const injectTenant = (args: string | FetchArgs, slug: string): string | FetchArgs => {
  if (typeof args === "string") {
    const sep = args.includes("?") ? "&" : "?";
    return `${args}${sep}tenant=${encodeURIComponent(slug)}`;
  }
  return { ...args, params: { ...(args.params as object), tenant: slug } };
};

let sessionRecoveryInProgress = false;

const forceLogoutAndRedirect = (api: Parameters<BaseQueryFn>[1]) => {
  if (sessionRecoveryInProgress) return;
  sessionRecoveryInProgress = true;
  api.dispatch(resetAuth());
  endSession();
  // Preserve the page they were on so login can return them there. Must run
  // AFTER endSession (which clears sessionStorage).
  captureReturnTo();
  window.location.href = routesPath.AUTH.LOGIN;
};

// `/user/auth/me/` is tenant-exempt, so this raw fetch needs no `?tenant=`.
// It refreshes both the permission set and the cached tenant context.
const fetchFreshMe = async (
  accessToken: string,
  impersonation: ActiveImpersonation | null,
): Promise<{ permissions: string[] | null; tenant: AuthTenant | null }> => {
  try {
    const response = await fetch(`${baseUrl}/user/auth/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        ...(impersonation
          ? { "X-Impersonation-Session": String(impersonation.id) }
          : {}),
      },
    });
    if (!response.ok) return { permissions: null, tenant: null };
    const data = await response.json();
    return {
      permissions: data?.data?.permissions ?? null,
      tenant: data?.data?.tenant ?? null,
    };
  } catch {
    return { permissions: null, tenant: null };
  }
};

const extractFirstDetailError = (detail: unknown): string | null => {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return typeof detail[0] === "string" ? detail[0] : null;
  if (typeof detail === "object") {
    for (const key of Object.keys(detail as Record<string, unknown>)) {
      const found = extractFirstDetailError((detail as Record<string, unknown>)[key]);
      if (found) return found;
    }
  }
  return null;
};

const AUTH_URLS = [
  "login",
  "reset-password",
  "password/reset",
  "forgot-password",
  "activate",
  "special_login",
];

const isAuthRoute = (args: string | FetchArgs): boolean => {
  const url =
    typeof args === "string"
      ? args
      : typeof args === "object" && "url" in args && typeof args.url === "string"
        ? args.url
        : "";
  return AUTH_URLS.some((u) => url.includes(u));
};

// Wraps the raw fetch base query so the mandatory `?tenant=` assertion is
// appended centrally to every authenticated request. Exempt endpoints (auth,
// `/me` family, logout) and requests that already assert a tenant are left
// untouched. When an impersonation session is active, the TARGET tenant slug is
// asserted instead of the caller's own.
const baseQueryWithTenant: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const endpoint = api.endpoint;
  if (
    identitySwapInProgress &&
    endpoint !== "getMe" &&
    !IMPERSONATION_ENDPOINTS.has(endpoint) &&
    !IMPERSONATION_HEADER_EXEMPT_ENDPOINTS.has(endpoint)
  ) {
    // Matches the abort-suppression in the interceptor: silent, no toast.
    return {
      error: {
        status: "FETCH_ERROR",
        error: "AbortError: identity swap in progress",
      } as FetchBaseQueryError,
    };
  }
  let finalArgs = args;
  if (!TENANT_EXEMPT_ENDPOINTS.has(endpoint) && !hasTenantParam(args)) {
    const { tenantSlug, impersonation } = readAuth(api.getState);
    const slug = impersonation?.tenantSlug || tenantSlug;
    if (slug) finalArgs = injectTenant(args, slug);
  }
  return baseQuery(finalArgs, api, extraOptions);
};

export const baseQueryInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryWithTenant(args, api, extraOptions);
  if (!result?.error) return result;

  // Background requests (e.g. the notifications bell poll, which resumes the
  // instant the tab regains focus) pass `{ silent: true }` so a transient 5xx
  // never interrupts the user with a global error toast — they just retry on the
  // next cycle. The refresh/retry and force-logout machinery still runs.
  const silent = !!(extraOptions as { silent?: boolean } | undefined)?.silent;
  const notify = (message: string) => {
    if (!silent) toast.error(message);
  };

  // FetchBaseQueryError uses a string status for transport-level failures
  // and a number for HTTP responses, so narrow access via `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = result.error;

  // Cache resets intentionally abort in-flight requests during identity
  // changes. They are not connectivity failures and must not produce a burst
  // of misleading "Could not reach the server" toasts.
  if (
    res?.status === "FETCH_ERROR" &&
    /abort|aborted/i.test(String(res?.error ?? ""))
  ) {
    return result;
  }

  if (res?.status === 409) {
    // Domain conflicts carry useful structured context in `error.detail`
    // (period ids/statuses, lifecycle state, available balances), but the
    // top-level message is the backend's complete user-facing explanation.
    // Prefer it so a missing period does not degrade to a toast like "<none>".
    if (!isAuthRoute(args)) {
      const message =
        res?.data?.message ||
        extractFirstDetailError(res?.data?.error?.detail) ||
        extractFirstDetailError(res?.data?.error);
      if (message) notify(message);
    }
    return result;
  }

  if (res?.status === 400 || res?.status === 422) {
    // Auth routes (login, reset, activate, special-login…) own their own
    // inline/panel error UX and route the message through humanizeAuthError, so
    // never fire a global toast here — doing so leaks the raw backend detail (and
    // even machine codes like INVITATION_NOT_FOUND) into the UI beside the
    // friendly panel.
    if (!isAuthRoute(args)) {
      const message =
        extractFirstDetailError(res?.data?.error?.detail) ||
        extractFirstDetailError(res?.data?.error) ||
        res?.data?.message;
      if (message) notify(message);
    }
    return result;
  }

  if (res?.status === 401) {
    // A 401 on an auth route (login, reset, activate…) means bad credentials or
    // an expired link — not a recoverable session. Never run the refresh/retry
    // machinery here — doing otherwise would attempt a token refresh and retry
    // the login itself. No toast either: the page owns the error UI (it routes
    // the caught error through humanizeAuthError), so a global toast here would
    // duplicate the inline message.
    if (isAuthRoute(args)) {
      return result;
    }

    const refreshed = await refreshTokenSingleFlight();

    if (refreshed.ok) {
      // The singleton already updated cookies. Mirror access into Redux so any
      // selector reading state.auth.access stays consistent.
      api.dispatch(setToken(refreshed.access));

      // Role may have changed since last login — keep permissions and the
      // cached tenant context fresh.
      const activeImpersonation = readAuth(api.getState).impersonation;
      const fresh = await fetchFreshMe(refreshed.access, activeImpersonation);
      if (fresh.permissions) api.dispatch(updatePermissions(fresh.permissions));
      if (fresh.tenant) api.dispatch(updateTenant(fresh.tenant));

      const retry = await baseQueryWithTenant(args, api, extraOptions);
      if (retry?.error?.status === 401) {
        if (activeImpersonation) {
          // The actor's refreshed token is valid, so a second 401 while
          // proxying means the proxy session/target became invalid. Restore
          // the original actor instead of incorrectly logging them out.
          await runWithIdentitySwap(async () => {
            api.dispatch(setImpersonation(null));
            api.dispatch(setAuthContext(activeImpersonation.actor));
            api.dispatch(clearSelectedEntity());
            // Imported lazily: the route table imports pages that import this
            // module, so a static import would be circular.
            const { router } = await import("@/routes");
            await router.navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
          });
          api.dispatch(baseApi.util.resetApiState());
          toast.info("Proxy session ended");
        } else {
          forceLogoutAndRedirect(api);
        }
      }
      return retry;
    }

    if (refreshed.reason === "token_invalid") {
      forceLogoutAndRedirect(api);
      return result;
    }

    // network_error, server_error, no_token — transient. Keep the user signed
    // in; the failing query surfaces its own error. Do not show the misleading
    // "session could not be restored" toast.
    return result;
  }

  if (res?.status === 403) {
    if (!isAuthRoute(args)) {
      const msg =
        extractFirstDetailError(res?.data?.error?.detail) ||
        res?.data?.message ||
        "You don't have permission to perform this action.";
      notify(msg);
    }
    return result;
  }

  if (res?.status === 404) {
    if (!isAuthRoute(args)) notify(res?.data?.message || "Resource not found.");
    return result;
  }

  if (res?.status === 405) {
    notify(res?.data?.detail || "Something went wrong. Please try again.");
    return result;
  }

  if (res?.status === 413) {
    notify("Content Too Large");
    return result;
  }

  if (typeof res?.status === "number" && res.status >= 500) {
    // Auth pages surface their own error state (friendly panel / inline copy).
    if (!isAuthRoute(args)) notify("A server error occurred. Please try again later.");
    return result;
  }

  // Transport-level failures (offline, DNS, timeout). Auth pages render their
  // own friendly panel/inline copy from the query's isError, so stay quiet there.
  if (!isAuthRoute(args)) {
    if (res?.status === "TIMEOUT_ERROR") notify("The request timed out. Please try again.");
    else if (res?.status === "FETCH_ERROR") notify("Could not reach the server. Please try again.");
    else if (res?.status === "PARSING_ERROR") notify("Unexpected response from the server. Please try again.");
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryInterceptor,
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: [
    "Users",
    "Role",
    "Schools",
    "Branches",
    "PlatformRoles",
    "PermissionGroups",
    "Permissions",
    "PermissionModules",
    "PermissionResources",
    "PermissionActions",
    "PermissionDependencies",
    "UserAssignments",
    "ChangeRequests",
    "AuditEvents",
    "AuditExports",
    "AuditDashboard",
    "EntityTrails",
    "ComplianceRules",
    "MyActivity",
    "LoginSessions",
    "AuthAttempts",
    "AccountLockouts",
    "ImpersonationSessions",
    "PasswordResets",
    "ImportTemplates",
    "ImportBatches",
    "ImportValidationIssues",
    "ImportJobs",
    "WorkflowTemplates",
    "WorkflowInstances",
    "WorkflowDelegations",
    "WorkflowPending",
    "WorkflowSubmissions",
    "WorkflowTeamLoad",
    "OrgNodes",
    "OrgPositions",
    "OrgPositionTree",
    "OrgAssignments",
    "OrgMatrixReports",
    "StaffProfiles",
    "StaffPhotos",
    "TodoDashboard",
    "TodoTasks",
    "TodoAssignable",
    "QueueJobs",
    "QueueSummary",
    "Notifications",
    "NotificationHistory",
    "NotificationSettings",
    "NotificationTemplates",
    "Config",
    "Tickets",
    "TicketAssignees",
    "Health",
    // ── Finance & Procurement consoles ──────────────────────────────────────
    "FinanceEntities",
    "FinanceAccounts",
    "FinancePeriods",
    "FinanceJournals",
    "FinanceInvoices",
    "FinanceCreditNotes",
    "FinanceRefunds",
    "FinanceWriteOffs",
    "FinanceConcessions",
    "FinancePaymentPlans",
    "FinanceDunning",
    "FinanceCustomers",
    "FinanceFeeStructures",
    "FinanceReports",
    "FinanceBankAccounts",
    "FinanceStatementLines",
    "FinanceExpenseClaims",
    "FinancePettyCash",
    "FinancePayroll",
    "FinanceBudgets",
    "FinanceFixedAssets",
    "FinanceTax",
    "FinanceAuditLog",
    "FinanceSetup",
    "FinancePayments",
    "PaymentsCollections",
    "PaymentsVirtualAccounts",
    "PaymentsPayouts",
    "PaymentsPayoutBatches",
    "PaymentsTransactions",
    "ProcVendors",
    "ProcCategories",
    "ProcCatalog",
    "ProcContracts",
    "ProcRequisitions",
    "ProcRfqs",
    "ProcQuotations",
    "ProcPurchaseOrders",
    "ProcGoodsReceipts",
    "ProcVendorInvoices",
    "ProcVendorPayments",
    "ProcVendorAssessments",
    "ProcStock",
  ],
});
