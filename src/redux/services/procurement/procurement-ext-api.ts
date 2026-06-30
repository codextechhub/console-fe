// vs_procurement extended: sourcing (RFQ + quotations), contracts, inventory
// (stock + movements) and analytics reports (§7.3–7.5).

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "../finance/api-types";
import type {
  Quotation,
  Rfq,
  StockItem,
  StockMovement,
  VendorContract,
} from "./procurement-types";
import type {
  ApAging,
  ApReconciliation,
  GrirBalance,
  SpendAnalysis,
  VendorPerformance,
} from "./procurement-ext-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);
type E = { entity: string; page?: number; status?: string };
type Act = { id: number; entity: string };

export const procurementExtApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Contracts
    getContracts: b.query<PaginatedEnvelope<VendorContract>, E & { vendor?: string }>({
      query: (p) => ({ url: `/procurement/contracts/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcContracts"],
    }),
    createContract: b.mutation<ApiEnvelope<VendorContract>, { entity: string; reference: string; title: string; vendor: string; start_date?: string; end_date?: string; contract_value?: number; payment_terms?: string; auto_renew?: boolean }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/contracts/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcContracts"],
    }),
    activateContract: b.mutation<ApiEnvelope<VendorContract>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/contracts/${id}/activate/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcContracts"],
    }),
    renewContract: b.mutation<ApiEnvelope<VendorContract>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/contracts/${id}/renew/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcContracts"],
    }),
    terminateContract: b.mutation<ApiEnvelope<VendorContract>, Act & { reason?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/procurement/contracts/${id}/terminate/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcContracts"],
    }),

    // RFQs
    getRfqs: b.query<PaginatedEnvelope<Rfq>, E>({
      query: (p) => ({ url: `/procurement/rfqs/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcRfqs"],
    }),
    createRfq: b.mutation<ApiEnvelope<Rfq>, { entity: string; title?: string; issue_date: string; response_due_date?: string; notes?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/rfqs/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcRfqs"],
    }),
    issueRfq: b.mutation<ApiEnvelope<Rfq>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/rfqs/${id}/issue/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcRfqs"],
    }),

    // Quotations
    getQuotations: b.query<PaginatedEnvelope<Quotation>, E & { rfq?: string; vendor?: string }>({
      query: (p) => ({ url: `/procurement/quotations/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcQuotations"],
    }),
    createQuotation: b.mutation<ApiEnvelope<Quotation>, { entity: string; rfq: number; vendor: string; quote_date: string; valid_until?: string; reference?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/quotations/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcQuotations"],
    }),
    submitQuotation: b.mutation<ApiEnvelope<Quotation>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/quotations/${id}/submit/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcQuotations"],
    }),
    awardQuotation: b.mutation<ApiEnvelope<Quotation>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/quotations/${id}/award/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcQuotations", "ProcPurchaseOrders"],
    }),

    // Inventory
    getStockItems: b.query<PaginatedEnvelope<StockItem>, E & { q?: string; needs_reorder?: string }>({
      query: (p) => ({ url: `/procurement/stock-items/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcStock"],
    }),
    createStockItem: b.mutation<ApiEnvelope<StockItem>, { entity: string; code: string; name: string; description?: string; unit_of_measure?: string; inventory_account: string; default_expense_account?: string; reorder_level?: number; reorder_qty?: number }>({
      query: ({ entity, ...body }) => ({ url: `/procurement/stock-items/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["ProcStock"],
    }),
    getStockMovements: b.query<PaginatedEnvelope<StockMovement>, { entity: string; page?: number; stock_item?: string; movement_type?: string }>({
      query: (p) => ({ url: `/procurement/stock-movements/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcStock"],
    }),

    // Analytics reports
    getApAging: b.query<ApiEnvelope<ApAging>, { entity: string; as_of?: string }>({
      query: (p) => ({ url: `/procurement/reports/ap-aging/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcStock"],
    }),
    getApReconciliation: b.query<ApiEnvelope<ApReconciliation>, { entity: string; as_of?: string }>({
      query: (p) => ({ url: `/procurement/reports/ap-reconciliation/${qs(p)}`, method: "GET" }),
    }),
    getGrirBalance: b.query<ApiEnvelope<GrirBalance>, { entity: string }>({
      query: (p) => ({ url: `/procurement/reports/grir/${qs(p)}`, method: "GET" }),
    }),
    getSpendAnalysis: b.query<ApiEnvelope<SpendAnalysis>, { entity: string; start_date?: string; end_date?: string }>({
      query: (p) => ({ url: `/procurement/reports/spend-analysis/${qs(p)}`, method: "GET" }),
    }),
    getVendorPerformance: b.query<ApiEnvelope<VendorPerformance>, { entity: string; start_date?: string; end_date?: string }>({
      query: (p) => ({ url: `/procurement/reports/vendor-performance/${qs(p)}`, method: "GET" }),
    }),
  }),
});

export const {
  useGetContractsQuery,
  useCreateContractMutation,
  useActivateContractMutation,
  useRenewContractMutation,
  useTerminateContractMutation,
  useGetRfqsQuery,
  useCreateRfqMutation,
  useIssueRfqMutation,
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useSubmitQuotationMutation,
  useAwardQuotationMutation,
  useGetStockItemsQuery,
  useCreateStockItemMutation,
  useGetStockMovementsQuery,
  useGetApAgingQuery,
  useGetApReconciliationQuery,
  useGetGrirBalanceQuery,
  useGetSpendAnalysisQuery,
  useGetVendorPerformanceQuery,
} = procurementExtApi;
