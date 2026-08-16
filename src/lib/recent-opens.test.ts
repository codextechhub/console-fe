import { beforeEach, describe, expect, it } from "vitest";
import {
  dismissRecentOpen,
  LIFESPAN_DAYS,
  loadRecentOpens,
  logRecentOpen,
} from "./recent-opens";

const entry = (id: string, kind: "school" | "ticket" = "school") => ({
  kind,
  id,
  label: `Item ${id}`,
  to: `/x/${id}`,
});

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_000_000_000_000;

describe("recent-opens store", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty for a user with no history", () => {
    expect(loadRecentOpens(1)).toEqual([]);
  });

  it("logs most-recent-first and dedupes by kind+id", () => {
    logRecentOpen(1, entry("a"), T0);
    logRecentOpen(1, entry("b"), T0 + 1000);
    logRecentOpen(1, entry("a"), T0 + 2000);
    const list = loadRecentOpens(1, T0 + 2000);
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
    expect(list[0].last).toBe(T0 + 2000);
  });

  it("keeps the same id under different kinds distinct", () => {
    logRecentOpen(1, entry("7", "school"), T0);
    logRecentOpen(1, entry("7", "ticket"), T0 + 1000);
    expect(loadRecentOpens(1, T0 + 1000)).toHaveLength(2);
  });

  it("caps the list at 8", () => {
    for (let i = 0; i < 12; i++) logRecentOpen(1, entry(String(i)), T0 + i);
    const list = loadRecentOpens(1, T0 + 12);
    expect(list).toHaveLength(8);
    expect(list[0].id).toBe("11");
  });

  it("scopes history per user", () => {
    logRecentOpen(1, entry("a"), T0);
    expect(loadRecentOpens(2, T0)).toEqual([]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("recent-opens:v1:1", "{not json");
    expect(loadRecentOpens(1, T0)).toEqual([]);
    logRecentOpen(1, entry("a"), T0);
    expect(loadRecentOpens(1, T0)).toHaveLength(1);
  });

  describe("expiry", () => {
    it("drops a single visit after a day", () => {
      logRecentOpen(1, entry("a"), T0);
      expect(loadRecentOpens(1, T0 + DAY - 1)).toHaveLength(1);
      expect(loadRecentOpens(1, T0 + DAY)).toEqual([]);
    });

    it("buys another day per return visit", () => {
      logRecentOpen(1, entry("a"), T0);
      logRecentOpen(1, entry("a"), T0 + 60_000);
      // Two visits, so two days from the last open.
      expect(loadRecentOpens(1, T0 + 60_000 + 2 * DAY - 1)).toHaveLength(1);
      expect(loadRecentOpens(1, T0 + 60_000 + 2 * DAY)).toEqual([]);
    });

    it("never lives longer than the cap however often it is opened", () => {
      for (let i = 0; i < 10; i++) logRecentOpen(1, entry("a"), T0 + i * 1000);
      const last = T0 + 9000;
      expect(loadRecentOpens(1, last + LIFESPAN_DAYS * DAY - 1)).toHaveLength(1);
      expect(loadRecentOpens(1, last + LIFESPAN_DAYS * DAY)).toEqual([]);
    });

    it("restarts the count when the previous visit had already aged out", () => {
      logRecentOpen(1, entry("a"), T0);
      logRecentOpen(1, entry("a"), T0 + 60_000); // two visits, worth two days
      // Come back a week later: that is a fresh glance, not a third visit.
      const later = T0 + 7 * DAY;
      logRecentOpen(1, entry("a"), later);
      expect(loadRecentOpens(1, later + DAY - 1)).toHaveLength(1);
      expect(loadRecentOpens(1, later + DAY)).toEqual([]);
    });

    it("treats entries written before expiry existed as a single visit", () => {
      localStorage.setItem(
        "recent-opens:v1:1",
        JSON.stringify([{ ...entry("old"), last: T0 }]),
      );
      expect(loadRecentOpens(1, T0 + DAY - 1)).toHaveLength(1);
      expect(loadRecentOpens(1, T0 + DAY)).toEqual([]);
    });

    it("prunes expired entries on write instead of letting them hold slots", () => {
      logRecentOpen(1, entry("stale"), T0);
      logRecentOpen(1, entry("fresh"), T0 + 2 * DAY);
      const raw = JSON.parse(localStorage.getItem("recent-opens:v1:1") ?? "[]");
      expect(raw.map((e: { id: string }) => e.id)).toEqual(["fresh"]);
    });
  });

  describe("dismiss", () => {
    it("removes just that record and returns the rest", () => {
      logRecentOpen(1, entry("a"), T0);
      logRecentOpen(1, entry("b"), T0 + 1000);
      const left = dismissRecentOpen(1, "school", "a", T0 + 1000);
      expect(left.map((e) => e.id)).toEqual(["b"]);
      expect(loadRecentOpens(1, T0 + 1000).map((e) => e.id)).toEqual(["b"]);
    });

    it("only dismisses the matching kind", () => {
      logRecentOpen(1, entry("7", "school"), T0);
      logRecentOpen(1, entry("7", "ticket"), T0 + 1000);
      const left = dismissRecentOpen(1, "ticket", "7", T0 + 1000);
      expect(left.map((e) => e.kind)).toEqual(["school"]);
    });

    it("lets the record come back if it is opened again", () => {
      logRecentOpen(1, entry("a"), T0);
      dismissRecentOpen(1, "school", "a", T0);
      logRecentOpen(1, entry("a"), T0 + 5000);
      expect(loadRecentOpens(1, T0 + 5000).map((e) => e.id)).toEqual(["a"]);
    });

    it("does not resurrect a dismissed record's accrued lifespan", () => {
      logRecentOpen(1, entry("a"), T0);
      logRecentOpen(1, entry("a"), T0 + 1000); // two visits
      dismissRecentOpen(1, "school", "a", T0 + 1000);
      logRecentOpen(1, entry("a"), T0 + 2000);
      // Back to a single visit, so a day and no more.
      expect(loadRecentOpens(1, T0 + 2000 + DAY)).toEqual([]);
    });
  });
});
