// vs_procurement RTK Query — master data (vendors, categories, catalog) and the
// Procure-to-Pay chain (requisition → PO → goods receipt → vendor invoice with
// 3-way match → vendor payment with WHT). Reads gate on *.view; actions on their
// own rbac_permission. Every call is entity-scoped.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope } from "../finance/api-types";
import type {
  CatalogItem,
  GoodsReceipt,
  PurchaseOrder,
  Requisition,
  Vendor,
  VendorCategory,
  VendorInvoice,
  VendorPayment,
} from "./procurement-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);
type E = { entity: string; page?: number; status?: string };
type Act = { id: number; entity: string };

export const procurementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Master data
    getVendors: b.query<ApiEnvelope<Vendor[]>, E & { q?: string }>({
      query: (p) => ({ url: `/procurement/vendors/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getVendor: b.query<ApiEnvelope<Vendor>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendors/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    createVendor: b.mutation<ApiEnvelope<Vendor>, { entity: string; code: string; name: string; category?: string; email?: string; phone?: string; tax_id?: string; bank_name?: string; bank_account_number?: string; bank_account_name?: string; payable_account?: string; default_expense_account?: string; payment_terms?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendors/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendors"],
    }),
    getCategories: b.query<ApiEnvelope<VendorCategory[]>, E>({
      query: (p) => ({ url: `/procurement/categories/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCategories"],
    }),
    createCategory: b.mutation<ApiEnvelope<VendorCategory>, { entity: string; code: string; name: string; default_expense_account?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/categories/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcCategories"],
    }),
    getCatalogItems: b.query<ApiEnvelope<CatalogItem[]>, E & { q?: string }>({
      query: (p) => ({ url: `/procurement/catalog-items/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCatalog"],
    }),
    createCatalogItem: b.mutation<ApiEnvelope<CatalogItem>, { entity: string; code: string; name: string; description?: string; unit_of_measure?: string; preferred_vendor?: string; default_expense_account?: string; default_tax_code?: string; standard_unit_price?: number }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/catalog-items/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcCatalog"],
    }),

    // Requisitions
    getRequisitions: b.query<ApiEnvelope<Requisition[]>, E>({
      query: (p) => ({ url: `/procurement/requisitions/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    createRequisition: b.mutation<ApiEnvelope<Requisition>, { entity: string; request_date: string; needed_by?: string; justification?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/requisitions/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcRequisitions"],
    }),
    submitRequisition: b.mutation<ApiEnvelope<Requisition>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/requisitions/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcRequisitions"],
    }),

    // Purchase orders (created from an approved requisition; lines are copied)
    getPurchaseOrders: b.query<ApiEnvelope<PurchaseOrder[]>, E & { vendor?: string }>({
      query: (p) => ({ url: `/procurement/purchase-orders/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcPurchaseOrders"],
    }),
    createPurchaseOrder: b.mutation<ApiEnvelope<PurchaseOrder>, { entity: string; requisition: number; vendor: string; order_date: string; expected_date?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/purchase-orders/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcPurchaseOrders", "ProcRequisitions"],
    }),
    submitPurchaseOrder: b.mutation<ApiEnvelope<PurchaseOrder>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/purchase-orders/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcPurchaseOrders"],
    }),

    // Goods receipts
    getGoodsReceipts: b.query<ApiEnvelope<GoodsReceipt[]>, E>({
      query: (p) => ({ url: `/procurement/goods-receipts/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcGoodsReceipts"],
    }),
    createGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, { entity: string; vendor: string; purchase_order?: number; received_date: string; reference?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/goods-receipts/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcGoodsReceipts"],
    }),
    postGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/goods-receipts/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcGoodsReceipts", "ProcPurchaseOrders"],
    }),

    // Vendor invoices (3-way match)
    getVendorInvoices: b.query<ApiEnvelope<VendorInvoice[]>, E & { match_status?: string; payment_status?: string }>({
      query: (p) => ({ url: `/procurement/vendor-invoices/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
    }),
    createVendorInvoice: b.mutation<ApiEnvelope<VendorInvoice>, { entity: string; vendor: string; purchase_order?: number; invoice_date: string; due_date?: string; vendor_reference?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendor-invoices/${qs({ entity })}`, method: "POST", body }),
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
    getVendorPayments: b.query<ApiEnvelope<VendorPayment[]>, E>({
      query: (p) => ({ url: `/procurement/vendor-payments/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorPayments"],
    }),
    createVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, { entity: string; vendor: string; payment_date: string; method?: string; gross_amount: number; wht_amount?: number; payment_account: string; reference?: string }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/vendor-payments/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorPayments"],
    }),
    postVendorPayment: b.mutation<ApiEnvelope<VendorPayment>, Act & { auto_allocate?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/vendor-payments/${id}/post/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcVendorPayments", "ProcVendorInvoices", "FinanceJournals"],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetCatalogItemsQuery,
  useCreateCatalogItemMutation,
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useSubmitRequisitionMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useGetGoodsReceiptsQuery,
  useCreateGoodsReceiptMutation,
  usePostGoodsReceiptMutation,
  useGetVendorInvoicesQuery,
  useCreateVendorInvoiceMutation,
  useMatchVendorInvoiceMutation,
  useSubmitVendorInvoiceMutation,
  usePostVendorInvoiceMutation,
  useGetVendorPaymentsQuery,
  useCreateVendorPaymentMutation,
  usePostVendorPaymentMutation,
} = procurementApi;
