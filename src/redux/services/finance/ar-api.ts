// Accounts-Receivable RTK Query endpoints (vs_finance). Invoices + the AR
// adjustment documents and their lifecycle actions. Reads gate on *.view; each
// action gates on its own backend rbac_permission.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  Concession,
  CreditNote,
  Customer,
  CustomerDetail,
  DunningNotice,
  FeeStructure,
  Invoice,
  InvoiceDetail,
  InvoiceListParams,
  InvoiceSummary,
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
    getInvoiceSummary: builder.query<ApiEnvelope<InvoiceSummary>, { entity: string; search?: string }>({
      query: (params) => ({ url: `/finance/invoices/summary/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceInvoices"],
    }),
    getInvoiceDetail: builder.query<ApiEnvelope<InvoiceDetail>, { entity: string; id: number }>({
      query: ({ entity, id }) => ({ url: `/finance/invoices/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinanceInvoices"],
    }),
    createInvoice: builder.mutation<ApiEnvelope<Invoice>, {
      entity: string; customer: string | number; invoice_date: string; due_date?: string;
      reference?: string; narration?: string; post?: boolean;
      lines: { revenue_account: string | number; description?: string; quantity?: number; unit_price: number; tax_code?: string | number | null }[];
    }>({
      query: ({ entity, ...body }) => ({ url: `/finance/invoices/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceInvoices", "FinanceReports", "FinanceJournals"],
    }),
    writeOffInvoice: builder.mutation<ApiEnvelope<Invoice>, { id: number; entity: string; reason?: string; date?: string }>({
      query: ({ id, entity, ...body }) => ({
        url: `/finance/invoices/${id}/write-off/${qs({ entity })}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceInvoices", "FinanceReports", "FinanceJournals"],
    }),
    recordPayment: builder.mutation<ApiEnvelope<Invoice>, {
      id: number; entity: string; amount: number; payment_date: string;
      method?: string; deposit_account: string | number; reference?: string; narration?: string;
    }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/invoices/${id}/pay/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceInvoices", "FinanceReports", "FinanceJournals"],
    }),
    remindInvoice: builder.mutation<ApiEnvelope<DunningNotice>, { id: number; entity: string; message?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/invoices/${id}/remind/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceInvoices", "FinanceDunning"],
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

    // Customers / payers (non-paginated, capped server-side; use toArray)
    getCustomers: builder.query<ApiEnvelope<Customer[]>, { entity: string; search?: string; is_active?: string }>({
      query: (params) => ({ url: `/finance/customers/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceCustomers"],
    }),
    createCustomer: builder.mutation<ApiEnvelope<Customer>, { entity: string; code: string; name: string; billing_email?: string; billing_phone?: string; billing_address?: string; receivable_account?: string; opening_balance?: number; is_active?: boolean }>({
      query: ({ entity, ...body }) => ({ url: `/finance/customers/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceCustomers"],
    }),
    getCustomerDetail: builder.query<ApiEnvelope<CustomerDetail>, { entity: string; id: string | number }>({
      query: ({ entity, id }) => ({ url: `/finance/customers/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinanceCustomers"],
    }),
    updateCustomer: builder.mutation<ApiEnvelope<Customer>, { entity: string; id: string | number; name?: string; billing_email?: string; billing_phone?: string; billing_address?: string; receivable_account?: string; is_active?: boolean }>({
      query: ({ entity, id, ...body }) => ({ url: `/finance/customers/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["FinanceCustomers"],
    }),
    recordCustomerReceipt: builder.mutation<ApiEnvelope<{ payment: string; allocated: number; unallocated: number }>, { entity: string; id: string | number; amount: number; payment_date: string; method?: string; deposit_account: string | number; reference?: string }>({
      query: ({ entity, id, ...body }) => ({ url: `/finance/customers/${id}/receipt/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceCustomers", "FinanceInvoices", "FinanceReports", "FinanceJournals"],
    }),
    remindCustomer: builder.mutation<ApiEnvelope<{ created: number }>, { entity: string; customer: string | number }>({
      query: ({ entity, ...body }) => ({ url: `/finance/dunning/generate/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceCustomers", "FinanceDunning"],
    }),

    // Fee structures (non-paginated; use toArray)
    getFeeStructures: builder.query<ApiEnvelope<FeeStructure[]>, { entity: string; search?: string; is_active?: string }>({
      query: (params) => ({ url: `/finance/fee-structures/${qs(params)}`, method: "GET" }),
      providesTags: ["FinanceFeeStructures"],
    }),
    generateFromFeeStructure: builder.mutation<ApiEnvelope<{ structure: string; generated: number; invoices: Invoice[] }>, { id: string | number; entity: string; customers?: (string | number)[]; all_active?: boolean; invoice_date?: string; due_date?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/fee-structures/${id}/generate/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceFeeStructures", "FinanceInvoices"],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceSummaryQuery,
  useGetInvoiceDetailQuery,
  useCreateInvoiceMutation,
  useWriteOffInvoiceMutation,
  useRecordPaymentMutation,
  useRemindInvoiceMutation,
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
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useGetCustomerDetailQuery,
  useUpdateCustomerMutation,
  useRecordCustomerReceiptMutation,
  useRemindCustomerMutation,
  useGetFeeStructuresQuery,
  useGenerateFromFeeStructureMutation,
} = arApi;
