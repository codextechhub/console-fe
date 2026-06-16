// <FormModal> — a dialog wrapper for create/edit forms. Owns the chrome (title,
// description, cancel/submit, loading + disabled state); the caller supplies the
// fields as children and the submit handler. Keeps every create form terse and
// consistent with the app's Dialog style.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitText?: string;
  loading?: boolean;
  canSubmit?: boolean;
  widthClass?: string;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = "Create",
  loading,
  canSubmit = true,
  widthClass = "sm:max-w-lg",
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className={`console-geist max-h-[92dvh] overflow-y-auto ${widthClass}`}>
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold text-black-01">{title}</DialogTitle>
          {description ? <DialogDescription className="font-mont text-sm text-gray-05">{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-3 py-2">{children}</div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading || !canSubmit} onClick={onSubmit}>{loading ? "Saving…" : submitText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Labelled field wrapper for form rows. */
export function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="font-mont text-xs text-gray-05">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}
