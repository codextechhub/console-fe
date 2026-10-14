import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { routesPath } from "@/routes/routes-path";
import { ProfileField, ProfileHero, ProfileTabs } from "./profile-system";

describe("profile system", () => {
  it("renders the shared identity hierarchy for every profile type", () => {
    const html = renderToStaticMarkup(
      <ProfileHero
        avatar={<span>AO</span>}
        name="Amara Okafor"
        title="Product Operations Lead"
        email="amara.okafor@cx.com"
        badges={<span>CX Staff</span>}
        facts={[{ label: "Department", value: "Product Operations" }]}
      />,
    );

    expect(html).toContain("Amara Okafor");
    expect(html).toContain("Product Operations Lead");
    expect(html).toContain("amara.okafor@cx.com");
    expect(html).toContain("CX Staff");
    expect(html).toContain("Product Operations");
  });

  it("marks one profile tab as selected", () => {
    const html = renderToStaticMarkup(
      <ProfileTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "access", label: "Access" },
          { id: "activity", label: "Activity" },
          { id: "history", label: "History" },
        ]}
        active="activity"
        onChange={vi.fn()}
      />,
    );

    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain("profile-panel-activity");
    expect(html).toContain("overflow-x-auto");
  });

  it("keeps empty fields explicit and builds a full school-user profile route", () => {
    const html = renderToStaticMarkup(<ProfileField label="Phone" />);

    expect(html).toContain("Phone");
    expect(html).toContain(">-</div>");
    expect(routesPath.PROTECTED.TEAM_MGT.SCHOOL_USER_VIEW("42")).toBe("/users/schools/42/view");
  });
});
