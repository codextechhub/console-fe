/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EllipsisVertical } from "lucide-react";
import {
  SkeletonCard,
  SkeletonLoadingLabel,
  SkeletonRow,
} from "@/components/custom/skeletons";

/** Ghost rows shown while a list loads - enough to fill the fold, not so many
 *  that the page grows past the real result. */
const GHOST_ROWS = 6;

interface myComponentProps {
  tableHeaderList: string[];
  loading?: boolean;
  tableBodyList?: any;
  hidePagination?: boolean;
  onPageChange?: (param?: string | number) => void;
  currentPage?: number;
  totalPage?: number;
  perPage?: number;
  onRowClick?: (param?: any) => void;
  defaultBodyList?: any;
  actionButton?: string;
  actionButtonOnClick?: (param?: unknown) => void;
  dropDown?: boolean;
  dropDownList?: any;
  width?: string;
  disabledDropdown?: boolean;
  loadingText?: string;
  emptyText?: string;
  /** Phone rendering (<md). "cards" (default) stacks each row as a label/value
   *  card built from the header/cell pairs; "scroll" keeps the table with
   *  horizontal scroll. */
  mobile?: "cards" | "scroll";
}

const CustomTable = ({
  tableHeaderList,
  loading,
  actionButtonOnClick,
  actionButton,
  tableBodyList,
  onRowClick,
  defaultBodyList,
  dropDown,
  dropDownList,
  width,
  disabledDropdown,
  totalPage = 0,
  currentPage = 0,
  onPageChange,
  hidePagination,
  loadingText,
  emptyText,
  mobile = "cards",
}: myComponentProps) => {
  //   pagination here ------
  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    // Always show first page
    pageNumbers.push(1);

    // Calculate range of pages to show around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPage - 1, currentPage + 1);
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pageNumbers.push("ellipsis-start");
    }
    // Add pages in the calculated range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPage - 1) {
      pageNumbers.push("ellipsis-end");
    }
    // Always show last page if there is more than one page
    if (totalPage > 1) {
      pageNumbers.push(totalPage);
    }

    return pageNumbers;
  };

  const handlePickObjFromDefaultList = (param: any) => {
    if (defaultBodyList?.length > 0) {
      const obj = defaultBodyList?.find((_: any, idx: any) => idx === param);
      return obj;
    }
  };

  // The action button / kebab menu for one row - shared between the table's
  // action cell and the phone card's top-right corner.
  const RowActions = ({ item }: { item: any }) => {
    const resolvedDropDownList =
      typeof dropDownList === "function" ? dropDownList(item) : dropDownList;
    return actionButton ? (
      <button
        type="button"
        disabled={disabledDropdown}
        onClick={() => {
          if (actionButtonOnClick) {
            actionButtonOnClick(item);
          }
        }}
        className="w-13 h-6 rounded-xm border-[0.5px] border-black-02 text-black-02 font-medium text-xs cursor-pointer"
      >
        {actionButton}
      </button>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className={cn(
            "cursor-pointer px-2",
            disabledDropdown && "cursor-not-allowed",
          )}
          disabled={disabledDropdown}
        >
          <EllipsisVertical className="size-8" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="border rounded-sm"
          align="end"
          style={{ width: width ? width : "170px" }}
        >
          {resolvedDropDownList?.map((child: any, idx: any) => (
            <DropdownMenuItem
              key={idx}
              onClick={() => {
                if (child?.onActionClick) {
                  child.onActionClick(item);
                }
              }}
              className={cn(
                "font-light text-sm cursor-pointer text-custom-gray-scale-400",
                child?.className,
              )}
            >
              {child?.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const TableRowComponet = ({
    row,
    children,
    onClick,
  }: {
    row: any;
    children: React.ReactNode;
    onClick: (val: any) => void;
  }) => (
    <TableRow
      className={cn(
        "transition-all duration-300 hover:bg-primary/5",
        onRowClick && "cursor-pointer",
      )}
      key={row?.id}
    >
      {row?.map((cell: any, index: any) => (
        <TableCell
          className="text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5"
          key={index}
          onClick={onClick}
        >
          {cell}
        </TableCell>
      ))}
      {children}
    </TableRow>
  );

  // Ghost geometry is derived from the real column definitions, so the loading
  // state previews the exact table that is about to render.
  const ghostColumns = Math.max(1, tableHeaderList?.length ?? 1);
  // Cards own the phone viewport whenever the table would be card-shaped -
  // including while loading, so the phone never flips table -> cards on arrival.
  const showCards =
    mobile === "cards" && (loading || tableBodyList?.length > 0);

  return (
    <>
      {/* Phone rendering: each row as a stacked label/value card (the empty
          state stays in the table, which renders fine at any width). */}
      {showCards && loading && (
        <div className="rounded-md bg-white md:hidden">
          <SkeletonLoadingLabel text={loadingText || "Loading…"} />
          {Array.from({ length: GHOST_ROWS }).map((_, rowIndex) => (
            <SkeletonCard
              key={rowIndex}
              rowIndex={rowIndex}
              lines={Math.max(1, ghostColumns - 2)}
            />
          ))}
        </div>
      )}
      {showCards && !loading && (
        <div className="rounded-md bg-white md:hidden">
          {tableBodyList?.map((item: any, rowIndex: any) => {
            const cells = Object.entries(item)
              .filter(([key]) => !key.startsWith("_"))
              .map(([, v]) => v as React.ReactNode);
            const labels = tableHeaderList.filter(
              (h) => h.toLowerCase() !== "action",
            );
            const serialColumn = labels.findIndex((label) =>
              ["s/n", "sn", "#"].includes(label.trim().toLowerCase()),
            );
            const primaryColumn = serialColumn === 0 && cells.length > 1 ? 1 : 0;
            const rowKey =
              item?._id ?? item?._slug ?? item?._code ?? item?._key ?? rowIndex;
            const handleRowClick = () => {
              if (onRowClick) {
                if (defaultBodyList?.length > 0) {
                  onRowClick(handlePickObjFromDefaultList(rowIndex));
                } else {
                  onRowClick(item);
                }
              }
            };
            return (
              <div
                key={rowKey}
                onClick={handleRowClick}
                className={cn(
                  "space-y-2 border-b border-gray-03 px-3.5 py-3 last:border-0",
                  onRowClick && "cursor-pointer transition-colors active:bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 font-mont text-sm font-semibold text-black-01">
                    {cells[primaryColumn]}
                  </div>
                  {dropDown && (
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <RowActions item={item} />
                    </div>
                  )}
                </div>
                {cells.map((cell, i) => i !== primaryColumn && i !== serialColumn && (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 font-mont text-[11px] capitalize text-gray-01">
                      {labels[i]}
                    </span>
                    <span className="min-w-0 text-right font-mont text-sm font-medium text-black-01">
                      {cell}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {/* table component start here ------ */}
      <Table containerClassName={cn(showCards && "max-md:hidden")}>
        {tableHeaderList?.length > 0 && (
          <TableHeader className="border-0">
            <TableRow>
              {tableHeaderList?.map((chi, idx) => {
                return (
                  <TableHead
                    key={idx}
                    className={cn(
                      "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs lg:text-sm whitespace-nowrap capitalize pt-3 pb-2",
                      chi.toLowerCase() === "action" && " text-center",
                    )}
                  >
                    {chi || ""}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
        )}
        {/* body start here ------ */}

        <TableBody className="bg-white">
          {loading ? (
            <>
              {/* One announcement for the whole surface; the ghost rows
                  themselves are aria-hidden decoration. `loadingText` keeps
                  working - it is now what the screen reader hears. */}
              <TableRow aria-hidden={false} className="hover:bg-transparent">
                <TableCell colSpan={ghostColumns} className="h-0 border-0 p-0">
                  <SkeletonLoadingLabel text={loadingText || "Loading…"} />
                </TableCell>
              </TableRow>
              {Array.from({ length: GHOST_ROWS }).map((_, rowIndex) => (
                <SkeletonRow
                  key={rowIndex}
                  rowIndex={rowIndex}
                  columns={ghostColumns}
                />
              ))}
            </>
          ) : (
            <>
              {tableBodyList?.length > 0 ? (
                <>
                  {tableBodyList?.map((item: any, rowIndex: any) => {
                    const FORMATTED_DATA = Object?.entries(item)
                      .filter(([key]) => {
                        return !key.startsWith("_");
                      })
                      ?.map((d) => {
                        return {
                          [d[0]]: d[1],
                        };
                      });
                    // Stable row key from the hidden id field callers attach
                    // (convention: _id / _slug / _code), so rows keep their
                    // identity across sort/filter/refetch instead of being
                    // re-keyed by position. Falls back to index when absent.
                    const rowKey =
                      item?._id ?? item?._slug ?? item?._code ?? item?._key ?? rowIndex;
                    return (
                      <TableRowComponet
                        key={rowKey}
                        row={FORMATTED_DATA?.map(
                          (data) => Object.values(data)[0],
                        )}
                        onClick={() => {
                          if (onRowClick) {
                            if (defaultBodyList?.length > 0) {
                              onRowClick(
                                handlePickObjFromDefaultList(rowIndex),
                              );
                            } else {
                              onRowClick(item);
                            }
                          }
                        }}
                      >
                        {dropDown && (
                          <TableCell className="text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5">
                            <div
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%",
                              }}
                            >
                              <RowActions item={item} />
                            </div>
                          </TableCell>
                        )}
                      </TableRowComponet>
                    );
                  })}
                </>
              ) : (
                <>
                  <TableRow>
                    <TableCell
                      colSpan={tableHeaderList?.length + 1}
                      className="h-56 text-center hover:bg-transparent"
                    >
                      <div className="size-40 mx-auto rounded-full border border-primary grid place-content-center">
                        <p className="text-xs text-gray-01">
                          {emptyText ? emptyText : "No available data."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </>
          )}
        </TableBody>
        {/* body end here ------------------ */}
      </Table>
      {/* table component end here ------ */}
      {/* pagination start here ------ */}
      {totalPage > 0 && !hidePagination && (
        <div className="flex items-center justify-end gap-2 mt-3.5">
          <button
            onClick={() => { if (onPageChange && currentPage > 1) onPageChange(currentPage - 1); }}
            disabled={currentPage <= 1}
            className={cn(
              "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
              currentPage <= 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-black-02 hover:bg-gray-100 cursor-pointer",
            )}
          >
            Prev
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <div key={`ellipsis-${index}`} className="px-2 text-black-02">
                  ...
                </div>
              );
            }

            const isActive = currentPage === page;

            return (
              <button
                key={`page-${page}`}
                onClick={() => { if (onPageChange) onPageChange(page as number); }}
                className={cn(
                  "grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-transparent text-black-02 hover:bg-gray-100",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => { if (onPageChange && currentPage < totalPage) onPageChange(currentPage + 1); }}
            disabled={currentPage >= totalPage}
            className={cn(
              "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
              currentPage >= totalPage
                ? "text-gray-300 cursor-not-allowed"
                : "text-black-02 hover:bg-gray-100 cursor-pointer",
            )}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default CustomTable;
