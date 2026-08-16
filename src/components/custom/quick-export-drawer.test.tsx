// The quick export drawer's job is honesty about what the file will contain.
// These tests cover the parts that would silently mislead if they broke:
//
//   1. an unmapped screen filter means the file is WIDER than the table, so the
//      warning must render and the run button must say "Run anyway"
//   2. a clean plan must NOT show that warning
//   3. the button needs BOTH permissions - one alone opens a drawer that cannot
//      submit, which is the dead-button defect wearing a different hat
//   4. the run payload must be the config the SERVER prepared, not anything the
//      FE re-derived from the screen's params

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  plan: vi.fn(),
  runQuick: vi.fn(),
  reprice: vi.fn(),
  save: vi.fn(),
  hasAllPermissions: vi.fn(),
}));

vi.mock("@/redux/services/dashboard/exports-api", () => ({
  useGetScreenExportPlanQuery: (...args: unknown[]) => mocks.plan(...args),
  useRunQuickExportMutation: () => [mocks.runQuick, { isLoading: false }],
  usePreviewExportMutation: () => [mocks.reprice, { data: undefined, isLoading: false }],
}));

vi.mock("@/pages/protected/export/use-file-download", () => ({
  useFileDownload: () => ({ save: mocks.save, busyId: null }),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ hasAllPermissions: mocks.hasAllPermissions }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { QuickExportButton, QuickExportDrawer } from "./quick-export-drawer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FIELDS = [
  { id: "document_number", label: "Invoice number", group: "Invoice", type: "text", locked: true, sensitive: false, description: "" },
  { id: "total", label: "Total", group: "Amounts", type: "money", locked: false, sensitive: false, description: "" },
  { id: "customer_email", label: "Billing email", group: "Customer", type: "text", locked: false, sensitive: true, description: "" },
];

const CONFIG = {
  dataset_key: "finance.customer_invoices",
  columns: ["document_number", "total"],
  filters: [{ id: "status", values: ["POSTED"] }],
  sort: [],
  format: "xlsx" as const,
  values_mode: "people" as const,
};

function planData(over: Record<string, unknown> = {}) {
  return {
    data: {
      data: {
        screen: {
          key: "finance.invoices",
          label: "Finance - Invoices",
          dataset: "finance.customer_invoices",
          default_window_days: 365,
        },
        config: CONFIG,
        supported_formats: ["xlsx", "csv"],
        fields: FIELDS,
        carried: ["status"],
        unmapped: [],
        added: [],
        exact: true,
        warning: null,
        matching_rows: 42,
        rows_bucket: null,
        estimated_bytes: 2048,
        estimate_confidence: "exact",
        columns: 2,
        row_cap: 500000,
        warnings: [],
        sample: { headers: ["Invoice"], rows: [["INV-1"]] },
        reads_as: "Customer invoices where Status is Posted",
        ...over,
      },
    },
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  };
}

describe("QuickExportDrawer honesty contract", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.hasAllPermissions.mockReturnValue(true);
    mocks.runQuick.mockReturnValue({ unwrap: () => Promise.resolve({ data: { id: 7 }, message: "queued" }) });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  const render = () =>
    act(() => {
      root.render(
        <MemoryRouter>
          <QuickExportDrawer open onOpenChange={() => {}} screen="finance.invoices" />
        </MemoryRouter>,
      );
    });

  // Regression: `entity` was passed to the run call but not to the plan call, so
  // every entity-scoped screen (all of Finance and Procurement) opened the drawer
  // straight onto "An 'entity' query parameter (id or code) is required". The
  // tenant-scoped screens worked, which is what made it easy to miss.
  it("sends entity to the plan request, not only to the run request", () => {
    mocks.plan.mockReturnValue(planData());
    act(() => {
      root.render(
        <MemoryRouter>
          <QuickExportDrawer open onOpenChange={() => {}} screen="finance.invoices" entity="CODEX" />
        </MemoryRouter>,
      );
    });
    expect(mocks.plan.mock.calls[0][0]).toMatchObject({ screen: "finance.invoices", entity: "CODEX" });
  });

  it("warns and says 'Run anyway' when a screen filter could not be carried", () => {
    mocks.plan.mockReturnValue(
      planData({
        exact: false,
        warning: "Some filters on this screen cannot be carried into an export.",
        unmapped: [{ param: "bucket", value: "overdue", reason: "Not recognised." }],
      }),
    );
    render();
    const text = document.body.textContent ?? "";
    expect(text).toContain("This file will contain more than the table shows");
    // the dropped filter is named, not just counted - a warning that does not
    // say WHICH filter went missing cannot be acted on
    expect(text).toContain("bucket=overdue");
    expect(text).toContain("Run anyway");
  });

  it("shows no warning and offers a direct download for a small file", () => {
    mocks.plan.mockReturnValue(planData());
    render();
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("This file will contain more than the table shows");
    // Small enough to run inline, so the button promises the file, not a queue.
    expect(text).toContain("Download export");
    expect(text).toContain("42");
  });

  // The backend caps client_key at 64 chars and returns the in-flight run for a
  // repeated key inside 60s. If two different filter sets produced the same key,
  // the second export would silently hand back the first one's file.
  it("gives different filters different idempotency keys", async () => {
    const keyFor = async (filters: unknown) => {
      mocks.runQuick.mockClear();
      mocks.plan.mockReturnValue(planData({ config: { ...CONFIG, filters } }));
      const local = createRoot(document.body.appendChild(document.createElement("div")));
      await act(async () => {
        local.render(
          <MemoryRouter>
            <QuickExportDrawer open onOpenChange={() => {}} screen="finance.gl_postings" />
          </MemoryRouter>,
        );
      });
      const run = Array.from(document.body.querySelectorAll("button")).find(
        (b) => /^Download export$/.test(b.textContent?.trim() ?? ""),
      );
      await act(async () => { run!.click(); });
      const key = mocks.runQuick.mock.calls[0][0].client_key;
      act(() => local.unmount());
      return key;
    };

    // Same shape, same length, differing only well past a 64-char truncation.
    const a = await keyFor([{ id: "entry_date", start: "2026-07-01", end: "2026-07-31" }]);
    const b = await keyFor([{ id: "entry_date", start: "2026-07-01", end: "2026-08-31" }]);
    expect(a).not.toBe(b);
    expect(a.length).toBeLessThanOrEqual(64);
  });

  // A locked column is the row's identity. The backend puts it back regardless,
  // so a picker that let you "remove" it would disagree with the file produced.
  it("offers every column, marks restricted ones, and locks the identity column", () => {
    mocks.plan.mockReturnValue(planData());
    render();
    const boxes = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    expect(boxes).toHaveLength(FIELDS.length);
    const locked = boxes[0];
    expect(locked.disabled).toBe(true);
    expect(locked.checked).toBe(true);
    expect(document.body.textContent).toContain("restricted");
  });

  // The whole point of choosing columns is that the file changes - so the run
  // has to carry the choice, not the plan's defaults.
  it("sends the chosen columns, not the defaults", async () => {
    mocks.plan.mockReturnValue(planData());
    render();
    const boxes = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const sensitive = boxes[FIELDS.findIndex((f) => f.sensitive)];
    await act(async () => { sensitive.click(); });

    const run = Array.from(document.body.querySelectorAll("button")).find(
      (b) => /^(Download|Run) export$/.test(b.textContent?.trim() ?? ""),
    );
    await act(async () => { run!.click(); });
    expect(mocks.runQuick.mock.calls[0][0].columns).toContain("customer_email");
  });

  // The server may queue instead of running inline; the drawer must react to
  // what came back rather than to what it asked for.
  it("downloads the file when the run came back complete", async () => {
    mocks.plan.mockReturnValue(planData());
    mocks.runQuick.mockReturnValue({
      unwrap: () => Promise.resolve({
        message: "Export ready.",
        data: { id: 7, status: "COMPLETED", file: { id: 99, name: "invoices.xlsx", is_downloadable: true } },
      }),
    });
    render();
    const run = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Download export",
    );
    await act(async () => { run!.click(); });
    expect(mocks.save).toHaveBeenCalledWith({ id: 99, name: "invoices.xlsx" }, 7);
  });

  it("does not claim a download when the server queued it instead", async () => {
    mocks.plan.mockReturnValue(planData());
    mocks.runQuick.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "Export queued successfully.", data: { id: 7, status: "QUEUED", file: null } }),
    });
    render();
    const run = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Download export",
    );
    await act(async () => { run!.click(); });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("submits the server's config rather than anything re-derived on the client", async () => {
    mocks.plan.mockReturnValue(planData());
    render();
    const run = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Download export",
    );
    expect(run).toBeTruthy();
    await act(async () => { run!.click(); });
    const body = mocks.runQuick.mock.calls[0][0];
    expect(body.dataset_key).toBe(CONFIG.dataset_key);
    expect(body.filters).toEqual(CONFIG.filters);
    expect(body.columns).toEqual(CONFIG.columns);
  });
});

describe("QuickExportButton gating", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.plan.mockReturnValue(planData());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("renders nothing unless the user holds BOTH export keys", () => {
    mocks.hasAllPermissions.mockReturnValue(false);
    act(() => {
      root.render(
        <MemoryRouter>
          <QuickExportButton screen="finance.invoices" />
        </MemoryRouter>,
      );
    });
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the button when both keys are held", () => {
    mocks.hasAllPermissions.mockReturnValue(true);
    act(() => {
      root.render(
        <MemoryRouter>
          <QuickExportButton screen="finance.invoices" />
        </MemoryRouter>,
      );
    });
    expect(container.querySelector("button")?.textContent).toContain("Export");
  });
});

/** The drawer driven the way its own props allow: kept mounted, with `open`
 *  controlled from outside, so a close and a reopen can both be exercised. The
 *  app's own QuickExportButton drops the drawer on close instead, which reaches
 *  the same fresh start by unmounting. */
function ControlledDrawer() {
  const [open, setOpen] = useState(true);
  return (
    <MemoryRouter>
      <button type="button" id="reopen" onClick={() => setOpen(true)}>
        reopen
      </button>
      <QuickExportDrawer open={open} onOpenChange={setOpen} screen="finance.invoices" />
    </MemoryRouter>
  );
}

// The drawer stores only what the USER chose and works out everything else from
// the plan while rendering. These are the four things that break the moment it
// goes back to keeping its own copy of the plan in state: each one is a case
// where a plan arrives (or arrives again) after the user has already decided.
describe("QuickExportDrawer keeps the user's choices, not a copy of the plan", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.hasAllPermissions.mockReturnValue(true);
    mocks.runQuick.mockReturnValue({ unwrap: () => Promise.resolve({ data: { id: 7 }, message: "queued" }) });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  const show = () =>
    act(() => {
      root.render(
        <MemoryRouter>
          <QuickExportDrawer open onOpenChange={() => {}} screen="finance.invoices" />
        </MemoryRouter>,
      );
    });

  const nameField = () => document.body.querySelector<HTMLInputElement>("#quick-export-name")!;
  const boxFor = (id: string) =>
    Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))[
      FIELDS.findIndex((f) => f.id === id)
    ];
  const byText = (label: string | RegExp) =>
    Array.from(document.body.querySelectorAll("button")).find((b) => {
      const text = b.textContent?.trim() ?? "";
      return typeof label === "string" ? text === label : label.test(text);
    })!;
  const runButton = () => byText(/^(Download|Run) export$/);

  // Typing as React sees it. Assigning `.value` straight onto the node is
  // swallowed by React's value tracker, so go through the native setter and
  // then fire the `input` event React actually listens for.
  const typeName = async (value: string) => {
    const input = nameField();
    const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setValue?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  // A re-estimate hands back a new plan. This is the moment a seeded copy of
  // `config.columns` would quietly put the dataset's defaults back over the
  // boxes the user had just ticked.
  it("keeps the columns the user ticked when a re-estimated plan arrives", async () => {
    mocks.plan.mockReturnValue(planData());
    show();
    await act(async () => { boxFor("customer_email").click(); });
    expect(boxFor("customer_email").checked).toBe(true);

    mocks.plan.mockReturnValue(planData({ matching_rows: 43, estimated_bytes: 4096 }));
    show();

    expect(boxFor("customer_email").checked).toBe(true);
    await act(async () => { runButton().click(); });
    expect(mocks.runQuick.mock.calls[0][0].columns).toContain("customer_email");
  });

  // The default name follows the screen only until the user types. After that a
  // fresh plan must not touch it: they would lose what they wrote without
  // pressing a key.
  it("never overwrites a name the user typed, however many plans arrive", async () => {
    mocks.plan.mockReturnValue(planData());
    show();
    expect(nameField().value).toContain("Finance - Invoices - ");

    await typeName("July audit pack");
    expect(nameField().value).toBe("July audit pack");

    mocks.plan.mockReturnValue(planData({ matching_rows: 43 }));
    show();
    expect(nameField().value).toBe("July audit pack");

    await act(async () => { runButton().click(); });
    expect(mocks.runQuick.mock.calls[0][0].name).toBe("July audit pack");
  });

  // Emptying the box is a choice too, so "" must not read as "has not chosen"
  // and spring the default back while the user is still mid-delete.
  it("leaves the name empty when the user clears it instead of restoring the default", async () => {
    mocks.plan.mockReturnValue(planData());
    show();
    await typeName("");
    expect(nameField().value).toBe("");

    mocks.plan.mockReturnValue(planData({ matching_rows: 43 }));
    show();
    expect(nameField().value).toBe("");

    // An empty box still submits something sensible: the screen's own label.
    await act(async () => { runButton().click(); });
    expect(mocks.runQuick.mock.calls[0][0].name).toBe("Finance - Invoices");
  });

  // A dataset that cannot produce the drawer's default format must not let that
  // format be submitted anyway.
  it("falls back to a supported format when the current one is not offered", async () => {
    mocks.plan.mockReturnValue(planData({ supported_formats: ["csv"] }));
    show();
    expect(byText("CSV (.csv)").getAttribute("aria-pressed")).toBe("true");

    await act(async () => { runButton().click(); });
    expect(mocks.runQuick.mock.calls[0][0].format).toBe("csv");
  });

  // ...but a supported format the user picked is theirs, and a re-estimate is
  // not permission to put the dataset's first choice back.
  it("keeps a supported format the user picked when a re-estimated plan arrives", async () => {
    mocks.plan.mockReturnValue(planData());
    show();
    await act(async () => { byText("CSV (.csv)").click(); });
    expect(byText("CSV (.csv)").getAttribute("aria-pressed")).toBe("true");

    mocks.plan.mockReturnValue(planData({ matching_rows: 43 }));
    show();
    expect(byText("CSV (.csv)").getAttribute("aria-pressed")).toBe("true");

    await act(async () => { runButton().click(); });
    expect(mocks.runQuick.mock.calls[0][0].format).toBe("csv");
  });

  // What was ticked and typed belongs to one opening of the drawer. The format
  // deliberately does not: it is a preference about the file rather than about
  // this table, and it has always outlived a close.
  it("forgets the ticked columns and the typed name on close, but not the format", async () => {
    mocks.plan.mockReturnValue(planData());
    await act(async () => { root.render(<ControlledDrawer />); });

    await act(async () => { boxFor("customer_email").click(); });
    await typeName("July audit pack");
    await act(async () => { byText("CSV (.csv)").click(); });

    await act(async () => { byText("Cancel").click(); });
    await act(async () => {
      document.body.querySelector<HTMLButtonElement>("#reopen")!.click();
    });

    expect(boxFor("customer_email").checked).toBe(false);
    expect(nameField().value).toContain("Finance - Invoices - ");
    expect(byText("CSV (.csv)").getAttribute("aria-pressed")).toBe("true");
  });
});
