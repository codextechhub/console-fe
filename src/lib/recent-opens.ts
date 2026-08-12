// "Pick up where you left off" - the last few entities the user actually
// opened, logged locally per user (same storage posture as the action
// palette's popularity model: localStorage, fail-safe, no backend).

const VERSION = "v1";
const CAP = 8;
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
}

export function loadRecentOpens(userId: string | number | undefined): RecentOpen[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const list = raw ? (JSON.parse(raw) as RecentOpen[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function logRecentOpen(
  userId: string | number | undefined,
  entry: Omit<RecentOpen, "last">,
  now = Date.now(),
): void {
  try {
    const list = loadRecentOpens(userId).filter(
      (e) => !(e.kind === entry.kind && e.id === entry.id),
    );
    list.unshift({ ...entry, last: now });
    localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, CAP)));
  } catch {
    // Private mode / quota - recents are best-effort, so silently skip.
  }
}
