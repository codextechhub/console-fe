// Setup / master-data reads + month-end close + audit log (vs_finance).
//   GET  /finance/accounts/         finance.account.view
//   GET  /finance/periods/          finance.period.view
//   POST /finance/periods/{id}/close/  finance.period.close
//   GET  /finance/audit-logs/        finance.audit.view
//   GET  /finance/currencies|tax-codes|cost-centers  (reference)

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope, PaginatedEnvelope } from "./api-types";
import type {
  Account,
  CostCenter,
  Currency,
  FinanceAuditLog,
  FiscalPeriod,
  PeriodCloseResult,
  TaxCode,
} from "./setup-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);

export const setupApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAccounts: b.query<PaginatedEnvelope<Account>, { entity: string; account_type?: string; is_postable?: boolean; page?: number }>({
      query: (p) => ({ url: `/finance/accounts/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceAccounts"],
    }),
    getPeriods: b.query<PaginatedEnvelope<FiscalPeriod>, { entity: string; status?: string; year?: number }>({
      query: (p) => ({ url: `/finance/periods/${qs(p)}`, method: "GET" }),
      providesTags: ["FinancePeriods"],
    }),
    closePeriod: b.mutation<ApiEnvelope<PeriodCloseResult>, { id: number; entity: string; soft?: boolean; force?: boolean; run_depreciation?: boolean }>({
      query: ({ id, entity, ...body }) => ({ url: `/finance/periods/${id}/close/${qs({ entity })}`, method: "POST", body }),
      invalidatesTags: ["FinancePeriods", "FinanceReports"],
    }),
    getCurrencies: b.query<PaginatedEnvelope<Currency>, void>({
      query: () => ({ url: `/finance/currencies/`, method: "GET" }),
      providesTags: ["FinanceSetup"],
    }),
    getTaxCodes: b.query<PaginatedEnvelope<TaxCode>, { entity: string }>({
      query: (p) => ({ url: `/finance/tax-codes/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceSetup"],
    }),
    getCostCenters: b.query<PaginatedEnvelope<CostCenter>, { entity: string }>({
      query: (p) => ({ url: `/finance/cost-centers/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceSetup"],
    }),
    getAuditLog: b.query<PaginatedEnvelope<FinanceAuditLog>, { entity: string; page?: number; action?: string }>({
      query: (p) => ({ url: `/finance/audit-logs/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceAuditLog"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetPeriodsQuery,
  useClosePeriodMutation,
  useGetCurrenciesQuery,
  useGetTaxCodesQuery,
  useGetCostCentersQuery,
  useGetAuditLogQuery,
} = setupApi;
