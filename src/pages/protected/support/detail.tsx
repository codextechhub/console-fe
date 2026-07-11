import { useState } from "react";
import { ArrowLeft, History, Loader2, Lock, MessageSquare, Paperclip, Send, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { useAddTicketCommentMutation, useAssignTicketMutation, useGetTicketAuditQuery, useGetTicketQuery, useTransitionTicketMutation, useUpdateTicketMutation, useUploadTicketAttachmentMutation, type TicketStatus } from "@/redux/services/tickets-api";

const transitions: Record<TicketStatus, TicketStatus[]> = { OPEN:["ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED"], ASSIGNED:["IN_PROGRESS","RESOLVED","CLOSED"], IN_PROGRESS:["RESOLVED","CLOSED"], RESOLVED:["CLOSED","IN_PROGRESS"], CLOSED:["IN_PROGRESS"] };

export default function TicketDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const ticketQuery = useGetTicketQuery(id);
  const ticket = ticketQuery.data?.data;
  const canManage = hasPermission(P.MANAGE_TICKETS);
  const canAssign = hasPermission(P.ASSIGN_TICKET);
  const canInternal = hasPermission(P.POST_INTERNAL_NOTE);
  const canAudit = hasPermission(P.VIEW_TICKET_AUDIT);
  const { data: members } = useGetTeamMembersQuery({ page_size: 200, user_type: "CX_STAFF" }, { skip: !canAssign });
  const audit = useGetTicketAuditQuery(id, { skip: !canAudit });
  const [transition, transitionState] = useTransitionTicketMutation();
  const [assign, assignState] = useAssignTicketMutation();
  const [update, updateState] = useUpdateTicketMutation();
  const [comment, commentState] = useAddTicketCommentMutation();
  const [upload, uploadState] = useUploadTicketAttachmentMutation();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  if (ticketQuery.isLoading) return <DashboardLayout title="Support"><div className="grid h-[70vh] place-content-center"><Loader2 className="animate-spin text-primary" /></div></DashboardLayout>;
  if (!ticket) return <DashboardLayout title="Support"><div className="p-10 text-center">Ticket not found.</div></DashboardLayout>;

  const send = async () => {
    if (!body.trim()) return;
    await comment({ id, body, visibility: internal ? "INTERNAL" : "PUBLIC" }).unwrap();
    setBody(""); toast.success(internal ? "Internal note added" : "Reply sent");
  };
  const uploadFile = async (file?: File) => {
    if (!file) return;
    await upload({ id, file }).unwrap(); toast.success("Attachment uploaded");
  };

  return <DashboardLayout title={ticket.ticket_number}><main className="px-4.5 py-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-01"><ArrowLeft className="size-4" />Back to tickets</button>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium text-primary">{ticket.ticket_number}</p><h1 className="mt-1 text-xl font-semibold">{ticket.title}</h1></div><span className="rounded-full bg-pry-01 px-3 py-1 text-xs font-semibold text-primary">{ticket.status.replace("_", " ")}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">{ticket.description}</p></div>
        <div className="p-6"><div className="flex items-center gap-2"><MessageSquare className="size-4" /><h2 className="font-semibold">Conversation</h2><span className="text-xs text-gray-01">{ticket.comments?.length ?? 0}</span></div>
          <div className="mt-5 space-y-5">{ticket.comments?.map(c => <div key={c.id} className={cn("rounded-lg border p-4", c.visibility === "INTERNAL" && "border-amber-200 bg-amber-50/60")}><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{c.author.name}</p><p className="text-xs text-gray-01">{new Date(c.created_at).toLocaleString()}</p></div>{c.visibility === "INTERNAL" && <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700"><Lock className="size-3" />Internal note</p>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6">{c.body}</p>{c.attachments.map(a => <a className="mt-3 inline-flex items-center gap-2 text-xs text-primary" href={a.url} key={a.id}><Paperclip className="size-3" />{a.original_filename}</a>)}</div>)}</div>
          <div className="mt-6 rounded-lg border p-3"><Textarea rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder={internal ? "Add a private note for support staff…" : "Write a reply…"} /><div className="mt-2 flex items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-gray-01 hover:bg-gray-50"><Upload className="size-3" />{uploadState.isLoading ? "Uploading…" : "Attach file"}<input type="file" accept=".csv,.xlsx,.png,.jpg,.jpeg,.pdf" className="hidden" onChange={e => uploadFile(e.target.files?.[0])} /></label>{canInternal && <button onClick={() => setInternal(x => !x)} className={cn("inline-flex items-center gap-1 rounded px-2 py-1 text-xs", internal ? "bg-amber-100 text-amber-800" : "text-gray-01")}><Lock className="size-3" />Internal note</button>}<button onClick={send} disabled={commentState.isLoading || !body.trim()} className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send className="size-3" />{commentState.isLoading ? "Sending…" : "Send reply"}</button></div></div>
        </div>
      </section>
      <aside className="space-y-4"><div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex justify-between"><h2 className="font-semibold">Ticket details</h2>{canManage && <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary">Edit</button>}</div><dl className="mt-4 space-y-3 text-sm">{[["Requester",ticket.requester.name],["Assignee",ticket.assignee?.name ?? "Unassigned"],["School",ticket.school_name || "Platform"],["Category",ticket.category],["Priority",ticket.priority],["Created",new Date(ticket.created_at).toLocaleString()]].map(([k,v]) => <div key={k}><dt className="text-xs text-gray-01">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}</dl></div>
        {canAssign && <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">Assignment</h2><select disabled={assignState.isLoading} value={ticket.assignee?.id ?? ""} onChange={async e => { await assign({ id, assignee_id:e.target.value || null }).unwrap(); toast.success("Assignment updated") }} className="mt-3 h-9 w-full rounded-md border bg-white px-3 text-sm"><option value="">Unassigned</option>{(members?.data ?? []).map(m => <option value={m.id} key={m.id}>{m.full_name}</option>)}</select></div>}
        {canManage && <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">Update status</h2><p className="mt-1 text-xs text-gray-01">Only valid workflow transitions are available.</p><div className="mt-4 grid gap-2">{transitions[ticket.status].map(status => <button disabled={transitionState.isLoading} onClick={async () => { await transition({ id, status }).unwrap(); toast.success("Ticket status updated") }} key={status} className="rounded-md border px-3 py-2 text-left text-sm hover:border-primary hover:text-primary">Move to {status.replace("_", " ").toLowerCase()}</button>)}</div></div>}
        {canAudit && <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-2 rounded-xl border bg-white p-4 text-sm font-medium shadow-sm"><History className="size-4 text-primary" />View audit history</button>}
      </aside>
    </div>
    {editing && <EditTicket ticket={ticket} busy={updateState.isLoading} close={() => setEditing(false)} save={async body => { await update({ id, body }).unwrap(); toast.success("Ticket updated"); setEditing(false) }} />}
    {showAudit && <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={() => setShowAudit(false)}><aside onMouseDown={e => e.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto bg-white p-6"><button onClick={() => setShowAudit(false)} className="text-sm text-gray-01">← Close</button><h2 className="mt-6 text-xl font-semibold">Audit history</h2><div className="mt-6 space-y-5">{audit.isLoading ? <Loader2 className="animate-spin" /> : audit.data?.data.map(a => <div className="border-l-2 border-primary/30 pl-4" key={a.id}><p className="text-sm font-semibold">{a.summary}</p><p className="text-xs text-gray-01">{a.actor?.name ?? "System"} · {new Date(a.created_at).toLocaleString()}</p></div>)}</div></aside></div>}
  </div></main></DashboardLayout>;
}

function EditTicket({ ticket, busy, close, save }: { ticket:{title:string;description:string;category:string;priority:string};busy:boolean;close:()=>void;save:(body:Record<string,unknown>)=>Promise<void> }) {
  const [form,setForm]=useState({title:ticket.title,description:ticket.description,category:ticket.category,priority:ticket.priority});
  return <div className="fixed inset-0 z-50 grid place-content-center bg-black/30 p-4"><form onSubmit={e => { e.preventDefault(); save(form) }} className="w-full max-w-xl rounded-xl bg-white p-6"><h2 className="text-xl font-semibold">Edit ticket</h2><div className="mt-5 space-y-4"><input className="h-9 w-full rounded-md border px-3 text-sm" value={form.title} onChange={e => setForm({...form,title:e.target.value})} /><Textarea rows={6} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /><div className="grid grid-cols-2 gap-3"><select className="h-9 rounded-md border px-3" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{["BUG","SUPPORT","HELP","ACCOUNT","BILLING","OTHER"].map(x=><option key={x}>{x}</option>)}</select><select className="h-9 rounded-md border px-3" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>{["LOW","MEDIUM","HIGH","URGENT"].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={close} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">{busy?"Saving…":"Save changes"}</button></div></form></div>;
}
