// The sections the platform Settings console has.
//
// Same contract as the Finance and Procurement equivalents: the route table
// declares one path per section and the page maps each to a panel, so both need
// this list and neither may drift. The page is lazy, so importing the list from it
// would pull that chunk into the entry bundle.
//
// Two different misses, kept apart on purpose:
//
//   * A section that **does not exist** is a wrong address. It matches no route and
//     falls through to the app's 404, outside the console layout.
//   * A section that exists but the reader **lacks the permission** for is not a
//     wrong address - the page still falls back to the overview, as it always has.
//     404-ing that would tell somebody a page is missing when it is simply not
//     theirs, which is both untrue and a small disclosure in reverse.

export const SETTINGS_SECTIONS = [
  "overview",
  "platform-profile",
  "school-onboarding",
  "security",
  "integrations",
  "features",
  "administration",
  "audit",
  "advanced",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const DEFAULT_SETTINGS_SECTION: SettingsSection = "overview";
