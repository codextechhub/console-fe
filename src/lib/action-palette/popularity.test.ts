import { beforeEach, describe, expect, it } from "vitest";
import { recordPick } from "./popularity";

const ADAPTIVE_KEY = "action-palette:v1:amaka:adaptive";

describe("capAdaptive eviction", () => {
  beforeEach(() => localStorage.clear());

  it("lets a brand new query into a full store", () => {
    // The bug this guards. A new bucket enters with weight 1, every other
    // bucket is at least 1, Array.prototype.sort is stable so ties hold their
    // insertion order, and a newly added object key sorts last. The newcomer
    // was therefore evicted by the very write that created it - so once the
    // store filled up it never learned another query, for good.
    for (let i = 0; i < 200; i += 1) {
      recordPick("amaka", `action-${i}`, `query ${i}`);
    }
    recordPick("amaka", "the-new-one", "brand new query");

    const store = JSON.parse(localStorage.getItem(ADAPTIVE_KEY) ?? "{}");
    expect(store["brand new query"]).toEqual({ "the-new-one": 1 });
  });

  it("still keeps the store bounded", () => {
    for (let i = 0; i < 260; i += 1) {
      recordPick("amaka", `action-${i}`, `query ${i}`);
    }
    const store = JSON.parse(localStorage.getItem(ADAPTIVE_KEY) ?? "{}");
    expect(Object.keys(store)).toHaveLength(200);
  });

  it("keeps the heaviest buckets when it evicts", () => {
    for (let i = 0; i < 200; i += 1) {
      recordPick("amaka", `action-${i}`, `query ${i}`);
    }
    // Make one bucket clearly popular, then overflow the store.
    for (let i = 0; i < 5; i += 1) {
      recordPick("amaka", "action-0", "query 0");
    }
    for (let i = 200; i < 210; i += 1) {
      recordPick("amaka", `action-${i}`, `query ${i}`);
    }

    const store = JSON.parse(localStorage.getItem(ADAPTIVE_KEY) ?? "{}");
    expect(store["query 0"]).toBeDefined();
  });
});
