import { useMemo } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { useGetStaffProfilesQuery } from "@/redux/services/dashboard/organogram-api";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";
import { useActionSearch, type UseActionSearch } from "@/hooks/use-action-search";
import { useAppSelector } from "@/redux/store";

const PEOPLE_QUERY_MIN_LENGTH = 2;
const PEOPLE_QUERY_MAX_LENGTH = 64;
const PEOPLE_RESULT_LIMIT = 6;

export interface UseWorkspaceSearch extends UseActionSearch {
  people: StaffProfileListItem[];
  peopleTotal: number;
  peopleLoading: boolean;
  peopleError: boolean;
  canSearchPeople: boolean;
  peopleQueryTooShort: boolean;
  peopleQueryTooLong: boolean;
}

/**
 * Workspace search combines the local, permission-gated action catalog with a
 * small server-side staff search. The people request is debounced and capped;
 * stale results are hidden while the query is still changing.
 */
export function useWorkspaceSearch(query: string): UseWorkspaceSearch {
  const actions = useActionSearch(query);
  // Discovery is open to every signed-in user. The backend applies the current
  // tenant boundary and decides whether a selected profile is brief or full.
  const canSearchPeople = useAppSelector((state) => Boolean(state.auth.user));
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebounce(normalizedQuery, 300);
  const peopleQueryTooShort = normalizedQuery.length > 0 && normalizedQuery.length < PEOPLE_QUERY_MIN_LENGTH;
  const peopleQueryTooLong = normalizedQuery.length > PEOPLE_QUERY_MAX_LENGTH;
  const queryEligible =
    canSearchPeople &&
    normalizedQuery.length >= PEOPLE_QUERY_MIN_LENGTH &&
    !peopleQueryTooLong;
  const debouncedQueryEligible =
    canSearchPeople &&
    debouncedQuery.length >= PEOPLE_QUERY_MIN_LENGTH &&
    debouncedQuery.length <= PEOPLE_QUERY_MAX_LENGTH;

  const { data, isFetching, isError } = useGetStaffProfilesQuery(
    { search: debouncedQuery, page_size: PEOPLE_RESULT_LIMIT },
    { skip: !debouncedQueryEligible },
  );

  const querySettled = normalizedQuery === debouncedQuery;
  const people = useMemo(
    () => queryEligible && querySettled && Array.isArray(data?.data) ? data.data : [],
    [data, queryEligible, querySettled],
  );

  return {
    ...actions,
    people,
    peopleTotal: querySettled ? data?.pagination?.totalItems ?? people.length : 0,
    peopleLoading: queryEligible && (!querySettled || isFetching),
    peopleError: queryEligible && querySettled && isError,
    canSearchPeople,
    peopleQueryTooShort: canSearchPeople && peopleQueryTooShort,
    peopleQueryTooLong: canSearchPeople && peopleQueryTooLong,
  };
}
