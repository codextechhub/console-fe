/**
 * The role form names restricted permissions in words. A permission waiting
 * for approval is named by the backend's own wording even when the catalogue
 * no longer lists it, and a key with no wording anywhere is counted, never
 * printed.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RestrictedApprovalNotes } from "./restricted-approval-notes";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("RestrictedApprovalNotes", () => {
  it("names a waiting permission by the role's own wording", () => {
    act(() =>
      root.render(
        <RestrictedApprovalNotes
          labels={new Map([["payments.payout.create", "Create payouts"]])}
          adding={["payments.payout.create"]}
          waiting={[
            {
              permission_key: "finance.journal.reverse",
              permission_label: "Reverse journals",
            },
          ]}
        />,
      ),
    );

    expect(host.textContent).toContain("Create payouts is a restricted permission");
    expect(host.textContent).toContain("Waiting for approval: Reverse journals.");
    expect(host.textContent).not.toContain("finance.journal.reverse");
  });

  it("counts a permission it cannot name instead of printing its key", () => {
    act(() =>
      root.render(
        <RestrictedApprovalNotes
          labels={new Map()}
          adding={[]}
          waiting={[{ permission_key: "finance.journal.reverse" }]}
        />,
      ),
    );

    expect(host.textContent).toContain("Waiting for approval: 1 other permission.");
    expect(host.textContent).not.toContain("finance.journal.reverse");
  });
});
