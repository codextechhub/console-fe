// Pairing a template's platform version with this tenant's own. JSX-free so it
// is not a react-refresh boundary, and unit-testable on its own.
import type { WorkflowTemplate } from "@/redux/services/dashboard/workflow-types";

/**
 * One approval path, and which version of it is running.
 *
 * The API returns the platform's template and this tenant's as two rows,
 * because they are two records. To an administrator they are one thing: "the
 * leave approval", which either runs as Codex published it or as this school
 * adjusted it. Listing both rows invites the reading this product does not
 * want - that a tenant "has a copy" - so they are paired here and the screen
 * shows one line per approval path.
 */
export interface TemplateVersions {
  /** Stable key: the pair a template is identified by. */
  key: string;
  document_type: string;
  code: string;
  /** The row the engine would actually run for this tenant. */
  running: WorkflowTemplate;
  /** Codex's version, when there is one. */
  platform: WorkflowTemplate | null;
  /** This tenant's own version, when it is running one. */
  own: WorkflowTemplate | null;
  /** True when this tenant has adjusted it and runs its own. */
  isAdjusted: boolean;
  /** True when Codex changed its version after this tenant last saved. */
  platformMovedOn: boolean;
}

export function pairTemplateVersions(rows: WorkflowTemplate[]): TemplateVersions[] {
  const byPair = new Map<string, { platform: WorkflowTemplate | null; own: WorkflowTemplate | null }>();

  for (const row of rows) {
    const key = `${row.document_type}::${row.code}`;
    const pair = byPair.get(key) ?? { platform: null, own: null };
    if (row.is_platform) {
      pair.platform = row;
    } else if (row.is_active) {
      // A switched-off version is not what this tenant runs, so it must not
      // present as "adjusted" - they asked for Codex's back.
      pair.own = row;
    }
    byPair.set(key, pair);
  }

  const out: TemplateVersions[] = [];
  for (const [key, pair] of byPair) {
    // A pair with neither side is not reachable: every row is one or the other.
    const running = pair.own ?? pair.platform;
    if (!running) continue;
    const [document_type, code] = key.split("::");
    out.push({
      key,
      document_type,
      code,
      running,
      platform: pair.platform,
      own: pair.own,
      isAdjusted: pair.own !== null,
      platformMovedOn: !!pair.own?.platform_changed_since,
    });
  }
  return out.sort((a, b) =>
    a.document_type.localeCompare(b.document_type) || a.code.localeCompare(b.code),
  );
}

/** The one-line answer to "which version is this school running?". */
export function versionLabel(v: TemplateVersions, isPlatformTenant: boolean): string {
  // "Your own" would be ambiguous for Codex, whose own tenant templates are
  // exactly the ones no school inherits.
  if (isPlatformTenant) return v.isAdjusted ? "Codex-only" : "Shared with every school";
  if (!v.isAdjusted) return "Codex version";
  return v.platformMovedOn ? "Yours · Codex updated theirs" : "Yours";
}
