import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  approve: vi.fn(),
  refetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/redux/services/dashboard/onboarding-api", () => ({
  useGetGoLiveRequestsQuery: () => ({
    data: { data: mocks.rows, pagination: { currentPage: 1, totalPages: 1 } },
    isLoading: false, isFetching: false, isError: false, refetch: mocks.refetch,
  }),
  useApproveGoLiveMutation: () => [mocks.approve, { isLoading: false }],
  useRejectGoLiveMutation: () => [vi.fn(), { isLoading: false }],
}));

// The row menu is a Radix dropdown; its actions are rendered as plain buttons here.
vi.mock("@/components/custom/custom-table", () => ({
  default: ({ tableBodyList, dropDownList }: {
    tableBodyList: { status: React.ReactNode; _row: unknown }[];
    dropDownList: (item: unknown) => { label: string; onActionClick: () => void }[];
  }) => (
    <div>
      {tableBodyList.map((item, index) => (
        <div key={index}>
          <div data-testid="status">{item.status}</div>
          {dropDownList(item).map((action) => (
            <button key={action.label} type="button" onClick={action.onActionClick}>{action.label}</button>
          ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));

import GoLiveQueue from "./go-live";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PENDING = {
  id: 7, tenant_slug: "bright-star", school_name: "Bright Star School", status: "PENDING",
  preferred_go_live_at: "2026-11-02T09:00:00Z", note: "", acknowledged: true,
  requested_by_name: "Funke Adeyemi", reviewed_by_name: "", reviewed_at: null,
  rejection_reason: "", failure_reference: "", created_at: "2026-10-29T09:00:00Z",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.rows = [{ ...PENDING }];
  mocks.approve.mockReset();
  mocks.refetch.mockReset();
  mocks.toastError.mockReset();
  mocks.toastSuccess.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Presses the last button with this label, so the dialog's wins over the row's of the same name. */
async function press(text: string) {
  await act(async () => {
    Array.from(document.querySelectorAll("button")).filter((b) => b.textContent === text).at(-1)?.click();
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
}

const rejectWith = (body: unknown) =>
  mocks.approve.mockReturnValue({ unwrap: () => Promise.reject({ status: 500, data: body }) });

describe("go-live queue: a failed activation", () => {
  it("quotes the failure reference and reloads the queue", async () => {
    rejectWith({
      success: false,
      message: "Activation could not be completed. The school was not changed.",
      error: { code: "GOLIVE_ACTIVATION_FAILED", detail: { failure_reference: "GL-7F3A" } },
    });
    act(() => root.render(<GoLiveQueue />));

    await press("Approve and take live");
    await press("Approve and take live");

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Activation could not be completed. The school was not changed. Reference: GL-7F3A",
    );
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("says any other refusal in the backend's words and keeps the dialog open", async () => {
    mocks.approve.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 409,
        data: {
          success: false,
          message: "This go-live request has already been reviewed.",
          error: { code: "GOLIVE_NOT_PENDING" },
        },
      }),
    });
    act(() => root.render(<GoLiveQueue />));

    await press("Approve and take live");
    await press("Approve and take live");

    expect(mocks.toastError).toHaveBeenCalledWith("This go-live request has already been reviewed.");
    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Take Bright Star School live?");
  });

  it("shows a failed request's reference on its row", () => {
    mocks.rows = [{ ...PENDING, status: "FAILED", failure_reference: "GL-7F3A" }];
    act(() => root.render(<GoLiveQueue />));

    expect(container.querySelector("[data-testid=status]")?.textContent).toContain("Reference GL-7F3A");
  });
});
