import { describe, expect, it } from "vitest";
import type { WorkflowInstanceDetail } from "@/redux/services/dashboard/workflow-types";
import { sourceDocumentLink, sourceDocumentPrompt } from "./source-document-link";

function instance(
  documentType: string,
  title = "DOC-001",
  storedLink = "/wrong/route/1/",
): WorkflowInstanceDetail {
  return {
    document_type: documentType,
    document_summary: { title, link: storedLink },
  } as WorkflowInstanceDetail;
}

describe("sourceDocumentLink", () => {
  it.each([
    ["finance.journal", "/finance/ledger?search=DOC-001"],
    ["finance.refund", "/finance/receivables/refunds?search=DOC-001"],
    ["finance.write_off", "/finance/receivables/refunds?search=DOC-001"],
    ["finance.concession", "/finance/receivables/concessions?search=DOC-001"],
    ["finance.credit_note", "/finance/receivables/credit-notes?search=DOC-001"],
    ["finance.expense_claim", "/finance/expenses/claims?document=42"],
    ["payments.payout_batch", "/finance/payments/batches?document=42"],
    ["procurement.requisition", "/procurement/requisitions?document=42"],
    ["procurement.purchase_order", "/procurement/purchase-orders?document=42"],
    ["procurement.vendor_invoice", "/procurement/vendor-invoices?document=42"],
    ["procurement.vendor_payment", "/procurement/vendor-payments?document=42"],
  ])("repairs a stored route for %s", (documentType, expected) => {
    const value = instance(documentType) as WorkflowInstanceDetail & { document_object_id: string };
    value.document_object_id = "42";
    expect(sourceDocumentLink(value)).toBe(expected);
  });

  it("preserves a handler link for document types without a console mapping", () => {
    expect(sourceDocumentLink(instance("custom.request", "REQ-1", "/custom/requests/1")))
      .toBe("/custom/requests/1");
  });

  it("preserves a current entity-scoped procurement link from the handler", () => {
    const value = instance(
      "procurement.requisition",
      "PR-0042",
      "/procurement/requisitions?document=42&entity=TES",
    );

    expect(sourceDocumentLink(value)).toBe(
      "/procurement/requisitions?document=42&entity=TES",
    );
  });

  it("returns null when no source route is available", () => {
    expect(sourceDocumentLink(instance("custom.request", "REQ-1", ""))).toBeNull();
  });
});

describe("sourceDocumentPrompt", () => {
  it("keeps decision guidance for an active approval", () => {
    expect(sourceDocumentPrompt("IN_PROGRESS")).toEqual({
      title: "Review the source document",
      description: "Open the complete record in its originating module before making a decision.",
    });
  });

  it("describes an approved record without asking for a decision", () => {
    const prompt = sourceDocumentPrompt("APPROVED");

    expect(prompt.title).toBe("View the approved document");
    expect(prompt.description).toBe(
      "Open the complete source record to review the approved document.",
    );
    expect(prompt.description).not.toContain("decision");
  });
});
