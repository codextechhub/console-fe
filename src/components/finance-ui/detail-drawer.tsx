// <DetailDrawer> — a right-side drawer over the app's Sheet primitive, used for
// record details (view a journal, an invoice, a PO…) and read-only inspection
// without leaving the list. Actions for the record live in `footer`.

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Width of the drawer; defaults to a comfortable record width. */
  widthClass?: string;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClass = "sm:max-w-xl",
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* `console-geist` because the Sheet portals to <body>, outside the console
          wrapper — without it the drawer would fall back to the app's Montserrat
          while the page behind is Geist. */}
      <SheetContent className={cn("console-geist flex w-full flex-col gap-0 p-0", widthClass)}>
        <SheetHeader className="border-b border-gray-03 px-5 py-4">
          <SheetTitle className="font-mont text-base font-semibold text-black-01">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="font-mont text-xs text-gray-05">{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-gray-03 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
