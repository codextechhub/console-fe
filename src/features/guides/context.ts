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
    activate: "Account access",
    audit: "Audit and security",
    export: "Exports",
    "forgot-password": "Account access",
    "how-to-guide": "Support",
    login: "Account access",
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
    "reset-password": "Account access",
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

/**
 * The exact values the ticket API accepts for `product_area`.
 *
 * Not a display list - `GuidePageContext.productArea` is also shown on screen
 * ("Guidance matched to ...") and may read more naturally than these. This is the
 * wire contract, and anything outside it is **rejected outright**, taking the whole
 * ticket create with it rather than just dropping the field.
 */
const TICKET_PRODUCT_AREAS = new Set([
  "Account", "Audit and security", "Console", "Data imports", "Exports",
  "Finance", "Health", "Notifications", "Organogram", "Permissions",
  "Platform health", "Procurement", "Roles", "School management",
  "Settings", "Support", "Tasks", "Users", "Workflow",
]);

/**
 * Display labels that mean one of the accepted areas but are not spelled like it.
 *
 * "Account access" reads better beside a sign-in screen than "Account" does, so the
 * label stays and is translated here instead of being flattened at the source.
 */
const PRODUCT_AREA_ALIASES: Record<string, string> = {
  "Account access": "Account",
};

/** The accepted spelling, or undefined when there is no honest mapping. */
function ticketProductArea(area: string | undefined): string | undefined {
  if (!area) return undefined;
  const mapped = PRODUCT_AREA_ALIASES[area] ?? area;
  return TICKET_PRODUCT_AREAS.has(mapped) ? mapped : undefined;
}

/**
 * A route pattern the API will accept, or undefined.
 *
 * Digits are rejected server-side on purpose: a parameter placeholder is the proof
 * that record identifiers were stripped, so `/finance/invoices/8842/` must never be
 * sent. Anything with a digit, a query string or a fragment is dropped rather than
 * sent and refused.
 */
function ticketRoutePattern(pattern: string | undefined): string | undefined {
  if (!pattern) return undefined;
  const ok = /^\/[a-z0-9_./:-]{0,199}$/.test(pattern)
    && !/\d/.test(pattern)
    && !pattern.includes("?")
    && !pattern.includes("#");
  return ok ? pattern : undefined;
}

/**
 * A guide id the API will accept, or undefined.
 *
 * Lowercase, and dots and hyphens only - an underscore is refused. Every id in the
 * registry passes today; this is here so that adding one that does not costs a
 * missing field rather than a rejected ticket.
 */
function ticketGuideId(id: string | undefined): string | undefined {
  return id && /^[a-z0-9][a-z0-9.-]{0,119}$/.test(id) ? id : undefined;
}

/**
 * The context attached to a ticket raised from inside the console.
 *
 * Every field is validated against the API's allowlist here rather than trusted from
 * the page, because the endpoint rejects an unknown value by **failing the whole
 * create**. Losing one field off a support ticket is a small thing; losing the
 * ticket because of it is not, and it would surface to the user as an unexplained
 * error on a screen they came to for help.
 */
export function buildSafeTicketContext(context: GuidePageContext): SafeTicketContext {
  const guide = context.guides[0] ?? context.troubleshooting[0];
  const guideId = ticketGuideId(guide?.id);
  const area = ticketProductArea(context.productArea);
  const route = ticketRoutePattern(context.routePattern);
  // Up to 40 characters of version string, and only these characters.
  const rawVersion = import.meta.env.VITE_APP_VERSION;
  const version = rawVersion && /^[A-Za-z0-9._+-]{1,40}$/.test(rawVersion) ? rawVersion : undefined;
  return {
    ...(guideId ? { guide_id: guideId } : {}),
    ...(route ? { route_pattern: route } : {}),
    ...(area ? { product_area: area } : {}),
    ...(version ? { app_version: version } : {}),
  };
}
