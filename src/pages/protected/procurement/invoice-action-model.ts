/** Match states the backend requires an explicit audited override to post. */
export const isBlockingInvoiceVariance = (matchStatus: string) =>
  matchStatus === "UNDER_RECEIVED" || matchStatus === "OVER_BILLED";
