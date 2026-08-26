// What the delivery-history table asks the backend for.
//
// Kept out of the panel because it carries a rule the screen cannot show: the
// history endpoint refuses an unfiltered dump. With none of scope,
// recipient_email, event_type_key, channel, status, created_after,
// created_before or search supplied it answers 422 rather than a page of rows,
// so this object must never come back as just `{ page }`. The last-7-days
// window is what guarantees that.
//
// `scope` does satisfy the backend's "at least one filter" rule, so choosing a
// scope would technically license dropping the window. We keep the window
// anyway: scope says which of the caller's own rows to show, not how far back
// to look, and silently widening the table from a week to the whole of history
// because somebody picked "Platform" is a bigger surprise than a date range
// that stays put. The window still lifts on an explicit row filter (recipient
// email or status), exactly as it did before scope existed.

/**
 * The only scope value the backend acts on (`_PLATFORM_SCOPE` in
 * vs_notifications/views.py, applied as `tenant__kind="PLATFORM"`). Any other
 * non-empty string would count as "a filter was supplied" while narrowing
 * nothing, which is the one thing the endpoint is trying to prevent.
 */
export const PLATFORM_SCOPE = "platform";

/**
 * "" is every row this log holds, which is every row the caller's OWN tenant
 * owns - never another tenant's. A notification belongs to the tenant of the
 * recipient reading it, so a school's support ticket notified to CodeX staff
 * is CodeX's row and the school never sees it. There is no third scope to
 * offer, and no scope value reaches across the boundary.
 */
export type HistoryScope = "" | typeof PLATFORM_SCOPE;

/** How far back the table looks when the user has set no explicit filter. */
export const HISTORY_WINDOW_DAYS = 7;

/** Start of that window, as the ISO timestamp `created_after` expects. */
export const historyWindowStart = (now: number = Date.now()): string =>
  new Date(now - HISTORY_WINDOW_DAYS * 864e5).toISOString();

export interface HistoryFilters {
  page: number;
  /** Already debounced by the panel. */
  email: string;
  status: string;
  scope: HistoryScope;
  /** Start of the implicit window, from `historyWindowStart`. */
  createdAfter: string;
}

/** The query string for one state of the filter row. Filters combine. */
export function historyParams({
  page,
  email,
  status,
  scope,
  createdAfter,
}: HistoryFilters): Record<string, string> {
  const params: Record<string, string> = { page: String(page) };
  if (email) params.recipient_email = email;
  if (status) params.status = status;
  if (scope) params.scope = scope;
  // The window is what stops an untouched form asking for the whole log.
  if (!email && !status) params.created_after = createdAfter;
  return params;
}
