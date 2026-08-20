import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildAttachmentUrl, downloadAuthorisedFile, mediaOrigin } from "./attachment-download";
import { bindTenantStore } from "./tenant-context";

// The bug these guard against is silent: append /media/x to an API base that ends in
// /v1 and every attachment 404s, with nothing in the UI to say why.
describe("attachment url resolution", () => {
  it("drops the API version prefix so root-mounted media resolves", () => {
    expect(mediaOrigin("https://api.codexng.com/v1")).toBe("https://api.codexng.com");
    expect(mediaOrigin("https://api.codexng.com/v1/")).toBe("https://api.codexng.com");
    expect(mediaOrigin("http://localhost:8000/v1")).toBe("http://localhost:8000");
  });

  it("leaves a base with no version prefix alone", () => {
    expect(mediaOrigin("https://api.codexng.com")).toBe("https://api.codexng.com");
  });

  it("joins the stored capability path onto the origin", () => {
    expect(buildAttachmentUrl("/media/invoice-a1b2.pdf", "https://api.codexng.com/v1"))
      .toBe("https://api.codexng.com/media/invoice-a1b2.pdf");
  });

  it("tolerates a stored path with no leading slash", () => {
    expect(buildAttachmentUrl("media/x.pdf", "https://api.codexng.com/v1"))
      .toBe("https://api.codexng.com/media/x.pdf");
  });

  it("passes an already-absolute url straight through", () => {
    const absolute = "https://cdn.example.com/media/x.pdf";
    expect(buildAttachmentUrl(absolute, "https://api.codexng.com/v1")).toBe(absolute);
  });
});

// A published download_url already carries the /v1 prefix, so it must resolve
// against the origin exactly as a /media/ path does - and, unlike /media/, it
// re-checks the permission on every call, so it needs the tenant assertion.
describe("downloadAuthorisedFile", () => {
  const anchorClicks: string[] = [];

  beforeEach(() => {
    anchorClicks.length = 0;
    bindTenantStore(() => ({ auth: { tenant: { slug: "codex" } } }));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:stub",
      revokeObjectURL: () => {},
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      anchorClicks.push(this.download);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asserts the tenant and saves the file under the job's own name", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("event_id,event_at\n", { status: 200, headers: { "content-type": "text/csv" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await downloadAuthorisedFile("/v1/audit/exports/abc/download/", "audit_export_abc.csv");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://test.local/v1/audit/exports/abc/download/?tenant=codex",
    );
    expect(anchorClicks).toEqual(["audit_export_abc.csv"]);
  });

  it("rejects with the backend's own words when the export is not ready", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, message: "This export is not ready to download." }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    ));

    await expect(downloadAuthorisedFile("/v1/audit/exports/abc/download/", "x.csv"))
      .rejects.toThrow("This export is not ready to download.");
    expect(anchorClicks).toEqual([]);
  });

  it("falls back to its own message when the refusal carries no body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));

    await expect(downloadAuthorisedFile("/v1/audit/exports/abc/download/", "x.csv"))
      .rejects.toThrow("That file could not be downloaded.");
  });
});
