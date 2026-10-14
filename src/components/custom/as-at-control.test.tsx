import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AsAtControl } from "./as-at-control";

describe("AsAtControl", () => {
  it("keeps the date control inline without a history-start caption", () => {
    const html = renderToStaticMarkup(
      <AsAtControl
        historyStarts="2026-09-26"
        value={undefined}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain("As at");
    expect(html).toContain("items-center");
    expect(html).not.toContain("History from");
    expect(html).not.toContain("26 September 2026");
  });
});
