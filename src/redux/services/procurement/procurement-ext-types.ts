// Procurement analytics report shapes (§7.5). Money fields are the backend's
// `{kobo, naira}` pair (same as the vs_finance reports) — read `.kobo`.

import type { ReportMoney } from "../finance/reports-types";

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
