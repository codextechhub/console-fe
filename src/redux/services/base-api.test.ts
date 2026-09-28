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

// Item 2 of the owed changes: the six account actions resolve through a
// tenant-scoped gate now, so a 404 means "not yours OR not there" and the two
// must stay indistinguishable. The backend says "User not found."; showing that
// sends a CX operator hunting for a deleted account that is alive at another
// school.
describe("a 404 on an account action", () => {
  const notFound = () =>
    new Response(JSON.stringify({ success: false, message: "User not found.", error: {} }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

  const call = async (endpoint: string) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(notFound()));
    const { baseQueryInterceptor } = await import("./base-api");
    await baseQueryInterceptor(
      { url: "/user/42/suspend/", method: "POST" },
      {
        endpoint,
        getState: () => ({ auth: { tenant: { slug: "codex" } } }),
        dispatch: vi.fn(),
        signal: new AbortController().signal,
        abort: vi.fn(),
        extra: undefined,
        type: "mutation" as const,
      },
      {},
    );
  };

  it("never claims the account does not exist", async () => {
    await call("suspendTeamMember");

    const shown = String(toastError.mock.calls[0][0]);
    expect(shown).not.toMatch(/user not found/i);
    expect(shown).toMatch(/another school/i);
  });

  it("says the same thing for every one of the six", async () => {
    for (const endpoint of [
      "suspendTeamMember", "reactivateTeamMember", "unlockTeamMember",
      "adminPasswordReset", "changeUserEmail", "resendInvite",
    ]) {
      toastError.mockClear();
      await call(endpoint);
      expect(String(toastError.mock.calls[0][0])).toMatch(/another school/i);
    }
  });

  it("leaves an ordinary 404 elsewhere alone", async () => {
    await call("getImportBatch");

    expect(String(toastError.mock.calls[0][0])).not.toMatch(/another school/i);
  });
});

/**
 * A 403 `field_write_denied` belongs to the form that sent it: the form shows
 * each message beside its field, so the interceptor neither toasts nor closes
 * the drawer the form sits in. Every other 403 keeps the generic handling.
 */
describe("a 403 on a save", () => {
  const refuse = (code: string) =>
    new Response(JSON.stringify({
      success: false,
      message: "You do not have permission to perform this action.",
      error: {
        code,
        detail: { account_number: ["You do not have permission to change this field."] },
      },
    }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });

  const save = async (code: string) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(refuse(code)));
    const { baseQueryInterceptor } = await import("./base-api");
    return baseQueryInterceptor(
      { url: "/user/platform-staff-profiles/7/", method: "PATCH", body: { account_number: "0123456789" } },
      {
        endpoint: "updateStaffProfile",
        getState: () => ({ auth: { tenant: { slug: "codex" } } }),
        dispatch: vi.fn(),
        signal: new AbortController().signal,
        abort: vi.fn(),
        extra: undefined,
        type: "mutation" as const,
      },
      {},
    );
  };

  it("leaves a refused field write to the form", async () => {
    const result = await save("field_write_denied");

    expect(result.error?.status).toBe(403);
    expect(toastError).not.toHaveBeenCalled();
    expect(dismissOpenDrawerForError).not.toHaveBeenCalled();
  });

  it("still toasts any other refusal", async () => {
    await save("permission_denied");

    expect(toastError).toHaveBeenCalledOnce();
    expect(dismissOpenDrawerForError).toHaveBeenCalledOnce();
  });
});

/**
 * A refused read is left to the screen that asked. A report loading the
 * periods behind its filter must not tell the reader they were refused
 * something they never asked for, nor close the drawer they are working in.
 */
describe("a 403 on a read", () => {
  it("stays quiet and leaves the error to the query", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      message: "You do not have permission to perform this action.",
      error: { code: "permission_denied", detail: { detail: "You do not have permission to perform this action." } },
    }), { status: 403, headers: { "content-type": "application/json" } })));
    const { baseQueryInterceptor } = await import("./base-api");

    const result = await baseQueryInterceptor(
      { url: "/finance/periods/?entity=HOLYCROSS", method: "GET" },
      {
        endpoint: "getPeriods",
        getState: () => ({ auth: { tenant: { slug: "codex" } } }),
        dispatch: vi.fn(),
        signal: new AbortController().signal,
        abort: vi.fn(),
        extra: undefined,
        type: "query" as const,
      },
      {},
    );

    expect(result.error?.status).toBe(403);
    expect(toastError).not.toHaveBeenCalled();
    expect(dismissOpenDrawerForError).not.toHaveBeenCalled();
  });
});

describe("a post with no approval route", () => {
  const refusal = () => new Response(JSON.stringify({
    success: false,
    message: "This journal has an approval path with no steps, so nobody will review it.",
    error: { code: "APPROVAL_NOT_CONFIGURED" },
  }), { status: 409, headers: { "content-type": "application/json" } });
  const posted = () => new Response(JSON.stringify({ success: true, data: { id: 9 } }), {
    status: 200, headers: { "content-type": "application/json" },
  });
  const api = {
    endpoint: "postJournal",
    getState: () => ({ auth: { tenant: { slug: "codex" } } }),
    dispatch: vi.fn(),
    signal: new AbortController().signal,
    abort: vi.fn(),
    extra: undefined,
    type: "mutation" as const,
  };
  const post = { url: "/finance/journals/9/post/?entity=CREST", method: "POST", body: { memo: "x" } };

  it("asks, and resends the same post with the confirmation and reason", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(refusal()).mockResolvedValueOnce(posted());
    vi.stubGlobal("fetch", fetchMock);
    const { subscribeToApprovalConfirm } = await import("@/lib/approval-confirm");
    const stop = subscribeToApprovalConfirm((pending) => pending?.settle("Steps not built yet"));
    const { baseQueryInterceptor } = await import("./base-api");

    const result = await baseQueryInterceptor(post, api, {});
    stop();

    expect(result.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const resent = fetchMock.mock.calls[1][0] as Request;
    expect(await resent.json()).toEqual({
      memo: "x", confirm_without_approval: true, reason: "Steps not built yet",
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("returns the refusal untouched when the reader declines", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(refusal());
    vi.stubGlobal("fetch", fetchMock);
    const { subscribeToApprovalConfirm } = await import("@/lib/approval-confirm");
    const stop = subscribeToApprovalConfirm((pending) => pending?.settle(null));
    const { baseQueryInterceptor } = await import("./base-api");

    const result = await baseQueryInterceptor(post, api, {});
    stop();

    expect(result.error?.status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
