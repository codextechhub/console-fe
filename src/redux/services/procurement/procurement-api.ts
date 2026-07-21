// vs_procurement RTK Query — master data (vendors, categories, catalog) and the
// Procure-to-Pay chain (requisition → PO → goods receipt → vendor invoice with
// 3-way match → vendor payment with WHT). Reads gate on *.view; actions on their
// own rbac_permission. Every call is entity-scoped.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "../finance/api-types";
import type {
  CatalogItem,
  CatalogItemInsights,
  GoodsReceipt,
  PurchaseOrder,
  PurchaseOrderSummary,
  Requisition,
  RequisitionBudgetAvailability,
  RequisitionSummary,
  Vendor,
  VendorCategory,
  VendorCategoryInsight,
  VendorInsights,
  VendorInvoice,
  VendorInvoiceSummary,
  VendorPayment,
  VendorPaymentEligibleInvoice,
  VendorSummary,
} from "./procurement-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);
type E = { entity: string; page?: number; page_size?: number; status?: string; search?: string };
type Act = { id: number; entity: string };

export const procurementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Master data
    getVendors: b.query<PaginatedEnvelope<Vendor>, E & { q?: string; is_active?: boolean; on_hold?: boolean; kyc_status?: string; purchase_eligible?: boolean }>({
      query: (p) => ({ url: `/procurement/vendors/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getVendor: b.query<ApiEnvelope<Vendor>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendors/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getVendorSummary: b.query<ApiEnvelope<VendorSummary>, { entity: string }>({
      query: ({ entity }) => ({ url: `/procurement/vendors/summary/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getVendorInsights: b.query<ApiEnvelope<VendorInsights>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendors/${id}/insights/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    createVendor: b.mutation<ApiEnvelope<Vendor>, { entity: string; code: string; name: string; category?: string; email?: string; phone?: string; address?: string; tax_id?: string; bank_name?: string; bank_account_number?: string; bank_account_name?: string; payable_account?: string; default_expense_account?: string; default_wht_tax_code?: string; payment_terms?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendors/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendors"],
    }),
    updateVendor: b.mutation<ApiEnvelope<Vendor>, { id: number; entity: string; name?: string; category?: string; email?: string; phone?: string; address?: string; tax_id?: string; bank_name?: string; bank_account_number?: string; bank_account_name?: string; payable_account?: string; default_expense_account?: string; default_wht_tax_code?: string; payment_terms?: string; kyc_status?: string; risk?: string; on_hold?: boolean; is_active?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendors/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcVendors"],
    }),
    getCategories: b.query<PaginatedEnvelope<VendorCategory>, E & { q?: string; is_active?: boolean }>({
      query: (p) => ({ url: `/procurement/categories/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCategories"],
    }),
    getCategory: b.query<ApiEnvelope<VendorCategory>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/categories/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcCategories"],
    }),
    getCategoryInsights: b.query<ApiEnvelope<VendorCategoryInsight[]>, { entity: string }>({
      query: ({ entity }) => ({ url: `/procurement/categories/insights/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcCategories"],
    }),
    createCategory: b.mutation<ApiEnvelope<VendorCategory>, { entity: string; code: string; name: string; parent?: string; default_expense_account?: string; is_active?: boolean }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/categories/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcCategories"],
    }),
    updateCategory: b.mutation<ApiEnvelope<VendorCategory>, { id: number; entity: string; code?: string; name?: string; parent?: string; default_expense_account?: string; is_active?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/categories/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcCategories", "ProcVendors"],
    }),
    getCatalogItems: b.query<PaginatedEnvelope<CatalogItem>, E & { q?: string; is_active?: boolean; vendor?: string; category?: string }>({
      query: (p) => ({ url: `/procurement/catalog-items/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCatalog"],
    }),
    getCatalogItem: b.query<ApiEnvelope<CatalogItem>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/catalog-items/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcCatalog"],
    }),
    getCatalogItemInsights: b.query<ApiEnvelope<CatalogItemInsights>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/catalog-items/${id}/insights/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcCatalog"],
    }),
    createCatalogItem: b.mutation<ApiEnvelope<CatalogItem>, { entity: string; code: string; name: string; description?: string; unit_of_measure: string; category?: string; preferred_vendor?: string; default_expense_account?: string; default_tax_code?: string; lead_time_days?: number | null; standard_unit_price: number; is_active?: boolean }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/catalog-items/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcCatalog"],
    }),
    updateCatalogItem: b.mutation<ApiEnvelope<CatalogItem>, { id: number; entity: string; code?: string; name?: string; description?: string; unit_of_measure?: string; category?: string; preferred_vendor?: string; default_expense_account?: string; default_tax_code?: string; lead_time_days?: number | null; standard_unit_price?: number; is_active?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/catalog-items/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcCatalog", "ProcCategories"],
    }),

    // Requisitions
    getRequisitions: b.query<PaginatedEnvelope<Requisition>, E>({
      query: (p) => ({ url: `/procurement/requisitions/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    getRequisition: b.query<ApiEnvelope<Requisition>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/requisitions/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    getRequisitionSummary: b.query<ApiEnvelope<RequisitionSummary>, { entity: string }>({
      query: ({ entity }) => ({ url: `/procurement/requisitions/summary/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    getRequisitionBudgetAvailability: b.query<ApiEnvelope<RequisitionBudgetAvailability>, { entity: string; cost_center: string; date?: string }>({
      query: (p) => ({ url: `/procurement/requisitions/budget-availability/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    createRequisition: b.mutation<ApiEnvelope<Requisition>, { entity: string; title?: string; request_date: string; needed_by?: string; cost_center?: string; justification?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/requisitions/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcRequisitions"],
    }),
    updateRequisition: b.mutation<ApiEnvelope<Requisition>, { id: number; entity: string; title?: string; request_date?: string; needed_by?: string; cost_center?: string; justification?: string; lines?: Record<string, unknown>[] }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/requisitions/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcRequisitions"],
    }),
    submitRequisition: b.mutation<ApiEnvelope<Requisition>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/requisitions/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcRequisitions"],
    }),

    // Purchase orders (created from an approved requisition; lines are copied)
    getPurchaseOrders: b.query<PaginatedEnvelope<PurchaseOrder>, E & { vendor?: string }>({
      query: (p) => ({ url: `/procurement/purchase-orders/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcPurchaseOrders"],
    }),
    getPurchaseOrder: b.query<ApiEnvelope<PurchaseOrder>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/purchase-orders/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcPurchaseOrders"],
    }),
    getPurchaseOrderSummary: b.query<ApiEnvelope<PurchaseOrderSummary>, { entity: string }>({
      query: ({ entity }) => ({ url: `/procurement/purchase-orders/summary/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcPurchaseOrders"],
    }),
    createPurchaseOrder: b.mutation<ApiEnvelope<PurchaseOrder>, { entity: string; requisition: number; vendor: string; order_date: string; expected_date?: string; delivery_address?: string; payment_terms?: string; contract?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/purchase-orders/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcPurchaseOrders", "ProcRequisitions", "ProcContracts"],
    }),
    updatePurchaseOrder: b.mutation<ApiEnvelope<PurchaseOrder>, { id: number; entity: string; vendor?: string; order_date?: string; expected_date?: string; delivery_address?: string; payment_terms?: string; contract?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/purchase-orders/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcPurchaseOrders", "ProcContracts"],
    }),
    submitPurchaseOrder: b.mutation<ApiEnvelope<PurchaseOrder>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/purchase-orders/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcPurchaseOrders"],
    }),

    // Goods receipts
    getGoodsReceipts: b.query<PaginatedEnvelope<GoodsReceipt>, E>({
      query: (p) => ({ url: `/procurement/goods-receipts/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcGoodsReceipts"],
    }),
    getGoodsReceipt: b.query<ApiEnvelope<GoodsReceipt>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/goods-receipts/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcGoodsReceipts"],
    }),
    createGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, { entity: string; vendor: string; purchase_order?: number; received_date: string; reference?: string; narration?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/goods-receipts/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcGoodsReceipts"],
    }),
    updateGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, { id: number; entity: string; received_date?: string; reference?: string; narration?: string; lines?: Record<string, unknown>[] }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/goods-receipts/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcGoodsReceipts", "ProcPurchaseOrders"],
    }),
    postGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/goods-receipts/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcGoodsReceipts", "ProcPurchaseOrders"],
    }),

    // Vendor invoices (3-way match)
    getVendorInvoices: b.query<PaginatedEnvelope<VendorInvoice>, E & { vendor?: string; match_status?: string; payment_status?: string; display_status?: string }>({
      query: (p) => ({ url: `/procurement/vendor-invoices/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
    }),
    getVendorInvoice: b.query<ApiEnvelope<VendorInvoice>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-invoices/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
    }),
    getVendorInvoiceSummary: b.query<ApiEnvelope<VendorInvoiceSummary>, { entity: string }>({
      query: ({ entity }) => ({ url: `/procurement/vendor-invoices/summary/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
    }),
    createVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, { entity: string; vendor: string; purchase_order?: number; invoice_date: string; due_date?: string; vendor_reference?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendor-invoices/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorInvoices"],
    }),
    updateVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, { id: number; entity: string; vendor?: string; purchase_order?: number | null; invoice_date?: string; due_date?: string; vendor_reference?: string; narration?: string; lines?: Record<string, unknown>[] }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendor-invoices/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcVendorInvoices"],
    }),
    matchVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-invoices/${id}/match/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcVendorInvoices"],
    }),
    submitVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-invoices/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcVendorInvoices"],
    }),
    postVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, Act & { allow_variance?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendor-invoices/${id}/post/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorInvoices", "FinanceJournals"],
    }),

    // Vendor payments
    getVendorPayments: b.query<PaginatedEnvelope<VendorPayment>, E & { approval_state?: string }>({
      query: (p) => ({ url: `/procurement/vendor-payments/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorPayments"],
    }),
    getVendorPayment: b.query<ApiEnvelope<VendorPayment>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-payments/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendorPayments"],
    }),
    getVendorPaymentEligibleInvoices: b.query<ApiEnvelope<VendorPaymentEligibleInvoice[]>, { entity: string; vendor?: string }>({
      query: (p) => ({ url: `/procurement/vendor-payments/eligible-invoices/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
    }),
    createVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, { entity: string; vendor: string; payment_date: string; method?: string; bank_account: number; wht_amount?: number; wht_tax_code?: string; reference?: string; narration?: string; allocations: { vendor_invoice: number; amount: number }[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendor-payments/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorPayments"],
    }),
    updateVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, { id: number; entity: string; vendor: string; payment_date: string; method?: string; bank_account: number; wht_amount?: number; wht_tax_code?: string; reference?: string; narration?: string; allocations: { vendor_invoice: number; amount: number }[] }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendor-payments/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["ProcVendorPayments"],
    }),
    submitVendorPayment: b.mutation<ApiEnvelope<unknown>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-payments/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcVendorPayments"],
    }),
    postVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-payments/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcVendorPayments", "ProcVendorInvoices", "FinanceJournals"],
    }),
    cancelVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendor-payments/${id}/cancel/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcVendorPayments"],
    }),
    reverseVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, Act & { date?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendor-payments/${id}/reverse/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorPayments", "ProcVendorInvoices", "FinanceJournals"],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useGetVendorSummaryQuery,
  useGetVendorInsightsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetCategoryInsightsQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetCatalogItemsQuery,
  useGetCatalogItemQuery,
  useGetCatalogItemInsightsQuery,
  useCreateCatalogItemMutation,
  useUpdateCatalogItemMutation,
  useGetRequisitionsQuery,
  useGetRequisitionQuery,
  useGetRequisitionSummaryQuery,
  useGetRequisitionBudgetAvailabilityQuery,
  useCreateRequisitionMutation,
  useUpdateRequisitionMutation,
  useSubmitRequisitionMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useGetPurchaseOrderSummaryQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptQuery,
  useCreateGoodsReceiptMutation,
  useUpdateGoodsReceiptMutation,
  usePostGoodsReceiptMutation,
  useGetVendorInvoicesQuery,
  useGetVendorInvoiceQuery,
  useGetVendorInvoiceSummaryQuery,
  useCreateVendorInvoiceMutation,
  useUpdateVendorInvoiceMutation,
  useMatchVendorInvoiceMutation,
  useSubmitVendorInvoiceMutation,
  usePostVendorInvoiceMutation,
  useGetVendorPaymentsQuery,
  useGetVendorPaymentQuery,
  useGetVendorPaymentEligibleInvoicesQuery,
  useCreateVendorPaymentMutation,
  useUpdateVendorPaymentMutation,
  useSubmitVendorPaymentMutation,
  usePostVendorPaymentMutation,
  useCancelVendorPaymentMutation,
  useReverseVendorPaymentMutation,
} = procurementApi;
