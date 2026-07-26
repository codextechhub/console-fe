import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    info: vi.fn(),
  },
}));

afterEach(() => {
  toastError.mockClear();
  vi.unstubAllGlobals();
});

describe("baseQueryInterceptor", () => {
  it("shows the backend message for a 409 domain conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: false,
        message: (
          "This date is outside your fiscal periods. "
          + "Choose a date within an open fiscal period."
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
      "This date is outside your fiscal periods. "
      + "Choose a date within an open fiscal period.",
    );
  });
});
