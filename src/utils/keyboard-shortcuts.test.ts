import { describe, expect, it } from "vitest";
import { isPrimaryShortcut, type PrimaryShortcutEvent } from "./keyboard-shortcuts";

const keyboardEvent = (
  overrides: Partial<PrimaryShortcutEvent> = {},
): PrimaryShortcutEvent => ({
  altKey: false,
  code: "Enter",
  ctrlKey: false,
  isComposing: false,
  metaKey: false,
  shiftKey: false,
  ...overrides,
});

describe("isPrimaryShortcut", () => {
  it("accepts Ctrl and Cmd variants", () => {
    expect(isPrimaryShortcut(keyboardEvent({ ctrlKey: true }), "Enter")).toBe(true);
    expect(isPrimaryShortcut(keyboardEvent({ metaKey: true }), "Enter")).toBe(true);
  });

  it("matches the physical key code", () => {
    expect(isPrimaryShortcut(keyboardEvent({ code: "KeyE", ctrlKey: true }), "KeyE")).toBe(true);
    expect(isPrimaryShortcut(keyboardEvent({ code: "KeyE", ctrlKey: true }), "Enter")).toBe(false);
  });

  it("rejects modified, unmodified, and composing input", () => {
    expect(isPrimaryShortcut(keyboardEvent(), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ ctrlKey: true, altKey: true }), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ metaKey: true, shiftKey: true }), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ ctrlKey: true, isComposing: true }), "Enter")).toBe(false);
  });
});
