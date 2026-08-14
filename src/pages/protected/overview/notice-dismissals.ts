// Dismissals for the action centre's blue NOTICES only (exports ready, unread
// notifications). Red and amber rows report something broken or overdue and
// stay put; a notice is information, so the reader is allowed to put it down.
//
// A dismissal is deliberately narrow: it hides one row, at one figure, for the
// rest of the local day. The moment the number moves - two more exports finish,
// three more notifications arrive - the row is new information and comes back.
// That keeps "dismiss" from quietly becoming "never tell me again".
//
// Local per user, fail-safe, no backend: same storage posture as recent-opens.

const VERSION = "v1";
const storageKey = (userId: string | number | undefined) =>
  `overview-notices:${VERSION}:${userId ?? "anon"}`;

/** Row key -> the figure that was dismissed, and the day it was dismissed on. */
export type NoticeDismissals = Record<string, { stat: string; day: string }>;

/** Local calendar day, so a dismissal lasts until tomorrow, not 24 hours. */
export function dayStamp(now: number = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function loadDismissals(userId: string | number | undefined): NoticeDismissals {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    // Anything that isn't the shape we wrote is treated as nothing dismissed:
    // showing a notice again is always the safe failure.
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as NoticeDismissals)
      : {};
  } catch {
    return {};
  }
}

export function isDismissed(
  dismissals: NoticeDismissals,
  key: string,
  stat: string,
  now: number = Date.now(),
): boolean {
  const entry = dismissals[key];
  return Boolean(entry && entry.stat === stat && entry.day === dayStamp(now));
}

/** Record a dismissal and persist it; returns the new map for state. */
export function dismissNotice(
  userId: string | number | undefined,
  dismissals: NoticeDismissals,
  key: string,
  stat: string,
  now: number = Date.now(),
): NoticeDismissals {
  const next: NoticeDismissals = { ...dismissals, [key]: { stat, day: dayStamp(now) } };
  // Yesterday's entries can never hide anything again, so drop them on write
  // rather than letting the record grow a row per notice per day.
  const today = dayStamp(now);
  for (const [k, entry] of Object.entries(next)) {
    if (entry?.day !== today) delete next[k];
  }
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Private mode / quota: the dismissal still applies for this page view.
  }
  return next;
}
