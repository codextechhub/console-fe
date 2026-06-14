// The four explicit screen states every finance/procurement list/detail must
// handle (spec §4): loading, empty, error (retry), forbidden. Kept tiny and
// composable so pages and <DataTable> share one vocabulary.

import { Ban, Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Centered({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      {children}
    </div>
  );
}

export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Centered>
      <Inbox className="mb-3 size-8 text-gray-03" />
      <p className="font-mont text-sm font-semibold text-gray-01">{title}</p>
      {message && <p className="mt-1 max-w-md font-mont text-xs text-gray-05">{message}</p>}
    </Centered>
  );
}

export function ErrorState({
  message = "We couldn’t load this. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Centered>
      <TriangleAlert className="mb-3 size-8 text-destructive/70" />
      <p className="font-mont text-sm font-medium text-gray-05">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="size-4" /> Retry
        </Button>
      )}
    </Centered>
  );
}

export function ForbiddenState({
  message = "You don’t have permission to view this.",
}: {
  message?: string;
}) {
  return (
    <Centered>
      <Ban className="mb-3 size-8 text-gray-03" />
      <p className="font-mont text-sm font-semibold text-gray-01">Access restricted</p>
      <p className="mt-1 max-w-md font-mont text-xs text-gray-05">{message}</p>
    </Centered>
  );
}
