import { baseApi } from "../base-api";

// The `/onboarding/` surface, which is a different root from `/i/` and a
// different permission namespace from the rest of school management.
//
// Only reinstatement lives here so far. The go-live decisions belong on this
// service too, but a platform caller has no way to LIST the requests waiting on
// one: `GET /onboarding/go-live/` is scoped to the caller's own tenant and does
// not accept a cross-tenant assertion, so it answers an empty page for CodeX
// and 404 for a school slug. Approve and reject do accept the assertion, but
// they take a request id nothing hands out. Recorded in todo.md.

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
  }),
});

export const { useReinstateSchoolMutation } = onboardingApi;
