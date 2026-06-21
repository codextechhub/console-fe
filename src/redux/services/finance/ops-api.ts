// Finance-operations RTK Query endpoints (vs_finance views_ops): banking,
// expense claims, petty cash, payroll, budgets, fixed assets, tax. Reads gate on
// *.view; actions on their own rbac_permission.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  BankAccount,
  BankAccountDetail,
  BankBookLine,
  BankReconciliationRun,
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
    getBankAccount: b.query<ApiEnvelope<BankAccountDetail>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/bank-accounts/${id}/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    createBankAccount: b.mutation<ApiEnvelope<BankAccount>, { entity: string; name: string; bank_name?: string; account_number?: string; gl_account: string; currency?: string; is_active?: boolean; is_primary?: boolean }>({
      query: ({ entity, ...body }) => ({ url: `/finance/bank-accounts/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBankAccounts"],
    }),
    updateBankAccount: b.mutation<ApiEnvelope<BankAccount>, Act & { name?: string; bank_name?: string; account_number?: string; currency?: string; is_active?: boolean; is_primary?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/bank-accounts/${id}/${qs({ entity })}`, method: "PATCH", body }),
      invalidatesTags: ["FinanceBankAccounts"],
    }),
    getStatementLines: b.query<ApiEnvelope<BankStatementLine[]>, Act & { status?: string }>({
      query: ({ id, ...p }) => ({ url: `/finance/bank-accounts/${id}/statement-lines/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceStatementLines"],
    }),
    importStatement: b.mutation<ApiEnvelope<BankStatementLine[]>, Act & { lines: { txn_date: string; amount: number; description?: string; reference?: string }[]; period_label?: string; statement_date?: string; opening_balance?: number; closing_balance?: number }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/bank-accounts/${id}/statement-lines/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    autoReconcile: b.mutation<ApiEnvelope<BankStatementLine[]>, Act & { tolerance_days?: number }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/bank-accounts/${id}/auto-reconcile/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    getBookLines: b.query<ApiEnvelope<BankBookLine[]>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/bank-accounts/${id}/book-lines/${qs({ entity })}`, method: "GET" }),
      providesTags: ["FinanceStatementLines"],
    }),
    matchStatementLine: b.mutation<ApiEnvelope<BankStatementLine>, { id: number; entity: string; journal_line: number }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/statement-lines/${id}/match/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    adjustStatementLine: b.mutation<ApiEnvelope<BankStatementLine>, { id: number; entity: string; counter_account?: string; narration?: string }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/statement-lines/${id}/adjust/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    unmatchStatementLine: b.mutation<ApiEnvelope<BankStatementLine>, { id: number; entity: string }>({
      query: ({ id, entity }) => ({ url: `/finance/statement-lines/${id}/unmatch/${qs({ entity })}`, method: "POST", body: {} }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),
    completeReconciliation: b.mutation<ApiEnvelope<BankReconciliationRun>, Act>({
      query: ({ id, entity }) => ({ url: `/finance/bank-accounts/${id}/reconcile/complete/${qs({ entity })}`, method: "POST", body: {} }),
      invalidatesTags: ["FinanceBankAccounts", "FinanceStatementLines"],
    }),

    // Expense claims
    getExpenseClaims: b.query<PaginatedEnvelope<ExpenseClaim>, E>({
      query: (p) => ({ url: `/finance/expense-claims/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceExpenseClaims"],
    }),
    createExpenseClaim: b.mutation<ApiEnvelope<ExpenseClaim>, { entity: string; claimant_name?: string; claim_date: string; title?: string; narration?: string; lines: { description: string; expense_account: string; quantity: number; unit_price: number; tax_code?: string; cost_center?: string }[] }>({
      query: ({ entity, ...body }) => ({ url: `/finance/expense-claims/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceExpenseClaims"],
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
    createPettyCashVoucher: b.mutation<ApiEnvelope<PettyCashVoucher>, { entity: string; fund: number; voucher_date: string; payee?: string; reference?: string; lines: { description: string; expense_account: string; quantity: number; unit_price: number; tax_code?: string; cost_center?: string }[] }>({
      query: ({ entity, ...body }) => ({ url: `/finance/petty-cash-vouchers/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePettyCash"],
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
    createPayrollRun: b.mutation<ApiEnvelope<PayrollRun>, { entity: string; pay_date: string; period_label?: string; narration?: string; lines: { employee_name: string; gross_amount: number; paye_amount: number; pension_amount: number }[] }>({
      query: ({ entity, ...body }) => ({ url: `/finance/payroll-runs/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePayroll"],
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
    createBudget: b.mutation<ApiEnvelope<Budget>, { entity: string; name: string; fiscal_year?: number }>({
      query: ({ entity, ...body }) => ({ url: `/finance/budgets/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceBudgets"],
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
    createFixedAsset: b.mutation<ApiEnvelope<FixedAsset>, { entity: string; name: string; asset_code?: string; acquisition_date: string; cost: number; salvage_value?: number; useful_life_months: number; method?: string }>({
      query: ({ entity, ...body }) => ({ url: `/finance/fixed-assets/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceFixedAssets"],
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
    createTaxObligation: b.mutation<ApiEnvelope<TaxObligation>, { entity: string; code: string; name?: string; obligation_type: string; liability_account: string; authority_name?: string; frequency?: string; filing_day?: number }>({
      query: ({ entity, ...body }) => ({ url: `/finance/tax-obligations/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceTax"],
    }),
    getTaxFilings: b.query<PaginatedEnvelope<TaxFiling>, E>({
      query: (p) => ({ url: `/finance/tax-filings/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceTax"],
    }),
    createTaxFiling: b.mutation<ApiEnvelope<TaxFiling>, { entity: string; obligation: number; period_start: string; period_end: string; due_date?: string }>({
      query: ({ entity, ...body }) => ({ url: `/finance/tax-filings/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinanceTax"],
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
  useGetBankAccountQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useGetStatementLinesQuery,
  useImportStatementMutation,
  useAutoReconcileMutation,
  useGetBookLinesQuery,
  useMatchStatementLineMutation,
  useAdjustStatementLineMutation,
  useUnmatchStatementLineMutation,
  useCompleteReconciliationMutation,
  useGetExpenseClaimsQuery,
  useGetExpenseClaimQuery,
  useCreateExpenseClaimMutation,
  usePostExpenseClaimMutation,
  useSettleExpenseClaimMutation,
  useGetPettyCashFundsQuery,
  useReplenishPettyCashMutation,
  useGetPettyCashVouchersQuery,
  useCreatePettyCashVoucherMutation,
  usePostPettyCashVoucherMutation,
  useGetPayrollRunsQuery,
  useGetPayrollRunQuery,
  useCreatePayrollRunMutation,
  usePostPayrollRunMutation,
  usePayPayrollRunMutation,
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useApproveBudgetMutation,
  useGetFixedAssetsQuery,
  useCreateFixedAssetMutation,
  useAcquireFixedAssetMutation,
  useDepreciateFixedAssetMutation,
  useGetTaxObligationsQuery,
  useCreateTaxObligationMutation,
  useGetTaxFilingsQuery,
  useCreateTaxFilingMutation,
  useFileTaxFilingMutation,
  usePayTaxFilingMutation,
} = opsApi;
