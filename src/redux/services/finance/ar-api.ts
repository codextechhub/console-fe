// Accounts-Receivable RTK Query endpoints (vs_finance). Invoices + the AR
// adjustment documents and their lifecycle actions. Reads gate on *.view; each
// action gates on its own backend rbac_permission.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  CreditNote,
  DunningNotice,
  Invoice,
  InvoiceListParams,
  PaymentPlan,
  Refund,
} from "./ar-types";

type EntityList = { entity: string; page?: number; status?: string; customer?: string };
const qs = (p: object) => generateQueryString(p as Record<string, string | number>);

export const arApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Invoices
    getInvoices: builder.query<PaginatedEnvelope<Invoice>, InvoiceListParams>({
      query: (params) => ({ url: `/finance/invoices/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceInvoices"],
    }),
    writeOffInvoice: builder.mutation<ApiEnvelope<Invoice>, { id: number; entity: string; reason?: string; date?: string }>({
      query: ({ id, entity, ...body }) => ({
        url: `/finance/invoices/${id}/write-off/${qs({ entity })}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceInvoices", "FinanceReports", "FinanceJournals"],
    }),

    // Credit notes
    getCreditNotes: builder.query<PaginatedEnvelope<CreditNote>, EntityList & { kind?: string }>({
      query: (params) => ({ url: `/finance/credit-notes/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceCreditNotes"],
    }),
    postCreditNote: builder.mutation<ApiEnvelope<CreditNote>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({
        url: `/finance/credit-notes/${id}/post/${qs({ entity })}`,
        method: "POST",
      }),
      invalidatesTags: ["FinanceCreditNotes", "FinanceReports", "FinanceJournals"],
    }),
    allocateCreditNote: builder.mutation<ApiEnvelope<CreditNote>, { id: number; entity: string; invoice: number; amount: number }>({
      query: ({ id, entity, ...body }) => ({
        url: `/finance/credit-notes/${id}/allocate/${qs({ entity })}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceCreditNotes", "FinanceInvoices"],
    }),

    // Refunds
    getRefunds: builder.query<PaginatedEnvelope<Refund>, EntityList>({
      query: (params) => ({ url: `/finance/refunds/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceRefunds"],
    }),
    postRefund: builder.mutation<ApiEnvelope<Refund>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({
        url: `/finance/refunds/${id}/post/${qs({ entity })}`,
        method: "POST",
      }),
      invalidatesTags: ["FinanceRefunds", "FinanceReports", "FinanceJournals"],
    }),

    // Payment plans (read + lifecycle)
    getPaymentPlans: builder.query<PaginatedEnvelope<PaymentPlan>, EntityList>({
      query: (params) => ({ url: `/finance/payment-plans/${qs(params)}`, method: "GET" }),
      providesTags: ["FinancePaymentPlans"],
    }),

    // Dunning notices
    getDunningNotices: builder.query<PaginatedEnvelope<DunningNotice>, EntityList>({
      query: (params) => ({ url: `/finance/dunning-notices/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceDunning"],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useWriteOffInvoiceMutation,
  useGetCreditNotesQuery,
  usePostCreditNoteMutation,
  useAllocateCreditNoteMutation,
  useGetRefundsQuery,
  usePostRefundMutation,
  useGetPaymentPlansQuery,
  useGetDunningNoticesQuery,
} = arApi;
