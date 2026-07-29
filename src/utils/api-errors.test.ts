import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "./api-errors";

describe("apiErrorMessage", () => {
  it("unwraps an RTK mutation error and prefers a typed domain message", () => {
    expect(apiErrorMessage({
      status: 422,
      data: {
        message: "Customer STU-014 has no receivable account configured.",
        error: { code: "POSTING_ERROR", detail: {} },
      },
    })).toBe("Customer STU-014 has no receivable account configured.");
  });

  it("prefers field detail for a REQUEST_ERROR validation envelope", () => {
    expect(apiErrorMessage({
      message: "An error occurred. Check the error details for more information.",
      error: {
        code: "REQUEST_ERROR",
        detail: { invoice_date: ["Enter a valid date."] },
      },
    })).toBe("Enter a valid date.");
  });

  it("never falls back to the machine code", () => {
    expect(apiErrorMessage({
      message: "",
      error: { code: "POSTING_ERROR", detail: {} },
    }, "Invoice generation failed.")).toBe("Invoice generation failed.");
  });
});
