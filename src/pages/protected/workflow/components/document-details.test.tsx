import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DocumentDetailsPanel,
  documentDetailSections,
} from "@/pages/protected/workflow/components/document-details";

const prompt = {
  title: "Review the source document",
  description: "Open the complete source record before making a decision.",
};

function render(details: unknown, documentLink: string | null = "/roles/42") {
  return renderToStaticMarkup(
    <DocumentDetailsPanel
      details={details}
      documentLink={documentLink}
      documentPrompt={prompt}
    />,
  );
}

describe("DocumentDetailsPanel", () => {
  it("renders fields, line items, and permission changes in the approval", () => {
    const permissions = Array.from({ length: 20 }, (_, index) => ({
      operation: index % 2 === 0 ? "ADD" : "REMOVE",
      label: `Permission ${index + 1}`,
      description: index === 0 ? "Allows fee adjustments" : undefined,
      restricted: index < 3,
    }));
    const html = render({
      schema_version: 1,
      sections: [
        {
          kind: "fields",
          title: "Request",
          items: [
            { label: "Reason", value: "Cover the term-end close" },
          ],
        },
        {
          kind: "table",
          title: "Leave dates",
          columns: [
            { key: "start", label: "Start" },
            { key: "end", label: "End" },
          ],
          rows: [{ start: "14 Sep 2026", end: "18 Sep 2026" }],
        },
        { kind: "changes", title: "Permission changes", items: permissions },
      ],
    });

    expect(html).toContain("Review without leaving this approval");
    expect(html).toContain("Cover the term-end close");
    expect(html).toContain("14 Sep 2026");
    expect(html).toContain("Permission 20");
    expect(html.match(/Restricted/g)).toHaveLength(3);
    expect(html).toContain("View full document");
  });

  it("escapes server-provided strings instead of rendering markup", () => {
    const html = render({
      schema_version: 1,
      sections: [
        {
          kind: "fields",
          title: "Request",
          items: [{ label: "Reason", value: "<script>alert('x')</script>" }],
        },
      ],
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("keeps the source document as a compact fallback for legacy approvals", () => {
    const html = render({}, "/roles/42");

    expect(html).toContain("Review the source document");
    expect(html).toContain("View full document");
    expect(html).not.toContain(">Details<");
  });

  it("renders nothing for a legacy approval without a source link", () => {
    expect(render({}, null)).toBe("");
  });

  it("warns safely when the detail schema is unsupported", () => {
    const html = render({ schema_version: 2, sections: [] }, null);

    expect(documentDetailSections({ schema_version: 2, sections: [] })).toBeNull();
    expect(html).toContain("cannot be shown here");
  });
});
