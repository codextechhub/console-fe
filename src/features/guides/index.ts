export { GUIDE_CATEGORIES } from "./categories";
export { buildGuideCoverageReport } from "./coverage";
export { GUIDE_REGISTRY } from "./registry";
export { GUIDE_ROUTE_PATTERNS, GUIDE_ROUTE_PATTERN_SET } from "./route-catalog";
export { validateGuideRegistry } from "./validate";
export type {
  GuideArticleModule,
  GuideAudience,
  GuideCategory,
  GuideCategoryId,
  GuidePermissionRule,
  GuideRecord,
  GuideRisk,
  GuideValidationIssue,
} from "./types";
export type { GuideCoverageGap, GuideCoverageReport, GuideCoverageTarget } from "./coverage";
