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

/** Balance sheet / cash flow / changes-in-equity share a sectioned shape; kept
 *  loose here and refined when those screens ship (slice 4). */
export interface SectionedReport {
  entity: string;
  period: string | null;
  [key: string]: unknown;
}

export interface ReportParams {
  entity: string;
  period?: string | number;
  as_of?: string;
}
