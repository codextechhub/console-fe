import { describe, expect, it } from "vitest";
import { actionableTasks, buildActionRows, partitionRows } from "./action-center-model";
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
        tickets: { active: 5, assigned_to_me: 3 },
        notifications: { unread: 7 },
      }),
    );
    expect(rows.map((r) => r.key)).toEqual(["webhooks", "tickets", "notifications"]);
    expect(rows.map((r) => r.severity)).toEqual(["red", "amber", "blue"]);
  });

  it("omits tickets and notifications at zero", () => {
    const rows = buildActionRows(overview({ tickets: { active: 4, assigned_to_me: 0 } }));
    expect(rows).toEqual([]);
  });

  it("sends the tickets row to the caller's own unresolved queue", () => {
    // The row counts unfinished tickets assigned to the reader, so the link
    // must land on that same set - not the whole ticket list.
    const [row] = buildActionRows(overview({ tickets: { active: 9, assigned_to_me: 2 } }));
    expect(row.to).toBe("/support?status=ACTIVE&assignee=me");
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

  it("counts your own work as yours and module conditions as watch", () => {
    const rows = buildActionRows(
      overview({
        tickets: { active: 9, assigned_to_me: 2 },
        notifications: { unread: 4 },
        health: { label: "1 service down", overall: "critical", active_incidents: 1 },
        signals: {
          jobs_failed_24h: { count: 1 },
          jobs_succeeded_24h: { count: 2 },
          draft_journals: { count: 3 },
          users_without_roles: { count: 38 },
        },
      }),
    );
    const { mine, watch } = partitionRows(rows);
    // Your tickets, your jobs (failed and finished), your notifications.
    expect(mine.map((r) => r.key).sort()).toEqual([
      "exports_ready", "jobs", "notifications", "tickets",
    ]);
    // Incidents are red and loud, but they are still not one reader's to close.
    expect(watch.map((r) => r.key).sort()).toEqual([
      "incidents", "journals", "roleless_users",
    ]);
  });

  it("loses no row in the split", () => {
    const rows = buildActionRows(
      overview({
        tickets: { active: 2, assigned_to_me: 1 },
        notifications: { unread: 1 },
        signals: { rfqs_open: { count: 2 }, contracts_expiring: { count: 1 } },
      }),
    );
    const { mine, watch } = partitionRows(rows);
    expect(mine.length + watch.length).toBe(rows.length);
  });

  it("keeps severity order inside each group", () => {
    const { watch } = partitionRows(
      buildActionRows(
        overview({
          health: { label: "down", overall: "critical", active_incidents: 1 },
          signals: { draft_journals: { count: 1 }, webhook_failures_24h: { count: 2 } },
        }),
      ),
    );
    expect(watch.map((r) => r.severity)).toEqual(["red", "red", "amber"]);
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
