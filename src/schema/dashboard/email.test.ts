import { describe, expect, it } from "vitest";
import { emailSchema } from ".";

const schema = emailSchema("Enter a valid email address");

describe("emailSchema", () => {
  it("refuses an address with no dot after the @, as the server does", () => {
    expect(schema.isValidSync("lekki@brightstar")).toBe(false);
  });

  it("refuses an address with nothing after the @", () => {
    expect(schema.isValidSync("kunle.afolabi@")).toBe(false);
  });

  it("accepts an ordinary address, including a plus-address", () => {
    expect(schema.isValidSync("brightstar.funke.adeyemi@gmail.com")).toBe(true);
    expect(schema.isValidSync("ada+parent1@gmail.com")).toBe(true);
  });

  it("leaves a blank optional field alone", () => {
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });
});
