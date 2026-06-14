import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoginSession } from "@/redux/services/dashboard/security-types";

export function SessionStatusBadge({ session }: { session: LoginSession }) {
  if (session.is_active) {
    return (
      <Badge variant="active" className="text-[10px] gap-1">
        <span className="size-1.5 rounded-full bg-green-01 animate-pulse" />
        Active
      </Badge>
    );
  }
  if (session.end_reason === "FORCE_LOGOUT") {
    return (
      <Badge variant="rejected" className="text-[10px] gap-1">
        <span className="size-1.5 rounded-full bg-destructive" />
        Force logout
      </Badge>
    );
  }
  if (session.end_reason === "EXPIRED") {
    return (
      <Badge variant="pending" className="text-[10px] gap-1">
        <span className="size-1.5 rounded-full bg-yellow-01" />
        Expired
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-[10px]">Ended</Badge>;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-end gap-2 mt-3.5">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
          currentPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer",
        )}
      >
        Prev
      </button>
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={`e-${i}`} className="px-2 text-black-02">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors",
              currentPage === p ? "bg-primary text-white" : "text-black-02 hover:bg-gray-100",
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
          currentPage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer",
        )}
      >
        Next
      </button>
    </div>
  );
}
