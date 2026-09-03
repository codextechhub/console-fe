import { useEffect, useState } from "react";
import { roleApi } from "@/redux/services/dashboard/role-api";
import { useAppDispatch } from "@/redux/store";
import type { Role } from "@/redux/services/dashboard/dashboard-types";

const PAGE_SIZE = 100;

/**
 * Fetches every page of platform roles once per mount. The page walk happens
 * inside one async effect (setState only from async callbacks - never
 * synchronously in the effect body), instead of the previous
 * setState→re-render→effect ping-pong that re-rendered consumers once per page.
 */
export function useAllRoles() {
  const dispatch = useAppDispatch();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all: Role[] = [];
      let page = 1;
      let totalPages = 1;
      try {
        do {
          const res = await dispatch(
            roleApi.endpoints.getAllRoles.initiate(
              { page, page_size: PAGE_SIZE },
              { subscribe: false },
            ),
          ).unwrap();
          all.push(...(res.data ?? []));
          totalPages = res.pagination?.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages && !cancelled);
        if (!cancelled) setRoles(all);
      } catch {
        if (!cancelled) setIsError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return {
    roles: roles ?? [],
    isLoading: roles === null && !isError,
    isError,
  };
}
