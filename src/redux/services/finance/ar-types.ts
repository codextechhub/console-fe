// Accounts-Receivable types — mirror the vs_finance AR serializers. Money kobo.

export type InvoiceStatus = "DRAFT" | "POSTED" | "REVERSED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface Invoice {
  id: number;
  document_number: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  amount_paid: number;
  balance_due: number;
  reference: string;
  narration: string;
}

export interface CreditNoteLine {
  id: number;
  line_no: number;
  description: string;
  revenue_account: string;
  quantity: string;
  unit_price: number;
  tax_code: string | null;
  net_amount: number;
  tax_amount: number;
}

export interface CreditNote {
  id: number;
  document_number: string;
  kind: "CREDIT" | "DEBIT";
  customer_id: number;
  customer_code: string;
  customer_name: string;
  invoice_id: number | null;
  note_date: string;
  status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  allocated_amount: number;
  unallocated_amount: number;
  reason: string;
  reference: string;
  lines: CreditNoteLine[];
}

export interface Refund {
  id: number;
  document_number: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  refund_date: string;
  method: string;
  status: string;
  amount: number;
  amount_naira: string;
  bank_account_id: number | null;
  reference: string;
  narration: string;
}

export interface Concession {
  id: number;
  document_number: string;
  kind: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  invoice_id: number | null;
  invoice_number: string | null;
  concession_date: string;
  status: string;
  amount: number;
  amount_naira: string;
  allowance_account: string | null;
  reason: string;
  reference: string;
}

export interface PaymentPlanInstallment {
  id: number;
  seq_no: number;
  due_date: string;
  amount: number;
  amount_settled: number;
  balance: number;
  status: string;
}

export interface PaymentPlan {
  id: number;
  document_number: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  invoice_id: number | null;
  invoice_number: string | null;
  plan_status: string;
  start_date: string;
  frequency: string;
  installment_count: number;
  total_amount: number;
  total_naira: string;
  scheduled_total: number;
  settled_total: number;
  outstanding_total: number;
  notes: string;
  installments: PaymentPlanInstallment[];
}

export interface DunningNotice {
  id: number;
  document_number: string;
  customer_code: string;
  customer_name: string;
  invoice_number: string;
  policy_name: string | null;
  level: number;
  notice_date: string;
  days_overdue: number;
  amount_due: number;
  amount_due_naira: string;
  channel: string;
  message: string;
  notice_status: string;
  sent_at: string | null;
}

export interface InvoiceListParams {
  entity: string;
  page?: number;
  status?: InvoiceStatus;
  payment_status?: PaymentStatus;
  bucket?: string;
  search?: string;
}

type ArMoney = { kobo: number; naira: string };

export interface InvoiceDetail {
  invoice: Invoice;
  summary: { subtotal: ArMoney; tax: ArMoney; total: ArMoney; paid: ArMoney; balance: ArMoney; due_date: string | null };
  lines: { description: string; account_code: string; account_name: string; quantity: string; unit_price: ArMoney; tax_code: string | null; tax_amount: ArMoney; line_total: ArMoney }[];
  payments: { date: string; reference: string; method: string; amount: ArMoney }[];
  gl_postings: { account_code: string; account_name: string; debit: ArMoney; credit: ArMoney }[];
  reminders: { date: string; level: number | null; channel: string; status: string }[];
  activity: { date: string; label: string }[];
}

export interface InvoiceSummary {
  kpis: {
    total_invoiced: { kobo: number; naira: string };
    total_collected: { kobo: number; naira: string };
    collection_rate: number;
    overdue_balance: { kobo: number; naira: string };
  };
  by_status: { draft: number; issued: number; partial: number; paid: number; overdue: number; total: number };
  totals: { count: number; total: { kobo: number; naira: string }; outstanding: { kobo: number; naira: string } };
  monthly: { label: string; invoiced: number; collected: number }[];
}

// Customers / payers — the AR sub-ledger party (mirrors CustomerSerializer).
export type CustomerAccountStatus = "ACTIVE" | "OVERDUE" | "CREDIT";

export interface Customer {
  id: number;
  code: string;
  name: string;
  billing_email: string;
  billing_phone: string;
  billing_address: string;
  receivable_account_code: string | null;
  receivable_account_name: string | null;
  opening_balance: number;
  opening_balance_naira: string;
  source_type: string;
  source_id: string;
  is_active: boolean;
  // Enriched on the list endpoint: net AR position (signed kobo; + owes, − credit).
  balance?: number;
  balance_naira?: string;
  account_status?: CustomerAccountStatus;
}

// Customer receipts + allocation (Receipts & Allocation screen).
export type PaymentAllocationStatus = "ALLOCATED" | "PARTIAL" | "UNALLOCATED";

export interface Payment {
  id: number;
  document_number: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  payment_date: string;
  method: string;
  amount: number;
  amount_naira: string;
  allocated_amount: number;
  unallocated_amount: number;
  allocation_status: PaymentAllocationStatus;
  deposit_account_code: string | null;
  deposit_account_name: string | null;
  reference: string;
  narration: string;
  journal_id: number | null;
  status: string;
}

export interface PaymentDetail {
  payment: Payment;
  allocations: { invoice: string; invoice_id: number; amount: ArMoney }[];
  open_invoices: { id: number; document_number: string; due_date: string | null; balance: ArMoney }[];
  gl_postings: { account_code: string; account_name: string; debit: ArMoney; credit: ArMoney }[];
}

export interface CustomerDetail {
  customer: Customer;
  summary: {
    current_balance: ArMoney; lifetime_paid: ArMoney;
    open_invoice_count: number; account_status: CustomerAccountStatus;
  };
  open_invoices: { document_number: string; invoice_date: string; due_date: string | null; total: ArMoney; balance: ArMoney; status: string }[];
  transactions: { date: string; type: "INVOICE" | "PAYMENT"; reference: string; amount: ArMoney; status: string }[];
  statement: { date: string | null; description: string; debit: ArMoney; credit: ArMoney; balance: ArMoney }[];
}

// Fee structures — billing catalogue rolled up into invoices.
export interface FeeItem {
  id: number;
  line_no: number;
  description: string;
  revenue_account_code: string;
  amount: number;
  amount_naira: string;
  tax_code_value: string | null;
}

export interface FeeStructure {
  id: number;
  code: string;
  name: string;
  term: string;
  description: string;
  is_active: boolean;
  items: FeeItem[];
  total: number;
  total_naira: string;
}
