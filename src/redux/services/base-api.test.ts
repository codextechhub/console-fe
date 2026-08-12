import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
const dismissOpenDrawerForError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    info: vi.fn(),
  },
}));

vi.mock("@/utils/drawer-errors", () => ({
  dismissOpenDrawerForError,
}));

afterEach(() => {
  toastError.mockClear();
  dismissOpenDrawerForError.mockClear();
  vi.unstubAllGlobals();
});

describe("baseQueryInterceptor", () => {
  it("shows the backend message for a 409 domain conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: false,
        message: (
          "No fiscal period covers this date. Either the date falls "
          + "outside your fiscal calendar, or the next fiscal year has "
          + "not been created yet."
        ),
        error: {
          code: "PERIOD_CLOSED",
          detail: { period_label: "<none>", status: "missing" },
        },
      }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }),
    ));

    const { baseQueryInterceptor } = await import("./base-api");
    const api = {
      endpoint: "postDirectEntry",
      getState: () => ({ auth: { tenant: { slug: "codex" } } }),
      dispatch: vi.fn(),
      signal: new AbortController().signal,
      abort: vi.fn(),
      extra: undefined,
      type: "mutation" as const,
    };

    const result = await baseQueryInterceptor(
      {
        url: "/finance/direct-entries/?entity=CREST",
        method: "POST",
        body: {},
      },
      api,
      {},
    );

    expect(result.error?.status).toBe(409);
    expect(toastError).toHaveBeenCalledWith(
      "No fiscal period covers this date. Either the date falls "
      + "outside your fiscal calendar, or the next fiscal year has "
      + "not been created yet.",
    );
    expect(dismissOpenDrawerForError).toHaveBeenCalledOnce();
  });

  it("shows the actionable message instead of a 422 machine code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: false,
        message: (
          "Customer STU-014 has no receivable account configured. "
          + "Edit the customer and select an active Accounts Receivable account."
        ),
        error: {
          code: "POSTING_ERROR",
          detail: {},
        },
      }), {
        status: 422,
        headers: { "content-type": "application/json" },
      }),
    ));

    const { baseQueryInterceptor } = await import("./base-api");
    const api = {
      endpoint: "generateFromFeeStructure",
      getState: () => ({ auth: { tenant: { slug: "codex" } } }),
      dispatch: vi.fn(),
      signal: new AbortController().signal,
      abort: vi.fn(),
      extra: undefined,
      type: "mutation" as const,
    };

    const result = await baseQueryInterceptor(
      {
        url: "/finance/fee-structures/TUITION/generate/?entity=CREST",
        method: "POST",
        body: {},
      },
      api,
      {},
    );

    expect(result.error?.status).toBe(422);
    expect(toastError).toHaveBeenCalledWith(
      "Customer STU-014 has no receivable account configured. "
      + "Edit the customer and select an active Accounts Receivable account.",
    );
    expect(toastError).not.toHaveBeenCalledWith("POSTING_ERROR");
  });

  it("still prefers field detail for ordinary request validation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: false,
        message: "An error occurred. Check the error details for more information.",
        error: {
          code: "REQUEST_ERROR",
          detail: { invoice_date: ["Enter a valid date."] },
        },
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    ));

    const { baseQueryInterceptor } = await import("./base-api");
    const api = {
      endpoint: "generateFromFeeStructure",
      getState: () => ({ auth: { tenant: { slug: "codex" } } }),
      dispatch: vi.fn(),
      signal: new AbortController().signal,
      abort: vi.fn(),
      extra: undefined,
      type: "mutation" as const,
    };

    await baseQueryInterceptor(
      {
        url: "/finance/fee-structures/TUITION/generate/?entity=CREST",
        method: "POST",
        body: {},
      },
      api,
      {},
    );

    expect(toastError).toHaveBeenCalledWith("Enter a valid date.");
  });

  it("does not close a drawer for a silent background failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Temporary failure" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    ));

    const { baseQueryInterceptor } = await import("./base-api");
    const api = {
      endpoint: "getNotifications",
      getState: () => ({ auth: { tenant: { slug: "codex" } } }),
      dispatch: vi.fn(),
      signal: new AbortController().signal,
      abort: vi.fn(),
      extra: undefined,
      type: "query" as const,
    };

    await baseQueryInterceptor(
      "/notifications/",
      api,
      { silent: true },
    );

    expect(toastError).not.toHaveBeenCalled();
    expect(dismissOpenDrawerForError).not.toHaveBeenCalled();
  });

  it("leaves inline validation failures for the form without closing its drawer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: false,
        message: "Check the form.",
        error: {
          code: "REQUEST_ERROR",
          detail: { vendor_reference: ["This number is already recorded."] },
        },
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    ));

    const { baseQueryInterceptor } = await import("./base-api");
    const api = {
      endpoint: "createVendorInvoice",
      getState: () => ({ auth: { tenant: { slug: "codex" } } }),
      dispatch: vi.fn(),
      signal: new AbortController().signal,
      abort: vi.fn(),
      extra: undefined,
      type: "mutation" as const,
    };

    const result = await baseQueryInterceptor(
      {
        url: "/procurement/vendor-invoices/?entity=CREST",
        method: "POST",
        body: {},
      },
      api,
      { inlineValidation: true },
    );

    expect(result.error?.status).toBe(400);
    expect(toastError).not.toHaveBeenCalled();
    expect(dismissOpenDrawerForError).not.toHaveBeenCalled();
  });
});
