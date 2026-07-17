// vs_procurement types — mirror the serializers. Money is integer kobo. Vendor
// bank fields are FLS-stripped unless procurement.vendor.view_sensitive.

export interface VendorCategory {
  id: number;
  code: string;
  name: string;
  default_expense_account_id: number | null;
  default_expense_code: string | null;
  is_active: boolean;
}

export interface Vendor {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  category_code: string | null;
  email: string;
  phone: string;
  tax_id: string;
  bank_name?: string; // FLS
  bank_account_number?: string; // FLS
  bank_account_name?: string; // FLS
  payable_account_id: number | null;
  payable_code: string | null;
  default_expense_account_id: number | null;
  default_expense_code: string | null;
  payment_terms: string;
  kyc_status: string;
  risk: string;
  on_hold: boolean;
  is_active: boolean;
  _stripped_fields?: string[];
}

export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  description: string;
  unit_of_measure: string;
  preferred_vendor_code: string | null;
  expense_code: string | null;
  tax_code: string | null;
  lead_time_days: number;
  standard_unit_price: number;
  standard_unit_price_naira: string;
  is_active: boolean;
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
  quotation_number: string | null;
  order_date: string;
  expected_date: string | null;
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
  unit_price: number;
  value_amount: number;
}
export interface GoodsReceipt {
  id: number;
  document_number: string;
  status: string;
  vendor_id: number;
  vendor_code: string;
  purchase_order_id: number | null;
  received_date: string;
  reference: string;
  narration: string;
  total_value: number;
  total_value_naira: string;
  journal_id: number | null;
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
  net_amount: number;
  tax_amount: number;
}
export interface VendorInvoice {
  id: number;
  document_number: string;
  status: string;
  match_status: string;
  payment_status: string;
  vendor_id: number;
  vendor_code: string;
  purchase_order_id: number | null;
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
}

export interface VendorPaymentAllocation {
  id: number;
  vendor_invoice_id: number;
  invoice_number: string;
  amount: number;
}
export interface VendorPayment {
  id: number;
  document_number: string;
  status: string;
  vendor_id: number;
  vendor_code: string;
  payment_date: string;
  method: string;
  gross_amount: number;
  wht_amount: number;
  net_amount: number;
  net_naira: string;
  allocated_amount: number;
  payment_code: string | null;
  reference: string;
  narration: string;
  journal_id: number | null;
  allocations: VendorPaymentAllocation[];
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
  start_date: string;
  end_date: string | null;
  renewal_window_start: string | null;
  contract_value: number;
  contract_value_naira: string;
  payment_terms: string;
  auto_renew: boolean;
  renewal_notice_days: number;
  renews_id: number | null;
  notes: string;
  milestones: ContractMilestone[];
}

export interface Rfq {
  id: number;
  document_number: string;
  rfq_status: string;
  title: string;
  requisition_id: number | null;
  issue_date: string | null;
  response_due_date: string | null;
  notes: string;
  lines: { id: number; line_no: number; description: string; quantity: string }[];
}

export interface Quotation {
  id: number;
  document_number: string;
  quotation_status: string;
  rfq_id: number | null;
  rfq_number: string;
  vendor_id: number;
  vendor_code: string;
  quote_date: string;
  valid_until: string | null;
  lead_time_days: number;
  reference: string;
  notes: string;
  subtotal: number;
  tax_total: number;
  total: number;
  total_naira: string;
  awarded_po_id: number | null;
  lines: { id: number; line_no: number; description: string; quantity: string; unit_price: number; net_amount: number }[];
}

// ── Inventory ────────────────────────────────────────────────────────────────
export interface StockItem {
  id: number;
  code: string;
  name: string;
  description: string;
  unit_of_measure: string;
  catalog_item_code: string | null;
  inventory_code: string | null;
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
  created_at: string;
}
