// Finance operations types (banking, expenses, petty cash, payroll, budgets,
// fixed assets, tax) — mirror the vs_finance serializers. Money is kobo. FLS
// fields are optional + carry _stripped_fields when stripped.

// ── Banking ──────────────────────────────────────────────────────────────────
export interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  account_number?: string; // FLS — finance.bankaccount.view_sensitive
  gl_account: string;
  gl_account_id: number;
  currency: string | null;
  is_active: boolean;
  _stripped_fields?: string[];
}

export interface BankStatementLine {
  id: number;
  bank_account_id: number;
  txn_date: string;
  description: string;
  reference: string;
  amount: number;
  amount_naira: string;
  status: string;
  matched_line_id: number | null;
  adjusting_journal_id: number | null;
  external_id: string;
  reconciled_at: string | null;
}

// ── Expense claims ───────────────────────────────────────────────────────────
export interface ExpenseClaimLine {
  id: number;
  line_no: number;
  description: string;
  expense_account: string;
  quantity: string;
  unit_price: number;
  tax_code: string | null;
  net_amount: number;
  tax_amount: number;
  line_total: number;
  cost_center: string | null;
}

export interface ExpenseClaim {
  id: number;
  document_number: string;
  claimant_id: number | null;
  claimant_name: string;
  claim_date: string;
  title: string;
  narration: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  amount_paid: number;
  balance_due: number;
  journal_id: number | null;
  lines: ExpenseClaimLine[];
}

// ── Petty cash ───────────────────────────────────────────────────────────────
export interface PettyCashFund {
  id: number;
  name: string;
  gl_account: string;
  gl_account_id: number;
  custodian_id: number | null;
  custodian_name: string;
  custodian_label: string;
  float_amount: number;
  float_amount_naira: string;
  current_balance: number;
  current_balance_naira: string;
  shortfall: number;
  currency: string | null;
  last_replenished_at: string | null;
  is_active: boolean;
}

export interface PettyCashVoucher {
  id: number;
  document_number: string;
  fund_id: number;
  voucher_date: string;
  payee: string;
  spent_by_id: number | null;
  narration: string;
  reference: string;
  status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  journal_id: number | null;
}

// ── Payroll (FLS on per-employee figures) ────────────────────────────────────
export interface PayrollLine {
  id: number;
  line_no: number;
  employee_id: number | null;
  employee_name?: string; // FLS
  gross_amount?: number; // FLS
  paye_amount?: number; // FLS
  pension_amount?: number; // FLS
  net_amount?: number; // FLS
  cost_center: string | null;
  _stripped_fields?: string[];
}

export interface PayrollRun {
  id: number;
  document_number: string;
  pay_date: string;
  period_label: string;
  narration: string;
  run_status: string;
  status: string;
  gross_total: number;
  paye_total: number;
  pension_total: number;
  net_total: number;
  net_total_naira: string;
  bank_account_id: number | null;
  journal_id: number | null;
  disbursement_journal_id: number | null;
  lines: PayrollLine[];
}

// ── Budgets ──────────────────────────────────────────────────────────────────
export interface BudgetLine {
  id: number;
  account: string;
  account_id: number;
  cost_center: string | null;
  period_no: number;
  amount: number;
}

export interface Budget {
  id: number;
  name: string;
  fiscal_year: number;
  fiscal_year_id: number;
  status: string;
  is_locked: boolean;
  approved_at: string | null;
  lines: BudgetLine[];
}

// ── Fixed assets ─────────────────────────────────────────────────────────────
export interface DepreciationScheduleRow {
  id: number;
  seq: number;
  depreciation_date: string;
  amount: number;
  is_posted: boolean;
  journal_id: number | null;
  posted_at: string | null;
}

export interface FixedAsset {
  id: number;
  document_number: string;
  name: string;
  asset_code: string;
  acquisition_date: string;
  cost: number;
  cost_naira: string;
  salvage_value: number;
  useful_life_months: number;
  method: string;
  asset_status: string;
  status: string;
  accumulated_depreciation: number;
  net_book_value: number;
  depreciable_base: number;
  acquisition_journal_id: number | null;
  schedule: DepreciationScheduleRow[];
}

// ── Tax ──────────────────────────────────────────────────────────────────────
export interface TaxObligation {
  id: number;
  code: string;
  name: string;
  obligation_type: string;
  liability_account: string;
  authority_name: string;
  frequency: string;
  filing_day: number;
  is_active: boolean;
}

export interface TaxFiling {
  id: number;
  document_number: string;
  obligation_id: number;
  obligation_code: string;
  obligation_type: string;
  authority_name: string;
  period_start: string;
  period_end: string;
  due_date: string | null;
  filing_status: string;
  status: string;
  gross_liability: number;
  recoverable_amount: number;
  adjustment_amount: number;
  amount_due: number;
  amount_due_naira: string;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  filing_reference: string;
  filed_at: string | null;
  narration: string;
}
