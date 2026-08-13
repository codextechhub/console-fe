export { GUIDE_CATEGORIES } from "./categories";
export { buildGuideCoverageReport } from "./coverage";
export {
  canDiscoverGuide,
  featuredGuides,
  GUIDE_ROLE_ENTRY_POINTS,
  guidesForAudience,
  recentlyReviewedGuides,
  visibleGuides,
} from "./discovery";
export { GUIDE_REGISTRY } from "./registry";
export { searchGuides } from "./search";
export { GUIDE_ROUTE_PATTERNS, GUIDE_ROUTE_PATTERN_SET } from "./route-catalog";
export { validateGuideRegistry } from "./validate";
export type {
  GuideArticleModule,
  GuideArticleSection,
  GuideAudience,
  GuideCategory,
  GuideCategoryId,
  GuidePermissionRule,
  GuideRecord,
  GuideRisk,
  GuideMatchKind,
  ScoredGuide,
  GuideValidationIssue,
} from "./types";
export type { GuideCoverageGap, GuideCoverageReport, GuideCoverageTarget } from "./coverage";
