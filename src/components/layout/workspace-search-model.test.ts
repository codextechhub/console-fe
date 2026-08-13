import { describe, expect, it } from "vitest";

import type { ScoredAction } from "@/lib/action-palette";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";
import { GUIDE_REGISTRY, type ScoredGuide } from "@/features/guides";
import {
  buildWorkspaceSearchRows,
  getWorkspaceSearchIdentityKey,
  getWorkspaceSearchSections,
  isWorkspaceSearchSelf,
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

const guide = (): ScoredGuide => ({
  guide: GUIDE_REGISTRY[0],
  matchKind: "title",
  score: 400,
});

describe("workspace search grouping", () => {
  it("shows only Actions when only actions match", () => {
    const rows = buildWorkspaceSearchRows([action("view-schools")], false, [], []);
    expect(rows.map((row) => row.kind)).toEqual(["action"]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["Actions"]);
  });

  it("shows only People when only people match", () => {
    const rows = buildWorkspaceSearchRows([], false, [], [person(1, "Ada")]);
    expect(rows.map((row) => row.kind)).toEqual(["person"]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["People"]);
  });

  it("keeps Actions, Guides, and People in keyboard order", () => {
    const rows = buildWorkspaceSearchRows(
      [action("view-profile")],
      true,
      [guide()],
      [person(1, "Ada"), person(2, "Grace")],
    );
    expect(rows.map((row) => row.kind)).toEqual([
      "action",
      "show-all-actions",
      "guide",
      "person",
      "person",
    ]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["Actions", "Guides", "People"]);
  });

  it("shows only Guides when only guides match", () => {
    const rows = buildWorkspaceSearchRows([], false, [guide()], []);
    expect(rows.map((row) => row.kind)).toEqual(["guide"]);
    expect(getWorkspaceSearchSections(rows)).toEqual(["Guides"]);
  });

  it("returns no sections when nothing matches", () => {
    const rows = buildWorkspaceSearchRows([], false, [], []);
    expect(rows).toEqual([]);
    expect(getWorkspaceSearchSections(rows)).toEqual([]);
  });
});

describe("workspace search identity boundary", () => {
  it("keeps a stable key for ordinary navigation as the same user", () => {
    expect(getWorkspaceSearchIdentityKey("42", null)).toBe(
      getWorkspaceSearchIdentityKey("42", null),
    );
  });

  it("changes the key when proxy mode starts or ends", () => {
    const direct = getWorkspaceSearchIdentityKey("42", null);
    const proxied = getWorkspaceSearchIdentityKey("87", 123);

    expect(proxied).not.toBe(direct);
    expect(getWorkspaceSearchIdentityKey("42", null)).toBe(direct);
  });

  it("changes the key when one proxy session is replaced by another", () => {
    expect(getWorkspaceSearchIdentityKey("87", 123)).not.toBe(
      getWorkspaceSearchIdentityKey("87", 124),
    );
  });
});

describe("workspace person destination", () => {
  it("recognises the current user across numeric and string ids", () => {
    expect(isWorkspaceSearchSelf("42", 42)).toBe(true);
  });

  it("does not treat another person or an anonymous viewer as self", () => {
    expect(isWorkspaceSearchSelf("87", 42)).toBe(false);
    expect(isWorkspaceSearchSelf("87", undefined)).toBe(false);
  });
});
