import type {
  AuditActorType,
  AuditEventQueryParams,
  AuditSeverity,
  AuditStatus,
} from "@/redux/services/dashboard/audit-types";

export const AUDIT_DATE_RANGES = [
  { value: "15m", label: "Last 15m", ms: 15 * 60_000 },
  { value: "1h", label: "Last hour", ms: 3_600_000 },
  { value: "24h", label: "Last 24h", ms: 86_400_000 },
  { value: "7d", label: "Last 7 days", ms: 7 * 86_400_000 },
  { value: "30d", label: "Last 30 days", ms: 30 * 86_400_000 },
  { value: "all", label: "All time", ms: 0 },
] as const;

export type AuditDateRange = (typeof AUDIT_DATE_RANGES)[number]["value"];

/**
 * The slug `tenant_slug` accepts to mean "events that belong to no customer":
 * platform operations, sweeps and management commands. Underscored because a
 * tenant slug cannot contain underscores, so no school can ever shadow it.
 */
export const AUDIT_NO_TENANT = "__none__";

export interface AuditEventFilters {
  dateRange: AuditDateRange;
  search: string;
  /** A tenant slug, AUDIT_NO_TENANT, or "" for every tenant. */
  tenantSlug: string;
  modules: string[];
  actionTypes: string[];
  severities: AuditSeverity[];
  statuses: AuditStatus[];
  actorType: "" | AuditActorType;
  entityType: string;
  entityId: string;
}

const SEVERITIES = new Set<AuditSeverity>(["INFO", "WARNING", "CRITICAL"]);
const STATUSES = new Set<AuditStatus>(["SUCCESS", "FAILED", "DENIED", "PARTIAL"]);
const DATE_RANGES = new Set<AuditDateRange>(AUDIT_DATE_RANGES.map((range) => range.value));

export function defaultAuditEventFilters(dateRange: AuditDateRange = "24h"): AuditEventFilters {
  return {
    dateRange,
    search: "",
    tenantSlug: "",
    modules: [],
    actionTypes: [],
    severities: [],
    statuses: [],
    actorType: "",
    entityType: "",
    entityId: "",
  };
}

function uniqueNormalized(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toUpperCase()).filter(Boolean))];
}

export function parseAuditEventFilters(params: URLSearchParams): AuditEventFilters {
  const entityType = (params.get("entity_type") ?? "").trim();
  const entityId = (params.get("entity_id") ?? "").trim();
  const requestedRange = params.get("date_range") as AuditDateRange | null;
  const dateRange = requestedRange && DATE_RANGES.has(requestedRange)
    ? requestedRange
    : entityType || entityId
      ? "all"
      : "24h";
  const actorTypeValue = params.get("actor_type")?.toUpperCase();

  return {
    dateRange,
    search: (params.get("search") ?? "").trim(),
    // Not checked against the roster here: the roster is fetched, and a slug
    // no tenant answers to is a 400 the backend gives on purpose, so that a
    // misspelling reads as a refusal rather than as "nothing happened there".
    tenantSlug: (params.get("tenant_slug") ?? "").trim().toLowerCase(),
    modules: uniqueNormalized(params.getAll("module_key")),
    actionTypes: uniqueNormalized(params.getAll("action_type")),
    severities: uniqueNormalized(params.getAll("severity")).filter(
      (value): value is AuditSeverity => SEVERITIES.has(value as AuditSeverity),
    ),
    statuses: uniqueNormalized(params.getAll("status")).filter(
      (value): value is AuditStatus => STATUSES.has(value as AuditStatus),
    ),
    actorType: actorTypeValue === "USER" || actorTypeValue === "SYSTEM" ? actorTypeValue : "",
    entityType,
    entityId,
  };
}

export function parseAuditEventPage(params: URLSearchParams): number {
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function normalizedText(value: string): string {
  return value.trim();
}

export function buildAuditEventQuery(
  filters: AuditEventFilters,
  page: number,
  now: number,
): AuditEventQueryParams {
  const query: AuditEventQueryParams = { page };
  const search = normalizedText(filters.search);
  const entityType = normalizedText(filters.entityType);
  const entityId = normalizedText(filters.entityId);

  if (search) query.search = search;
  if (filters.tenantSlug) query.tenant_slug = filters.tenantSlug;
  if (filters.modules.length) query.module_key = uniqueNormalized(filters.modules);
  if (filters.actionTypes.length) query.action_type = uniqueNormalized(filters.actionTypes);
  if (filters.severities.length) query.severity = filters.severities;
  if (filters.statuses.length) query.status = filters.statuses;
  if (filters.actorType) query.actor_type = filters.actorType;
  if (entityType) query.entity_type = entityType;
  if (entityId) query.entity_id = entityId;

  const range = AUDIT_DATE_RANGES.find((item) => item.value === filters.dateRange);
  if (range && range.ms > 0) {
    query.date_from = new Date(now - range.ms).toISOString();
  }

  return query;
}

export function buildAuditExportFilterPayload(
  filters: AuditEventFilters,
  now: number,
): Record<string, unknown> {
  const query = buildAuditEventQuery(filters, 1, now);
  const payload: Record<string, unknown> = { ...query };
  delete payload.page;
  return payload;
}

export function serializeAuditEventFilters(
  filters: AuditEventFilters,
  page?: number,
): URLSearchParams {
  const params = new URLSearchParams();
  const appendAll = (key: string, values: string[]) => {
    uniqueNormalized(values).forEach((value) => params.append(key, value));
  };

  if (filters.dateRange !== "24h") params.set("date_range", filters.dateRange);
  if (normalizedText(filters.search)) params.set("search", normalizedText(filters.search));
  if (filters.tenantSlug) params.set("tenant_slug", filters.tenantSlug);
  appendAll("module_key", filters.modules);
  appendAll("action_type", filters.actionTypes);
  appendAll("severity", filters.severities);
  appendAll("status", filters.statuses);
  if (filters.actorType) params.set("actor_type", filters.actorType);
  if (normalizedText(filters.entityType)) params.set("entity_type", normalizedText(filters.entityType));
  if (normalizedText(filters.entityId)) params.set("entity_id", normalizedText(filters.entityId));
  if (page && page > 1) params.set("page", String(page));

  return params;
}
