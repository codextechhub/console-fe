import { describe, expect, it } from "vitest";

import { buildAttachmentUrl, mediaOrigin } from "./attachment-download";

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
