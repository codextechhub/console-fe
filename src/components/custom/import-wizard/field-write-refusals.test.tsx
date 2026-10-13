import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportBatch, ImportJob } from "@/redux/services/dashboard/import-types";

const state = vi.hoisted(() => ({ job: undefined as unknown }));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: () => false, fieldAccess: {} }),
}));
vi.mock("@/redux/services/dashboard/import-api", () => ({
  useGetImportTemplatesQuery: () => ({}),
  useGetImportTemplateQuery: () => ({}),
  useGetImportJobsQuery: () => ({}),
  useGetImportJobQuery: () => ({ data: state.job ? { data: state.job } : undefined }),
  useRollbackImportJobMutation: () => [vi.fn(), { isLoading: false }],
  useDownloadImportTemplateMutation: () => [vi.fn(), { isLoading: false }],
  importDownloadUrls: { validationIssuesExport: () => "" },
}));

const { CompleteStep, ReviewIssuesStep, refusedFields } = await import("./wizard-steps");

/**
 * A CX users file whose rows set details the importer's write switches keep
 * closed is refused per field. The preview lists one issue per refused field
 * beside its row and column, worded by the server; execution records the row
 * as failed with the same sentence, and a failed job's own message is shown
 * plainly.
 */
const REFUSAL = "You may not set Employee ID.";

const previewBatch = {
  id: 7,
  status: "validation_failed",
  dataset_type: "cx_users",
  total_rows: 3,
  error_count: 2,
  warning_count: 0,
  is_ready_for_import: false,
  validation_summary: { error_count: 2, warning_count: 0, info_count: 0, error_rows: 2 },
  validation_issues: [
    {
      id: 1, severity: "error", code: "business_rule", message: REFUSAL,
      row_number: 2, column_name: "Employee ID", field_name: "", is_resolved: false,
      created_at: "", raw_value: "", metadata: { field_write_denied: ["employee_id"] },
    },
    {
      id: 2, severity: "error", code: "business_rule", message: "You may not set Date joined.",
      row_number: 2, column_name: "Date Joined", field_name: "", is_resolved: false,
      created_at: "", raw_value: "", metadata: { field_write_denied: ["date_joined"] },
    },
  ],
} as unknown as ImportBatch;

const failedBatch = { id: 7, status: "import_failed", dataset_type: "cx_users" } as unknown as ImportBatch;
const partialBatch = { id: 7, status: "import_partial", dataset_type: "cx_users" } as unknown as ImportBatch;

const renderPreview = () =>
  renderToStaticMarkup(
    <ReviewIssuesStep batch={previewBatch} batchId={7} onBack={() => {}} onNext={() => {}} />,
  );
const renderComplete = (batch: ImportBatch) =>
  renderToStaticMarkup(
    <CompleteStep batch={batch} batchId={7} jobId={3} onNewImport={() => {}} />,
  );

describe("a refused field in the import preview", () => {
  it("is listed under its row with the server's sentence and its column", () => {
    const html = renderPreview();
    expect(html).toContain("Row 2");
    expect(html).toContain(REFUSAL);
    expect(html).toContain("You may not set Date joined.");
    expect(html).toContain("Employee ID");
    expect(html).toContain("Date Joined");
    expect(html).toContain("business_rule");
  });

  it("counts one issue per refused field on the one row", () => {
    expect(renderPreview()).toContain("2 issues");
  });
});

describe("a refused field after the import ran", () => {
  beforeEach(() => { state.job = undefined; });

  it("shows the failed row's message verbatim, with the field it names", () => {
    state.job = {
      id: 3, failed_rows: 1, skipped_rows: 0, succeeded_rows: 0, processed_rows: 1,
      row_results: [{
        id: 1, job: 3, row_number: 2, action: "failed", target_model: "cx_users",
        target_object_pk: "", status_message: REFUSAL,
        error_details: { field_write_denied: ["employee_id"] },
      }],
    } as unknown as ImportJob;
    const html = renderComplete(partialBatch);
    expect(html).toContain("Row 2");
    expect(html).toContain(REFUSAL);
    expect(html).toContain("employee_id");
  });

  it("shows the sentence alone when the viewer may not read the row's error details", () => {
    state.job = {
      id: 3, failed_rows: 1, skipped_rows: 0, succeeded_rows: 0, processed_rows: 1,
      row_results: [{
        id: 1, job: 3, row_number: 2, action: "failed", target_model: "cx_users",
        target_object_pk: "", status_message: REFUSAL,
      }],
    } as unknown as ImportJob;
    const html = renderComplete(partialBatch);
    expect(html).toContain(REFUSAL);
    expect(html).not.toContain("field:");
  });

  it("states a failed job's own message plainly", () => {
    state.job = {
      id: 3, failed_rows: 0, skipped_rows: 0, succeeded_rows: 0, processed_rows: 0,
      last_error_message: "The platform tenant is not provisioned.", row_results: [],
    } as unknown as ImportJob;
    expect(renderComplete(failedBatch)).toContain("The platform tenant is not provisioned.");
  });

  it("adds no message line when the job carries none", () => {
    state.job = { id: 3, failed_rows: 0, skipped_rows: 0, succeeded_rows: 0, processed_rows: 0, row_results: [] } as unknown as ImportJob;
    expect(renderComplete(failedBatch)).not.toContain('role="alert"');
  });
});

describe("refusedFields", () => {
  it("reads the field names the server recorded, and nothing else", () => {
    expect(refusedFields({ error_details: { field_write_denied: ["employee_id", "date_joined"] } }))
      .toEqual(["employee_id", "date_joined"]);
    expect(refusedFields({ error_details: { field_write_denied: [3, "job_title"] } })).toEqual(["job_title"]);
    expect(refusedFields({ error_details: { validation_errors: {} } })).toEqual([]);
    expect(refusedFields({})).toEqual([]);
  });
});
