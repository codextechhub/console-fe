// <DataTable> — the one list primitive every finance/procurement list screen
// uses. Column-driven over the app's existing <Table>, with server pagination
// and all four explicit states (loading / empty / error / forbidden). Filters
// and toolbars live above it on the page; this owns the table + its footer.

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "./states";

export interface Column<T> {
  /** Header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  /** Right-align (money/numeric columns). */
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: boolean;
  forbidden?: boolean;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  forbiddenMessage?: string;
  // Server pagination (omit to hide the footer).
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const headCls =
  "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs lg:text-sm whitespace-nowrap pt-3 pb-2";
const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  forbidden,
  onRetry,
  onRowClick,
  emptyTitle,
  emptyMessage,
  forbiddenMessage,
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  const colCount = columns.length;
  // Defensive: the backend returns `{}` (not `[]`) for an empty list endpoint,
  // so a caller may hand us a non-array. Never let `.map` throw.
  const safeRows: T[] = Array.isArray(rows) ? rows : [];

  const body = () => {
    if (forbidden) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colCount} className="h-56 p-0">
            <ForbiddenState message={forbiddenMessage} />
          </TableCell>
        </TableRow>
      );
    }
    if (loading) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colCount} className="p-0">
            <LoadingState />
          </TableCell>
        </TableRow>
      );
    }
    if (error && safeRows.length === 0) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colCount} className="h-56 p-0">
            <ErrorState onRetry={onRetry} />
          </TableCell>
        </TableRow>
      );
    }
    if (safeRows.length === 0) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colCount} className="h-56 p-0">
            <EmptyState title={emptyTitle} message={emptyMessage} />
          </TableCell>
        </TableRow>
      );
    }
    return safeRows.map((row) => (
      <TableRow
        key={rowKey(row)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={cn(onRowClick && "cursor-pointer transition-colors hover:bg-primary/5")}
      >
        {columns.map((col, ci) => (
          <TableCell
            key={ci}
            className={cn(cellCls, col.align === "right" && "text-right", col.className)}
          >
            {col.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="rounded-md bg-white">
      <Table>
        <TableHeader className="border-0">
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={cn(headCls, col.align === "right" && "text-right")}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">{body()}</TableBody>
      </Table>

      {!!page && !!totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-end gap-2 px-3 py-3.5">
          <button
            onClick={() => page > 1 && onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn(
              "grid h-7.5 place-content-center rounded-md px-2.5 text-sm font-medium transition-colors",
              page <= 1 ? "cursor-not-allowed text-gray-300" : "cursor-pointer text-black-02 hover:bg-gray-100",
            )}
          >
            Prev
          </button>
          <span className="font-mont text-sm text-gray-01">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => page < totalPages && onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              "grid h-7.5 place-content-center rounded-md px-2.5 text-sm font-medium transition-colors",
              page >= totalPages ? "cursor-not-allowed text-gray-300" : "cursor-pointer text-black-02 hover:bg-gray-100",
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
