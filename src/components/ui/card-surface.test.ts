import { describe, it, expect } from "vitest";
import { INFORMATION_CARD_SURFACE } from "./card-surface";

// Read every source file through Vite so the guard needs no node types.
const SOURCES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Tints that exist as FILLS. Drawn as a line on a white card they measure
 * 1.02-1.07 against the page, where the house hairline measures 1.14 - so the
 * outline is simply not there. That is how the Bank Accounts KPIs and the
 * Chart of Accounts table shipped looking outline-less while their markup
 * said `border` and `ring`.
 */
const FILL_TINTS = ["gray-03", "gray-04", "gray-50", "gray-100", "slate-50", "slate-100", "white-05"];
const LINE = new RegExp(`(border(-[trblxyse])?|ring|divide(-[xy])?)-(${FILL_TINTS.join("|")})\\b`);

describe("the console's one card surface", () => {
  it("draws with the house hairline, not a fill colour", () => {
    expect(INFORMATION_CARD_SURFACE).toBe("border border-white-02 bg-white");
  });

  it("never draws a line in a fill colour", () => {
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      if (/\.test\.tsx?$/.test(file)) continue;
      for (const [index, line] of text.split("\n").entries()) {
        const hit = line.match(LINE);
        if (!hit) continue;
        // A chip whose line matches its own fill is deliberately invisible.
        if (line.includes(`bg-${hit[4]}`)) continue;
        offenders.push(`${file}:${index + 1}  ${hit[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
