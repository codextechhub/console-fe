// Auth-gated media fetching. The backend serves /media/ behind JWT auth
// (core.views.MediaView), so a plain <img src> gets 401 — the browser sends no
// Authorization header. This endpoint fetches the bytes through RTK Query (whose
// prepareHeaders attaches the JWT), turns them into a local blob: URL, and caches
// it. Any avatar/image component renders the returned blob URL instead of the
// raw /media/ URL. Shared app-wide (header, organogram, RBAC, …).

import { baseApi } from "./base-api";

// user_id → absolute profile-photo URL. One shared request feeds every avatar
// on the platform; components resolve a user's photo by id from this map rather
// than each API response carrying the photo.
export type StaffPhotoMap = Record<string, string>;

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The single "primary view" for avatars (backend: /platform-staff-profiles/photos/).
    getStaffPhotos: builder.query<StaffPhotoMap, void>({
      query: () => ({ url: `/user/platform-staff-profiles/photos/`, method: "GET" }),
      transformResponse: (res: { data: StaffPhotoMap }) => res.data ?? {},
      providesTags: ["StaffPhotos"],
      keepUnusedDataFor: 3600,
    }),
    fetchAuthMedia: builder.query<string, string>({
      // mediaUrl is the absolute URL the backend built (host + /media/...).
      // fetchBaseQuery uses an absolute http(s) URL as-is (no baseUrl prefix).
      queryFn: async (mediaUrl, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: mediaUrl,
          responseHandler: (r) => r.blob(),
        });
        if ("error" in result && result.error) return { error: result.error };
        return { data: URL.createObjectURL(result.data as Blob) };
      },
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetStaffPhotosQuery, useFetchAuthMediaQuery } = mediaApi;
