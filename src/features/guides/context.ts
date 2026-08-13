import type { GuideRecord } from "./types";
import { canDiscoverGuide } from "./discovery";
import { GUIDE_ROUTE_PATTERNS } from "./route-catalog";

export type GuidePageContext = {
  routePattern?: string;
  productArea: string;
  guides: GuideRecord[];
  troubleshooting: GuideRecord[];
  walkthroughs: GuideRecord[];
};

const cleanPath = (value: string) => {
  const pathname = value.split(/[?#]/, 1)[0] || "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
};

const segments = (value: string) => cleanPath(value).split("/").filter(Boolean);

export function routePatternMatches(pattern: string, pathname: string): boolean {
  const patternSegments = segments(pattern);
  const pathSegments = segments(pathname);
  return patternSegments.length === pathSegments.length && patternSegments.every(
    (segment, index) => segment.startsWith(":") || segment === pathSegments[index],
  );
}

export function resolveGuideRoutePattern(pathname: string): string | undefined {
  return [...GUIDE_ROUTE_PATTERNS]
    .sort((a, b) => {
      const staticDifference = segments(b).filter((part) => !part.startsWith(":")).length
        - segments(a).filter((part) => !part.startsWith(":")).length;
      return staticDifference || b.length - a.length;
    })
    .find((pattern) => routePatternMatches(pattern, pathname));
}

function routeProductArea(pattern: string | undefined): string {
  const firstSegment = segments(pattern ?? "")[0];
  if (!firstSegment) return "Console";
  const labels: Record<string, string> = {
    audit: "Audit and security",
    export: "Exports",
    "how-to-guide": "Support",
    notifications: "Notifications",
    organogram: "Organogram",
    permissions: "Permissions",
    roles: "Roles",
    settings: "Settings",
    tasks: "Tasks",
    users: "Users",
    "data-imports": "Data imports",
    finance: "Finance",
    health: "Platform health",
    me: "Account",
    overview: "Console",
    procurement: "Procurement",
    "school-management": "School management",
    support: "Support",
    workflow: "Workflow",
  };
  return labels[firstSegment] ?? "Console";
}

export function contextualGuideContext(
  guides: readonly GuideRecord[],
  pathname: string,
  permissionKeys: readonly string[],
): GuidePageContext {
  const routePattern = resolveGuideRoutePattern(pathname);
  const articleSlug = cleanPath(pathname).match(/^\/support\/guides\/([^/]+)$/)?.[1];
  const permitted = guides.filter((guide) => (
    guide.status === "published" && canDiscoverGuide(guide, permissionKeys)
  ));
  const pageGuides = permitted.filter((guide) => (
    articleSlug
      ? guide.slug === decodeURIComponent(articleSlug)
      : guide.routes.some((pattern) => routePatternMatches(pattern, pathname))
  ));
  const relatedIds = new Set(pageGuides.flatMap((guide) => [...(guide.relatedGuideIds ?? [])]));
  const troubleshooting = permitted.filter((guide) => (
    guide.category === "troubleshooting"
    && (pageGuides.includes(guide) || relatedIds.has(guide.id))
  ));

  return {
    routePattern,
    productArea: routeProductArea(routePattern),
    guides: pageGuides.filter((guide) => guide.category !== "troubleshooting"),
    troubleshooting,
    walkthroughs: pageGuides.filter((guide) => Boolean(guide.walkthroughId)),
  };
}

export type SafeTicketContext = {
  guide_id?: string;
  route_pattern?: string;
  product_area?: string;
  app_version?: string;
};

export function buildSafeTicketContext(context: GuidePageContext): SafeTicketContext {
  const guide = context.guides[0] ?? context.troubleshooting[0];
  return {
    ...(guide ? { guide_id: guide.id } : {}),
    ...(context.routePattern ? { route_pattern: context.routePattern } : {}),
    ...(context.productArea ? { product_area: context.productArea } : {}),
    ...(import.meta.env.VITE_APP_VERSION ? { app_version: import.meta.env.VITE_APP_VERSION } : {}),
  };
}
