export { GUIDE_CATEGORIES } from "./categories";
export {
  buildSafeTicketContext,
  contextualGuideContext,
  resolveGuideRoutePattern,
  routePatternMatches,
} from "./context";
export { buildGuideCoverageReport } from "./coverage";
export {
  canDiscoverGuide,
  featuredGuides,
  guideLandingView,
  GUIDE_ROLE_ENTRY_POINTS,
  guidesForAudience,
  recentlyReviewedGuides,
  visibleGuides,
} from "./discovery";
export type { GuideLandingView } from "./discovery";
export { GUIDE_REGISTRY } from "./registry";
export { searchGuides } from "./search";
export { buildGuideEditorialQueue } from "./editorial";
export type { GuideEditorialCounts, GuideEditorialQueueItem } from "./editorial";
export { GUIDE_COVERAGE_ROUTE_PATTERNS, GUIDE_ROUTE_PATTERNS, GUIDE_ROUTE_PATTERN_SET } from "./route-catalog";
export { buildGuideOperationsReport, guideFreshness, GUIDE_REVIEW_INTERVAL_DAYS } from "./operations";
export { WALKTHROUGH_VERIFICATION_RECORDS } from "./walkthroughs/verification";
export type { GuideOperationsReport, GuideFreshnessItem, GuideFreshnessStatus } from "./operations";
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
export type { GuidePageContext, SafeTicketContext } from "./context";
export { WALKTHROUGH_REGISTRY, findWalkthrough } from "./walkthroughs/registry";
export { WalkthroughProvider } from "./walkthroughs/runtime";
export { useWalkthrough } from "./walkthroughs/context";
export { queueWalkthrough, requestWalkthroughStart, validateWalkthroughs } from "./walkthroughs/engine";
export type { Walkthrough, WalkthroughProgress, WalkthroughStep } from "./walkthroughs/types";
