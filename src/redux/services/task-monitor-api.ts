/**
 * The platform task monitor - /v1/admin/tasks/, the hardened operator surface
 * over core.BackgroundJob. Distinct from `health-api`'s /health/tasks/, which
 * reads the same table for the Jobs & Queues list but serves metadata only and
 * has no per-run detail.
 *
 * Three keys govern it, and the split is the whole design:
 *   platform.tasks.view            the redacted list and one run's detail
 *   platform.tasks.view_all        widens the list past the caller's own tenant
 *   platform.tasks.view_sensitive  the raw failure text (audited on every read)
 *
 * The tenant filter is `for_tenant`, never `tenant`. `?tenant=` is the
 * assertion the auth layer requires - who is asking - and this viewset does not
 * accept a foreign one, so sending it as a filter would narrow every caller to
 * their own tenant and hide every school from the person holding view_all.
 */

import { baseApi } from "./base-api";
import { generateQueryString } from "@/utils/helpers";

/** One run as the list serves it: metadata only, no payload fields. */
export interface TaskRun {
  id: string;
  celery_task_id: string;
  task_name: string;
  kind: string;
  label: string;
  owner: number | null;
  owner_name: string | null;
  tenant: number | null;
  status: string;
  progress: number | null;
  worker: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  runtime_seconds: number | null;
  /** True when raw failure text exists to open. Not the text itself. */
  has_diagnostic: boolean;
}

/** The detail route adds the REDACTED payloads. Never the traceback. */
export interface TaskRunDetail extends TaskRun {
  result: unknown;
  error: string;
}

/** The raw record. Reaching this writes an audit event naming the reader. */
export interface TaskDiagnostic {
  job: string;
  task_name: string;
  tenant: number | null;
  raw_error: string;
  raw_traceback: string;
  raw_result: unknown;
  recorded_at: string;
  expires_at: string;
}

export interface TaskParams {
  page?: number;
  page_size?: number;
  status?: string;
  task?: string;
  kind?: string;
  since?: string;
  for_tenant?: string;
}

export const taskMonitorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTaskRuns: b.query<
      { data: TaskRun[]; pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number } },
      TaskParams
    >({
      query: (p) => `/admin/tasks/${generateQueryString(p as Record<string, string | number>)}`,
      providesTags: ["Health"],
    }),
    getTaskRun: b.query<{ data: TaskRunDetail }, string>({
      query: (id) => `/admin/tasks/${id}/`,
      providesTags: ["Health"],
    }),
    // Deliberately NOT cached across mounts: every read is audited, so serving
    // a second look from cache would under-report and a refetch would
    // over-report. keepUnusedDataFor: 0 makes one open equal one recorded read.
    getTaskDiagnostic: b.query<{ data: TaskDiagnostic }, string>({
      query: (id) => `/admin/tasks/${id}/diagnostics/`,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetTaskRunsQuery,
  useGetTaskRunQuery,
  useLazyGetTaskDiagnosticQuery,
} = taskMonitorApi;
