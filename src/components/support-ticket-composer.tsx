import { useState } from "react";
import { Link } from "react-router";
import {
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  FileText,
  Headset,
  Loader2,
  Paperclip,
  Plus,
  Send,
  X,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GUIDE_CATEGORIES, findWalkthrough, useWalkthrough, type GuidePageContext, type SafeTicketContext } from "@/features/guides";
import { routesPath } from "@/routes/routes-path";
import {
  useCreateTicketMutation,
  useUploadTicketAttachmentMutation,
  type Ticket,
  type TicketPriority,
} from "@/redux/services/tickets-api";

// Mirrors core.uploads.TICKET_EXTENSIONS. The backend now also verifies that the
// bytes match the extension, so a renamed file is refused with a 400.
const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.csv,.xls,.xlsx";

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
  context?: SafeTicketContext;
}

export function CreateTicketForm({
  draft,
  setDraft,
  files,
  setFiles,
  onCancel,
  onCreated,
  context,
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
      const result = await create({ ...draft, ...(context && Object.keys(context).length ? { context } : {}) }).unwrap();
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
      // The global API error interceptor (base-api) already raises a toast for
      // every non-auth failure - validation (400/422), 5xx and network - so we
      // intentionally stay silent here; a second local toast would double up
      // (the bug this replaced). We only need to not advance to the success view.
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5" data-guide="support-ticket.form">
      <div className="space-y-3.5" data-guide="support-ticket.issue">
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
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-guide="support-ticket.classification">
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

      <div data-guide="support-ticket.attachments">
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

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3" data-guide="support-ticket.submit-boundary">
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

export function SupportTicketComposer({
  pageContext,
  ticketContext,
}: {
  pageContext?: GuidePageContext;
  ticketContext?: SafeTicketContext;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [draft, setDraft] = useState<TicketDraft>(EMPTY_TICKET_DRAFT);
  const [files, setFiles] = useState<File[]>([]);
  const [created, setCreated] = useState<Ticket | null>(null);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);
  const { start: startWalkthrough } = useWalkthrough();
  // Guides plus troubleshooting: both are page-matched reading, and splitting the
  // count across two labels would make the affordance wordier than the thing it
  // points at.
  const guideCount = (pageContext?.guides.length ?? 0) + (pageContext?.troubleshooting.length ?? 0);

  const reset = () => {
    setDraft(EMPTY_TICKET_DRAFT);
    setFiles([]);
    setCreated(null);
    setFailedFiles([]);
  };

  return (
    <>
      <div className="group relative">
        <span className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100">
          Need any help?
        </span>
        <button
          type="button"
          data-guide="header.page-help"
          aria-label="Help for this page"
          onClick={() => setTicketOpen(true)}
          className="relative grid size-8.5 place-content-center rounded-full bg-gray-04 text-gray-700 transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
        >
          <Headset className="size-4.5 stroke-[2.15]" />
        </button>
      </div>

      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side="right" className="w-full gap-0 border-gray-200 bg-white p-0 sm:max-w-md">
          <SheetHeader className="border-b border-gray-100 px-5 pb-5 pt-6 pr-12 text-left">
            <div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Headset className="size-5" />
            </div>
            <SheetTitle className="font-mont text-lg">Help for this page</SheetTitle>
            <SheetDescription className="text-xs leading-5">
              Guidance matched to {pageContext?.productArea || "your current Console screen"}.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {pageContext?.guides.length ? (
              <section aria-labelledby="page-guides-heading">
                <h2 id="page-guides-heading" className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-01">Guides for this page</h2>
                <div className="mt-3 space-y-2">
                  {pageContext.guides.map((guide) => {
                    const category = GUIDE_CATEGORIES.find((item) => item.id === guide.category);
                    return (
                      <Link
                        key={guide.id}
                        to={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug)}
                        onClick={() => setHelpOpen(false)}
                        className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-primary/30 hover:bg-primary/[0.025]"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary"><BookOpenText className="size-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{guide.title}</span><span className="mt-0.5 block text-xs leading-5 text-gray-01">{category?.title}</span></span>
                        <ChevronRight className="mt-2 size-4 shrink-0 text-gray-300" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center">
                <BookOpenText className="mx-auto size-7 text-gray-300" />
                <h2 className="mt-3 text-sm font-semibold">No page-specific guide yet</h2>
                <p className="mt-1 text-xs leading-5 text-gray-01">Browse the guide centre or tell support what you need from this screen.</p>
              </section>
            )}

            <section className="mt-6" aria-labelledby="walkthrough-heading">
              <h2 id="walkthrough-heading" className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-01">Available walkthroughs</h2>
              {pageContext?.walkthroughs.some((guide) => guide.walkthroughId && findWalkthrough(guide.walkthroughId)) ? (
                <div className="mt-2 space-y-2">
                  {pageContext.walkthroughs.filter((guide) => guide.walkthroughId && findWalkthrough(guide.walkthroughId)).map((guide) => (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => {
                        setHelpOpen(false);
                        if (guide.walkthroughId) window.setTimeout(() => startWalkthrough(guide.walkthroughId!), 350);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-left text-sm font-medium transition hover:border-primary/30 hover:bg-primary/[0.025]"
                    >
                      <span>{guide.title}</span><ChevronRight className="size-4 shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-gray-01">No published interactive walkthrough is mapped to this page yet.</p>
              )}
            </section>

            <section className="mt-6" aria-labelledby="troubleshooting-heading">
              <h2 id="troubleshooting-heading" className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-01">Related troubleshooting</h2>
              {pageContext?.troubleshooting.length ? (
                <div className="mt-2 space-y-2">
                  {pageContext.troubleshooting.map((guide) => (
                    <Link key={guide.id} to={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug)} onClick={() => setHelpOpen(false)} className="block rounded-xl border border-gray-200 p-3 text-sm font-medium hover:border-primary/30">{guide.title}</Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-gray-01">No published troubleshooting article is related to this page yet.</p>
              )}
            </section>
          </div>

          <div className="grid gap-2 border-t border-gray-100 p-5">
            <Button asChild variant="outline"><Link to={routesPath.PROTECTED.SUPPORT.GUIDES} onClick={() => setHelpOpen(false)}>Browse all guides</Link></Button>
            <Button onClick={() => { setHelpOpen(false); setTicketOpen(true); }}><Headset className="size-4" /> Back to your ticket</Button>
            <p className="text-center text-[10px] leading-4 text-gray-400">Only the guide ID, route pattern, product area, and app version may be attached. Page values are never copied.</p>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent
          className="left-3 right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto overscroll-contain rounded-3xl border-white bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,.24),inset_0_1px_0_rgba(255,255,255,.98)] [backdrop-filter:blur(22px)_saturate(150%)] sm:bottom-auto sm:left-auto sm:right-6 sm:top-[72px] sm:h-auto sm:max-h-[calc(100dvh-96px)] sm:w-[430px] sm:max-w-[calc(100vw-3rem)]"
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
                  onCancel={() => setTicketOpen(false)}
                  context={ticketContext}
                  onCreated={(ticket, failed) => {
                    setCreated(ticket);
                    setFailedFiles(failed);
                  }}
                />
              </div>
              {/* The guidance is still one click away, but it no longer stands
                  between somebody and the ticket they came to raise. The count is
                  shown because "3 guides" is a reason to look and a bare link is
                  not. */}
              <div className="relative flex items-center border-t border-white/80 px-5 py-3">
                <button
                  type="button"
                  onClick={() => { setTicketOpen(false); setHelpOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
                >
                  <BookOpenText className="size-3.5" />
                  {guideCount > 0
                    ? `${guideCount} guide${guideCount === 1 ? "" : "s"} for this page`
                    : "Guides for this page"}
                </button>
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
                <Button asChild size="sm" onClick={() => setTicketOpen(false)}>
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
