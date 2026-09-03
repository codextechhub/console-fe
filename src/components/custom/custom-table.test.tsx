import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CustomTable from "./custom-table";

/**
 * The loading state is a *shape* promise: while a list loads the user should
 * see the table that is about to arrive (ghost rows under the real header),
 * not a spinner. These lock the geometry - ghost row count and, critically,
 * ghost column count derived from the real column definitions, so the ghosts
 * line up under the headers instead of drifting.
 */

const HEADERS = ["S/N", "Name", "Email", "Role", "Status", "Action"];

function renderLoading(props: Record<string, unknown> = {}) {
  const html = renderToStaticMarkup(
    <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} {...props} />,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

describe("CustomTable loading skeleton", () => {
  it("renders six ghost rows", () => {
    const doc = renderLoading();
    const ghostRows = doc.querySelectorAll('tr[aria-hidden="true"]');
    expect(ghostRows).toHaveLength(6);
  });

  it("gives every ghost row one cell per column definition", () => {
    const doc = renderLoading();
    const ghostRows = Array.from(doc.querySelectorAll('tr[aria-hidden="true"]'));
    for (const row of ghostRows) {
      expect(row.querySelectorAll("td")).toHaveLength(HEADERS.length);
    }
  });

  it("tracks the column count when the definitions change", () => {
    const short = ["Name", "Status"];
    const html = renderToStaticMarkup(
      <CustomTable tableHeaderList={short} loading tableBodyList={[]} />,
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    const row = doc.querySelector('tr[aria-hidden="true"]');
    expect(row?.querySelectorAll("td")).toHaveLength(short.length);
  });

  it("keeps the header row real so the ghosts have columns to align under", () => {
    const doc = renderLoading();
    const heads = doc.querySelectorAll("th");
    expect(Array.from(heads).map((h) => h.textContent)).toEqual(HEADERS);
  });

  it("shows no spinner", () => {
    const doc = renderLoading();
    expect(doc.querySelector(".loader")).toBeNull();
  });

  it("announces loading once for the whole surface, not per ghost row", () => {
    const doc = renderLoading();
    const live = doc.querySelectorAll('[role="status"]');
    // one for the table, one for the phone card stack - each surface announces
    // itself once, and only one of the two is visible at any viewport.
    expect(live.length).toBeLessThanOrEqual(2);
    expect(live.length).toBeGreaterThan(0);
    for (const el of Array.from(live)) {
      expect(el.className).toContain("sr-only");
    }
  });

  it("keeps loadingText working as the accessible announcement", () => {
    const doc = renderLoading({ loadingText: "Fetching admins…" });
    const live = doc.querySelector('[role="status"]');
    expect(live?.textContent).toBe("Fetching admins…");
  });

  it("renders ghost cards for the phone card layout", () => {
    const doc = renderLoading();
    const cardStack = doc.querySelector("div.md\\:hidden");
    expect(cardStack).not.toBeNull();
    expect(cardStack?.querySelectorAll('div[aria-hidden="true"]').length).toBe(6);
  });

  it("renders no ghost cards when the caller opted into scroll mode", () => {
    const doc = renderLoading({ mobile: "scroll" });
    expect(doc.querySelector("div.md\\:hidden")).toBeNull();
  });

  it("uses stable, deterministic ghost widths across renders", () => {
    const first = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} />,
    );
    const second = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} />,
    );
    expect(first).toBe(second);
  });

  it("still renders the empty state when not loading", () => {
    const html = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} tableBodyList={[]} />,
    );
    expect(html).toContain("No available data.");
    expect(html).not.toContain('aria-hidden="true"');
  });
});
