// Types for the Export Centre (backend app `vs_exports`, mounted at /v1/exports/).
//
// Every shape here is read from apps/vs_exports/serializers.py — this feature's
// API already exists, so nothing below is invented. See
// docs/EXPORT_BUILD_NOTES.md for the endpoint→screen map.

// ── Closed vocabularies (vs_exports/constants.py) ─────────────────────────────

/** vs_exports RunStatus. EXPIRED is deliberately absent: expiry is a property of
 *  the FILE, derived at read time, so a completed run stays completed forever. */
export type ExportRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "COMPLETED_WITH_OMISSIONS"
  | "FAILED"
  | "CANCELLED";

export type ExportTrigger = "MANUAL" | "QUICK" | "RETRY" | "API";
export type ExportFormat = "csv" | "xlsx";
export type ValuesMode = "people" | "system";

/** Why part of a COMPLETED_WITH_OMISSIONS result was left out. */
export type OmissionCode = "FIELD_FORBIDDEN" | "FIELD_WITHDRAWN" | "ROW_CAP_HIT";

export type DeliveryState = "PENDING" | "SENT" | "FAILED" | "REVOKED" | "SKIPPED";
export type DownloadOutcome = "ALLOWED" | "REFUSED";

// ── Runs, files, downloads ────────────────────────────────────────────────────

export interface ExportFile {
  id: number;
  name: string;
  format: ExportFormat;
  size_bytes: number;
  row_count: number;
  columns_produced: string[];
  available_until: string;
  purged_at: string | null;
  download_count: number;
  /** All three are derived server-side at read time, never stored. */
  is_expired: boolean;
  is_purged: boolean;
  is_downloadable: boolean;
}

/** Present only while a run is NOT terminal; null once it has finished.
 *  A null `rows_total` means indeterminate progress — expected, not an error. */
export interface ExportProgress {
  phase: string;
  phase_label: string;
  rows_done: number;
  rows_total: number | null;
  /** Null once the run starts. While queued this is what explains the wait. */
  queue_position: number | null;
}

export interface ExportOmission {
  code: OmissionCode;
  scope: string;
  detail: string;
  items?: string[];
}

/** The UI shows `message` and `recommended_action` and maps nothing itself.
 *  `code` is for support and analytics; it is never rendered raw. */
export interface ExportFailure {
  code: string;
  message: string;
  recommended_action: string;
  reference: string;
  retryable: boolean;
}

/** The frozen config as labels, not as the stored blob. */
export interface ExportRunConfiguration {
  dataset: string;
  scope: string;
  columns: string[];
  filters: string[];
  format: ExportFormat;
  values_mode: ValuesMode;
}

export interface ExportDelivery {
  id: number;
  destination: string;
  recipient: string;
  state: DeliveryState;
  attempted_at: string | null;
  failure_reason: string;
}

export interface ExportRun {
  id: number;
  reference: string;
  export_name: string;
  status: ExportRunStatus;
  trigger: ExportTrigger;
  requested_by_name: string;
  queued_at: string;
  started_at: string | null;
  ended_at: string | null;
  row_count: number | null;
  attempt: number;
  progress: ExportProgress | null;
  file: ExportFile | null;
}

export interface ExportRunDetail extends ExportRun {
  omissions: ExportOmission[];
  failure: ExportFailure | null;
  configuration: ExportRunConfiguration;
  /** How far the definition has drifted from what produced this file. */
  drift: { count: number; fields: string[] };
  deliveries: ExportDelivery[];
}

/** One download attempt — allowed and refused alike. */
export interface ExportDownloadEntry {
  id: number;
  user_name: string;
  at: string;
  ip_address: string;
  outcome: DownloadOutcome;
  refusal_reason: string;
}

/** Flags so the UI can disable with a reason instead of failing at submit. */
export interface ExportCapabilities {
  can_create: boolean;
  can_run: boolean;
  can_share: boolean;
  can_export_sensitive: boolean;
  can_view_activity: boolean;
  allowed_entities: { id: number; code: string; name: string }[];
  row_cap: number;
  concurrent_run_limit: number;
  in_flight: number;
  retention_days: number;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface RunListParams {
  status?: ExportRunStatus | "";
  trigger?: ExportTrigger | "";
  definition?: number;
  page?: number;
}

// ── Envelopes (platform convention: {success, message, data}) ────────────────

export interface ExportPagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface ExportListResponse<T> {
  message?: string;
  data: T[];
  pagination: ExportPagination;
}

export interface ExportItemResponse<T> {
  message?: string;
  data: T;
}
