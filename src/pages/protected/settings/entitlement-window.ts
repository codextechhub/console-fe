/**
 * Reading an entitlement's activation and expiry dates when the server may have
 * left them out.
 *
 * A grant a school's plan wrote (`source` PACKAGE) carries the school's
 * subscription window, so the backend omits `starts_at` / `ends_at` (and the
 * calendar's `days_until_expiry`) when the caller's Field Access hides
 * `subscription_starts_at` / `subscription_expires_at`. An absent key means
 * "not shown to you", which is different from `null`, which means "no date".
 * Everything here decides from key presence, so a hidden date never turns into
 * "Invalid Date", a false "Active now" or an expiry computed from nothing.
 */
import type { Entitlement, EntitlementCalendarEntry } from "@/redux/services/config-api";

type Window = Pick<Entitlement, "starts_at" | "ends_at">;

/** Whether the server sent each date of the window (null counts as sent). */
export function windowShown(window: Window): { starts: boolean; ends: boolean } {
  return { starts: "starts_at" in window, ends: "ends_at" in window };
}

/** A readable local date and time, or null when the value is empty or unparseable. */
export function formatWindowDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

/**
 * The short line saying when a granted capability is live.
 *
 * With either date hidden the line names the grant's source instead of
 * claiming "Active now", because the hidden date could say otherwise.
 */
export function entitlementTiming(entitlement?: Entitlement, now = Date.now()): string {
  if (!entitlement || entitlement.state !== "GRANTED") return "Not granted";
  const starts = formatWindowDate(entitlement.starts_at);
  if (starts && new Date(entitlement.starts_at as string).getTime() > now) return `Starts ${starts}`;
  const ends = formatWindowDate(entitlement.ends_at);
  if (ends) {
    return new Date(entitlement.ends_at as string).getTime() <= now ? "Expired" : `Expires ${ends}`;
  }
  const shown = windowShown(entitlement);
  if (!shown.starts || !shown.ends) return entitlement.source_label || "Included in the plan";
  return "Active now";
}

/**
 * Whether the hand-schedule editor may be offered for this grant. Saving
 * replaces both dates, so an editor that could not show one of them would
 * silently erase it.
 */
export function canEditSchedule(entitlement?: Entitlement): boolean {
  if (!entitlement) return true;
  const shown = windowShown(entitlement);
  return shown.starts && shown.ends;
}

/**
 * The date a renewal-calendar row shows: the activation for a scheduled
 * entry, the expiry otherwise. Undefined when the server withheld that date,
 * so the row omits the date instead of printing a placeholder for it.
 */
export function calendarEntryDate(entry: EntitlementCalendarEntry): string | undefined {
  const key = entry.status === "scheduled" ? "starts_at" : "ends_at";
  if (!(key in entry)) return undefined;
  return formatWindowDate(entry[key]) ?? "No date";
}
