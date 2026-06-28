// vs_payments RTK Query endpoints (/v1/payments/). Receivable cash arrives by
// confirming a Collection (verify), never by a "record receipt" form (spec §1.7).
//   GET  /payments/collections/              payments.collection.view
//   POST /payments/collections/              payments.collection.create
//   GET  /payments/collections/{id}/?verify=1 confirm + book the receipt
//   POST /payments/virtual-accounts/         payments.virtual_account.create
//   GET  /payments/payouts/ , /payout-batches/  payments.payout.view (slice 6)

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "../finance/api-types";
import type {
  Collection,
  InitiateCollectionPayload,
  PayoutBatch,
  PayoutBatchSummary,
  PayoutInstruction,
  TransactionLogEntry,
  VirtualAccount,
  VirtualAccountKpis,
} from "./payments-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<ApiEnvelope<Collection[]>, { entity: string; status?: string; virtual_account?: number }>({
      query: (p) => ({ url: `/payments/collections/${qs(p)}`, method: "GET" }),
      providesTags: ["PaymentsCollections"],
    }),
    initiateCollection: builder.mutation<ApiEnvelope<Collection>, InitiateCollectionPayload>({
      query: ({ entity, ...body }) => ({
        url: `/payments/collections/${qs({ entity })}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentsCollections"],
    }),
    // ?verify=1 polls the PSP and books the receipt if settled.
    verifyCollection: builder.mutation<ApiEnvelope<Collection>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({
        url: `/payments/collections/${id}/${qs({ entity, verify: 1 })}`,
        method: "GET",
      }),
      invalidatesTags: ["PaymentsCollections", "FinanceInvoices", "FinanceReports"],
    }),

    getVirtualAccounts: builder.query<PaginatedEnvelope<VirtualAccount> & { kpis: VirtualAccountKpis }, { entity: string; page?: number; status?: string; provider?: string; search?: string }>({
      query: (p) => ({ url: `/payments/virtual-accounts/${qs(p)}`, method: "GET" }),
      providesTags: ["PaymentsVirtualAccounts"],
    }),
    createVirtualAccount: builder.mutation<ApiEnvelope<VirtualAccount>, { entity: string; customer: string | number; provider?: string; deposit_account?: string; bank_code?: string }>({
      query: ({ entity, ...body }) => ({
        url: `/payments/virtual-accounts/${qs({ entity })}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentsVirtualAccounts"],
    }),
    updateVirtualAccount: builder.mutation<ApiEnvelope<VirtualAccount>, { id: number; entity: string; status: string }>({
      query: ({ id, entity, ...body }) => ({
        url: `/payments/virtual-accounts/${id}/${qs({ entity })}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PaymentsVirtualAccounts"],
    }),

    // Payouts (slice 6)
    getPayouts: builder.query<PaginatedEnvelope<PayoutInstruction>, { entity: string; page?: number; status?: string }>({
      query: (p) => ({ url: `/payments/payouts/${qs(p)}`, method: "GET" }),
      providesTags: ["PaymentsPayouts"],
    }),
    getPayoutBatches: builder.query<PaginatedEnvelope<PayoutBatchSummary>, { entity: string; page?: number; status?: string }>({
      query: (p) => ({ url: `/payments/payout-batches/${qs(p)}`, method: "GET" }),
      providesTags: ["PaymentsPayoutBatches"],
    }),
    getPayoutBatch: builder.query<ApiEnvelope<PayoutBatch>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({ url: `/payments/payout-batches/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["PaymentsPayoutBatches"],
    }),
    // POST the batch detail submits its pending instructions to the PSP.
    submitPayoutBatch: builder.mutation<ApiEnvelope<PayoutBatch>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({ url: `/payments/payout-batches/${id}/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["PaymentsPayoutBatches", "PaymentsPayouts"],
    }),
    getSettlementReconciliation: builder.query<ApiEnvelope<Record<string, unknown>>, { entity: string; provider?: string }>({
      query: (p) => ({ url: `/payments/reports/settlement-reconciliation/${qs(p)}`, method: "GET" }),
    }),
    // Append-only gateway action log (PaymentEvent). Non-paginated, capped at 200.
    getTransactionsLog: builder.query<ApiEnvelope<TransactionLogEntry[]>, { entity: string; action?: string; provider?: string; succeeded?: string }>({
      query: (p) => ({ url: `/payments/transactions/${qs(p)}`, method: "GET" }),
      providesTags: ["PaymentsTransactions"],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useInitiateCollectionMutation,
  useVerifyCollectionMutation,
  useGetVirtualAccountsQuery,
  useCreateVirtualAccountMutation,
  useUpdateVirtualAccountMutation,
  useGetPayoutsQuery,
  useGetPayoutBatchesQuery,
  useGetPayoutBatchQuery,
  useSubmitPayoutBatchMutation,
  useGetSettlementReconciliationQuery,
  useGetTransactionsLogQuery,
} = paymentsApi;
