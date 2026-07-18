// Procurement analytics report shapes (§7.5). Money fields are the backend's
// `{kobo, naira}` pair (same as the vs_finance reports) — read `.kobo`.

import type { ReportMoney } from "../finance/reports-types";

export type ProcurementApprovalAction = "APPROVED" | "REJECTED" | "RETURNED";

export interface ProcurementApprovalRow {
  id: string;
  document_type: string;
  document_type_label: string;
  document_id: number;
  reference: string;
  title: string;
  requester: string;
  amount: number;
  currency: string;
  submitted_at: string | null;
  awaiting_since: string | null;
  stage: string;
  status: string;
  on_behalf_of: string | null;
}

export interface ProcurementApprovalStageAction {
  id: string;
  action: ProcurementApprovalAction;
  actor: string;
  on_behalf_of: string | null;
  comment: string;
  acted_at: string;
  attempt: number;
  is_reversal: boolean;
  reversed_at: string | null;
}

export interface ProcurementApprovalStage {
  id: string;
  label: string;
  status: string;
  on_rejection: "TERMINAL" | "RETURN_TO_REQUESTER";
  advance_rule: "ANY" | "QUORUM" | "UNANIMOUS";
  quorum_count: number | null;
  eligible_count: number;
  activated_at: string | null;
  resolved_at: string | null;
  skip_reason: string;
  attempt: number;
  actions: ProcurementApprovalStageAction[];
}

export interface ProcurementApprovalDetail extends ProcurementApprovalRow {
  document_status: string;
  approval_state: string;
  next_stage: { label: string | null; is_final: boolean } | null;
  stages: ProcurementApprovalStage[];
  activity: {
    id: string;
    event_type: string;
    actor: string | null;
    message: string;
    occurred_at: string;
  }[];
}

export interface ProcurementDashboard {
  entity: string;
  currency: string;
  as_of: string;
  month_start: string;
  kpis: {
    total_spend_mtd: { value: ReportMoney; prior_value: ReportMoney; delta_pct: number | null };
    open_purchase_orders: { count: number; partial_count: number };
    pending_approvals: { count: number };
    overdue_invoices: { count: number; amount: ReportMoney };
    active_vendors: { count: number; on_hold_count: number };
  };
  spend_by_category: {
    total: ReportMoney;
    items: { key: string; label: string; amount: ReportMoney }[];
  };
  purchase_order_status: {
    items: { key: string; label: string; count: number }[];
  };
  monthly_spend_trend: { labels: string[]; values: number[] };
  recent_activity: {
    id: number;
    action: string;
    label: string;
    summary: string;
    reference: string;
    actor: string;
    occurred_at: string;
  }[];
  approvals_awaiting_user: {
    workflow_id: string;
    document_type: string;
    document_id: number;
    reference: string;
    title: string;
    requester: string;
    amount: ReportMoney;
    stage: string;
    awaiting_since: string | null;
    on_behalf_of: string | null;
  }[];
}

export interface ApAgingRow {
  vendor_id: number;
  code: string;
  name: string;
  buckets: Record<string, ReportMoney>;
  outstanding: ReportMoney;
  unallocated_credit: ReportMoney;
  net: ReportMoney;
}
export interface ApAging {
  entity: string;
  as_of: string;
  buckets: string[];
  rows: ApAgingRow[];
  bucket_totals: Record<string, ReportMoney>;
  total_net: ReportMoney;
}

export interface ApReconciliation {
  entity: string;
  subledger_total: ReportMoney;
  control_total: ReportMoney;
  difference: ReportMoney;
  is_reconciled: boolean;
}

export interface GrirBalance {
  entity: string;
  grir_balance: ReportMoney;
  is_clear: boolean;
}

export interface SpendRow {
  code?: string;
  name?: string;
  net?: ReportMoney;
  gross?: ReportMoney;
  [k: string]: unknown;
}
export interface SpendAnalysis {
  entity: string;
  start_date: string | null;
  end_date: string | null;
  by_vendor: SpendRow[];
  by_category: SpendRow[];
  total_net: ReportMoney;
  total_tax: ReportMoney;
  total_gross: ReportMoney;
  invoice_count: number;
}

export interface VendorPerformanceRow {
  vendor_id: number;
  code: string;
  name: string;
  po_count: number;
  total_ordered: ReportMoney;
  receipt_count: number;
  on_time_receipts: number;
  late_receipts: number;
  on_time_rate: number;
  invoice_count: number;
  total_billed: ReportMoney;
  payment_count: number;
  total_paid: ReportMoney;
  avg_payment_days: number;
}
export interface VendorPerformance {
  entity: string;
  start_date: string | null;
  end_date: string | null;
  rows: VendorPerformanceRow[];
}

export interface SettlementReconciliation {
  unmatched_bank_total?: number;
  unmatched_bank_count?: number;
  [k: string]: unknown;
}
