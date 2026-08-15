// Does the template editor have anything worth saving?
//
// Kept out of the component because it is the rule the Save button lives by,
// and it has one subtlety worth pinning in tests: a STANDARD template's markup
// is derived from its message, regenerated on every keystroke. Comparing that
// derived value would report a change while the author is still typing, and
// would still report one after they typed the message back to how it started.
// So the comparison only ever looks at what a person can actually type.

import type { NotificationTemplate, NotificationTemplateDraft } from "@/redux/services/notifications-api";

export type TemplateForm = Required<NotificationTemplateDraft>;

/** The editable content of a stored template. */
export const toForm = (t: NotificationTemplate): TemplateForm => ({
  subject: t.subject,
  body: t.body,
  cta_label: t.cta_label,
  cta_url: t.cta_url,
  html_body: t.html_body,
  html_is_custom: t.html_is_custom,
});

/**
 * True when `form` differs from what is stored.
 *
 * Reverting an edit by hand makes this false again - the answer is always a
 * comparison against the saved values, never a "something was typed" flag.
 */
export function hasUnsavedChanges(
  form: TemplateForm,
  saved: TemplateForm,
  isEmail: boolean,
): boolean {
  const typed = (["subject", "body", "cta_label", "cta_url"] as const).some(
    (key) => form[key] !== saved[key],
  );
  if (typed) return true;
  if (!isEmail) return false;

  // Markup counts only when it is hand-maintained: taking ownership of it (or
  // handing it back) is a change, and so is editing markup you already own.
  if (form.html_is_custom !== saved.html_is_custom) return true;
  return form.html_is_custom && form.html_body !== saved.html_body;
}
