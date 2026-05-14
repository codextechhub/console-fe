import { useEffect, useState } from "react";
import { useGetAllRolesQuery } from "@/redux/services/dashboard/roleApi";
import type { Role } from "@/redux/services/dashboard/type";

const PAGE_SIZE = 100;

export function useAllRoles() {
  const [page, setPage] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);

  const { data, isFetching, isError } = useGetAllRolesQuery(
    { page, page_size: PAGE_SIZE },
    { refetchOnMountOrArgChange: false },
  );

  useEffect(() => {
    if (!data?.data) return;
    const currentPage = data.pagination?.currentPage ?? 1;
    setRoles((prev) => (currentPage === 1 ? data.data : [...prev, ...data.data]));
    if (currentPage < (data.pagination?.totalPages ?? 1)) {
      setPage(currentPage + 1);
    }
  }, [data]);

  return {
    roles,
    isLoading: isFetching && roles.length === 0,
    isError,
  };
}
