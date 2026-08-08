// RTK Query endpoints for the Tasks tool - "ToDo - Org Accountability" (vs_todo).
// Mounted backend-side at .../v1/todo/*. Access is gated to CX staff; what a
// person sees and who they may assign to is enforced structurally by the
// organogram on the server, so these endpoints just return ready-to-render data.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  DataEnvelope,
  MineDashboard,
  NodeDashboard,
  Person,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
} from "./todo-types";

type QueryParams = Record<string, string | number>;

export const todoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Dashboards ───────────────────────────────────────────────────────────
    // "My Tasks": the viewer's own tasks, headline stats, and person card.
    getTodoMine: builder.query<DataEnvelope<MineDashboard>, void>({
      query: () => ({ url: `/todo/dashboard/mine/`, method: "GET" }),
      providesTags: ["TodoDashboard"],
    }),
    // "My Team": the viewer's roll-up, with optional ?focus=<user_id> drill-down.
    getTodoTeam: builder.query<DataEnvelope<NodeDashboard>, { focus?: number | string } | void>({
      query: (params) => ({
        url: `/todo/dashboard/team/${generateQueryString((params ?? {}) as QueryParams)}`,
        method: "GET",
      }),
      providesTags: ["TodoDashboard"],
    }),

    // Who the viewer may assign a task to - everyone in their area below them.
    getTodoAssignable: builder.query<DataEnvelope<Person[]>, void>({
      query: () => ({ url: `/todo/assignable/`, method: "GET" }),
      providesTags: ["TodoAssignable"],
    }),

    // ── Tasks ────────────────────────────────────────────────────────────────
    // Create a self-set task, or an assignment when assignee_id targets a report.
    createTodoTask: builder.mutation<DataEnvelope<Task>, TaskCreatePayload>({
      query: (body) => ({ url: `/todo/tasks/`, method: "POST", body }),
      invalidatesTags: ["TodoDashboard", "TodoTasks"],
    }),
    // Edit a task's descriptive fields (title, deadline, metric, target, …).
    updateTodoTask: builder.mutation<DataEnvelope<Task>, { id: number | string; body: TaskUpdatePayload }>({
      query: ({ id, body }) => ({ url: `/todo/tasks/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["TodoDashboard", "TodoTasks"],
    }),
    deleteTodoTask: builder.mutation<void, number | string>({
      query: (id) => ({ url: `/todo/tasks/${id}/`, method: "DELETE" }),
      invalidatesTags: ["TodoDashboard", "TodoTasks"],
    }),
    // Mark a task done / not-done.
    toggleTodoTask: builder.mutation<DataEnvelope<Task>, { id: number | string; done: boolean }>({
      query: ({ id, done }) => ({ url: `/todo/tasks/${id}/toggle/`, method: "POST", body: { done } }),
      invalidatesTags: ["TodoDashboard", "TodoTasks"],
    }),
  }),
});

export const {
  useGetTodoMineQuery,
  useGetTodoTeamQuery,
  useGetTodoAssignableQuery,
  useCreateTodoTaskMutation,
  useUpdateTodoTaskMutation,
  useDeleteTodoTaskMutation,
  useToggleTodoTaskMutation,
} = todoApi;
