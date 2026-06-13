// Resolves a user's avatar to a ready-to-render blob URL, by id.
//
// Two cached layers, both deduped by RTK Query so every avatar on the page
// shares them:
//   1. getStaffPhotos  — one request, the user_id → photo-URL map (primary view)
//   2. fetchAuthMedia  — per distinct photo, fetches the auth-gated /media/ bytes
//                        and hands back a local blob: URL
//
// Returns undefined while loading or when the user has no photo — callers fall
// back to initials.

import { skipToken } from "@reduxjs/toolkit/query";
import { useFetchAuthMediaQuery, useGetStaffPhotosQuery } from "@/redux/services/mediaApi";

export function useUserPhoto(userId?: string | number | null): string | undefined {
  const { data: photoMap } = useGetStaffPhotosQuery();
  const photoUrl = userId != null ? photoMap?.[String(userId)] : undefined;
  const { data: blobUrl } = useFetchAuthMediaQuery(photoUrl ?? skipToken);
  return blobUrl;
}
