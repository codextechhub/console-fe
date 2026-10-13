import { describe, expect, it } from "vitest";
import { resolveFieldAccess, type FieldAccessMap } from "@/components/finance-ui/field-access";
import { canGivePackage, SCHOOLS_FIELD_RESOURCE } from "../school-field-access";
import { packageSetupBody, placeRefusals, type PackageStepValues } from "./package-setup-body";

const VALUES: PackageStepValues = {
  package_plan: "basic",
  subscription_starts_at: "2026-10-12",
  subscription_expires_at: "2027-10-11",
  agreed_price_per_student: "",
  minimum_billable_students: "40",
};

function access(entry: { hidden?: string[]; read_only?: string[] } = {}) {
  const map: FieldAccessMap = { [SCHOOLS_FIELD_RESOURCE]: entry };
  return resolveFieldAccess(map, SCHOOLS_FIELD_RESOURCE);
}

describe("packageSetupBody", () => {
  it("sends every term to a role with full access", () => {
    expect(packageSetupBody(VALUES, access())).toEqual({
      package_plan: "basic",
      subscription_starts_at: "2026-10-12",
      subscription_expires_at: "2027-10-11",
      minimum_billable_students: 40,
    });
  });

  it("converts a quoted rate from naira to kobo", () => {
    const body = packageSetupBody(
      { ...VALUES, package_plan: "enterprise", agreed_price_per_student: "12500.50" },
      access(),
    );
    expect(body?.agreed_price_per_student).toBe(1250050);
  });

  it("leaves out a term the role may not change, and keeps the rest", () => {
    const body = packageSetupBody(
      VALUES,
      access({ read_only: ["minimum_billable_students", "subscription_expires_at"] }),
    );
    expect(body).toEqual({ package_plan: "basic", subscription_starts_at: "2026-10-12" });
  });

  it("leaves out a hidden term the same way", () => {
    const body = packageSetupBody(VALUES, access({ hidden: ["minimum_billable_students"] }));
    expect(body).not.toHaveProperty("minimum_billable_students");
    expect(body).toHaveProperty("package_plan", "basic");
  });

  it.each(["package_plan", "subscription_starts_at", "agreed_price_per_student"])(
    "creates the school without a package when %s is read-only",
    (name) => {
      expect(packageSetupBody(VALUES, access({ read_only: [name] }))).toBeUndefined();
    },
  );

  it.each(["package_plan", "subscription_starts_at", "agreed_price_per_student"])(
    "creates the school without a package when %s is hidden",
    (name) => {
      expect(packageSetupBody(VALUES, access({ hidden: [name] }))).toBeUndefined();
    },
  );

  it("sends no package when no plan was chosen", () => {
    expect(packageSetupBody({ ...VALUES, package_plan: "" }, access())).toBeUndefined();
  });
});

describe("canGivePackage", () => {
  it("holds for full access and for closed optional terms", () => {
    expect(canGivePackage(access())).toBe(true);
    expect(canGivePackage(access({ hidden: ["subscription_expires_at", "minimum_billable_students"] }))).toBe(true);
  });
});

describe("placeRefusals", () => {
  it("keeps a message on the control it names", () => {
    expect(placeRefusals({ subscription_expires_at: "Read only." }, ["package_plan", "subscription_expires_at"]))
      .toEqual({ subscription_expires_at: "Read only." });
  });

  it("folds a message about a field the step does not draw into the plan control", () => {
    const placed = placeRefusals(
      { agreed_price_per_student: "You may not change Agreed price per student." },
      ["package_plan", "subscription_starts_at"],
    );
    expect(placed).toEqual({
      package_plan: "Agreed price per student: You may not change Agreed price per student.",
    });
  });

  it("returns nothing for no refusal", () => {
    expect(placeRefusals(null, ["package_plan"])).toEqual({});
  });
});
