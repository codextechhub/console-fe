import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/redux/services/dashboard/import-api", () => ({
  useCreateImportBatchMutation: () => [vi.fn(), { isLoading: false }],
  useGetImportBatchQuery: () => ({ data: undefined, refetch: vi.fn() }),
  useValidateImportBatchMutation: () => [vi.fn()],
  useStartImportBatchMutation: () => [vi.fn()],
}));

vi.mock("./import-wizard/wizard-steps", () => ({
  unwrap: () => undefined,
  extractUploadError: () => "Upload failed",
  WizardStepper: () => null,
  UploadStep: ({ onNotesChange }: { onNotesChange: (value: string) => void }) => (
    <button type="button" onClick={() => onNotesChange("Needs review")}>
      Add note
    </button>
  ),
  HeaderReviewStep: () => null,
  ValidationStep: () => null,
  ReviewIssuesStep: () => null,
  ConfirmStep: () => null,
  ImportProgressStep: () => null,
  CompleteStep: () => null,
}));

import ImportWizard from "./import-wizard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function WizardRoute() {
  return (
    <>
      <ImportWizard />
      <Link to="/other">Leave wizard</Link>
    </>
  );
}

describe("ImportWizard navigation protection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    Reflect.deleteProperty(window, "confirm");
    vi.restoreAllMocks();
  });

  function refuseNavigation() {
    const confirm = vi.fn(() => false);
    Object.defineProperty(window, "confirm", {
      configurable: true,
      value: confirm,
    });
    return confirm;
  }

  async function renderWizard() {
    const router = createMemoryRouter([
      { path: "/new", element: <WizardRoute /> },
      { path: "/other", element: <p>Other page</p> },
    ], { initialEntries: ["/new"] });
    await act(async () => root.render(<RouterProvider router={router} />));
    return router;
  }

  it("allows internal navigation from a blank wizard without prompting", async () => {
    const confirm = refuseNavigation();
    const router = await renderWizard();

    await act(async () => {
      container.querySelector<HTMLAnchorElement>("a")?.click();
    });

    expect(router.state.location.pathname).toBe("/other");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("blocks internal navigation after the user enters work", async () => {
    const confirm = refuseNavigation();
    const router = await renderWizard();

    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")?.click();
    });
    await act(async () => {
      container.querySelector<HTMLAnchorElement>("a")?.click();
    });

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe("/new");
  });

  it("installs the browser unload guard only after work exists", async () => {
    await renderWizard();
    const blankEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(blankEvent);
    expect(blankEvent.defaultPrevented).toBe(false);

    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")?.click();
    });
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});
