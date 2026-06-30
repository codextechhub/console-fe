// Financial-statement report types — mirror the JSON the vs_finance report
// views emit. Money is the `{kobo, naira}` pair these endpoints return (not a
// bare integer), so the UI can show either without re-deriving.

export interface ReportMoney {
  kobo: number;
  naira: string;
}

export interface TrialBalanceRow {
  account_id: number;
  code: string;
  name: string;
  account_type: string;
  debit: ReportMoney;
  credit: ReportMoney;
}

// Analytics slice — net activity per account, bucketed by one axis (a cost centre
// or a dimension). Reads posted journal lines, so it can answer "per bucket".
export interface AnalyticsSliceRow {
  bucket: string;
  account_id: number;
  code: string;
  name: string;
  account_type: string;
  debit: ReportMoney;
  credit: ReportMoney;
  net: ReportMoney;
}

export interface AnalyticsSlice {
  entity: string;
  period: string | null;
  axis: string;
  rows: AnalyticsSliceRow[];
  bucket_totals: Record<string, ReportMoney>;
  total_net: ReportMoney;
}

export interface TrialBalance {
  entity: string;
  period: string | null;
  rows: TrialBalanceRow[];
  total_debit: ReportMoney;
  total_credit: ReportMoney;
  is_balanced: boolean;
}

export interface StatementLine {
  account_id: number;
  code: string;
  name: string;
  account_type: string;
  amount: ReportMoney;
}

export interface IncomeStatement {
  entity: string;
  period: string | null;
  income: StatementLine[];
  expense: StatementLine[];
  total_income: ReportMoney;
  total_expense: ReportMoney;
  net_income: ReportMoney;
}

export interface ArAgingRow {
  customer_id: number;
  code: string;
  name: string;
  buckets: Record<string, ReportMoney>;
  outstanding: ReportMoney;
  unallocated_credit: ReportMoney;
  net: ReportMoney;
}

export interface ArAging {
  entity: string;
  as_of: string;
  rows: ArAgingRow[];
  bucket_totals: Record<string, ReportMoney>;
  total_net: ReportMoney;
}

export interface BalanceSheet {
  entity: string;
  as_of: string;
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  total_assets: ReportMoney;
  total_liabilities: ReportMoney;
  retained_earnings: ReportMoney;
  total_equity: ReportMoney;
  is_balanced: boolean;
}

export interface CashFlow {
  entity: string;
  period: string | null;
  opening_cash: ReportMoney;
  closing_cash: ReportMoney;
  by_activity: Record<string, ReportMoney>;
  net_change: ReportMoney;
  is_reconciled: boolean;
}

export interface EquityColumn {
  key: string;
  label: string;
  code: string;
  account_id: number;
  opening: ReportMoney;
  profit: ReportMoney;
  contributions: ReportMoney;
  closing: ReportMoney;
}

export interface ChangesInEquity {
  entity: string;
  period: string | null;
  as_of: string;
  columns: EquityColumn[];
  total_opening: ReportMoney;
  total_profit: ReportMoney;
  total_contributions: ReportMoney;
  total_closing: ReportMoney;
  balance_sheet_equity: ReportMoney;
  is_reconciled: boolean;
}

export interface ReportParams {
  entity: string;
  period?: string | number;
  as_of?: string;
}

// ── Finance overview dashboard (aggregated) ──────────────────────────────────
export interface DashboardKpi {
  value: ReportMoney;
  delta_pct: number | null;
  spark: number[];
}

export interface BudgetLineMetric {
  actual: ReportMoney;
  plan: ReportMoney;
  pct_of_plan: number | null;
}

export interface FinanceDashboard {
  entity: string;
  fiscal_year: string | null;
  period: string | null;
  as_of: string;
  kpis: {
    cash_position: DashboardKpi;
    receivables: DashboardKpi;
    payables: DashboardKpi;
    net_income_ytd: DashboardKpi;
  };
  revenue_vs_budget: {
    has_budget: boolean;
    budget_name: string | null;
    revenue: BudgetLineMetric;
    expense: BudgetLineMetric;
    net: { actual: ReportMoney; delta_pct: number | null };
  };
  ar_aging: {
    buckets: { key: string; pct: number; amount: ReportMoney }[];
    total: ReportMoney;
  };
  trend: { labels: string[]; issued: number[]; collected: number[] };
  top_overdue: {
    customer: string;
    customer_code: string;
    reference: string;
    amount: ReportMoney;
    days_overdue: number;
  }[];
  vendor_due: {
    vendor: string;
    reference: string;
    due_date: string;
    amount: ReportMoney;
    days_until: number;
  }[];
  approvals: { items: { label: string; count: number }[]; total: number };
  close_progress: {
    period: string;
    done: number;
    total: number;
    checks: { name: string; passed: boolean; blocking: boolean }[];
  } | null;
  recent_journals: {
    document_number: string;
    date: string;
    source: string;
    narration: string;
    amount: ReportMoney;
    status: string;
    created_by: string;
  }[];
}
