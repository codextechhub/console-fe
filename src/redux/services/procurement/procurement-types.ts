// vs_procurement types - mirror the serializers. Money is integer kobo. Vendor
// bank fields are FLS-stripped unless procurement.vendor.view_sensitive.

export interface VendorCategory {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  parent_code: string | null;
  parent_name: string | null;
  level: 1 | 2 | 3;
  default_expense_account_id: number | null;
  default_expense_code: string | null;
  is_active: boolean;
  vendor_count: number;
  child_count: number;
  catalog_item_count: number;
}

export interface VendorCategoryInsight {
  category_id: number;
  spend_mtd: number;
  spend_prior_month: number;
  spend_ytd: number;
}

export interface Vendor {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  category_code: string | null;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  bank_name?: string; // FLS
  bank_account_number?: string; // FLS
  bank_account_name?: string; // FLS
  payable_account_id?: number | null;
  payable_code?: string | null;
  default_expense_account_id?: number | null;
  default_expense_code?: string | null;
  default_wht_tax_code_id?: number | null;
  default_wht_tax_code_value?: string | null;
  payment_terms: string;
  kyc_status: string;
  risk: string;
  on_hold: boolean;
  is_active: boolean;
  active_po_count?: number;
  _stripped_fields?: string[];
}

export interface VendorSummary {
  active: number;
  inactive: number;
  on_hold: number;
  kyc_pending: number;
  total_spend_ytd: number;
  average_payment_days: number | null;
}

export interface VendorInsights {
  spend_ytd: number;
  invoice_count: number;
  po_count: number;
  total_ordered: number;
  receipt_count: number;
  on_time_receipts: number;
  late_receipts: number;
  on_time_rate: number | null;
  payment_count: number;
  total_paid: number;
  average_payment_days: number | null;
}

export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  description: string;
  unit_of_measure: string;
  category_id: number | null;
  category_code: string | null;
  category_name: string | null;
  category_level: 1 | 2 | 3 | null;
  category_path: string | null;
  preferred_vendor_id: number | null;
  preferred_vendor_code: string | null;
  preferred_vendor_name: string | null;
  default_expense_account_id: number | null;
  expense_code: string | null;
  expense_name: string | null;
  default_tax_code_id: number | null;
  tax_code: string | null;
  tax_name: string | null;
  lead_time_days: number | null;
  standard_unit_price: number;
  standard_unit_price_naira: string;
  is_active: boolean;
  stock_status: "NOT_TRACKED" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | null;
}

export interface CatalogItemInsights {
  usage: { requisition_line_count: number; stock_item_count: number };
  vendor_pricing: Array<{
    vendor_id: number;
    vendor_code: string;
    vendor_name: string;
    order_count: number;
    total_quantity: string;
    minimum_unit_price: number;
    maximum_unit_price: number;
    latest_order_date: string;
  }>;
  purchase_history: Array<{
    purchase_order_id: number;
    document_number: string;
    vendor_code: string;
    vendor_name: string;
    order_date: string;
    quantity: string;
    unit_price: number;
  }>;
}

// ── P2P chain ────────────────────────────────────────────────────────────────
export interface RequisitionLine {
  id: number;
  line_no: number;
  catalog_item_id: number | null;
  description: string;
  quantity: string;
  unit: string;
  estimated_unit_price: number;
  expense_code: string | null;
  estimated_line_total: number;
}
export interface Requisition {
  id: number;
  document_number: string;
  status: string;
  approval_state: string;
  title: string;
  request_date: string;
  needed_by: string | null;
  requested_by_id: number | null;
  requested_by_name: string;
  cost_center_id: number | null;
  cost_center_code: string | null;
  cost_center_name: string | null;
  justification: string;
  estimated_total: number;
  estimated_total_naira: string;
  created_at: string;
  workflow_instance_id?: string | null;
  lines: RequisitionLine[];
}

export interface RequisitionSummary {
  as_of: string;
  pending_approval: { count: number; amount: number };
  approved_mtd: { count: number; amount: number; change: number };
  draft: { count: number; amount: number };
  total_value_mtd: { amount: number; change_pct: number | null };
}

export interface RequisitionBudgetAvailability {
  has_budget: boolean;
  period: string | null;
  budget: number;
  committed: number;
  available: number;
}

export interface POLine {
  id: number;
  line_no: number;
  description: string;
  expense_code: string;
  quantity: string;
  unit_price: number;
  tax_code_id: number | null;
  net_amount: number;
  tax_amount: number;
  received_qty: string;
  invoiced_qty: string;
}
export interface POReceiptDocument {
  id: number;
  document_number: string;
  received_date: string;
  status: string;
  item_count: number;
}
export interface POInvoiceDocument {
  id: number;
  document_number: string;
  invoice_date: string;
  total: number;
  status: string;
  match_status: string;
}
export interface PurchaseOrder {
  id: number;
  document_number: string;
  status: string;
  approval_state: string;
  display_status: string;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  requisition_id: number | null;
  requisition_number: string | null;
  contract_id: number | null;
  contract_reference: string | null;
  quotation_number: string | null;
  order_date: string;
  expected_date: string | null;
  delivery_address: string;
  payment_terms: string;
  narration: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  received_pct: string;
  invoiced_pct: string;
  lines: POLine[];
  receipt_documents: POReceiptDocument[];
  invoice_documents: POInvoiceDocument[];
  workflow_instance_id?: string | null;
}

export interface PurchaseOrderSummary {
  as_of: string;
  open: { count: number; amount: number };
  partially_received: { count: number };
  awaiting_receipt: { count: number };
  po_value_mtd: { amount: number; change_pct: number | null };
}

export interface GRNLine {
  id: number;
  line_no: number;
  po_line_id: number;
  description: string;
  expense_code: string;
  accepted_qty: string;
  rejected_qty: string;
  expected_qty: string;
  unit_price: number;
  value_amount: number;
}
export interface GoodsReceipt {
  id: number;
  document_number: string;
  status: string;
  receipt_status: string;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  received_by_name: string;
  purchase_order_id: number | null;
  purchase_order_number: string | null;
  received_date: string;
  reference: string;
  narration: string;
  total_value: number;
  total_value_naira: string;
  journal_id: number | null;
  received_item_count: string;
  ordered_item_count: string;
  purchase_order_fulfilment_status: "AWAITING" | "PARTIAL" | "RECEIVED" | null;
  purchase_order_received_item_count: string | null;
  purchase_order_ordered_item_count: string | null;
  purchase_order_remaining_item_count: string | null;
  lines: GRNLine[];
}

export interface VendorInvoiceLine {
  id: number;
  line_no: number;
  po_line_id: number | null;
  grn_line_id: number | null;
  description: string;
  expense_code: string;
  quantity: string;
  unit_price: number;
  tax_code_id: number | null;
  net_amount: number;
  tax_amount: number;
}
export interface VendorInvoiceMatchComparison {
  invoice_line_id: number;
  description: string;
  po_line_id: number | null;
  po_quantity: string | null;
  received_quantity: string | null;
  previously_invoiced_quantity: string | null;
  invoice_quantity: string;
  po_unit_price: number | null;
  invoice_unit_price: number;
  grn_number: string | null;
  grn_accepted_quantity: string | null;
}
export interface VendorInvoicePaymentHistory {
  id: number;
  document_number: string;
  payment_date: string;
  amount: number;
  status: string;
}
export interface VendorInvoice {
  id: number;
  document_number: string;
  status: string;
  approval_state: string;
  match_status: string;
  payment_status: string;
  display_status: string;
  is_overdue: boolean;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  purchase_order_id: number | null;
  purchase_order_number: string | null;
  invoice_date: string;
  due_date: string | null;
  vendor_reference: string;
  narration: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  amount_paid: number;
  balance_due: number;
  journal_id: number | null;
  lines: VendorInvoiceLine[];
  workflow_instance_id?: string | null;
  match_comparisons?: VendorInvoiceMatchComparison[];
  payments?: VendorInvoicePaymentHistory[];
  posting_lines?: { account_code: string; account_name: string; debit: number; credit: number }[];
  activity?: { id: number; action: string; message: string; status: string; actor_name: string; created_at: string }[];
}

export interface VendorInvoiceSummary {
  as_of: string;
  under_review: { count: number };
  approved: { count: number };
  overdue: { count: number; amount: number };
  disputed: { count: number };
}

export interface VendorPaymentAllocation {
  id: number;
  vendor_invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  invoice_total: number;
  invoice_balance: number;
  invoice_payment_status: string;
  amount: number;
}
export interface VendorPaymentEligibleInvoice {
  id: number;
  document_number: string;
  vendor_id: number;
  vendor_code: string;
  invoice_date: string;
  due_date: string | null;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
}
export interface VendorPayment {
  id: number;
  document_number: string;
  status: string;
  approval_state: string;
  allocation_status: string;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  payment_date: string;
  method: string;
  gross_amount: number;
  wht_amount: number;
  net_amount: number;
  net_naira: string;
  allocated_amount: number;
  unallocated_amount: number;
  payment_account_id: number | null;
  payment_code: string | null;
  payment_account_name: string | null;
  bank_account_id: number | null;
  bank_account_name: string | null;
  wht_tax_code_id: number | null;
  wht_tax_code_value: string | null;
  reference: string;
  narration: string;
  journal_id: number | null;
  created_at: string;
  created_by_name: string;
  allocations: VendorPaymentAllocation[];
  workflow_instance_id?: string | null;
  posting_lines?: { account_code: string; account_name: string; debit: number; credit: number }[];
  activity?: { id: number; action: string; message: string; status: string; actor_name: string; created_at: string }[];
}

// ── Sourcing & contracts ─────────────────────────────────────────────────────
export interface ContractMilestone {
  id: number;
  line_no: number;
  name: string;
  due_date: string | null;
  amount: number;
  amount_naira: string;
  status: string;
  completed_date: string | null;
  note: string;
}
export interface VendorContract {
  id: number;
  reference: string;
  title: string;
  status: string;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  start_date: string | null;
  end_date: string | null;
  renewal_window_start: string | null;
  is_expired: boolean;
  contract_value: number;
  contract_value_naira: string;
  payment_terms: string;
  auto_renew: boolean;
  renewal_notice_days: number;
  renews_id: number | null;
  renews_reference: string | null;
  renewed_by_reference: string | null;
  notes: string;
  milestones: ContractMilestone[];
  // list rows only
  milestone_count?: number;
  // detail only
  activity?: SourcingActivity[];
}

export interface ContractSummary {
  active: number;
  expiring_soon: number;
  expired: number;
  total_active_value: number;
  total_active_value_naira: string;
}

export interface ContractLinkedPo {
  id: number;
  document_number: string;
  total: number;
  total_naira: string;
  status: string;
  order_date: string | null;
  // "linked" = explicit call-off against this contract; "association" = same-vendor PO in term.
  link_type: "linked" | "association";
}

// Sourcing activity feed row (finance-audit rows for one document).
export interface SourcingActivity {
  id: number;
  action: string;
  message: string;
  status: string;
  actor_name: string;
  created_at: string;
}

export interface RfqLine {
  id: number;
  line_no: number;
  description: string;
  quantity: string;
  requisition_line_id: number | null;
  expense_account_id: number | null;
  expense_code: string | null;
  tax_code_id: number | null;
}

// A received quotation as summarised inside the RFQ detail drawer.
export interface RfqQuotationSummary {
  id: number;
  document_number: string;
  vendor_code: string;
  vendor_name: string;
  quotation_status: string;
  total: number;
  lead_time_days: number | null;
  quote_date: string;
  valid_until: string | null;
  is_expired: boolean;
}

// An invited vendor on an RFQ. `responded` is derived server-side (a quotation exists
// from this vendor on this RFQ); the quotation_* fields are populated when it has.
export interface RfqInvitation {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  responded: boolean;
  quotation_id: number | null;
  quotation_status: string | null;
  quotation_total: number | null;
}

// List row (lean; counts are backend annotations).
export interface Rfq {
  id: number;
  document_number: string;
  rfq_status: string;
  title: string;
  requisition_id: number | null;
  requisition_number: string | null;
  issue_date: string | null;
  response_due_date: string | null;
  budget_estimate: number | null;
  line_count: number;
  response_count: number;
  invited_count: number;
}

// Detail record (superset of the list row).
export interface RfqDetail extends Rfq {
  notes: string;
  lines: RfqLine[];
  invitations: RfqInvitation[];
  quotations: RfqQuotationSummary[];
  activity: SourcingActivity[];
}

export interface RfqSummary {
  draft: number;
  open: number;
  responses_in: number;
  closing_soon: number;
}

export interface QuotationLine {
  id: number;
  line_no: number;
  description: string;
  rfq_line_id: number | null;
  expense_account_id: number | null;
  expense_code: string | null;
  quantity: string;
  unit_price: number;
  tax_code_id: number | null;
  net_amount: number;
  tax_amount: number;
}

// List row. `is_expired` is a display-only overlay (never a persisted status).
export interface Quotation {
  id: number;
  document_number: string;
  quotation_status: string;
  rfq_id: number | null;
  rfq_number: string;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  quote_date: string;
  valid_until: string | null;
  lead_time_days: number | null;
  reference: string;
  total: number;
  total_naira: string;
  is_expired: boolean;
  awarded_po_id: number | null;
}

export interface QuotationDetail extends Quotation {
  currency_id: number | null;
  notes: string;
  subtotal: number;
  tax_total: number;
  awarded_po_number: string | null;
  lines: QuotationLine[];
  activity: SourcingActivity[];
}

// ── Inventory ────────────────────────────────────────────────────────────────
export interface StockItem {
  id: number;
  code: string;
  name: string;
  description: string;
  unit_of_measure: string;
  catalog_item_id: number | null;
  catalog_item_code: string | null;
  inventory_account_id: number | null;
  inventory_code: string | null;
  default_expense_account_id: number | null;
  expense_code: string | null;
  reorder_level: string;
  reorder_qty: string;
  on_hand_qty: string;
  stock_value: number;
  stock_value_naira: string;
  unit_cost: number;
  unit_cost_naira: string;
  needs_reorder: boolean;
  is_active: boolean;
}

export interface StockMovement {
  id: number;
  stock_item_id: number;
  stock_item_code: string | null;
  movement_type: string;
  movement_date: string;
  quantity: string;
  value_amount: number;
  value_amount_naira: string;
  balance_qty: string;
  balance_value: number;
  balance_value_naira: string;
  reference: string;
  narration: string;
  created_by_name: string | null;
  created_at: string;
}

// Full stock-item record for the detail drawer: header + recent movements + audit feed.
export interface StockItemDetail extends StockItem {
  movements: StockMovement[];
  activity: SourcingActivity[];
}

// Entity-wide stock KPI strip (one aggregate query on the backend).
export interface StockSummary {
  tracked: number;
  active: number;
  low_stock: number;
  out_of_stock: number;
  total_value: number;
  total_value_naira: string;
}

// Reorder report row - active items at/below their reorder level.
export interface StockReorderRow {
  stock_item_id: number;
  code: string;
  name: string;
  on_hand_qty: string;
  reorder_level: string;
  reorder_qty: string;
  unit_cost: number;
}

export interface StockReorderReport {
  entity: string;
  rows: StockReorderRow[];
}

// Valuation report row - on-hand value at moving-average cost.
export interface StockValuationRow {
  stock_item_id: number;
  code: string;
  name: string;
  on_hand_qty: string;
  unit_cost: number;
  stock_value: number;
}

export interface StockValuationReport {
  entity: string;
  rows: StockValuationRow[];
  total_value: number;
}
