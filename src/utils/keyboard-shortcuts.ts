export type PrimaryShortcutEvent = Pick<
  KeyboardEvent,
  "altKey" | "code" | "ctrlKey" | "isComposing" | "metaKey" | "shiftKey"
>;

// Keys with a numpad twin produce a different physical code for the same
// logical key ("Enter" vs "NumpadEnter") — a shortcut on such a key must
// accept both or numpad users are silently excluded.
const CODE_ALIASES: Record<string, readonly string[]> = {
  Enter: ["Enter", "NumpadEnter"],
};

const codeMatches = (event: PrimaryShortcutEvent, code: string): boolean =>
  (CODE_ALIASES[code] ?? [code]).includes(event.code);

/** Match the same primary shortcut on Windows/Linux (Ctrl) and macOS (Cmd). */
export function isPrimaryShortcut(event: PrimaryShortcutEvent, code: string): boolean {
  return (
    codeMatches(event, code)
    && (event.ctrlKey || event.metaKey)
    && !event.altKey
    && !event.shiftKey
    && !event.isComposing
  );
}

/** Match a Ctrl/Cmd + Shift shortcut while rejecting Alt and composition. */
export function isPrimaryShiftShortcut(event: PrimaryShortcutEvent, code: string): boolean {
  return (
    codeMatches(event, code)
    && (event.ctrlKey || event.metaKey)
    && !event.altKey
    && event.shiftKey
    && !event.isComposing
  );
}
