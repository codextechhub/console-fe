import { describe, expect, it } from "vitest";

import {
  BUDGETS_SECTIONS,
  COLLECTIONS_SECTIONS,
  EXPENSES_SECTIONS,
  INTER_BRANCH_PATH,
  INTER_BRANCH_SECTIONS,
  PAYMENTS_SECTIONS,
  RECEIVABLES_SECTIONS,
  REPORTS_SECTIONS,
  SETUP_SECTIONS,
} from "@/pages/protected/finance/console-sections";
import { financeSettingsSections } from "@/xvs-host";
import {
  ANALYTICS_SECTIONS,
  INVENTORY_SECTIONS,
  PROCUREMENT_SETTINGS_SECTIONS,
  VENDOR_SECTIONS,
} from "@/pages/protected/procurement/console-sections";
import { SETTINGS_SECTIONS } from "@/pages/protected/settings/sections";
import { routesPath } from "@/routes/routes-path";

import { GUIDE_ROUTE_PATTERN_SET } from "./route-catalog";

/**
 * The guide route catalogue against the section lists the route table mounts.
 *
 * Every area that declares one route per section is read from the same list its
 * routes are built from, so a section mounted without a catalogue entry fails
 * here by name, and the guides coverage check can then ask for a guide for it.
 *
 * Finance Settings is read from the host's `financeSettingsSections`, the
 * sections this app routes, rather than the package's full list: the package
 * also defines "fees", a school's rule about its own academic calendar that
 * the console does not mount.
 */

describe("guide route catalogue", () => {
  it("catalogues every named console section without permissive section wildcards", () => {
    const R = routesPath.PROTECTED;
    const namedRoutes = [
      ...SETUP_SECTIONS.map((section) => `${R.FINANCE.SETUP}/${section}`),
      ...RECEIVABLES_SECTIONS.map((section) => `${R.FINANCE.RECEIVABLES}/${section}`),
      ...COLLECTIONS_SECTIONS.map((section) => `${R.FINANCE.COLLECTIONS}/${section}`),
      ...EXPENSES_SECTIONS.map((section) => `${R.FINANCE.EXPENSES}/${section}`),
      INTER_BRANCH_PATH,
      ...INTER_BRANCH_SECTIONS.map((section) => `${INTER_BRANCH_PATH}/${section}`),
      ...BUDGETS_SECTIONS.map((section) => `${R.FINANCE.BUDGETS}/${section}`),
      ...PAYMENTS_SECTIONS.map((section) => `${R.FINANCE.PAYMENTS}/${section}`),
      ...REPORTS_SECTIONS.map((section) => `${R.FINANCE.REPORTS}/${section}`),
      ...financeSettingsSections.map((section) => `${R.FINANCE.SETTINGS}/${section}`),
      ...VENDOR_SECTIONS.map((section) => `${R.PROCUREMENT.VENDORS}/${section}`),
      ...INVENTORY_SECTIONS.map((section) => `${R.PROCUREMENT.INVENTORY}/${section}`),
      ...ANALYTICS_SECTIONS.map((section) => `${R.PROCUREMENT.ANALYTICS}/${section}`),
      ...PROCUREMENT_SETTINGS_SECTIONS.map((section) => `${R.PROCUREMENT.SETTINGS}/${section}`),
      ...SETTINGS_SECTIONS.map((section) => `${R.SETTINGS.INDEX}/${section}`),
    ];

    expect(namedRoutes.filter((route) => !GUIDE_ROUTE_PATTERN_SET.has(route))).toEqual([]);
    expect([...GUIDE_ROUTE_PATTERN_SET].filter((route) => route.endsWith("/:section"))).toEqual([]);
  });
});
