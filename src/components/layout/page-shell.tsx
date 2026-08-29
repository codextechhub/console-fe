import * as React from "react";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The <main> every page sits in.
//
// This existed as a hand-copied class string on 116 pages, which is how
// /users/cx came to scroll the whole window sideways. That page needed a grid
// and was given `grid` on its own: an implicit grid column is sized to its
// min-content, the widest thing on the page was a nowrap table, so the column
// grew to the table's natural width and the overflow escaped to the document.
// It was 133px past the right edge at 1200 and 507px past it at 820.
//
// The fix on that page was `grid-cols-1 min-w-0`. The fix for the NEXT page is
// this component, because the trap is not that somebody wrote the wrong class -
// it is that a bare `grid` looks complete and behaves correctly until the day
// the page grows a wide table. Nothing on screen says which of 116 mains has
// the guard.
//
// **So a grid cannot be asked for without its guard.** There is no `grid`
// className to pass; there is a `grid` prop, and it always emits
// `grid grid-cols-1` (`minmax(0, 1fr)`, which removes the min-content floor)
// together with `min-w-0`.
//
// **The default stays a block, deliberately.** 116 of these are block-level
// today and correct, and turning them into grids to be consistent would change
// margin collapsing on every page in the console to fix a bug none of them
// have. The layout's own children wrapper is already
// `grid grid-cols-1 min-w-0`, which is what keeps a block main safe; what it
// cannot protect against is a second grid declared inside it.
//
// The shell owns three things and no more: the page padding, `min-w-0`, and
// the grid guard. Text colour, vertical rhythm and max-width stay with the
// page, because they differ page to page and are not what went wrong.
// ─────────────────────────────────────────────────────────────────────────────

export function PageShell({
  className,
  grid = false,
  children,
  ...props
}: React.ComponentProps<"main"> & {
  /**
   * Lay the page out as a single-column grid.
   *
   * Use it when the page needs `gap` between sections or a `lg:grid-cols-[…]`
   * split. Always safe: the column is `minmax(0, 1fr)`, never `auto`.
   */
  grid?: boolean;
}) {
  return (
    <main
      className={cn(
        "min-w-0 px-4.5 py-6",
        grid && "grid grid-cols-1",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}
