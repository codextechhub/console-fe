import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import KpiCard from "./kpi-card";

describe("KpiCard", () => {
  it("gives default information cards a visible boundary", () => {
    const html = renderToStaticMarkup(<KpiCard label="Documents" value={12} />);

    expect(html).toContain("border-gray-200");
    expect(html).not.toContain("border-transparent");
  });

  it("keeps semantic borders for alert and warning cards", () => {
    const alert = renderToStaticMarkup(<KpiCard label="Urgent" value={2} tone="alert" />);
    const warning = renderToStaticMarkup(<KpiCard label="Pending" value={4} tone="warn" />);

    expect(alert).toContain("border-red-200");
    expect(alert).not.toContain("border-gray-200");
    expect(warning).toContain("border-amber-200");
    expect(warning).not.toContain("border-gray-200");
  });
});
