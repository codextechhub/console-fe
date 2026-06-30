// Setup / master-data + close types — mirror the vs_finance serializers.

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  is_contra: boolean;
  is_postable: boolean;
  is_active: boolean;
  parent_id: number | null;
  parent_code: string | null;
  subtype: string;
  // Present only on the chart-of-accounts (?with_balance=true) response.
  balance?: { kobo: number; naira: string } | null;
  tag?: "CONTROL" | "CASH" | null;
}

export interface AccountActivityLine {
  date: string;
  journal_no: string;
  source: string;
  description: string;
  cost_center: string;
  debit: { kobo: number; naira: string };
  credit: { kobo: number; naira: string };
  running_balance: { kobo: number; naira: string };
}

export interface AccountDetail {
  account: Account;
  type_label: string;
  summary: {
    current_balance: { kobo: number; naira: string };
    opening_balance: { kobo: number; naira: string };
    line_count: number;
    journal_count: number;
  };
  activity: AccountActivityLine[];
}

export interface FiscalPeriod {
  id: number;
  period_no: number;
  name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: "OPEN" | "SOFT_CLOSED" | "CLOSED" | "LOCKED";
  closed_at: string | null;
}

export interface ChecklistItem {
  name: string;
  passed: boolean;
  blocking: boolean;
  detail: string;
}

export interface PeriodChecklist {
  period: FiscalPeriod;
  passed: boolean;
  done: number;
  total: number;
  items: ChecklistItem[];
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  minor_unit: number;
  is_active: boolean;
}

export interface FxRate {
  id: number;
  base: string;
  quote: string;
  rate: string;
  as_of: string;
  source: string;
}

export interface TaxCode {
  id: number;
  code: string;
  name: string;
  rate_bps: number;
  is_recoverable: boolean;
  collected_account: string | null;
  paid_account: string | null;
  is_active: boolean;
}

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  parent_code: string | null;
  is_active: boolean;
}

// Analytical axis (e.g. FUND, PROJECT) with a constrained value list, tagged on
// journal lines and sliced by the analytics-slice report.
export interface Dimension {
  id: number;
  code: string;
  name: string;
  allowed_values: string[];
  is_active: boolean;
}

export interface FinanceAuditLog {
  id: number;
  action: string;
  status: string;
  actor: string | null;
  target_type: string;
  target_id: number | null;
  document_number: string | null;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CloseChecklistItem {
  name: string;
  passed: boolean;
  blocking: boolean;
  detail: string;
}

export interface PeriodCloseResult {
  period: FiscalPeriod;
  checklist: { passed: boolean; items: CloseChecklistItem[] };
}
