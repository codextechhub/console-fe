// "Pick up where you left off" - the last few entities the user actually
// opened, logged locally per user (same storage posture as the action
// palette's popularity model: localStorage, fail-safe, no backend).
//
// Entries expire. "I opened this" and "I still have work here" are different
// facts, and only the first one is observable from here, so the strip treats
// recency as a claim with a shelf life rather than a standing truth. Without
// that, a record opened once and finished with sits on the dashboard looking
// exactly like one you are halfway through, until eight newer records happen to
// push it out - which for an occasional user is never.
//
// How long an entry lives is bought by returning to it. Opening something once
// is a glance and lasts a day; coming back to it is the closest local signal we
// have to "this is what I am working on", and each return buys another day up to
// the LIFESPAN_DAYS cap. Nothing here is a substitute for knowing whether the
// underlying record is actually finished (a closed ticket, an approval already
// approved); that needs its live status, which the dashboard does not load.

const VERSION = "v1";
const CAP = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Longest an entry can live, however often it is reopened. */
export const LIFESPAN_DAYS = 3;

const storageKey = (userId: string | number | undefined) =>
  `recent-opens:${VERSION}:${userId ?? "anon"}`;

export type RecentKind = "school" | "ticket" | "approval" | "submission";

export interface RecentOpen {
  kind: RecentKind;
  /** Stable identity within the kind - slug for schools, id elsewhere. */
  id: string;
  label: string;
  /** Route to reopen it. */
  to: string;
  /** Last opened, epoch ms. */
  last: number;
  /**
   * How many times this record has been opened. Absent on entries written
   * before expiry existed, which are read as a single visit.
   */
  opens?: number;
}

/** One day per visit, capped: a glance lasts a day, real work lasts the week's start. */
function lifespanMs(entry: RecentOpen): number {
  const visits = Math.max(1, Math.min(LIFESPAN_DAYS, entry.opens ?? 1));
  return visits * DAY_MS;
}

export function isLive(entry: RecentOpen, now: number = Date.now()): boolean {
  return now - entry.last < lifespanMs(entry);
}

function read(userId: string | number | undefined): RecentOpen[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const list = raw ? (JSON.parse(raw) as RecentOpen[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(userId: string | number | undefined, list: RecentOpen[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, CAP)));
  } catch {
    // Private mode / quota - recents are best-effort, so silently skip.
  }
}

/**
 * Live entries, most recent first. Expired ones are filtered here rather than
 * only pruned on write, so someone who comes back after a week gets a clean
 * strip on first paint instead of stale cards until they next open something.
 */
export function loadRecentOpens(
  userId: string | number | undefined,
  now: number = Date.now(),
): RecentOpen[] {
  return read(userId).filter((e) => isLive(e, now));
}

export function logRecentOpen(
  userId: string | number | undefined,
  entry: Omit<RecentOpen, "last" | "opens">,
  now = Date.now(),
): void {
  const stored = read(userId);
  const previous = stored.find((e) => e.kind === entry.kind && e.id === entry.id);
  // A return only counts while the previous visit is still live. Reopening
  // something that had already aged out starts the count again, so a record
  // revisited once a month never accrues its way to a permanent slot.
  const opens = previous && isLive(previous, now) ? (previous.opens ?? 1) + 1 : 1;

  const list = stored.filter(
    (e) => !(e.kind === entry.kind && e.id === entry.id) && isLive(e, now),
  );
  list.unshift({ ...entry, last: now, opens });
  write(userId, list);
}

/**
 * Drop one record from the strip. Removal rather than a dismissal flag, so
 * opening it again brings it back: dismissing says "not now", which must not
 * quietly harden into "never show me this again".
 */
export function dismissRecentOpen(
  userId: string | number | undefined,
  kind: RecentKind,
  id: string,
  now: number = Date.now(),
): RecentOpen[] {
  const list = read(userId).filter(
    (e) => !(e.kind === kind && e.id === id) && isLive(e, now),
  );
  write(userId, list);
  return list;
}
