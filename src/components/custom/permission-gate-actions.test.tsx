import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionCode } from "@/permissions";

const held = new Set<PermissionCode>();
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    hasPermission: (code: PermissionCode) => held.has(code),
    hasAnyPermission: (...codes: PermissionCode[]) => codes.some((code) => held.has(code)),
    hasAllPermissions: (...codes: PermissionCode[]) => codes.every((code) => held.has(code)),
  }),
}));

const { default: PermissionGate } = await import("./permission-gate");
const { P } = await import("@/permissions");

const actions = [P.CREATE_AUDIT_RULE, P.UPDATE_AUDIT_RULE, P.DELETE_AUDIT_RULE];
const render = (permission: PermissionCode | PermissionCode[], mode?: "any" | "all") =>
  renderToStaticMarkup(
    <PermissionGate permission={permission} mode={mode}>
      <button>Action</button>
    </PermissionGate>,
  );

describe("permission-gated action controls", () => {
  beforeEach(() => held.clear());

  it.each(actions)("hides an action without its own key and shows it with that key", (action) => {
    expect(render(action)).toBe("");
    for (const other of actions.filter((candidate) => candidate !== action)) {
      held.add(other);
      expect(render(action)).toBe("");
    }
    held.add(action);
    expect(render(action)).toContain("<button>Action</button>");
  });

  it("uses any or all only when the caller explicitly groups actions", () => {
    held.add(P.UPDATE_AUDIT_RULE);
    expect(render(actions)).toContain("<button>Action</button>");
    expect(render(actions, "all")).toBe("");
    held.add(P.CREATE_AUDIT_RULE);
    held.add(P.DELETE_AUDIT_RULE);
    expect(render(actions, "all")).toContain("<button>Action</button>");
  });
});
