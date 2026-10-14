import type { TeamMember } from "@/redux/services/dashboard/dashboard-types";

/**
 * Resolve the school label across list and detail account responses.
 *
 * List rows carry the school-specific alias while the account detail contract
 * carries the domain-neutral tenant name. The profile accepts both because it
 * can be opened from a list row, global search, or a direct URL.
 */
export function getSchoolProfileName(
  detail: Pick<TeamMember, "school_name" | "tenant_name">,
): string {
  return detail.school_name || detail.tenant_name || "-";
}

export function getSchoolProfileTenantSlug(
  detail: Pick<TeamMember, "school_id" | "tenant_slug">,
  schools: Array<{ id: string | number; slug: string }>,
): string {
  return detail.tenant_slug
    || schools.find((school) => String(school.id) === String(detail.school_id))?.slug
    || "";
}
