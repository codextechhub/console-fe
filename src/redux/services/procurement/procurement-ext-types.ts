// Procurement analytics report shapes (§7.5). NOTE: unlike the vs_finance
// reports (which emit {kobo,naira}), these emit BARE integer kobo — render with
// <Money kobo=…/>.

export interface ApAgingRow {
  vendor_id: number;
  code: string;
  name: string;
  buckets: Record<string, number>;
  outstanding: number;
  unallocated_credit: number;
  net: number;
}
export interface ApAging {
  entity: string;
  as_of: string;
  buckets: string[];
  rows: ApAgingRow[];
  bucket_totals: Record<string, number>;
  total_net: number;
}

export interface ApReconciliation {
  entity: string;
  subledger_total: number;
  control_total: number;
  difference: number;
  is_reconciled: boolean;
}

export interface GrirBalance {
  entity: string;
  grir_balance: number;
  is_clear: boolean;
}

export interface SpendRow {
  key?: string;
  code?: string;
  name?: string;
  net?: number;
  gross?: number;
  [k: string]: unknown;
}
export interface SpendAnalysis {
  entity: string;
  start_date: string | null;
  end_date: string | null;
  by_vendor: SpendRow[];
  by_category: SpendRow[];
  total_net: number;
  total_tax: number;
  total_gross: number;
  invoice_count: number;
}

export interface VendorPerformanceRow {
  vendor_id: number;
  code: string;
  name: string;
  po_count: number;
  total_ordered: number;
  receipt_count: number;
  on_time_receipts: number;
  late_receipts: number;
  on_time_rate: number;
  invoice_count: number;
  total_billed: number;
  payment_count: number;
  total_paid: number;
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
