// <ConfirmActionModal> — confirms a state-changing action (post / reverse /
// settle / pay / approve) before it hits the action endpoint, in the app's
// Dialog style. `children` can show the impact (e.g. the journal that will be
// posted) so the user confirms with full sight of the consequence (spec §5).

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
  /** Destructive styling for irreversible actions (reverse, write-off…). */
  destructive?: boolean;
  /** Disable confirm (e.g. an unbalanced direct entry). */
  confirmDisabled?: boolean;
}

export function ConfirmActionModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  loading,
  destructive,
  confirmDisabled,
}: ConfirmActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold text-black-01">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="font-mont text-sm text-gray-05">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {children ? <div className="my-4">{children}</div> : <div className="h-2" />}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            disabled={loading || confirmDisabled}
            onClick={onConfirm}
            className={cn(
              destructive && "bg-error-01 text-white hover:bg-error-01/90 focus-visible:ring-error-01/20",
            )}
          >
            {loading ? "Working…" : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
