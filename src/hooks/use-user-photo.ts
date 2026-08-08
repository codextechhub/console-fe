// Resolves a user's avatar to a ready-to-render blob URL, by id.
//
// Two cached layers, both deduped by RTK Query so every avatar on the page
// shares them:
//   1. getStaffPhotos  - one request, the user_id → photo-URL map (primary view)
//   2. fetchAuthMedia  - per distinct photo, fetches the auth-gated /media/ bytes
//                        and hands back a local blob: URL
//
// Returns undefined while loading or when the user has no photo - callers fall
// back to initials.

import { skipToken } from "@reduxjs/toolkit/query";
import { useFetchAuthMediaQuery, useGetStaffPhotosQuery } from "@/redux/services/media-api";

export function useUserPhoto(userId?: string | number | null): string | undefined {
  const { currentData: photoMap } = useGetStaffPhotosQuery();
  const photoUrl = userId != null ? photoMap?.[String(userId)] : undefined;
  // `data` intentionally preserves the previous successful result while a
  // query arg changes. That is useful for most screens, but unsafe for an
  // avatar: during an identity/proxy swap it can show the previous account's
  // face for a user with another photo (or no photo at all). `currentData`
  // belongs only to the active photo URL, so absence falls through to the
  // current user's initials immediately.
  const { currentData: blobUrl } = useFetchAuthMediaQuery(photoUrl ?? skipToken);
  return blobUrl;
}
