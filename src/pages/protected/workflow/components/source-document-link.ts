import { routesPath } from "@/routes/routes-path";
import type {
  WorkflowInstanceDetail,
  WorkflowInstanceStatus,
} from "@/redux/services/dashboard/workflow-types";

const F = routesPath.PROTECTED.FINANCE;

const SOURCE_DOCUMENT_ROUTES: Record<string, string> = {
  "finance.journal": F.LEDGER,
  "finance.refund": `${F.RECEIVABLES}/refunds`,
  "finance.write_off": `${F.RECEIVABLES}/refunds`,
  "finance.concession": `${F.RECEIVABLES}/concessions`,
  "finance.credit_note": `${F.RECEIVABLES}/credit-notes`,
  "payments.payout_batch": `${F.PAYMENTS}/batches`,
};

const SOURCE_DOCUMENT_PROMPTS: Record<
  WorkflowInstanceStatus,
  { title: string; description: string }
> = {
  DRAFT: {
    title: "View the draft document",
    description: "Open the source record to review the draft document.",
  },
  SUBMITTED: {
    title: "Review the source document",
    description: "Open the complete record in its originating module while this approval is pending.",
  },
  IN_PROGRESS: {
    title: "Review the source document",
    description: "Open the complete record in its originating module before making a decision.",
  },
  RETURNED: {
    title: "View the returned document",
    description: "Open the source record to review the document returned for correction.",
  },
  APPROVED: {
    title: "View the approved document",
    description: "Open the complete source record to review the approved document.",
  },
  REJECTED: {
    title: "View the rejected document",
    description: "Open the source record to review the rejected document and its current state.",
  },
  WITHDRAWN: {
    title: "View the withdrawn document",
    description: "Open the source record to review the document after withdrawal.",
  },
  CANCELLED: {
    title: "View the cancelled document",
    description: "Open the source record to review the cancelled document and its current state.",
  },
};

export function sourceDocumentPrompt(status: WorkflowInstanceStatus) {
  return SOURCE_DOCUMENT_PROMPTS[status];
}

/**
 * Resolve the console route for a workflow's source document.
 *
 * Finance handlers historically stored API-shaped detail paths in the workflow
 * snapshot. Those paths are not console routes and therefore render the app's
 * 404 page. Known document types are resolved from the frontend route contract
 * so existing snapshots are repaired as well as newly submitted approvals.
 */
export function sourceDocumentLink(instance: WorkflowInstanceDetail): string | null {
  const route = SOURCE_DOCUMENT_ROUTES[instance.document_type];
  if (route) {
    if (instance.document_type === "payments.payout_batch") {
      return `${route}?document=${encodeURIComponent(String(instance.document_object_id))}`;
    }
    const reference = instance.document_summary?.title?.trim();
    return reference ? `${route}?search=${encodeURIComponent(reference)}` : route;
  }

  return instance.document_summary?.link || null;
}
