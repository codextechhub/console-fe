import { describe, expect, it } from "vitest";

import { P } from "@/permissions";
import { DOCUMENT_VOID_CONFIG } from "./document-void-config";

describe("document void actions", () => {
  it("routes every supported document to its own endpoint and reverse permission", () => {
    expect(DOCUMENT_VOID_CONFIG).toMatchObject({
      INVOICE: { resource: "invoices", permission: P.FIN_REVERSE_INVOICE },
      PAYMENT: { resource: "payments", permission: P.FIN_REVERSE_PAYMENT },
      CREDIT_NOTE: { resource: "credit-notes", permission: P.FIN_REVERSE_CREDIT_NOTE },
      REFUND: { resource: "refunds", permission: P.FIN_REVERSE_REFUND },
      CONCESSION: { resource: "concessions", permission: P.FIN_REVERSE_CONCESSION },
    });
  });
});
