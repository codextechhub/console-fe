// Accounts-Receivable RTK Query endpoints (vs_finance). Invoices + the AR
// adjustment documents and their lifecycle actions. Reads gate on *.view; each
// action gates on its own backend rbac_permission.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  Concession,
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
    createCreditNote: builder.mutation<ApiEnvelope<CreditNote>, { entity: string; customer: string; kind: string; note_date: string; reason?: string; reference?: string; lines: Record<string, unknown>[] }>({
      query: ({ entity, ...body }) => ({ url: `/finance/credit-notes/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceCreditNotes"],
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
    createRefund: builder.mutation<ApiEnvelope<Refund>, { entity: string; customer: string; refund_date: string; method?: string; amount: number; reference?: string; narration?: string }>({
      query: ({ entity, ...body }) => ({ url: `/finance/refunds/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceRefunds"],
    }),
    postRefund: builder.mutation<ApiEnvelope<Refund>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({
        url: `/finance/refunds/${id}/post/${qs({ entity })}`,
        method: "POST",
      }),
      invalidatesTags: ["FinanceRefunds", "FinanceReports", "FinanceJournals"],
    }),

    // Concessions
    getConcessions: builder.query<PaginatedEnvelope<Concession>, EntityList & { kind?: string }>({
      query: (params) => ({ url: `/finance/concessions/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceConcessions"],
    }),
    createConcession: builder.mutation<ApiEnvelope<Concession>, { entity: string; customer: string; invoice?: string; kind: string; concession_date: string; amount: number; allowance_account?: string; reason?: string }>({
      query: ({ entity, ...body }) => ({ url: `/finance/concessions/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceConcessions"],
    }),
    postConcession: builder.mutation<ApiEnvelope<Concession>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({ url: `/finance/concessions/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceConcessions", "FinanceReports", "FinanceJournals"],
    }),

    // Payment plans (read + create + lifecycle)
    getPaymentPlans: builder.query<PaginatedEnvelope<PaymentPlan>, EntityList>({
      query: (params) => ({ url: `/finance/payment-plans/${qs(params)}`, method: "GET" }),
      providesTags: ["FinancePaymentPlans"],
    }),
    createPaymentPlan: builder.mutation<ApiEnvelope<PaymentPlan>, { entity: string; customer: string; invoice?: number; start_date: string; frequency: string; installment_count: number; total_amount?: number; notes?: string }>({
      query: ({ entity, ...body }) => ({ url: `/finance/payment-plans/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePaymentPlans"],
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
  useCreateCreditNoteMutation,
  usePostCreditNoteMutation,
  useAllocateCreditNoteMutation,
  useGetRefundsQuery,
  useCreateRefundMutation,
  usePostRefundMutation,
  useGetConcessionsQuery,
  useCreateConcessionMutation,
  usePostConcessionMutation,
  useGetPaymentPlansQuery,
  useCreatePaymentPlanMutation,
  useGetDunningNoticesQuery,
} = arApi;
