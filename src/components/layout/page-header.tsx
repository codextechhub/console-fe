import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The title and one-line description at the top of a console screen.
 *
 * `@xvs/finance` imports `@/components/layout/page-header` from whichever
 * application hosts it, the same way it takes `PageShell`, so the shared
 * Finance, Procurement and Workflow screens draw their headings with this
 * one. Each application owns its own heading size: school-fe's matches its
 * Support screen, and this one keeps the console's finance heading, an 18px
 * grey title over a 12px description.
 *
 * The props match school-fe's `PageHeader` exactly, because the same package
 * screens render against both. The title is always the page's `<h1>`, and the
 * description is a block, so it can carry a second line or a pill. Actions sit
 * on the right and drop underneath on a phone; nothing in the heading is
 * truncated, so a long title wraps instead of losing words.
 */
export function PageHeader({
  title,
  description,
  titleAside,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Shown on the title's line, after it: an `InfoHint`, a status pill. */
  titleAside?: React.ReactNode;
  /** Buttons and controls on the right of the heading. */
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      {...props}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <h1 className="min-w-0 break-words font-mont text-lg font-semibold text-gray-01">
            {title}
          </h1>
          {titleAside}
        </div>
        {description ? (
          <div className="mt-0.5 font-mont text-xs text-gray-05">{description}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
