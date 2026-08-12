import { beforeEach, describe, expect, it } from "vitest";
import { loadRecentOpens, logRecentOpen } from "./recent-opens";

const entry = (id: string, kind: "school" | "ticket" = "school") => ({
  kind,
  id,
  label: `Item ${id}`,
  to: `/x/${id}`,
});

describe("recent-opens store", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty for a user with no history", () => {
    expect(loadRecentOpens(1)).toEqual([]);
  });

  it("logs most-recent-first and dedupes by kind+id", () => {
    logRecentOpen(1, entry("a"), 1000);
    logRecentOpen(1, entry("b"), 2000);
    logRecentOpen(1, entry("a"), 3000);
    const list = loadRecentOpens(1);
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
    expect(list[0].last).toBe(3000);
  });

  it("keeps the same id under different kinds distinct", () => {
    logRecentOpen(1, entry("7", "school"), 1000);
    logRecentOpen(1, entry("7", "ticket"), 2000);
    expect(loadRecentOpens(1)).toHaveLength(2);
  });

  it("caps the list at 8", () => {
    for (let i = 0; i < 12; i++) logRecentOpen(1, entry(String(i)), i);
    const list = loadRecentOpens(1);
    expect(list).toHaveLength(8);
    expect(list[0].id).toBe("11");
  });

  it("scopes history per user", () => {
    logRecentOpen(1, entry("a"));
    expect(loadRecentOpens(2)).toEqual([]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("recent-opens:v1:1", "{not json");
    expect(loadRecentOpens(1)).toEqual([]);
    logRecentOpen(1, entry("a"), 500);
    expect(loadRecentOpens(1)).toHaveLength(1);
  });
});
