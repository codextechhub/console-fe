import { baseApi } from "./base-api";
import { generateQueryString } from "@/utils/helpers";

type Params = Record<string, string | number>;
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown" | string;
export interface Signal { value: number; unit: string; delta: number; status: HealthStatus; spark: number[] }
export interface Service { key: string; name: string; group: string; tier: number; kind: string; status: HealthStatus; status_changed_at: string | null }
export interface SeriesPoint { t: string; requests: number; status_2xx: number; status_3xx: number; status_4xx: number; status_5xx: number; error_rate: number; p95: number }
export interface Incident { id: string; code: string; title: string; severity: number; severity_label?: string; status: string; owner_label: string; affected_tenant_count: number; started_at: string; service_keys: string[]; summary?: string }
export interface Queue { name: string; depth: number; status: HealthStatus; throughput_per_min: number; failed: number; retrying: number; dead: number; retry_storm: boolean; avg_duration_sec: number; depth_trend: number[]; captured_at: string }
export interface Overview { posture: { overall: string; label: string; critical: number; warning: number; active_incidents: number }; global_uptime: number; kpis: Record<"latency" | "traffic" | "errors" | "saturation", Signal>; services: Service[]; request_series: SeriesPoint[]; queues: Queue[]; active_incidents: Incident[] }
export interface Monitor { key: string; name: string; status: HealthStatus; uptime_24h: number; uptime_7d: number; uptime_30d: number; uptime_90d: number; segments: Array<{ day: string; status: HealthStatus; uptime: number }>; response_series: Array<{ t: string; ms: number }>; avg_response_ms: number | null; ssl: { days_left: number | null; domain: string | null } | null }
export interface Endpoint { route: string; method: string; requests: number; rpm: number; p50: number; p95: number; p99: number; error_rate: number; throttled: number; status: HealthStatus; codes: { x2: number; x3: number; x4: number; x5: number } }
export interface EndpointData { endpoints: Endpoint[]; top_slowest: Endpoint[]; top_errors: Endpoint[]; status_code_series: SeriesPoint[] }
export interface Task { id: string; task_name: string; label: string; kind: string; queue: string; status: string; tenant: string | null; duration_sec: number | null; worker: string; created_at: string }
export interface Alert { id: string; rule_name: string; severity: number; title: string; service_key: string | null; value: number; threshold: number; status: string; fired_at: string; resolved_at: string | null; incident_id: string | null }
export interface AlertRule { id: string; name: string; metric: string; comparator: string; threshold: number; duration_sec: number; severity: number; target_service_key: string | null; target_queue: string; channel: string; is_enabled: boolean }
export interface Reliability { mtta_min: number | null; mttr_min: number | null; incidents: number; active: number; window_days: number }
export interface TenantHealth { school_id: number; name: string; requests: number; rpm: number; error_rate: number; p95: number; noisy: boolean; status: HealthStatus }
export interface Slo { service: string; service_key: string; target: number; current: number; window_days: number; error_budget_remaining: number; breached: boolean }
export interface ServiceDetail extends Service { uptime: Monitor | null; recent_alerts: Alert[] }
export interface EndpointDetail { route: string; totals: { requests: number; error_rate: number; avg_ms: number; s2: number; s3: number; s4: number; s5: number; throttled: number }; p50: number; p95: number; p99: number; series: SeriesPoint[]; affected_tenants: Array<{ school_id: number; name: string; requests: number; error_rate: number }> }
export interface IncidentDetail extends Incident { postmortem?: string; acknowledged_at?: string | null; resolved_at?: string | null; timeline: Array<{ id: string; kind: string; who: string; text: string; created_at: string }> }
export interface TenantDetail { range: string; school_id: number; kpis: Record<"latency" | "traffic" | "errors" | "saturation", Signal>; series: SeriesPoint[]; endpoints: Endpoint[] }
interface Page<T> { data: T[]; pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number } }

export const healthApi = baseApi.injectEndpoints({ endpoints: (b) => ({
  getHealthOverview: b.query<{ data: Overview }, Params>({ query: (p) => `/health/overview/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getHealthUptime: b.query<{ data: { monitors: Monitor[] } }, void>({ query: () => "/health/uptime/monitors/", providesTags: ["Health"] }),
  getHealthServiceDetail: b.query<{ data: ServiceDetail }, string>({ query: (key) => `/health/services/${key}/`, providesTags: ["Health"] }),
  getHealthMonitorDetail: b.query<{ data: Monitor }, string>({ query: (key) => `/health/uptime/monitors/${key}/`, providesTags: ["Health"] }),
  getHealthEndpoints: b.query<{ data: EndpointData }, Params>({ query: (p) => `/health/api-endpoints/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getHealthEndpointDetail: b.query<{ data: EndpointDetail }, { route: string; range: string }>({ query: ({ route, range }) => `/health/api-endpoints/detail/${generateQueryString({ route, range })}`, providesTags: ["Health"] }),
  getHealthQueues: b.query<{ data: { queues: Queue[]; workers: { active: number; idle: number; total: number } } }, void>({ query: () => "/health/queues/", providesTags: ["Health"] }),
  getHealthTasks: b.query<Page<Task>, Params>({ query: (p) => `/health/tasks/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getHealthIncidents: b.query<Page<Incident>, Params>({ query: (p) => `/health/incidents/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getHealthIncidentDetail: b.query<{ data: IncidentDetail }, string>({ query: (id) => `/health/incidents/${id}/`, providesTags: ["Health"] }),
  getHealthAlerts: b.query<Page<Alert>, Params>({ query: (p) => `/health/alerts/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getAlertRules: b.query<Page<AlertRule>, void>({ query: () => "/health/alert-rules/", providesTags: ["Health"] }),
  getReliability: b.query<{ data: Reliability }, void>({ query: () => "/health/incidents/reliability/", providesTags: ["Health"] }),
  getTenantHealth: b.query<{ data: { tenants: TenantHealth[] } }, Params>({ query: (p) => `/health/tenants/${generateQueryString(p)}`, providesTags: ["Health"] }),
  getTenantHealthDetail: b.query<{ data: TenantDetail }, { id: number; range: string }>({ query: ({ id, range }) => `/health/tenants/${id}/${generateQueryString({ range })}`, providesTags: ["Health"] }),
  getSlos: b.query<{ data: { slos: Slo[] } }, void>({ query: () => "/health/slos/", providesTags: ["Health"] }),
}) });

export const { useGetHealthOverviewQuery, useGetHealthUptimeQuery, useGetHealthServiceDetailQuery, useGetHealthMonitorDetailQuery, useGetHealthEndpointsQuery, useGetHealthEndpointDetailQuery, useGetHealthQueuesQuery, useGetHealthTasksQuery, useGetHealthIncidentsQuery, useGetHealthIncidentDetailQuery, useGetHealthAlertsQuery, useGetAlertRulesQuery, useGetReliabilityQuery, useGetTenantHealthQuery, useGetTenantHealthDetailQuery, useGetSlosQuery } = healthApi;
