import type { ComponentType } from "react";

import type { PermissionCode } from "@/permissions";

export const GUIDE_CATEGORY_IDS = [
  "getting-started",
  "schools-and-users",
  "roles-and-permissions",
  "organogram-and-tasks",
  "approvals-and-workflow",
  "finance-and-payments",
  "procurement-and-inventory",
  "data-imports-and-exports",
  "audit-and-security",
  "platform-health-and-settings",
  "account-and-personal-security",
  "troubleshooting",
] as const;

export type GuideCategoryId = (typeof GUIDE_CATEGORY_IDS)[number];

export const GUIDE_AUDIENCES = [
  "all-users",
  "platform-administrator",
  "school-administrator",
  "finance-officer",
  "procurement-officer",
  "approver",
  "support-and-operations",
] as const;

export type GuideAudience = (typeof GUIDE_AUDIENCES)[number];

export type GuideRisk = "low" | "medium" | "high";

export type GuidePermissionRule =
  | { mode: "authenticated"; permissions: readonly [] }
  | { mode: "any" | "all"; permissions: readonly PermissionCode[] };

export type GuideArticleModule = {
  default: ComponentType;
};

export type GuideArticleSection = {
  id: string;
  title: string;
};

type GuideRecordBase = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: GuideCategoryId;
  tags: readonly string[];
  aliases: readonly string[];
  audiences: readonly GuideAudience[];
  routes: readonly string[];
  actionIds?: readonly string[];
  access: GuidePermissionRule;
  walkthroughId?: string;
  owner: string;
  reviewedAt: string;
  productVersion?: string;
  risk: GuideRisk;
  featured?: boolean;
  primaryRoute?: string;
  sections?: readonly GuideArticleSection[];
  relatedGuideIds?: readonly string[];
  estimatedMinutes?: number;
};

export type GuideRecord = GuideRecordBase & (
  | {
      status: "draft";
      article?: () => Promise<GuideArticleModule>;
    }
  | {
      status: "published";
      article: () => Promise<GuideArticleModule>;
    }
  | {
      status: "retired";
      article?: () => Promise<GuideArticleModule>;
      replacedBy?: string;
    }
);

export type GuideCategory = {
  id: GuideCategoryId;
  title: string;
  description: string;
  order: number;
};

export type GuideValidationIssue = {
  code:
    | "duplicate-id"
    | "duplicate-slug"
    | "invalid-action"
    | "invalid-audience"
    | "invalid-category"
    | "invalid-date"
    | "invalid-permissions"
    | "invalid-route"
    | "invalid-section"
    | "missing-article"
    | "missing-owner"
    | "missing-replacement"
    | "missing-related-guide"
    | "missing-walkthrough"
    | "missing-route";
  guideId: string;
  message: string;
};

export type GuideMatchKind = "title" | "alias" | "prefix" | "content";

export type ScoredGuide = {
  guide: GuideRecord;
  matchKind: GuideMatchKind;
  score: number;
};
