// The status filter on Jobs & Queues must speak the API's vocabulary.
//
// It used to offer "pending" and "completed". core.BackgroundJob.Status has no
// such members - they are QUEUED and SUCCEEDED - and the backend filters on
// `status=<value>.upper()`, so both options matched zero rows and the table
// went blank with no error to explain it. The same mistake in the row badge
// tested for "COMPLETED" and so styled every successful job as pending.
//
// This pins the tokens against the enum rather than against the words a person
// reads, which is the half that drifted.

import { describe, expect, it } from "vitest";
import { STATUS_OPTIONS } from "./jobs";

// core.BackgroundJob.Status, minus CANCELLED: nothing in the backend writes it,
// so offering it would be a filter that can only ever return nothing.
const OFFERED = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"];

describe("Jobs & Queues status filter", () => {
  it("sends the tokens the API actually stores", () => {
    expect(STATUS_OPTIONS.map((o) => o.value)).toEqual(OFFERED);
  });

  it("offers no value the backend cannot produce", () => {
    const invented = STATUS_OPTIONS.filter((o) => !OFFERED.includes(o.value));
    expect(invented).toEqual([]);
  });

  it("shows SUCCEEDED with the word the rest of the console uses", () => {
    // Export -> View Queues displays the job vocabulary's SUCCEEDED as the run
    // vocabulary's "Completed". Two words for one outcome is the confusion
    // run-status-pill.tsx exists to remove, so this screen must agree with it.
    const succeeded = STATUS_OPTIONS.find((o) => o.value === "SUCCEEDED");
    expect(succeeded?.label).toBe("Completed");
  });
});
