import { useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  FileText,
  Headset,
  Loader2,
  Paperclip,
  Plus,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { routesPath } from "@/routes/routes-path";
import {
  useCreateTicketMutation,
  useUploadTicketAttachmentMutation,
  type Ticket,
  type TicketPriority,
} from "@/redux/services/tickets-api";

const ACCEPTED_FILES = ".csv,.xlsx,.png,.jpg,.jpeg,.pdf";

export interface TicketDraft {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
}

export const EMPTY_TICKET_DRAFT: TicketDraft = {
  title: "",
  description: "",
  category: "SUPPORT",
  priority: "MEDIUM",
};

interface TicketFormProps {
  draft: TicketDraft;
  setDraft: React.Dispatch<React.SetStateAction<TicketDraft>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onCancel: () => void;
  onCreated: (ticket: Ticket, failedFiles: string[]) => void;
}

export function CreateTicketForm({
  draft,
  setDraft,
  files,
  setFiles,
  onCancel,
  onCreated,
}: TicketFormProps) {
  const [create, createState] = useCreateTicketMutation();
  const [upload, uploadState] = useUploadTicketAttachmentMutation();
  const canSubmit = Boolean(draft.title.trim() && draft.description.trim());
  const busy = createState.isLoading || uploadState.isLoading;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((current) => {
      const next = [...current];
      for (const file of Array.from(incoming)) {
        const duplicate = next.some(
          (item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified,
        );
        if (!duplicate) next.push(file);
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || busy) return;
    try {
      const result = await create(draft).unwrap();
      const failedFiles: string[] = [];
      for (const file of files) {
        try {
          await upload({ id: result.data.id, file }).unwrap();
        } catch {
          failedFiles.push(file.name);
        }
      }
      onCreated(result.data, failedFiles);
    } catch {
      toast.error("The ticket could not be created. Please review the details and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <label className="grid gap-1.5 text-xs font-semibold text-black-01">
        Title
        <Input
          required
          autoFocus
          placeholder="Briefly describe the issue"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <label className="grid gap-1.5 text-xs font-semibold text-black-01">
        Description
        <Textarea
          required
          rows={5}
          placeholder="What happened, what did you expect, and what have you tried?"
          className="max-h-40 min-h-28 resize-y bg-white"
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-xs font-semibold text-black-01">
          Category
          <NativeSelect
            size="sm"
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
          >
            {["BUG", "SUPPORT", "HELP", "ACCOUNT", "BILLING", "OTHER"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-black-01">
          Priority
          <NativeSelect
            size="sm"
            value={draft.priority}
            onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as TicketPriority }))}
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </NativeSelect>
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white/70 px-3 py-3 text-xs font-medium text-gray-500 transition hover:border-primary/35 hover:bg-primary/[0.025] hover:text-primary">
          <Paperclip className="size-4" />
          Add screenshots or files
          <input
            type="file"
            multiple
            accept={ACCEPTED_FILES}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <div className="mt-2 max-h-24 space-y-1 overflow-y-auto">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                <FileText className="size-3.5 shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-[10px] text-gray-400">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded p-0.5 text-gray-400 hover:bg-white hover:text-red-500"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Close
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit || busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {createState.isLoading ? "Creating…" : uploadState.isLoading ? "Uploading…" : "Create ticket"}
        </Button>
      </div>
    </form>
  );
}

export function SupportTicketComposer() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TicketDraft>(EMPTY_TICKET_DRAFT);
  const [files, setFiles] = useState<File[]>([]);
  const [created, setCreated] = useState<Ticket | null>(null);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const reset = () => {
    setDraft(EMPTY_TICKET_DRAFT);
    setFiles([]);
    setCreated(null);
    setFailedFiles([]);
  };

  return (
    <>
      <div className="group fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-black-01 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100">
          Need any help?
        </span>
        <button
          type="button"
          aria-label="Create support ticket"
          onClick={() => setOpen(true)}
          className="relative isolate grid size-14 place-items-center overflow-hidden rounded-full border border-white/75 bg-white/10 text-[#153c2b] shadow-[0_14px_38px_rgba(15,23,42,.2),inset_0_1px_1px_rgba(255,255,255,.95),inset_0_-1px_1px_rgba(15,23,42,.08)] [backdrop-filter:blur(13px)_saturate(190%)_contrast(112%)] transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-white/18 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:translate-y-0"
        >
          <span className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,.92),rgba(255,255,255,.2)_34%,transparent_62%),radial-gradient(circle_at_50%_78%,rgba(28,140,88,.2),transparent_58%)]" />
          <span className="absolute inset-[2px] -z-10 rounded-full border border-white/35" />
          <Headset className="relative size-6 stroke-[2.15] drop-shadow-[0_1px_0_rgba(255,255,255,.9)]" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="left-3 right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-3xl border-white/75 bg-white/72 p-0 shadow-[0_24px_80px_rgba(15,23,42,.24),inset_0_1px_0_rgba(255,255,255,.92)] [backdrop-filter:blur(22px)_saturate(165%)_contrast(108%)] sm:left-auto sm:right-6 sm:bottom-24 sm:w-[430px] sm:max-w-[calc(100vw-3rem)]"
        >
          <div className="pointer-events-none absolute inset-x-3 top-1 h-12 rounded-[22px] bg-gradient-to-b from-white/90 to-transparent" />
          {!created ? (
            <>
              <DialogHeader className="relative border-b border-white/80 px-5 pb-4 pt-5 pr-12 text-left">
                <div className="mb-2 grid size-9 place-items-center rounded-xl border border-white bg-white/70 text-primary shadow-sm">
                  <Headset className="size-4.5" />
                </div>
                <DialogTitle className="text-base">How can we help?</DialogTitle>
                <DialogDescription className="text-xs">Create a ticket without leaving your work.</DialogDescription>
              </DialogHeader>
              <div className="relative px-5 py-4">
                <CreateTicketForm
                  draft={draft}
                  setDraft={setDraft}
                  files={files}
                  setFiles={setFiles}
                  onCancel={() => setOpen(false)}
                  onCreated={(ticket, failed) => {
                    setCreated(ticket);
                    setFailedFiles(failed);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="relative px-6 py-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <DialogHeader className="mt-4 text-center">
                <DialogTitle>Ticket created</DialogTitle>
                <DialogDescription>
                  {created.ticket_number} is now with the support team.
                </DialogDescription>
              </DialogHeader>
              {failedFiles.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
                  The ticket was created, but these files could not be uploaded: {failedFiles.join(", ")}.
                </div>
              )}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  <Plus className="size-4" /> Create another
                </Button>
                <Button asChild size="sm" onClick={() => setOpen(false)}>
                  <Link to={routesPath.PROTECTED.SUPPORT.DETAIL(created.id)}>View ticket</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
