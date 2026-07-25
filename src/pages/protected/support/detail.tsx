// Ticket detail — conversation thread, attachments, and the staff-side
// actions (edit, assignment, status transitions, audit history), each gated
// by its tickets.* key. House kit: Dialog, Sheet, NativeSelect, Badge.

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Download, FileText, History, Image, Loader2, Lock, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { TicketStatusBadge } from "./status-badge";
import {
  useAddTicketCommentMutation,
  useAssignTicketMutation,
  useDownloadTicketAttachmentMutation,
  useGetEligibleTicketAssigneesQuery,
  useGetTicketAuditQuery,
  useGetTicketQuery,
  useTransitionTicketMutation,
  useUpdateTicketMutation,
  useUploadTicketAttachmentMutation,
  type TicketStatus,
  type TicketAttachment,
} from "@/redux/services/tickets-api";
import { isPrimaryShortcut } from "@/utils/keyboard-shortcuts";
import { useDashboardTitle } from "@/components/layout/dashboard-header";

// Mirrors backend VALID_STATUS_TRANSITIONS (vs_tickets/constants.py).
const transitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"],
};

const TICKET_DETAIL_POLL = {
  pollingInterval: 10_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
} as const;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TicketAttachmentCard({ ticketId, attachment }: { ticketId: string; attachment: TicketAttachment }) {
  const [download, state] = useDownloadTicketAttachmentMutation();
  const [previewUrl, setPreviewUrl] = useState("");
  const isImage = attachment.content_type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    let objectUrl = "";
    download({ id: ticketId, attachmentId: attachment.id })
      .unwrap()
      .then((url) => {
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, download, isImage, ticketId]);

  const save = async () => {
    try {
      // Images were already fetched for the preview — reuse that object URL
      // instead of downloading the file a second time.
      const url = previewUrl || (await download({ id: ticketId, attachmentId: attachment.id }).unwrap());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.original_filename;
      anchor.click();
      if (!previewUrl) URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download this attachment");
    }
  };

  return (
    <button
      type="button"
      onClick={save}
      className="mt-3 flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 text-left hover:border-primary/30 hover:bg-primary/5"
    >
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={attachment.original_filename} className="size-14 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-primary">
          {isImage ? <Image className="size-5" /> : <FileText className="size-5" />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-black-01">{attachment.original_filename}</span>
        <span className="mt-0.5 block text-[11px] text-gray-01">{formatFileSize(attachment.size)}</span>
      </span>
      {state.isLoading ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Download className="size-4 shrink-0 text-gray-01" />}
    </button>
  );
}

export default function TicketDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const ticketQuery = useGetTicketQuery(id, TICKET_DETAIL_POLL);
  const ticket = ticketQuery.data?.data;
  // Until the ticket lands the route handle's "Support" shows through.
  useDashboardTitle(ticket?.ticket_number);
  const hasTicket = Boolean(ticket);
  const commentCount = ticket?.comments?.length ?? 0;
  const canManage = hasPermission(P.MANAGE_TICKETS);
  const canAssign = hasPermission(P.ASSIGN_TICKET);
  const canInternal = hasPermission(P.POST_INTERNAL_NOTE);
  const canAudit = hasPermission(P.VIEW_TICKET_AUDIT);
  const { data: eligibleAssignees, isLoading: assigneesLoading } =
    useGetEligibleTicketAssigneesQuery(id, { skip: !canAssign });
  const audit = useGetTicketAuditQuery(id, { skip: !canAudit });
  const [transition, transitionState] = useTransitionTicketMutation();
  const [assign, assignState] = useAssignTicketMutation();
  const [update, updateState] = useUpdateTicketMutation();
  const [comment, commentState] = useAddTicketCommentMutation();
  const [upload, uploadState] = useUploadTicketAttachmentMutation();
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [internal, setInternal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const sendingRef = useRef(false);
  const conversationViewportRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef("");
  const staysAtLatestRef = useRef(true);
  const forceLatestOnUpdateRef = useRef(false);
  const knownCommentCountRef = useRef(0);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);

  const scrollConversationToLatest = (behavior: ScrollBehavior = "smooth") => {
    const viewport = conversationViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    staysAtLatestRef.current = true;
    setShowJumpToLatest(false);
    setNewMessagesBelow(0);
  };

  useEffect(() => {
    if (!hasTicket) return;
    const isOpeningTicket = activeConversationRef.current !== id;
    const previousCommentCount = knownCommentCountRef.current;
    const newlyArrivedCount = isOpeningTicket
      ? 0
      : Math.max(0, commentCount - previousCommentCount);
    activeConversationRef.current = id;
    knownCommentCountRef.current = commentCount;
    const shouldFollowLatest = (
      isOpeningTicket
      || staysAtLatestRef.current
      || forceLatestOnUpdateRef.current
    );
    forceLatestOnUpdateRef.current = false;
    if (!shouldFollowLatest) {
      if (newlyArrivedCount > 0) {
        setNewMessagesBelow((count) => count + newlyArrivedCount);
        setShowJumpToLatest(true);
      }
      return;
    }

    setNewMessagesBelow(0);

    const frame = requestAnimationFrame(() => {
      scrollConversationToLatest(isOpeningTicket ? "auto" : "smooth");
    });
    return () => cancelAnimationFrame(frame);
  }, [commentCount, hasTicket, id]);

  if (ticketQuery.isLoading)
    return (
      <>
        <div className="grid h-[70vh] place-content-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </>
    );
  if (!ticket)
    return (
      <>
        <div className="p-10 text-center">Ticket not found.</div>
      </>
    );

  // A file may be sent without text (it attaches to the ticket itself), but an
  // internal note needs text: a ticket-level attachment has no visibility flag,
  // so a file-only "internal" send would be visible to the requester.
  const canSend = !!body.trim() || (!!pendingFile && !internal);
  const isSending = commentState.isLoading || uploadState.isLoading;

  const send = async () => {
    if (!canSend || sendingRef.current) return;
    sendingRef.current = true;
    const text = body.trim();
    try {
      let commentId: string | undefined;
      if (text) {
        const created = await comment({ id, body: text, visibility: internal ? "INTERNAL" : "PUBLIC" }).unwrap();
        forceLatestOnUpdateRef.current = true;
        setBody("");
        commentId = created.data.id;
      }
      if (pendingFile) {
        try {
          await upload({ id, file: pendingFile, comment_id: commentId }).unwrap();
          setPendingFile(null);
        } catch {
          toast.warning(
            text
              ? "Reply sent, but the attachment could not be uploaded. You can try the file again."
              : "The attachment could not be uploaded. Please try again.",
          );
          return;
        }
      }
      toast.success(text ? (internal ? "Internal note added" : "Reply sent") : "Attachment uploaded");
    } catch {
      toast.error("Unable to send your reply");
    } finally {
      sendingRef.current = false;
    }
  };

  return (
    <>
      <main className="px-4.5 py-6 lg:h-[calc(100dvh-3.75rem)] lg:overflow-hidden lg:px-8">
        <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-gray-01"
          >
            <ArrowLeft className="size-4" />
            Back to tickets
          </button>

          <div className="mt-5 grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_310px]">
            <section className="overflow-hidden rounded-md bg-white lg:flex lg:min-h-0 lg:flex-col">
              <div className="shrink-0 border-b border-white-02 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-primary">{ticket.ticket_number}</p>
                    <h1 className="mt-1 font-mont text-xl font-semibold text-black-01">{ticket.title}</h1>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {ticket.description}
                </p>
                {!!ticket.attachments?.filter((attachment) => !attachment.comment_id).length && (
                  <div className="mt-4 border-t border-white-02 pt-3">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-01">
                      <Paperclip className="size-3.5" /> Ticket attachments
                    </p>
                    {ticket.attachments.filter((attachment) => !attachment.comment_id).map((attachment) => (
                      <TicketAttachmentCard key={attachment.id} ticketId={id} attachment={attachment} />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                <div className="flex shrink-0 items-center gap-2">
                  <MessageSquare className="size-4" />
                  <h2 className="font-semibold">Conversation</h2>
                  <span className="text-xs text-gray-01">{ticket.comments?.length ?? 0}</span>
                </div>

                <div className="mt-4 flex h-[65dvh] min-h-[430px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/40 lg:h-auto lg:min-h-0 lg:flex-1">
                  <div className="relative min-h-0 flex-1">
                    <div
                      ref={conversationViewportRef}
                      data-testid="ticket-conversation-viewport"
                      onScroll={(event) => {
                        const viewport = event.currentTarget;
                        const distanceFromLatest = (
                          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
                        );
                        const isNearLatest = distanceFromLatest <= 72;
                        staysAtLatestRef.current = isNearLatest;
                        setShowJumpToLatest(!isNearLatest);
                        if (isNearLatest) setNewMessagesBelow(0);
                      }}
                      className="absolute inset-0 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-4"
                    >
                      {ticket.comments?.map((c) => (
                        <div
                          key={c.id}
                          className={cn(
                            "rounded-lg border border-white-02 bg-white p-4",
                            c.visibility === "INTERNAL" && "border-amber-200 bg-amber-50/60",
                          )}
                        >
                          <div className="flex justify-between gap-3">
                            <p className="text-sm font-semibold">{c.author.name}</p>
                            <p className="text-xs text-gray-01">{new Date(c.created_at).toLocaleString()}</p>
                          </div>
                          {c.visibility === "INTERNAL" && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                              <Lock className="size-3" />
                              Internal note
                            </p>
                          )}
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{c.body}</p>
                          {c.attachments.map((attachment) => (
                            <TicketAttachmentCard key={attachment.id} ticketId={id} attachment={attachment} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {showJumpToLatest && (
                      <button
                        type="button"
                        aria-label={newMessagesBelow
                          ? `Jump to latest message, ${newMessagesBelow} new ${newMessagesBelow === 1 ? "message" : "messages"}`
                          : "Jump to latest message"}
                        onClick={() => scrollConversationToLatest()}
                        className="absolute bottom-3 right-3 grid size-9 place-content-center rounded-full border border-primary/15 bg-white text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <ArrowDown className="size-4" />
                        {newMessagesBelow > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-content-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-white">
                            {newMessagesBelow > 99 ? "99+" : newMessagesBelow}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {ticket.capabilities?.can_comment !== false ? <div className="shrink-0 border-t border-gray-200 bg-white p-3">
                    <Textarea
                      rows={3}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onKeyDown={(event) => {
                        if (!isPrimaryShortcut(event.nativeEvent, "Enter")) return;
                        event.preventDefault();
                        if (!isSending && canSend) void send();
                      }}
                      aria-keyshortcuts="Control+Enter Meta+Enter"
                      placeholder={internal ? "Add a private note for support staff…" : "Write a reply…"}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      {ticket.capabilities?.can_attach !== false && <label className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-gray-01 hover:bg-gray-50">
                        <Paperclip className="size-3" />
                        Attach file
                        <input
                          type="file"
                          accept=".csv,.xlsx,.png,.jpg,.jpeg,.pdf"
                          className="hidden"
                          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                        />
                      </label>}
                      {canInternal && (
                        <button
                          onClick={() => setInternal((x) => !x)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-1 text-xs",
                            internal ? "bg-amber-100 text-amber-800" : "text-gray-01",
                          )}
                        >
                          <Lock className="size-3" />
                          Internal note
                        </button>
                      )}
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={send}
                        disabled={isSending || !canSend}
                      >
                        <Send className="size-3" />
                        {commentState.isLoading ? "Sending…" : "Send reply"}
                      </Button>
                    </div>
                    {pendingFile && (
                      <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                        <Paperclip className="size-3.5 shrink-0" />
                        <span className="truncate">{pendingFile.name}</span>
                        <button type="button" aria-label="Remove attachment" onClick={() => setPendingFile(null)}>
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}
                    {pendingFile && internal && !body.trim() && (
                      <p className="mt-1.5 text-[11px] text-gray-01">
                        Write the note text to send this file with an internal note — a file sent
                        alone is visible to everyone on the ticket.
                      </p>
                    )}
                  </div> : (
                    <p className="shrink-0 border-t border-gray-200 bg-white p-4 text-sm text-gray-01">You can view this ticket, but you cannot reply to its conversation.</p>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              <div className="rounded-md bg-white p-5">
                <div className="flex justify-between">
                  <h2 className="font-semibold">Ticket details</h2>
                  {canManage && (
                    <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary">
                      Edit
                    </button>
                  )}
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ["Requester", ticket.requester.name],
                    ["Assignee", ticket.assignee?.name ?? "Unassigned"],
                    ["Tenant", ticket.tenant?.toUpperCase() ?? "—"],
                    ...(ticket.school && ticket.school_name?.trim()
                      ? [["School", ticket.school_name]]
                      : []),
                    ["Category", ticket.category],
                    ["Priority", ticket.priority],
                    ["Created", new Date(ticket.created_at).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-gray-01">{k}</dt>
                      <dd className="mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {canAssign && (
                <div className="rounded-md bg-white p-5">
                  <h2 className="font-semibold">Assignment</h2>
                  <NativeSelect
                    className="mt-3"
                    size="sm"
                    disabled={assignState.isLoading || assigneesLoading}
                    loading={assignState.isLoading || assigneesLoading}
                    value={ticket.assignee?.id ?? ""}
                    onChange={async (e) => {
                      await assign({ id, assignee_id: e.target.value || null }).unwrap();
                      toast.success("Assignment updated");
                    }}
                  >
                    <option value="">Unassigned</option>
                    {(eligibleAssignees?.data ?? []).map((m) => (
                      <option value={m.id} key={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {canManage && (
                <div className="rounded-md bg-white p-5">
                  <h2 className="font-semibold">Update status</h2>
                  <p className="mt-1 text-xs text-gray-01">Only valid workflow transitions are available.</p>
                  <div className="mt-4 grid gap-2">
                    {transitions[ticket.status].map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        disabled={transitionState.isLoading}
                        onClick={async () => {
                          await transition({ id, status }).unwrap();
                          toast.success("Ticket status updated");
                        }}
                      >
                        Move to {status.replace("_", " ").toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {canAudit && (
                <button
                  onClick={() => setShowAudit(true)}
                  className="flex w-full items-center gap-2 rounded-md bg-white p-4 text-sm font-medium"
                >
                  <History className="size-4 text-primary" />
                  View audit history
                </button>
              )}
            </aside>
          </div>

          {/* Mounted per-open so the form re-seeds from the current ticket. */}
          {editing && (
            <EditTicket
              open
              ticket={ticket}
              busy={updateState.isLoading}
              close={() => setEditing(false)}
              save={async (body) => {
                await update({ id, body }).unwrap();
                toast.success("Ticket updated");
                setEditing(false);
              }}
            />
          )}

          <Sheet open={showAudit} onOpenChange={setShowAudit}>
            <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
              <SheetHeader className="p-0">
                <SheetTitle>Audit history</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {audit.isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  audit.data?.data.map((a) => (
                    <div className="border-l-2 border-primary/30 pl-4" key={a.id}>
                      <p className="text-sm font-semibold">{a.summary}</p>
                      <p className="text-xs text-gray-01">
                        {a.actor?.name ?? "System"} · {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </>
  );
}

function EditTicket({
  open,
  ticket,
  busy,
  close,
  save,
}: {
  open: boolean;
  ticket: { title: string; description: string; category: string; priority: string };
  busy: boolean;
  close: () => void;
  save: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit ticket</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(form);
          }}
          className="space-y-4"
        >
          <label className="grid gap-1 text-sm font-medium">
            Title
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Description
            <Textarea
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Category
              <NativeSelect
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["BUG", "SUPPORT", "HELP", "ACCOUNT", "BILLING", "OTHER"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Priority
              <NativeSelect
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </NativeSelect>
            </label>
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="white" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
