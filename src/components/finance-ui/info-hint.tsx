// <InfoHint> — a small ⓘ icon that reveals an explanatory note on hover, focus,
// or click/tap. Replaces the always-on teaching-note banners so guidance is
// available but not in the way.
import { useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function InfoHint({
  children,
  className,
  ariaLabel = "About this screen",
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button type="button" aria-label={ariaLabel} aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn("inline-flex size-5 shrink-0 items-center justify-center text-gray-05 hover:text-gray-01", className)}>
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs font-mont text-xs leading-relaxed">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
