import { describe, expect, it } from "vitest";
import { isValidPhone, phoneSchema } from ".";
import { adminStepSchema } from "./school-mgt";
import { createTeamMemberSchema } from "./team-mgt";

/**
 * The shared phone rule accepts any number the backend's user-create
 * validator accepts, with or without a country code.
 */
describe("phone rule", () => {
  it.each([
    "08012345678",
    "+2348012345678",
    "+44 20 7946 0958",
    "(0)1 234-5678",
    "0201234567",
    "5550123",
  ])("accepts %s", (value) => {
    expect(isValidPhone(value)).toBe(true);
  });

  it.each(["abc", "0801", "080-CALL-NOW", "++2348012345678", "0801234567890123456789012"])(
    "rejects %s",
    (value) => {
      expect(isValidPhone(value)).toBe(false);
    },
  );

  it("treats an empty value as absent", async () => {
    expect(isValidPhone("")).toBe(true);
    await expect(phoneSchema.isValid(undefined)).resolves.toBe(true);
  });

  it("lets the Add School admin step take a local number", async () => {
    await expect(
      adminStepSchema.isValid({ first_name: "Ada", last_name: "Okeke", email: "ada@example.com", phone: "08012345678" }),
    ).resolves.toBe(true);
  });

  it("still requires a phone for a new team member", async () => {
    await expect(createTeamMemberSchema.validateAt("phone", { phone: "" })).rejects.toThrow("Phone number is required");
  });
});
