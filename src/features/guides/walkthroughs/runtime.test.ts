import { afterEach, describe, expect, it } from "vitest";

import { canFocusWalkthroughCoach } from "./focus";

afterEach(() => {
  document.body.replaceChildren();
});

describe("walkthrough coach focus", () => {
  it("can receive focus when it is the only open dialog", () => {
    const coach = document.createElement("section");
    coach.setAttribute("role", "dialog");
    document.body.append(coach);

    expect(canFocusWalkthroughCoach(coach)).toBe(true);
  });

  it("does not take focus from an open workflow dialog", () => {
    const drawer = document.createElement("section");
    drawer.setAttribute("role", "dialog");
    const coach = document.createElement("section");
    coach.setAttribute("role", "dialog");
    document.body.append(drawer, coach);

    expect(canFocusWalkthroughCoach(coach)).toBe(false);
  });
});
