import type { ConsoleNavGroup, ConsoleNavItem } from "@/components/finance-ui/console-nav";
import { financeNav } from "@/pages/protected/finance/finance-nav";
import { procurementNav } from "@/pages/protected/procurement/procurement-nav";

import type { GuideRecord } from "./types";

export type GuideMenuPath = readonly string[];

function itemPath(item: ConsoleNavItem, route: string): GuideMenuPath | null {
  for (const child of item.children ?? []) {
    const childPath = itemPath(child, route);
    if (childPath) return [item.title, ...childPath];
  }

  if (item.url === route || item.aliases?.includes(route)) return [item.title];
  return null;
}

function navPath(consoleTitle: string, nav: readonly ConsoleNavGroup[], route: string): GuideMenuPath | null {
  for (const group of nav) {
    for (const item of group.items) {
      const path = itemPath(item, route);
      if (path) return [consoleTitle, ...(group.label ? [group.label] : []), ...path];
    }
  }
  return null;
}

/**
 * Returns the visible sidebar path to a guide's main screen.
 *
 * Paths come from the same navigation trees rendered by the Finance and
 * Procurement sidebars, so guide directions follow menu regrouping without a
 * second hand-maintained copy of the hierarchy.
 */
export function guideMenuPath(guide: Pick<GuideRecord, "category" | "primaryRoute">): GuideMenuPath | null {
  if (!guide.primaryRoute) return null;
  if (guide.category === "finance-and-payments") return navPath("Finance", financeNav, guide.primaryRoute);
  if (guide.category === "procurement-and-inventory") return navPath("Procurement", procurementNav, guide.primaryRoute);
  return null;
}
