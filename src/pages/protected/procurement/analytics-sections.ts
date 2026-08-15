// The Procurement Analytics sections that exist.
//
// Kept in its own static module because two places need it and they must not
// disagree: the route table declares one path per section, and the page maps each
// to a screen. The page itself is lazy, so the route table importing from it would
// pull the whole analytics chunk into the entry bundle.
//
// Registering `:section` instead of these paths would match any URL and leave the
// page deciding what is real. That is how the deleted stock reports kept resolving
// from an old bookmark, quietly serving a different report. With only these
// declared, an unknown analytics URL matches no route and falls through to the
// app's own 404 - outside the console layout, as a wrong address should be.

export const ANALYTICS_SECTIONS = [
  "ap-aging",
  "grir",
  "spend",
  "performance",
] as const;

export type AnalyticsSection = (typeof ANALYTICS_SECTIONS)[number];

/** The section `/procurement/analytics` lands on when the URL names none. */
export const DEFAULT_ANALYTICS_SECTION: AnalyticsSection = "ap-aging";
