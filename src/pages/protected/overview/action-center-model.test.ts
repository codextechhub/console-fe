import { describe, expect, it } from "vitest";
import { actionableTasks, buildActionRows, partitionRows, rankQueues } from "./action-center-model";
import type { Task } from "@/redux/services/dashboard/todo-types";
import type {
  ApprovalWorklistItem,
  ConsoleOverview,
  ReturnedSubmissionItem,
} from "@/redux/services/dashboard/overview-types";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
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

let seq = 0;
const approval = (awaiting_since: string | null): ApprovalWorklistItem => ({
  id: `a${seq++}`,
  document_type: "d",
  document_object_id: "1",
  stage_label: "s",
  awaiting_since,
  requested_by_name: "",
  on_behalf_of_name: null,
});

const returnedItem = (returned_at: string): ReturnedSubmissionItem => ({
  id: `r${seq++}`,
  document_type: "d",
  document_object_id: "1",
  returned_at,
});

const ago = (ms: number) => new Date(NOW - ms).toISOString();
const ahead = (ms: number) => new Date(NOW + ms).toISOString();
const emptyQueues = { approvals: [], covering: [], returned: [], tasks: [] };

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
        signals: { exports_uncollected: { count: 2 } },
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
          exports_uncollected: { count: 2 },
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

describe("rankQueues", () => {
  it("orders boxes by the lateness of what they hold, most urgent first", () => {
    // The bug this fixes: a 9-day-old approval must outrank a task not due
    // until next week, whatever fixed order the boxes were declared in.
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [approval(ago(9 * DAY))],
        covering: [approval(ago(2 * DAY))],
        returned: [returnedItem(ago(1 * DAY))],
        tasks: [task({ deadline: ahead(7 * DAY) })],
      },
      NOW,
    );
    expect(order).toEqual(["approvals", "covering", "returned", "tasks"]);
  });

  it("ranks an overdue task above waiting work that is younger", () => {
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [approval(ago(1 * DAY))],
        tasks: [task({ status: "OVERDUE", deadline: ago(5 * DAY) })],
      },
      NOW,
    );
    expect(order).toEqual(["tasks", "approvals"]);
  });

  it("drops empty queues and returns only the ones that hold items", () => {
    const order = rankQueues({ ...emptyQueues, approvals: [approval(ago(DAY))] }, NOW);
    expect(order).toEqual(["approvals"]);
    expect(rankQueues(emptyQueues, NOW)).toEqual([]);
  });

  it("treats a missing timestamp as least urgent, never most", () => {
    // A null wait must not float to the top by accident: a box holding only an
    // undated item ranks below one with even an hour of real waiting.
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [approval(null)],
        returned: [returnedItem(ago(1 * HOUR))],
      },
      NOW,
    );
    expect(order).toEqual(["returned", "approvals"]);
  });

  it("keeps the fixed fallback order when boxes are equally urgent", () => {
    const at = ago(3 * DAY);
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [approval(at)],
        returned: [returnedItem(at)],
      },
      NOW,
    );
    // Equal lateness (including two undated boxes) resolves to the declared
    // order, so the result is deterministic rather than sort-dependent.
    expect(order).toEqual(["approvals", "returned"]);
    expect(
      rankQueues(
        { ...emptyQueues, approvals: [approval(null)], covering: [approval(null)] },
        NOW,
      ),
    ).toEqual(["approvals", "covering"]);
  });

  it("judges urgency from the visible items only, not the unseen remainder", () => {
    // A box shows at most 3 items; an ancient 4th one it never renders must not
    // lift its rank. Here approvals' visible items are all fresh, so a 5-day-old
    // returned item outranks it despite a hidden 100-day-old approval.
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [
          approval(ago(1 * DAY)),
          approval(ago(1 * DAY)),
          approval(ago(1 * DAY)),
          approval(ago(100 * DAY)),
        ],
        returned: [returnedItem(ago(5 * DAY))],
      },
      NOW,
    );
    expect(order).toEqual(["returned", "approvals"]);
  });

  it("does not let an overdue task with no deadline win by accident", () => {
    // Overdue-but-undated sits at the boundary: still present, but below any
    // work that is measurably late.
    const order = rankQueues(
      {
        ...emptyQueues,
        approvals: [approval(ago(2 * DAY))],
        tasks: [task({ status: "OVERDUE", deadline: "" })],
      },
      NOW,
    );
    expect(order).toEqual(["approvals", "tasks"]);
  });
});
