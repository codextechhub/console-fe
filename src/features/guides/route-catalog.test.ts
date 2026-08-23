import { describe, expect, it } from "vitest";

import {
  BUDGETS_SECTIONS,
  COLLECTIONS_SECTIONS,
  EXPENSES_SECTIONS,
  FINANCE_SETTINGS_SECTIONS,
  PAYMENTS_SECTIONS,
  RECEIVABLES_SECTIONS,
  REPORTS_SECTIONS,
  SETUP_SECTIONS,
} from "@/pages/protected/finance/console-sections";
import {
  ANALYTICS_SECTIONS,
  INVENTORY_SECTIONS,
  PROCUREMENT_SETTINGS_SECTIONS,
  VENDOR_SECTIONS,
} from "@/pages/protected/procurement/console-sections";
import { SETTINGS_SECTIONS } from "@/pages/protected/settings/sections";
import { routesPath } from "@/routes/routes-path";

import { GUIDE_ROUTE_PATTERN_SET } from "./route-catalog";

describe("guide route catalogue", () => {
  it("catalogues every named console section without permissive section wildcards", () => {
    const R = routesPath.PROTECTED;
    const namedRoutes = [
      ...SETUP_SECTIONS.map((section) => `${R.FINANCE.SETUP}/${section}`),
      ...RECEIVABLES_SECTIONS.map((section) => `${R.FINANCE.RECEIVABLES}/${section}`),
      ...COLLECTIONS_SECTIONS.map((section) => `${R.FINANCE.COLLECTIONS}/${section}`),
      ...EXPENSES_SECTIONS.map((section) => `${R.FINANCE.EXPENSES}/${section}`),
      ...BUDGETS_SECTIONS.map((section) => `${R.FINANCE.BUDGETS}/${section}`),
      ...PAYMENTS_SECTIONS.map((section) => `${R.FINANCE.PAYMENTS}/${section}`),
      ...REPORTS_SECTIONS.map((section) => `${R.FINANCE.REPORTS}/${section}`),
      ...FINANCE_SETTINGS_SECTIONS.map((section) => `${R.FINANCE.SETTINGS}/${section}`),
      ...VENDOR_SECTIONS.map((section) => `${R.PROCUREMENT.VENDORS}/${section}`),
      ...INVENTORY_SECTIONS.map((section) => `${R.PROCUREMENT.INVENTORY}/${section}`),
      ...ANALYTICS_SECTIONS.map((section) => `${R.PROCUREMENT.ANALYTICS}/${section}`),
      ...PROCUREMENT_SETTINGS_SECTIONS.map((section) => `${R.PROCUREMENT.SETTINGS}/${section}`),
      ...SETTINGS_SECTIONS.map((section) => `${R.SETTINGS.INDEX}/${section}`),
    ];

    expect(namedRoutes.every((route) => GUIDE_ROUTE_PATTERN_SET.has(route))).toBe(true);
    expect([...GUIDE_ROUTE_PATTERN_SET].filter((route) => route.endsWith("/:section"))).toEqual([]);
  });
});
