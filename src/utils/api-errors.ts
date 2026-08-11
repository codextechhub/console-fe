/**
 * Pull the user-facing explanation from the platform's error envelope.
 *
 * Typed domain failures use the top-level `message` as their complete,
 * actionable explanation and keep machine context under `error.code/detail`.
 * DRF request-validation failures use `REQUEST_ERROR` and put the useful
 * field-level message in `error.detail`, so those deliberately prefer detail.
 *
 * Never inspect the whole `error` object for a string: its first string is often
 * the machine code (`POSTING_ERROR`, `PERIOD_CLOSED`, …), which must not be shown
 * to a user as the explanation.
 */
export function apiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const envelope = unwrapErrorEnvelope(error);
  const errorObject = asRecord(envelope?.error);
  const code = typeof errorObject?.code === "string" ? errorObject.code : "";
  const message = typeof envelope?.message === "string" ? envelope.message.trim() : "";
  const detail = extractFirstDetail(errorObject?.detail);

  if (code && code !== "REQUEST_ERROR") return message || detail || fallback;
  return detail || message || fallback;
}

export function apiFieldError(error: unknown, field: string): string | null {
  const envelope = unwrapErrorEnvelope(error);
  const errorObject = asRecord(envelope?.error);
  const detail = asRecord(errorObject?.detail);
  return extractFirstDetail(detail?.[field]);
}

function unwrapErrorEnvelope(error: unknown): Record<string, unknown> | null {
  const record = asRecord(error);
  const nested = asRecord(record?.data);
  return nested ?? record;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function extractFirstDetail(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    for (const item of detail) {
      const found = extractFirstDetail(item);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(detail);
  if (record) {
    for (const value of Object.values(record)) {
      const found = extractFirstDetail(value);
      if (found) return found;
    }
  }
  return null;
}
