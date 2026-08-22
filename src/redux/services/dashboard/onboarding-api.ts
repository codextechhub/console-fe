import { baseApi } from "../base-api";
import { generateQueryString } from "@/utils/helpers";

// The `/onboarding/` surface, which is a different root from `/i/` and a
// different permission namespace from the rest of school management.
//
// Reinstatement and the go-live queue.
//
// The queue and the decisions taken from it assert DIFFERENT tenants, which is
// the one thing to know before reading further. The list is read as CodeX, so
// it takes the caller's own tenant and the base query supplies it. Approve and
// reject act ON a school, so they name that school's slug explicitly - the base
// query leaves a request that already asserts a tenant alone.

export type GoLiveStatus = "PENDING" | "APPROVED" | "REJECTED" | "ACTIVATED" | "FAILED";

export interface GoLiveRequest {
  id: number;
  /** The school this request is for. Both are needed: the slug addresses the
   *  decision endpoints, the name is what a reviewer reads. */
  tenant_slug: string;
  school_name: string;
  status: GoLiveStatus;
  preferred_go_live_at: string;
  note: string;
  acknowledged: boolean;
  requested_by_name: string;
  reviewed_by_name: string;
  reviewed_at: string | null;
  rejection_reason: string;
  failure_reference: string;
  created_at: string;
  /**
   * Whether this school has a set of books.
   *
   * Reviewer-only: the school's own copy of this payload does not carry the
   * field at all. Books are provisioned at school creation on a best-effort
   * basis, and confirming them used to be a required step on the school's
   * checklist, which blocked go-live until somebody looked. That step was
   * removed on 2026-08-22, so this is where the fact now surfaces - in front of
   * the one person who can still act on it before the school starts trading.
   */
  books_provisioned: boolean;
}

export interface GoLiveRequestsRes {
  message: string;
  data: GoLiveRequest[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ReinstateSchoolRes {
  message: string;
  data: {
    tenant: string;
    status: string;
    pending_since: string | null;
    /** How long the school has, from now, before the sweep suspends it again. */
    expires_in_days: number;
  };
}

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Undo an onboarding expiry: SUSPENDED back to PENDING.
     *
     * The school is named in the PATH, not in `?tenant=`, and that is the one
     * thing about this call worth reading twice. A suspended tenant is not
     * authenticable, so asserting its slug answers 404 to everybody - platform
     * staff included - and an endpoint addressed that way could never be called
     * for the only schools it exists to serve. The caller therefore asserts
     * their own tenant, which the base query already does.
     */
    reinstateSchool: builder.mutation<ReinstateSchoolRes, string>({
      query: (slug) => ({
        url: `/onboarding/reinstate/${slug}/`,
        method: "POST",
        body: {},
      }),
      // The school's status changes, so both the list and its own record are
      // stale - including the status tab counts the list renders from.
      invalidatesTags: (_res, _err, slug) => ["Schools", { type: "Schools", id: slug }],
    }),

    /**
     * The go-live queue: every school waiting on a decision.
     *
     * Read as CodeX, so the caller's own tenant is what is asserted and the
     * base query adds it. Which rows come back is decided server-side by the
     * caller's tenant kind, not by anything sent from here.
     */
    getGoLiveRequests: builder.query<GoLiveRequestsRes, Record<string, string | number>>({
      query: (params) => ({
        url: `/onboarding/go-live/${generateQueryString(params)}`,
        method: "GET",
      }),
      providesTags: ["GoLiveRequests"],
    }),

    /**
     * Approve, which takes the school live in the same call.
     *
     * The slug in the URL is the SCHOOL being decided about, not the caller's
     * own tenant: this is one of the few endpoints a platform caller may
     * address at another tenant. Sending our own would 404.
     */
    approveGoLive: builder.mutation<{ message: string }, { id: number; slug: string }>({
      query: ({ id, slug }) => ({
        url: `/onboarding/go-live/${id}/approve/?tenant=${encodeURIComponent(slug)}`,
        method: "POST",
        body: {},
      }),
      // The school goes live, so its record and the school list are stale too.
      invalidatesTags: ["GoLiveRequests", "Schools"],
    }),

    /** Decline, with a reason the school reads. The backend refuses a blank one. */
    rejectGoLive: builder.mutation<
      { message: string },
      { id: number; slug: string; rejection_reason: string }
    >({
      query: ({ id, slug, rejection_reason }) => ({
        url: `/onboarding/go-live/${id}/reject/?tenant=${encodeURIComponent(slug)}`,
        method: "POST",
        body: { rejection_reason },
      }),
      invalidatesTags: ["GoLiveRequests"],
    }),
  }),
});

export const {
  useReinstateSchoolMutation,
  useGetGoLiveRequestsQuery,
  useApproveGoLiveMutation,
  useRejectGoLiveMutation,
} = onboardingApi;
