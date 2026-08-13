import { resolvePermissionKey } from "@/permissions";

import type { GuideAudience, GuideRecord } from "./types";

export const GUIDE_ROLE_ENTRY_POINTS = [
  { id: "all-users", label: "Every Console user", description: "Navigation, personal security, and everyday help." },
  { id: "platform-administrator", label: "Platform administrator", description: "Schools, access control, workflow, settings, and operations." },
  { id: "school-administrator", label: "School administrator", description: "School setup, users, and day-to-day administration." },
  { id: "finance-officer", label: "Finance officer", description: "Accounting, receivables, payments, payroll, and reports." },
  { id: "procurement-officer", label: "Procurement officer", description: "Purchasing, vendors, sourcing, inventory, and payables." },
  { id: "approver", label: "Approver", description: "Approval queues, decisions, delegations, and tracking." },
  { id: "support-and-operations", label: "Support and operations", description: "Health, audit, troubleshooting, and platform support." },
] as const satisfies readonly { id: GuideAudience; label: string; description: string }[];

export function canDiscoverGuide(guide: GuideRecord, permissionKeys: readonly string[]): boolean {
  if (guide.status === "retired") return false;
  if (guide.access.mode === "authenticated") return true;

  const required = guide.access.permissions.map(resolvePermissionKey);
  return guide.access.mode === "all"
    ? required.every((permission) => permissionKeys.includes(permission))
    : required.some((permission) => permissionKeys.includes(permission));
}

export function visibleGuides(
  guides: readonly GuideRecord[],
  permissionKeys: readonly string[],
): GuideRecord[] {
  return guides.filter((guide) => canDiscoverGuide(guide, permissionKeys));
}

export function guidesForAudience(
  guides: readonly GuideRecord[],
  audience: GuideAudience | null,
): GuideRecord[] {
  if (!audience) return [...guides];
  return guides.filter((guide) => guide.audiences.includes(audience));
}

export function featuredGuides(guides: readonly GuideRecord[], limit = 6): GuideRecord[] {
  return guides.filter((guide) => guide.featured).slice(0, limit);
}

export function recentlyReviewedGuides(guides: readonly GuideRecord[], limit = 4): GuideRecord[] {
  return [...guides]
    .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt) || a.title.localeCompare(b.title))
    .slice(0, limit);
}
