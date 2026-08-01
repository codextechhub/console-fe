import { describe, expect, it } from "vitest";

import type { ScoredAction } from "@/lib/action-palette";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";
import {
  buildWorkspaceSearchRows,
  getWorkspaceSearchSections,
} from "./workspace-search-model";

const action = (id: string): ScoredAction => ({
  action: {
    id,
    label: id,
    aliases: [],
    console: "Main",
    group: "Test",
    kind: "view",
    gate: null,
    run: { to: `/${id}` },
  },
  tier: 1,
  popularity: 0,
  matchScore: 1,
});

const person = (id: number, name: string): StaffProfileListItem => ({
  id,
  user: {
    id: String(id),
    email: `${id}@example.test`,
    first_name: name,
    last_name: "Person",
    full_name: `${name} Person`,
  },
  employee_id: `CX-${id}`,
  job_title: "Tester",
  position: null,
  org_node: null,
  department: null,
  division: null,
  employment_type: "FULL_TIME",
  employment_status: "ACTIVE",
  is_active_employee: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("workspace search grouping", () => {
  it("shows only Actions when only actions match", () => {
    const rows = buildWorkspaceSearchRows([action("view-schools")], false, []);
    expect(rows.map((row) => row.kind)).toEqual(["action"]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["Actions"]);
  });

  it("shows only People when only people match", () => {
    const rows = buildWorkspaceSearchRows([], false, [person(1, "Ada")]);
    expect(rows.map((row) => row.kind)).toEqual(["person"]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["People"]);
  });

  it("keeps Actions before People when both match", () => {
    const rows = buildWorkspaceSearchRows(
      [action("view-profile")],
      true,
      [person(1, "Ada"), person(2, "Grace")],
    );
    expect(rows.map((row) => row.kind)).toEqual([
      "action",
      "show-all-actions",
      "person",
      "person",
    ]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["Actions", "People"]);
  });

  it("returns no sections when nothing matches", () => {
    const rows = buildWorkspaceSearchRows([], false, []);
    expect(rows).toEqual([]);
    expect(getWorkspaceSearchSections(rows)).toEqual([]);
  });
});
