// Financial-statement report endpoints (vs_finance). All gate on
// finance.report.view and return plain JSON (not paginated). Each also accepts
// ?export=csv|xlsx|pdf for a file download (handled in the UI via a direct link).

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { ApiEnvelope } from "./api-types";
import type {
  ArAging,
  IncomeStatement,
  ReportParams,
  SectionedReport,
  TrialBalance,
} from "./reports-types";

const qs = (p: object) => generateQueryString(p as Record<string, string | number>);

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrialBalance: builder.query<ApiEnvelope<TrialBalance>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/trial-balance/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
    getIncomeStatement: builder.query<ApiEnvelope<IncomeStatement>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/income-statement/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
    getBalanceSheet: builder.query<ApiEnvelope<SectionedReport>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/balance-sheet/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
    getCashFlow: builder.query<ApiEnvelope<SectionedReport>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/cash-flow/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
    getChangesInEquity: builder.query<ApiEnvelope<SectionedReport>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/changes-in-equity/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
    getArAging: builder.query<ApiEnvelope<ArAging>, ReportParams>({
      query: (p) => ({ url: `/finance/reports/ar-aging/${qs(p)}`, method: "GET" }),
      providesTags: ["FinanceReports"],
    }),
  }),
});

export const {
  useGetTrialBalanceQuery,
  useGetIncomeStatementQuery,
  useGetBalanceSheetQuery,
  useGetCashFlowQuery,
  useGetChangesInEquityQuery,
  useGetArAgingQuery,
} = reportsApi;
