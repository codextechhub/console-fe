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

/** One row as a stacked label/value card — the phone rendering of a list row. */
function RowCard<T>({ columns, row, onClick }: { columns: Column<T>[]; row: T; onClick?: () => void }) {
  const [first, ...rest] = columns;
  return (
    <div
      onClick={onClick}
      className={cn(
        "space-y-2 border-b border-gray-03 px-3.5 py-3 last:border-0",
        onClick && "cursor-pointer transition-colors active:bg-primary/5",
      )}
    >
      <div className="font-mont text-sm font-semibold text-black-01">{first.cell(row)}</div>
      {rest.map((col, i) => (
        <div key={i} className="flex items-start justify-between gap-3">
          <span className="shrink-0 font-mont text-[11px] text-gray-05">{col.header}</span>
          <span className="min-w-0 text-right font-mont text-sm font-medium text-black-01">{col.cell(row)}</span>
        </div>
      ))}
    </div>
  );
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
  /** Phone rendering (<md). "cards" (default) stacks each row as a label/value
   *  card; "scroll" keeps the table with horizontal scroll — for dense
   *  ledger/report-style tables where column alignment carries meaning. */
  mobile?: "cards" | "scroll";
  /** Custom phone card for one row; overrides the generic label/value card. */
  mobileCard?: (row: T) => React.ReactNode;
  /** Keep cards through tablet widths when a persistent side rail narrows the content area. */
  cardBreakpoint?: "md" | "lg";
}

export const headCls =
  "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs lg:text-sm whitespace-nowrap pt-3 pb-2";
export const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5";

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
  mobile = "cards",
  mobileCard,
  cardBreakpoint = "md",
}: DataTableProps<T>) {
  const colCount = columns.length;
  // Defensive: the backend returns `{}` (not `[]`) for an empty list endpoint,
  // so a caller may hand us a non-array. Never let `.map` throw.
  const safeRows: T[] = Array.isArray(rows) ? rows : [];
  // Cards replace the table on phones only when there are rows to show; the
  // loading/empty/error/forbidden states render inside the table at any width.
  const cardsOnPhone = mobile === "cards" && safeRows.length > 0 && !loading && !forbidden;

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
      {cardsOnPhone && (
        <div className={cardBreakpoint === "lg" ? "lg:hidden" : "md:hidden"}>
          {safeRows.map((row) =>
            mobileCard ? (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-gray-03 px-3.5 py-3 last:border-0",
                  onRowClick && "cursor-pointer transition-colors active:bg-primary/5",
                )}
              >
                {mobileCard(row)}
              </div>
            ) : (
              <RowCard
                key={rowKey(row)}
                columns={columns}
                row={row}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              />
            ),
          )}
        </div>
      )}
      <Table containerClassName={cn(cardsOnPhone && (cardBreakpoint === "lg" ? "max-lg:hidden" : "max-md:hidden"))}>
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
