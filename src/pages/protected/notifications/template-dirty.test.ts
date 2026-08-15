import { describe, expect, it } from "vitest";
import type { NotificationTemplate } from "@/redux/services/notifications-api";
import { hasUnsavedChanges, toForm, type TemplateForm } from "./template-dirty";

const stored: NotificationTemplate = {
  id: "t1",
  event_type: "e1",
  event_type_key: "ticket.created",
  event_type_label: "Ticket created",
  channel: "email",
  subject: "New ticket {{ ticket_number }}",
  body: "Hello,\n\nA ticket was raised.",
  cta_label: "",
  cta_url: "",
  html_body: "<html>standard {{ ticket_number }}</html>",
  variables: ["ticket_number"],
  html_is_custom: false,
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-08-15T09:00:00Z",
  updated_at: "2026-08-15T09:00:00Z",
};

const saved = toForm(stored);
const edit = (over: Partial<TemplateForm>): TemplateForm => ({ ...saved, ...over });

describe("hasUnsavedChanges", () => {
  it("is false when nothing has been touched", () => {
    expect(hasUnsavedChanges(saved, saved, true)).toBe(false);
  });

  it("is true once the message changes", () => {
    expect(hasUnsavedChanges(edit({ body: "Hello,\n\nA ticket was raised!" }), saved, true)).toBe(
      true,
    );
  });

  it("goes back to false when the edit is typed back to how it started", () => {
    const typed = edit({ subject: "New ticket {{ ticket_number }}!" });
    expect(hasUnsavedChanges(typed, saved, true)).toBe(true);
    const reverted = edit({ subject: stored.subject });
    expect(hasUnsavedChanges(reverted, saved, true)).toBe(false);
  });

  it("ignores regenerated markup on a standard template", () => {
    // The message drives the markup, so the box is refreshed constantly. That
    // is not an edit, and must not keep the Save button lit.
    const regenerated = edit({ html_body: "<html>standard, rebuilt {{ ticket_number }}</html>" });
    expect(hasUnsavedChanges(regenerated, saved, true)).toBe(false);
  });

  it("counts taking ownership of the markup", () => {
    expect(
      hasUnsavedChanges(edit({ html_is_custom: true, html_body: "<html>mine</html>" }), saved, true),
    ).toBe(true);
  });

  it("counts editing markup you already own", () => {
    const custom = edit({ html_is_custom: true, html_body: "<html>mine</html>" });
    expect(hasUnsavedChanges(edit({ ...custom, html_body: "<html>mine, v2</html>" }), custom, true)).toBe(
      true,
    );
  });

  it("counts handing the markup back to the standard design", () => {
    const custom = edit({ html_is_custom: true, html_body: "<html>mine</html>" });
    expect(hasUnsavedChanges(edit({ ...custom, html_is_custom: false }), custom, true)).toBe(true);
  });

  it("never looks at markup for an in-app template", () => {
    const withMarkup = edit({ html_body: "<html>ignored</html>", html_is_custom: true });
    expect(hasUnsavedChanges(withMarkup, saved, false)).toBe(false);
  });
});
