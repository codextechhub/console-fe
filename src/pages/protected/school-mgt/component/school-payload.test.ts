import { describe, expect, it } from "vitest";
import type { AdminStepData, BranchStepItem, SchoolStepData } from "../create-school";
import { buildPayload } from "./school-payload";

const SCHOOL: SchoolStepData = {
  name: "Bright Star School", email: "billing@bright-star.test", phone: "08031234567",
  slug: "bright-star", ownership_type: "PRIVATE", address: "14 Lantern Road", website: "",
  motto: "", term_structure: "3_TERMS", currency: "NGN", registration_id: "",
};
const ADMIN: AdminStepData = { first_name: "Ada", last_name: "Eze", email: "ada@bright-star.test", phone: "" };
const MAIN: BranchStepItem = {
  name: "Ikeja Branch", address: "", email: "", phone: "", country: "Nigeria", state: "Lagos",
  is_main: true, admin_first_name: "Tunde", admin_last_name: "Bello",
  admin_email: "tunde@bright-star.test", admin_phone: "",
};

const branchesOf = (list: BranchStepItem[]) =>
  buildPayload(SCHOOL, list, ADMIN, undefined).branches as Array<Record<string, unknown>>;

describe("school creation payload: branch phone", () => {
  it("sends each branch's own phone", () => {
    const [main, other] = branchesOf([
      { ...MAIN, phone: "08051112222" },
      { ...MAIN, name: "Lekki Branch", is_main: false, phone: " +2348033334444 " },
    ]);

    expect(main.phone).toBe("08051112222");
    expect(other.phone).toBe("+2348033334444");
  });

  it("sends a blank phone as blank, leaving the main branch to default to the school's", () => {
    const [main] = branchesOf([MAIN]);

    expect(main.phone).toBe("");
  });

  it("keeps the branch phone apart from the branch admin's", () => {
    const [main] = branchesOf([{ ...MAIN, phone: "08051112222", admin_phone: "08099990000" }]);

    expect(main.phone).toBe("08051112222");
    expect(main.primary_admin_data).toMatchObject({ phone: "08099990000" });
  });
});
