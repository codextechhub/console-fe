import { baseApi } from "../base-api";
import type { ConsoleOverviewRes } from "./overview-types";

export const overviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Everything the landing screen renders, in one request.
     *
     * Replaces eight parallel dashboard calls. Two of those pulled a whole
     * dashboard to read a single field - `/health/overview/` serialised the
     * service grid, request series, deployments and incidents for one posture
     * label, and `/todo/dashboard/mine/` serialised every task to list three.
     *
     * Sections the caller has no permission for are ABSENT from `data`, not
     * zeroed, so the screen must treat a missing section as "no access" and keep
     * its card hidden - never render it as 0.
     */
    getConsoleOverview: builder.query<ConsoleOverviewRes, void>({
      query: () => ({ url: `/admin/dashboard/overview/`, method: "GET" }),
      // The screen is a read-only roll-up of other modules; those modules'
      // mutations invalidate their own tags, and this one re-fetches with them.
      providesTags: [
        "Schools",
        "Users",
        "TodoDashboard",
        "WorkflowPending",
        "WorkflowSubmissions",
        "Notifications",
        "Tickets",
        "Health",
        // The "Getting started" flags: assigning a role or adding an org node
        // ticks a row, so the roll-up has to re-fetch with those mutations too.
        "UserAssignments",
        "OrgNodes",
      ],
    }),
  }),
});

export const { useGetConsoleOverviewQuery } = overviewApi;
