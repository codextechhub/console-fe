import { baseApi } from "./base-api";

export type GuideAnalyticsEvent =
  | { name: "guide.viewed" | "guide.completed" | "guide.outdated_reported"; guide_id: string }
  | { name: "guide.helpful_voted"; guide_id: string; outcome: "helpful" | "not_helpful" }
  | {
      name: "walkthrough.exited";
      guide_id: string;
      walkthrough_id: string;
      step_id: string;
      outcome: "finished" | "paused" | "target_unavailable";
    }
  | {
      name: "search.no_results";
      query: string;
      route_pattern?: string;
      result_count: 0;
    };

export type GuideAnalyticsGuideRow = {
  guide_id: string;
  views: number;
  completions: number;
  helpful: number;
  not_helpful: number;
  outdated_reports: number;
  walkthrough_exits: number;
  walkthrough_finishes: number;
};

export type GuideAnalyticsSummary = {
  since: string;
  totals: Record<string, number>;
  guides: GuideAnalyticsGuideRow[];
  no_result_searches: Array<{ search_query: string; route_pattern: string; count: number }>;
  walkthrough_exits: Array<{
    guide_id: string;
    walkthrough_id: string;
    step_id: string;
    outcome: "finished" | "paused" | "target_unavailable";
    count: number;
  }>;
};

export const guideAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    recordGuideAnalytics: builder.mutation<{ data: { accepted: boolean } }, GuideAnalyticsEvent>({
      query: (body) => ({
        url: "/support/guides/analytics/events/",
        method: "POST",
        body,
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["GuideAnalytics"],
    }),
    getGuideAnalyticsSummary: builder.query<{ data: GuideAnalyticsSummary }, number | void>({
      query: (days = 30) => `/support/guides/analytics/summary/?days=${days}`,
      extraOptions: { silent: true },
      providesTags: ["GuideAnalytics"],
    }),
  }),
});

export const {
  useRecordGuideAnalyticsMutation,
  useGetGuideAnalyticsSummaryQuery,
} = guideAnalyticsApi;
