export type PrimaryShortcutEvent = Pick<
  KeyboardEvent,
  "altKey" | "code" | "ctrlKey" | "isComposing" | "metaKey" | "shiftKey"
>;

/** Match the same primary shortcut on Windows/Linux (Ctrl) and macOS (Cmd). */
export function isPrimaryShortcut(event: PrimaryShortcutEvent, code: string): boolean {
  return (
    event.code === code
    && (event.ctrlKey || event.metaKey)
    && !event.altKey
    && !event.shiftKey
    && !event.isComposing
  );
}
