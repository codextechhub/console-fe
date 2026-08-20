import { describe, expect, it } from "vitest";
import {
  AUDIT_NO_TENANT,
  buildAuditEventQuery,
  buildAuditExportFilterPayload,
  defaultAuditEventFilters,
  parseAuditEventFilters,
  parseAuditEventPage,
  serializeAuditEventFilters,
  type AuditEventFilters,
} from "./event-filter-contract";

describe("Audit Event Explorer filter contract", () => {
  it("restores repeated multi-select filters and missing enum choices from the URL", () => {
    const params = new URLSearchParams(
      "date_range=all&module_key=PROCUREMENT&module_key=EXPORTS&module_key=PLATFORM&" +
      "action_type=PROCUREMENT_ACTION&action_type=EXPORT_COMPLETED&" +
      "severity=WARNING&severity=CRITICAL&status=FAILED&status=DENIED&" +
      "actor_type=USER&entity_type=%20PurchaseOrder%20&entity_id=%20PO-4%20&" +
      "tenant_slug=%20Bright-Star%20&search=%20approval%20&page=3",
    );

    expect(parseAuditEventFilters(params)).toEqual({
      dateRange: "all",
      search: "approval",
      tenantSlug: "bright-star",
      modules: ["PROCUREMENT", "EXPORTS", "PLATFORM"],
      actionTypes: ["PROCUREMENT_ACTION", "EXPORT_COMPLETED"],
      severities: ["WARNING", "CRITICAL"],
      statuses: ["FAILED", "DENIED"],
      actorType: "USER",
      entityType: "PurchaseOrder",
      entityId: "PO-4",
    });
    expect(parseAuditEventPage(params)).toBe(3);
  });

  it("sends every selected value as a repeated-key capable query argument", () => {
    const filters: AuditEventFilters = {
      ...defaultAuditEventFilters("7d"),
      modules: ["PROCUREMENT", "EXPORTS"],
      actionTypes: ["PROCUREMENT_ACTION", "EXPORT_COMPLETED"],
      severities: ["WARNING", "CRITICAL"],
      statuses: ["FAILED", "DENIED"],
      search: "  buyer  ",
      entityType: "  PurchaseOrder  ",
    };

    expect(buildAuditEventQuery(filters, 2, Date.parse("2026-08-08T12:00:00.000Z"))).toEqual({
      page: 2,
      search: "buyer",
      module_key: ["PROCUREMENT", "EXPORTS"],
      action_type: ["PROCUREMENT_ACTION", "EXPORT_COMPLETED"],
      severity: ["WARNING", "CRITICAL"],
      status: ["FAILED", "DENIED"],
      entity_type: "PurchaseOrder",
      date_from: "2026-08-01T12:00:00.000Z",
    });
  });

  it("uses the same normalized filters for explorer queries and CSV exports", () => {
    const filters: AuditEventFilters = {
      ...defaultAuditEventFilters("all"),
      modules: ["PROCUREMENT", "EXPORTS"],
      actionTypes: ["PROCUREMENT_ACTION"],
      statuses: ["FAILED", "DENIED"],
      actorType: "SYSTEM",
      entityId: "PO-9",
      search: "purchase",
    };
    const now = Date.parse("2026-08-08T12:00:00.000Z");
    const explorerFilter: Record<string, unknown> = buildAuditEventQuery(filters, 4, now);
    delete explorerFilter.page;

    expect(buildAuditExportFilterPayload(filters, now)).toEqual(explorerFilter);
  });

  it("narrows to one tenant, and to the platform-level rows that belong to none", () => {
    const now = Date.parse("2026-08-08T12:00:00.000Z");
    const oneTenant: AuditEventFilters = {
      ...defaultAuditEventFilters("all"),
      tenantSlug: "bright-star",
    };
    const noTenant: AuditEventFilters = {
      ...defaultAuditEventFilters("all"),
      tenantSlug: AUDIT_NO_TENANT,
    };

    expect(buildAuditEventQuery(oneTenant, 1, now)).toEqual({ page: 1, tenant_slug: "bright-star" });
    // The sentinel travels as the backend spells it, not folded away as empty.
    expect(buildAuditEventQuery(noTenant, 1, now)).toEqual({ page: 1, tenant_slug: AUDIT_NO_TENANT });
    // An export of what the Explorer is showing has to carry the same scope, or
    // the CSV silently widens to every tenant.
    expect(buildAuditExportFilterPayload(oneTenant, now)).toEqual({ tenant_slug: "bright-star" });
    // "All tenants" sends no filter at all rather than an empty one.
    expect(buildAuditEventQuery(defaultAuditEventFilters("all"), 1, now)).toEqual({ page: 1 });
  });

  it("reset serializes to an empty URL and drops stale search/page state", () => {
    expect(serializeAuditEventFilters(defaultAuditEventFilters(), 1).toString()).toBe("");
  });

  it("preserves all filter values in a stable shareable URL", () => {
    const filters: AuditEventFilters = {
      ...defaultAuditEventFilters("all"),
      modules: ["EXPORTS", "PROCUREMENT"],
      actionTypes: ["PROCUREMENT_ACTION"],
      severities: ["CRITICAL"],
      statuses: ["DENIED"],
      actorType: "USER",
      entityType: "PurchaseOrder",
      entityId: "PO-4",
      tenantSlug: "bright-star",
      search: "Buyer",
    };

    const serialized = serializeAuditEventFilters(filters, 2);

    expect(parseAuditEventFilters(serialized)).toEqual(filters);
    expect(parseAuditEventPage(serialized)).toBe(2);
  });
});
