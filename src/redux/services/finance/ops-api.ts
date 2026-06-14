// Finance-operations RTK Query endpoints (vs_finance views_ops): banking,
// expense claims, petty cash, payroll, budgets, fixed assets, tax. Reads gate on
// *.view; actions on their own rbac_permission.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  BankAccount,
  BankStatementLine,
  Budget,
  ExpenseClaim,
  FixedAsset,
  PayrollRun,
  PettyCashFund,
  PettyCashVoucher,
  TaxFiling,
  TaxObligation,
} from "./ops-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);
type E = { entity: string; page?: number; status?: string };
type Act = { id: number; entity: string };

export const opsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Banking
    getBankAccounts: b.query<PaginatedEnvelope<BankAccount>, E>({
      query: (p) => ({ url: `/finance/bank-accounts/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceBankAccounts"],
    }),
    getStatementLines: b.query<ApiEnvelope<BankStatementLine[]>, Act & { status?: string }>({
      query: ({ id, ...p }) => ({ url: `/finance/bank-accounts/${id}/statement-lines/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceStatementLines"],
    }),
    autoReconcile: b.mutation<ApiEnvelope<BankStatementLine[]>, Act & { tolerance_days?: number }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/bank-accounts/${id}/auto-reconcile/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceStatementLines"],
    }),

    // Expense claims
    getExpenseClaims: b.query<PaginatedEnvelope<ExpenseClaim>, E>({
      query: (p) => ({ url: `/finance/expense-claims/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceExpenseClaims"],
    }),
    getExpenseClaim: b.query<ApiEnvelope<ExpenseClaim>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/expense-claims/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinanceExpenseClaims"],
    }),
    postExpenseClaim: b.mutation<ApiEnvelope<ExpenseClaim>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/expense-claims/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceExpenseClaims", "FinanceJournals", "FinanceReports"],
    }),
    settleExpenseClaim: b.mutation<ApiEnvelope<ExpenseClaim>, Act & { bank_account?: string; date?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/expense-claims/${id}/settle/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceExpenseClaims", "FinanceJournals"],
    }),

    // Petty cash
    getPettyCashFunds: b.query<PaginatedEnvelope<PettyCashFund>, E>({
      query: (p) => ({ url: `/finance/petty-cash-funds/${qs(p)}`, method: "GET" }),
      providesTags: ["FinancePettyCash"],
    }),
    replenishPettyCash: b.mutation<ApiEnvelope<PettyCashFund>, Act & { date: string; amount?: number; bank_account?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/petty-cash-funds/${id}/replenish/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePettyCash", "FinanceJournals"],
    }),
    getPettyCashVouchers: b.query<PaginatedEnvelope<PettyCashVoucher>, E>({
      query: (p) => ({ url: `/finance/petty-cash-vouchers/${qs(p)}`, method: "GET" }),
      providesTags: ["FinancePettyCash"],
    }),
    postPettyCashVoucher: b.mutation<ApiEnvelope<PettyCashVoucher>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/petty-cash-vouchers/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinancePettyCash", "FinanceJournals"],
    }),

    // Payroll
    getPayrollRuns: b.query<PaginatedEnvelope<PayrollRun>, E>({
      query: (p) => ({ url: `/finance/payroll-runs/${qs(p)}`, method: "GET" }),
      providesTags: ["FinancePayroll"],
    }),
    getPayrollRun: b.query<ApiEnvelope<PayrollRun>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/payroll-runs/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinancePayroll"],
    }),
    postPayrollRun: b.mutation<ApiEnvelope<PayrollRun>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/payroll-runs/${id}/post/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinancePayroll", "FinanceJournals"],
    }),
    payPayrollRun: b.mutation<ApiEnvelope<PayrollRun>, Act & { bank_account?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/payroll-runs/${id}/pay/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePayroll", "FinanceJournals"],
    }),

    // Budgets
    getBudgets: b.query<PaginatedEnvelope<Budget>, E>({
      query: (p) => ({ url: `/finance/budgets/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceBudgets"],
    }),
    approveBudget: b.mutation<ApiEnvelope<Budget>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/budgets/${id}/approve/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceBudgets"],
    }),

    // Fixed assets
    getFixedAssets: b.query<PaginatedEnvelope<FixedAsset>, E>({
      query: (p) => ({ url: `/finance/fixed-assets/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceFixedAssets"],
    }),
    acquireFixedAsset: b.mutation<ApiEnvelope<FixedAsset>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/fixed-assets/${id}/acquire/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceFixedAssets", "FinanceJournals"],
    }),
    depreciateFixedAsset: b.mutation<ApiEnvelope<FixedAsset>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/fixed-assets/${id}/depreciate/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceFixedAssets", "FinanceJournals"],
    }),

    // Tax
    getTaxObligations: b.query<PaginatedEnvelope<TaxObligation>, E>({
      query: (p) => ({ url: `/finance/tax-obligations/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceTax"],
    }),
    getTaxFilings: b.query<PaginatedEnvelope<TaxFiling>, E>({
      query: (p) => ({ url: `/finance/tax-filings/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceTax"],
    }),
    fileTaxFiling: b.mutation<ApiEnvelope<TaxFiling>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/tax-filings/${id}/file/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceTax", "FinanceJournals"],
    }),
    payTaxFiling: b.mutation<ApiEnvelope<TaxFiling>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/tax-filings/${id}/pay/${qs({ entity })}`, method: "POST" }),
      invalidatesTags: ["FinanceTax", "FinanceJournals"],
    }),
  }),
});

export const {
  useGetBankAccountsQuery,
  useGetStatementLinesQuery,
  useAutoReconcileMutation,
  useGetExpenseClaimsQuery,
  useGetExpenseClaimQuery,
  usePostExpenseClaimMutation,
  useSettleExpenseClaimMutation,
  useGetPettyCashFundsQuery,
  useReplenishPettyCashMutation,
  useGetPettyCashVouchersQuery,
  usePostPettyCashVoucherMutation,
  useGetPayrollRunsQuery,
  useGetPayrollRunQuery,
  usePostPayrollRunMutation,
  usePayPayrollRunMutation,
  useGetBudgetsQuery,
  useApproveBudgetMutation,
  useGetFixedAssetsQuery,
  useAcquireFixedAssetMutation,
  useDepreciateFixedAssetMutation,
  useGetTaxObligationsQuery,
  useGetTaxFilingsQuery,
  useFileTaxFilingMutation,
  usePayTaxFilingMutation,
} = opsApi;
