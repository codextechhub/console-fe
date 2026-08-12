import { describe, expect, it } from "vitest";
import { actionableTasks, buildActionRows } from "./action-center-model";
import type { Task } from "@/redux/services/dashboard/todo-types";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-08-12T12:00:00Z").getTime();

const task = (over: Partial<Task>): Task =>
  ({
    id: Math.random(),
    title: "t",
    deadline: "",
    priority: "MEDIUM",
    department: "",
    status: "IN_PROGRESS",
    ...over,
  }) as Task;

const overview = (over: Partial<ConsoleOverview>): ConsoleOverview => ({
  approvals: { pending: 0, delegated: 0, items: [] },
  submissions: { returned: 0, items: [] },
  notifications: { unread: 0 },
  ...over,
});

describe("actionableTasks", () => {
  it("keeps overdue and due-soon tasks, drops far-future and undated", () => {
    const soon = new Date(NOW + 2 * DAY).toISOString();
    const far = new Date(NOW + 30 * DAY).toISOString();
    const picked = actionableTasks(
      [
        task({ id: 1, deadline: far }),
        task({ id: 2, status: "OVERDUE", deadline: new Date(NOW - 3 * DAY).toISOString() }),
        task({ id: 3, deadline: soon }),
        task({ id: 4 }),
      ],
      NOW,
    );
    expect(picked.map((t) => t.id)).toEqual([2, 3]);
  });

  it("orders overdue first, then nearest deadline", () => {
    const picked = actionableTasks(
      [
        task({ id: 1, deadline: new Date(NOW + 5 * DAY).toISOString() }),
        task({ id: 2, deadline: new Date(NOW + 1 * DAY).toISOString() }),
        task({ id: 3, status: "OVERDUE" }),
      ],
      NOW,
    );
    expect(picked.map((t) => t.id)).toEqual([3, 2, 1]);
  });
});

describe("buildActionRows", () => {
  it("is empty when everything is quiet", () => {
    expect(buildActionRows(overview({}))).toEqual([]);
    expect(buildActionRows(undefined)).toEqual([]);
  });

  it("appends tickets (amber) and notifications (blue) after signals", () => {
    const rows = buildActionRows(
      overview({
        signals: { webhook_failures_24h: { count: 2 } },
        tickets: { open: 5, assigned_to_me: 3 },
        notifications: { unread: 7 },
      }),
    );
    expect(rows.map((r) => r.key)).toEqual(["webhooks", "tickets", "notifications"]);
    expect(rows.map((r) => r.severity)).toEqual(["red", "amber", "blue"]);
  });

  it("omits tickets and notifications at zero", () => {
    const rows = buildActionRows(overview({ tickets: { open: 4, assigned_to_me: 0 } }));
    expect(rows).toEqual([]);
  });

  it("adds finished jobs and incidents from their own sections", () => {
    const rows = buildActionRows(
      overview({
        signals: { jobs_succeeded_24h: { count: 2 } },
        health: { label: "1 service down", overall: "critical", active_incidents: 1 },
      }),
    );
    expect(rows.map((r) => [r.key, r.severity])).toEqual([
      ["incidents", "red"],
      ["exports_ready", "blue"],
    ]);
  });

  it("keeps notices behind every warning severity", () => {
    const rows = buildActionRows(
      overview({
        notifications: { unread: 1 },
        signals: { draft_journals: { count: 2 } },
      }),
    );
    expect(rows.map((r) => r.severity)).toEqual(["amber", "blue"]);
  });
});
