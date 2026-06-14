// vs_procurement RTK Query — master data (vendors, categories, catalog) and the
// Procure-to-Pay chain (requisition → PO → goods receipt → vendor invoice with
// 3-way match → vendor payment with WHT). Reads gate on *.view; actions on their
// own rbac_permission. Every call is entity-scoped.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "../finance/api-types";
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
    getVendors: b.query<PaginatedEnvelope<Vendor>, E & { q?: string }>({
      query: (p) => ({ url: `/procurement/vendors/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getVendor: b.query<ApiEnvelope<Vendor>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/vendors/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["ProcVendors"],
    }),
    getCategories: b.query<PaginatedEnvelope<VendorCategory>, E>({
      query: (p) => ({ url: `/procurement/categories/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCategories"],
    }),
    getCatalogItems: b.query<PaginatedEnvelope<CatalogItem>, E & { q?: string }>({
      query: (p) => ({ url: `/procurement/catalog-items/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcCatalog"],
    }),

    // Requisitions
    getRequisitions: b.query<PaginatedEnvelope<Requisition>, E>({
      query: (p) => ({ url: `/procurement/requisitions/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcRequisitions"],
    }),
    submitRequisition: b.mutation<ApiEnvelope<Requisition>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/requisitions/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcRequisitions"],
    }),

    // Purchase orders
    getPurchaseOrders: b.query<PaginatedEnvelope<PurchaseOrder>, E & { vendor?: string }>({
      query: (p) => ({ url: `/procurement/purchase-orders/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcPurchaseOrders"],
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
    postGoodsReceipt: b.mutation<ApiEnvelope<GoodsReceipt>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/goods-receipts/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcGoodsReceipts", "ProcPurchaseOrders"],
    }),

    // Vendor invoices (3-way match)
    getVendorInvoices: b.query<PaginatedEnvelope<VendorInvoice>, E & { match_status?: string; payment_status?: string }>({
      query: (p) => ({ url: `/procurement/vendor-invoices/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorInvoices"],
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
    getVendorPayments: b.query<PaginatedEnvelope<VendorPayment>, E>({
      query: (p) => ({ url: `/procurement/vendor-payments/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcVendorPayments"],
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
  useGetCategoriesQuery,
  useGetCatalogItemsQuery,
  useGetRequisitionsQuery,
  useSubmitRequisitionMutation,
  useGetPurchaseOrdersQuery,
  useSubmitPurchaseOrderMutation,
  useGetGoodsReceiptsQuery,
  usePostGoodsReceiptMutation,
  useGetVendorInvoicesQuery,
  useMatchVendorInvoiceMutation,
  useSubmitVendorInvoiceMutation,
  usePostVendorInvoiceMutation,
  useGetVendorPaymentsQuery,
  usePostVendorPaymentMutation,
} = procurementApi;
