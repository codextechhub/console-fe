import { describe, expect, it } from "vitest";
import type { SchoolCreationJob } from "@/redux/services/dashboard/school-types";
import {
  creationPhase,
  progressFraction,
  stepLabel,
  stepStates,
} from "./school-creation-steps";

/**
 * The progress box may pace how quickly finished steps are revealed, but it
 * must never show a step done that the server has not finished, and it must
 * never say "ready" before the list has been seen completing.
 */

const STEPS = ["school", "roles", "branches", "books", "onboarding"];

function job(overrides: Partial<SchoolCreationJob> = {}): SchoolCreationJob {
  return {
    job_id: "3f1c2b8e-0000-4000-8000-000000000000",
    status: "RUNNING",
    steps: STEPS,
    done: ["school", "roles"],
    current: "branches",
    school: null,
    message: null,
    ...overrides,
  };
}

describe("stepStates", () => {
  it("never reveals more done steps than the server finished", () => {
    const states = stepStates(job(), 99).map((row) => row.state);
    expect(states).toEqual(["done", "done", "current", "pending", "pending"]);
  });

  it("holds finished steps back until they are revealed", () => {
    const states = stepStates(job(), 1).map((row) => row.state);
    expect(states).toEqual(["done", "current", "pending", "pending", "pending"]);
  });

  it("marks the step a failed job stopped on", () => {
    const failed = job({ status: "FAILED", message: "The mail server refused the address." });
    const states = stepStates(failed, 2).map((row) => row.state);
    expect(states).toEqual(["done", "done", "failed", "pending", "pending"]);
  });
});

describe("creationPhase", () => {
  it("is starting before the job has answered", () => {
    expect(creationPhase(undefined, 0)).toBe("starting");
  });

  it("waits for the reveal before calling a succeeded job ready", () => {
    const succeeded = job({ status: "SUCCEEDED", done: STEPS, current: null });
    expect(creationPhase(succeeded, 2)).toBe("running");
    expect(creationPhase(succeeded, STEPS.length)).toBe("succeeded");
  });

  it("is failed as soon as the job fails", () => {
    expect(creationPhase(job({ status: "FAILED" }), 0)).toBe("failed");
  });
});

describe("progressFraction", () => {
  it("fills with the revealed steps only", () => {
    expect(progressFraction(job(), 1)).toBeCloseTo(1 / 5);
    expect(progressFraction(job(), 5)).toBeCloseTo(2 / 5);
  });
});

describe("stepLabel", () => {
  it("names a step this build does not know rather than dropping it", () => {
    expect(stepLabel("something_new")).toBe("Finishing the setup");
    expect(stepLabel("branches")).toBe("Opening the branches and their administrators");
  });
});
