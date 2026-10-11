import { describe, expect, it } from "vitest";

import { GUIDE_REGISTRY } from "./registry";
import { guideMenuPath } from "./menu-path";

describe("guide menu paths", () => {
  it("builds paths through Finance menu and sub-menu levels", () => {
    const guide = GUIDE_REGISTRY.find((item) => item.id === "finance.configure-foundations");
    expect(guideMenuPath(guide!)).toEqual(["Finance", "Ledger & Setup", "Organisation & Analysis", "Entities"]);
  });

  it("builds paths through Procurement sections", () => {
    const guide = GUIDE_REGISTRY.find((item) => item.id === "procurement.review-analytics");
    expect(guideMenuPath(guide!)).toEqual(["Procurement", "Analytics", "Unpaid bills by age"]);
  });

  it("keeps every Finance and Procurement guide main screen tied to visible navigation", () => {
    const specialistGuides = GUIDE_REGISTRY.filter((guide) =>
      guide.category === "finance-and-payments" || guide.category === "procurement-and-inventory",
    );

    expect(specialistGuides
      .filter((guide) => guideMenuPath(guide) === null)
      .map((guide) => guide.id)).toEqual([]);
  });
});
