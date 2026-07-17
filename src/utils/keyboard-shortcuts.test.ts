import { describe, expect, it } from "vitest";
import {
  isPrimaryShortcut,
  isPrimaryShiftShortcut,
  type PrimaryShortcutEvent,
} from "./keyboard-shortcuts";

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

  it("accepts the numpad twin of Enter", () => {
    expect(isPrimaryShortcut(keyboardEvent({ code: "NumpadEnter", ctrlKey: true }), "Enter")).toBe(true);
    expect(isPrimaryShortcut(keyboardEvent({ code: "NumpadEnter", metaKey: true }), "Enter")).toBe(true);
  });

  it("rejects modified, unmodified, and composing input", () => {
    expect(isPrimaryShortcut(keyboardEvent(), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ ctrlKey: true, altKey: true }), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ metaKey: true, shiftKey: true }), "Enter")).toBe(false);
    expect(isPrimaryShortcut(keyboardEvent({ ctrlKey: true, isComposing: true }), "Enter")).toBe(false);
  });
});

describe("isPrimaryShiftShortcut", () => {
  it("accepts Ctrl+Shift and Cmd+Shift variants", () => {
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyL", ctrlKey: true, shiftKey: true }), "KeyL")).toBe(true);
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyL", metaKey: true, shiftKey: true }), "KeyL")).toBe(true);
  });

  it("rejects missing Shift, Alt, composition, and a different key", () => {
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyL", ctrlKey: true }), "KeyL")).toBe(false);
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyL", ctrlKey: true, shiftKey: true, altKey: true }), "KeyL")).toBe(false);
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyL", ctrlKey: true, shiftKey: true, isComposing: true }), "KeyL")).toBe(false);
    expect(isPrimaryShiftShortcut(keyboardEvent({ code: "KeyK", ctrlKey: true, shiftKey: true }), "KeyL")).toBe(false);
  });
});
