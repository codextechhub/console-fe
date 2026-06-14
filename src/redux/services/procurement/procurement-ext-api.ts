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
    issueRfq: b.mutation<ApiEnvelope<Rfq>, Act>({
      query: ({ id, entity }) => ({ url: `/procurement/rfqs/${id}/issue/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["ProcRfqs"],
    }),

    // Quotations
    getQuotations: b.query<PaginatedEnvelope<Quotation>, E & { rfq?: string; vendor?: string }>({
      query: (p) => ({ url: `/procurement/quotations/${qs(p)}`, method: "GET" }),
      providesTags: ["ProcQuotations"],
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
    getStockMovements: b.query<ApiEnvelope<StockMovement[]>, { entity: string; stock_item?: string; movement_type?: string }>({
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
  useActivateContractMutation,
  useRenewContractMutation,
  useTerminateContractMutation,
  useGetRfqsQuery,
  useIssueRfqMutation,
  useGetQuotationsQuery,
  useSubmitQuotationMutation,
  useAwardQuotationMutation,
  useGetStockItemsQuery,
  useGetStockMovementsQuery,
  useGetApAgingQuery,
  useGetApReconciliationQuery,
  useGetGrirBalanceQuery,
  useGetSpendAnalysisQuery,
  useGetVendorPerformanceQuery,
} = procurementExtApi;
