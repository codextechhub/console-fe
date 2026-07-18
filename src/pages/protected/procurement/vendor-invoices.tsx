import { useEffect, useMemo, useState } from "react";
import { useActionParam } from "@/hooks/use-action-param";
import { formatDistanceToNowStrict } from "date-fns";
import {
  AlertTriangle, Check, ChevronRight, CircleDollarSign, Clock3, FilePenLine,
  FileText, History, List, Plus, Printer, RotateCcw, Search, Send, X,
} from "lucide-react";
import { toast } from "sonner";

import { ProcurementShell } from "./procurement-shell";
import { PurchaseOrderPicker, VendorPicker } from "./pickers";
import { useUserDirectory } from "../workflow/components/use-user-directory";
import { sameId } from "../workflow/components/workflow-format";
import {
  DataTable, DetailDrawer, EmptyState, ErrorState, FormField, InfoHint, LineEditor,
  LoadingState, PostingRecap, StatusPill, emptyLine, toApiLines, toArray,
  useActiveEntity, type Column, type DocLine,
} from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { useAppSelector } from "@/redux/store";
import {
  useCreateVendorInvoiceMutation, useGetPurchaseOrderQuery, useGetVendorInvoiceQuery,
  useGetVendorInvoiceSummaryQuery, useGetVendorInvoicesQuery,
  useMatchVendorInvoiceMutation, usePostVendorInvoiceMutation,
  useSubmitVendorInvoiceMutation, useUpdateVendorInvoiceMutation,
} from "@/redux/services/procurement/procurement-api";
import type { VendorInvoice } from "@/redux/services/procurement/procurement-types";
import {
  useGetWorkflowInstanceQuery, useRecordWorkflowActionMutation,
} from "@/redux/services/dashboard/workflow-api";
import type { VoteAction } from "@/redux/services/dashboard/workflow-types";
import { formatMoney } from "@/utils/money";
import { formatQuantity } from "@/utils/quantity";

const TABS = [
  ["All", ""], ["Draft", "DRAFT"], ["Under Review", "PENDING_APPROVAL"],
  ["Approved", "APPROVED"], ["Posted", "POSTED"], ["Overdue", "OVERDUE"],
  ["Disputed", "DISPUTED"], ["Partial", "PARTIAL"], ["Paid", "PAID"],
] as const;

const DETAIL_TABS = [
  ["overview", "Overview", FileText], ["lines", "Line Items", List],
  ["match", "3-Way Match", Check], ["payments", "Payment History", CircleDollarSign],
  ["activity", "Activity", History],
] as const;

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
function isForbidden(error: unknown) {
  return !!error && typeof error === "object" && "status" in error && error.status === 403;
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="font-mont text-[11px] text-gray-05">{label}</dt><dd className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{value || "—"}</dd></div>;
}
function OpenStat({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return <div className="min-w-0"><p className="font-mont text-[11px] text-gray-05">{label}</p><p className={cn("mt-0.5 font-mont text-sm font-semibold tabular-nums", highlight ? "text-primary" : "text-black-01")}>{value}</p></div>;
}
function EmptyPanel({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-gray-03 px-4 text-center font-mont text-xs text-gray-05">{children}</div>;
}

export default function VendorInvoicesPage() {
  const { code: entity, currency } = useActiveEntity();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  useActionParam("new", () => setCreating(true));
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  const params = useMemo(() => ({ entity: entity!, page, ...(status ? { display_status: status } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) }), [entity, page, status, debouncedSearch]);
  const { currentData: data, isLoading, isFetching, isError, error, refetch } = useGetVendorInvoicesQuery(params, { skip: !entity });
  const { data: summaryData, isLoading: summaryLoading } = useGetVendorInvoiceSummaryQuery({ entity: entity! }, { skip: !entity });
  const rows = toArray(data?.data);
  const summary = summaryData?.data;
  const money = (value: number) => formatMoney(value, currency);
  const columns: Column<VendorInvoice>[] = [
    { header: "Invoice #", cell: (invoice) => <div className="min-w-36"><p className="font-mont text-sm font-semibold text-primary">{invoice.document_number}</p><p className="mt-1 text-[11px] text-gray-05">{invoice.vendor_reference || "No vendor reference"}</p></div> },
    { header: "Vendor", cell: (invoice) => <div className="min-w-32"><p className="font-semibold">{invoice.vendor_name || invoice.vendor_code}</p><p className="mt-0.5 text-[11px] text-gray-05">{invoice.vendor_code}</p></div> },
    { header: "PO Ref", cell: (invoice) => invoice.purchase_order_number || "Direct" },
    { header: "Due Date", cell: (invoice) => shortDate(invoice.due_date) },
    { header: "Amount", align: "right", cell: (invoice) => <span className="tabular-nums">{money(invoice.total)}</span> },
    { header: "Paid", align: "right", cell: (invoice) => <span className="tabular-nums">{money(invoice.amount_paid)}</span> },
    { header: "Status", cell: (invoice) => <div className="flex flex-wrap gap-1"><StatusPill status={invoice.status} />{invoice.display_status !== invoice.status && <StatusPill status={invoice.display_status} />}</div> },
    { header: "", align: "right", cell: () => <ChevronRight className="ml-auto size-4 text-gray-04" /> },
  ];
  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" message="Choose an entity to view its vendor invoices." /></main></ProcurementShell>;
  return <ProcurementShell>
    <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-1.5"><h1 className="font-mont text-lg font-semibold text-gray-01">Vendor Invoices</h1><InfoHint>Supplier bills remain drafts until matched, approved, and posted to Accounts Payable.</InfoHint></div><p className="mt-0.5 font-mont text-xs text-gray-05">Review three-way matches, approval, settlement, and overdue exposure.</p></div><Can permission={P.PROC_CREATE_VENDOR_INVOICE}><Button onClick={() => setCreating(true)}><Plus className="size-4" /> Record Invoice</Button></Can></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading || !summary ? <div className="col-span-full rounded-md bg-white"><LoadingState rows={2} /></div> : <>
          <Kpi label="Under Review" value={summary.under_review.count} icon={Clock3} tone="amber" />
          <Kpi label="Approved" value={summary.approved.count} icon={Check} tone="green" />
          <Kpi label="Overdue" value={summary.overdue.count} sub={money(summary.overdue.amount)} icon={AlertTriangle} tone="red" />
          <Kpi label="Disputed" value={summary.disputed.count} icon={AlertTriangle} tone="red" />
        </>}
      </div>
      <section className="min-w-0 rounded-md bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-03 px-4">
          <div className="max-w-full overflow-x-auto"><div className="flex min-w-max gap-5">{TABS.map(([label, value]) => <button key={label} onClick={() => { setStatus(value); setPage(1); }} className={cn("border-b-2 py-3 font-mont text-xs font-medium whitespace-nowrap", status === value ? "border-primary text-primary" : "border-transparent text-gray-05")}>{label}</button>)}</div></div>
          <label className="relative my-2 min-w-0 flex-1 sm:max-w-64"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-05" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search invoices or vendors" className="h-9 bg-white pl-9" /></label>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(invoice) => invoice.id} loading={isLoading || isFetching} error={isError} forbidden={isForbidden(error)} onRetry={refetch} onRowClick={(invoice) => setSelectedId(invoice.id)} page={data?.pagination?.currentPage} totalPages={data?.pagination?.totalPages} onPageChange={setPage} emptyTitle={status ? `No ${TABS.find((tab) => tab[1] === status)?.[0].toLowerCase()} invoices` : "No vendor invoices yet"} emptyMessage={debouncedSearch ? "Try a different search term or status." : "Record a supplier bill to begin matching."} />
      </section>
    </main>
    <InvoiceDrawer key={selectedId ?? "closed"} id={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
    {creating && <InvoiceForm entity={entity} currency={currency} onClose={() => setCreating(false)} />}
  </ProcurementShell>;
}

function Kpi({ label, value, sub, icon: Icon, tone = "gray" }: { label: string; value: number; sub?: string; icon: React.ElementType; tone?: "gray" | "amber" | "green" | "red" }) {
  const tones = { gray: "bg-gray-100 text-gray-600", amber: "bg-amber-100 text-amber-700", green: "bg-emerald-100 text-emerald-700", red: "bg-red-100 text-red-600" };
  return <div className="rounded-md bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="font-mont text-xs font-medium text-gray-05">{label}</p><span className={cn("rounded-md p-2", tones[tone])}><Icon className="size-4" /></span></div><p className="mt-2 font-mont text-xl font-semibold tabular-nums">{value}</p><p className="mt-2 min-h-4 font-mont text-[11px] text-gray-05">{sub || "—"}</p></div>;
}

function InvoiceDrawer({ id, entity, currency, onClose }: { id: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const user = useAppSelector((state) => state.auth.user);
  const uid = user?.id == null ? "" : String(user.id);
  const { name } = useUserDirectory();
  const [tab, setTab] = useState("overview");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const { data, isLoading, isError, refetch } = useGetVendorInvoiceQuery({ id: id!, entity }, { skip: id == null });
  const invoice = data?.data;
  const workflowId = invoice?.workflow_instance_id || "";
  const { data: workflow } = useGetWorkflowInstanceQuery(workflowId, { skip: !workflowId });
  const [recordAction, { isLoading: voting }] = useRecordWorkflowActionMutation();
  const [runMatch, { isLoading: matching }] = useMatchVendorInvoiceMutation();
  const [submit, { isLoading: submitting }] = useSubmitVendorInvoiceMutation();
  const [post, { isLoading: posting }] = usePostVendorInvoiceMutation();
  const activeStage = useMemo(() => (workflow?.stage_instances || []).filter((stage) => stage.status === "ACTIVE").at(-1), [workflow]);
  const canVote = !!activeStage && workflow?.status === "IN_PROGRESS" && activeStage.eligible_approvers.some((approver) => sameId(approver.user, uid) && approver.attempt === activeStage.attempt) && !activeStage.actions.some((action) => sameId(action.actor, uid) && !action.reversed_at && !action.is_reversal_of && action.attempt === activeStage.attempt);
  const vote = async (action: VoteAction) => {
    if (!workflowId || ((action === "REJECTED" || action === "RETURNED") && !comment.trim())) return;
    try { await recordAction({ id: workflowId, action, comment: comment.trim() }).unwrap(); toast.success(action === "APPROVED" ? "Approval recorded." : action === "RETURNED" ? "Revision requested." : "Invoice rejected."); setComment(""); } catch { /* central */ }
  };
  const action = async (kind: "match" | "submit" | "post") => {
    if (!invoice) return;
    try {
      if (kind === "match") { await runMatch({ id: invoice.id, entity }).unwrap(); toast.success("Three-way match refreshed."); }
      if (kind === "submit") { await submit({ id: invoice.id, entity }).unwrap(); toast.success("Invoice submitted for approval."); }
      if (kind === "post") { await post({ id: invoice.id, entity }).unwrap(); toast.success("Vendor invoice posted to Accounts Payable."); }
    } catch { /* central */ }
  };
  const editable = invoice?.status === "DRAFT" && ["NOT_SUBMITTED", "REJECTED"].includes(invoice.approval_state);
  return <>
    <DetailDrawer open={id != null} onOpenChange={(open) => !open && onClose()} title={invoice?.document_number || "Vendor invoice"} description={invoice ? `${invoice.vendor_name || invoice.vendor_code} · ${invoice.purchase_order_number || "Direct invoice"} · due ${shortDate(invoice.due_date)}` : "Loading vendor invoice"} widthClass="sm:max-w-[720px]" footer={invoice && <>
      <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
      {editable && <Can permission={P.PROC_UPDATE_VENDOR_INVOICE}><Button variant="outline" onClick={() => setEditing(true)}><FilePenLine className="size-4" /> Edit</Button></Can>}
      {editable && <Can permission={P.PROC_MATCH_VENDOR_INVOICE}><Button variant="outline" loading={matching} onClick={() => action("match")}><Check className="size-4" /> Run Match</Button></Can>}
      {editable && <Can permission={P.PROC_SUBMIT_VENDOR_INVOICE}><Button loading={submitting} onClick={() => action("submit")}><Send className="size-4" /> Submit for Approval</Button></Can>}
      {invoice.status === "DRAFT" && invoice.approval_state === "APPROVED" && <Can permission={P.PROC_POST_VENDOR_INVOICE}><Button loading={posting} onClick={() => action("post")}><Send className="size-4" /> Post Invoice</Button></Can>}
    </>}>
      {isLoading ? <LoadingState rows={8} /> : isError || !invoice ? <ErrorState onRetry={refetch} /> : <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1.5"><StatusPill status={invoice.status} /><StatusPill status={invoice.approval_state} /><StatusPill status={invoice.match_status} /><StatusPill status={invoice.payment_status} />{invoice.is_overdue && <StatusPill status="OVERDUE" />}</div><p className="font-mont text-lg font-semibold tabular-nums">{formatMoney(invoice.total, currency)}</p></div>
        <div className="max-w-full overflow-x-auto border-b border-gray-03"><div className="flex min-w-max gap-5">{DETAIL_TABS.map(([value, label, Icon]) => <button key={value} onClick={() => setTab(value)} className={cn("flex items-center gap-1.5 border-b-2 py-2.5 font-mont text-xs font-medium whitespace-nowrap", tab === value ? "border-primary text-primary" : "border-transparent text-gray-05")}><Icon className="size-3.5" />{label}</button>)}</div></div>
        {tab === "overview" && <div className="space-y-5">
          {invoice.approval_state === "PENDING" && <section className="rounded-md border border-amber-200 bg-amber-50 p-4"><p className="font-mont text-sm font-semibold text-amber-900">{canVote ? "Your approval is required" : activeStage ? `Awaiting ${activeStage.stage_label}` : "Approval in progress"}</p>{canVote && <><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment (required for revision or rejection)" className="mt-3 min-h-20 bg-white" /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" loading={voting} onClick={() => vote("APPROVED")}><Check className="size-4" /> Approve</Button><Button size="sm" variant="outline" disabled={!comment.trim() || voting} onClick={() => vote("RETURNED")}><RotateCcw className="size-4" /> Request Revision</Button><Button size="sm" variant="outline-dest" disabled={!comment.trim() || voting} onClick={() => vote("REJECTED")}><X className="size-4" /> Reject</Button></div></>}</section>}
          <dl className="grid grid-cols-1 gap-4 rounded-md border border-gray-03 p-4 sm:grid-cols-2"><Field label="Vendor invoice #" value={invoice.vendor_reference} /><Field label="Internal invoice #" value={invoice.document_number} /><Field label="Vendor" value={invoice.vendor_name || invoice.vendor_code} /><Field label="PO reference" value={invoice.purchase_order_number || "Direct invoice"} /><Field label="Invoice date" value={shortDate(invoice.invoice_date)} /><Field label="Due date" value={shortDate(invoice.due_date)} /><Field label="Subtotal" value={formatMoney(invoice.subtotal, currency)} /><Field label="Tax" value={formatMoney(invoice.tax_total, currency)} /><Field label="Paid" value={formatMoney(invoice.amount_paid, currency)} /><Field label="Balance due" value={formatMoney(invoice.balance_due, currency)} /></dl>
          <InvoicePostingRecap invoice={invoice} currency={currency} />
        </div>}
        {tab === "lines" && (invoice.lines.length ? <div className="overflow-x-auto rounded-md border border-gray-03"><table className="min-w-[580px] w-full"><thead><tr>{["Description", "Qty", "Unit price", "Tax", "Total"].map((label) => <th key={label} className="bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01">{label}</th>)}</tr></thead><tbody>{invoice.lines.map((line) => <tr key={line.id}><td className="border-t border-gray-03 px-3 py-2 font-mont text-xs font-semibold">{line.description}</td><td className="border-t border-gray-03 px-3 py-2 font-mont text-xs tabular-nums">{formatQuantity(line.quantity)}</td><td className="border-t border-gray-03 px-3 py-2 font-mont text-xs tabular-nums">{formatMoney(line.unit_price, currency)}</td><td className="border-t border-gray-03 px-3 py-2 font-mont text-xs tabular-nums">{formatMoney(line.tax_amount, currency)}</td><td className="border-t border-gray-03 px-3 py-2 font-mont text-xs font-semibold tabular-nums">{formatMoney(line.net_amount + line.tax_amount, currency)}</td></tr>)}</tbody></table></div> : <EmptyPanel>No invoice lines were recorded.</EmptyPanel>)}
        {tab === "match" && <MatchPanel invoice={invoice} currency={currency} />}
        {tab === "payments" && (invoice.payments?.length ? <div className="space-y-2">{invoice.payments.map((payment) => <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-md border border-gray-03 p-3"><div><p className="font-mont text-sm font-semibold">{payment.document_number}</p><p className="mt-1 font-mont text-xs text-gray-05">{shortDate(payment.payment_date)} · {payment.status}</p></div><p className="font-mont text-sm font-semibold tabular-nums">{formatMoney(payment.amount, currency)}</p></div>)}</div> : <EmptyPanel>No payment has been allocated to this invoice.</EmptyPanel>)}
        {tab === "activity" && <ActivityPanel invoice={invoice} workflow={workflow} name={name} />}
      </div>}
    </DetailDrawer>
    {invoice && editing && <InvoiceForm entity={entity} currency={currency} initial={invoice} onClose={() => setEditing(false)} />}
  </>;
}

function InvoicePostingRecap({ invoice, currency }: { invoice: VendorInvoice; currency?: string | null }) {
  if (invoice.posting_lines?.length) return <PostingRecap title="Posted journal" currency={currency} dr={invoice.posting_lines.filter((line) => line.debit).map((line) => ({ code: line.account_code, name: line.account_name, amount: line.debit }))} cr={invoice.posting_lines.filter((line) => line.credit).map((line) => ({ code: line.account_code, name: line.account_name, amount: line.credit }))} helper="This is the actual posted journal." />;
  const dr = [{ code: invoice.purchase_order_id ? "GR/IR" : "Expense", name: invoice.purchase_order_id ? "Goods received / invoice received" : "Direct purchase expense", amount: invoice.subtotal }];
  if (invoice.tax_total) dr.push({ code: "Input VAT", name: "Recoverable input tax", amount: invoice.tax_total });
  return <PostingRecap title="Posting preview" currency={currency} dr={dr} cr={[{ code: "AP", name: "Accounts payable", amount: invoice.total }]} helper="Posting revalidates approval and the three-way match under row locks." />;
}

function MatchPanel({ invoice, currency }: { invoice: VendorInvoice; currency?: string | null }) {
  if (!invoice.purchase_order_id) return <EmptyPanel>This is a direct invoice, so there is no PO or goods receipt to match.</EmptyPanel>;
  return <div className="space-y-4"><div className={cn("rounded-md border p-4", ["UNDER_RECEIVED", "OVER_BILLED"].includes(invoice.match_status) ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50")}><p className="font-mont text-sm font-semibold">{invoice.match_status === "AUTO_MATCHED" ? "3-way match passed" : invoice.match_status.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 font-mont text-xs text-gray-05">Exact quantity and unit-price comparison; no tolerance policy is configured.</p></div>{invoice.match_comparisons?.map((row) => <div key={row.invoice_line_id} className="rounded-md border border-gray-03 p-4"><p className="font-mont text-sm font-semibold">{row.description}</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Field label="Ordered" value={formatQuantity(row.po_quantity)} /><Field label="Received" value={formatQuantity(row.received_quantity)} /><Field label="Previously invoiced" value={formatQuantity(row.previously_invoiced_quantity)} /><Field label="This invoice" value={formatQuantity(row.invoice_quantity)} /><Field label="PO price" value={row.po_unit_price == null ? "—" : formatMoney(row.po_unit_price, currency)} /><Field label="Invoice price" value={formatMoney(row.invoice_unit_price, currency)} /><Field label="Goods receipt" value={row.grn_number || "All posted receipts"} /><Field label="GR accepted" value={formatQuantity(row.grn_accepted_quantity)} /></div></div>)}</div>;
}

function ActivityPanel({ invoice, workflow, name }: { invoice: VendorInvoice; workflow: ReturnType<typeof useGetWorkflowInstanceQuery>["data"]; name: (id: string | number | null | undefined) => string }) {
  const workflowLogs = (workflow?.audit_logs || []) as Array<{ id: string; message: string; event_type: string; actor: string | number | null; occurred_at: string }>;
  if (!workflowLogs.length && !invoice.activity?.length) return <EmptyPanel>No approval or posting activity has been recorded yet.</EmptyPanel>;
  return <div className="divide-y divide-gray-03">{workflowLogs.map((log) => <div key={log.id} className="py-3 first:pt-0"><p className="font-mont text-sm font-medium">{log.message || log.event_type.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 font-mont text-xs text-gray-05">{log.actor ? name(log.actor) : "System"} · {formatDistanceToNowStrict(new Date(log.occurred_at), { addSuffix: true })}</p></div>)}{invoice.activity?.map((log) => <div key={`finance-${log.id}`} className="py-3"><p className="font-mont text-sm font-medium">{log.message || log.action.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 font-mont text-xs text-gray-05">{log.actor_name || "System"} · {formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: true })}</p></div>)}</div>;
}

type POLineDraft = { po_line: number; description: string; expense_account: string; quantity: number; unit_price: number };
function InvoiceForm({ entity, currency, initial, onClose }: { entity: string; currency?: string | null; initial?: VendorInvoice; onClose: () => void }) {
  const [mode, setMode] = useState<"po" | "direct">(initial ? (initial.purchase_order_id ? "po" : "direct") : "po");
  const [vendor, setVendor] = useState(initial?.vendor_code || "");
  const [po, setPo] = useState(initial?.purchase_order_id ? String(initial.purchase_order_id) : "");
  const [invoiceDate, setInvoiceDate] = useState(initial?.invoice_date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial?.due_date || "");
  const [reference, setReference] = useState(initial?.vendor_reference || "");
  const [narration, setNarration] = useState(initial?.narration || "");
  const [poLines, setPoLines] = useState<POLineDraft[]>(initial?.purchase_order_id ? initial.lines.map((line) => ({ po_line: line.po_line_id!, description: line.description, expense_account: line.expense_code, quantity: Number(line.quantity), unit_price: line.unit_price })) : []);
  const [directLines, setDirectLines] = useState<DocLine[]>(initial && !initial.purchase_order_id ? initial.lines.map((line) => ({ id: crypto.randomUUID(), description: line.description, quantity: Number(line.quantity), unitPriceKobo: line.unit_price, account: line.expense_code, taxCode: line.tax_code_id ? String(line.tax_code_id) : "", costCenter: "" })) : [emptyLine()]);
  const { data: poData } = useGetPurchaseOrderQuery({ id: Number(po), entity }, { skip: !po });
  const source = poData?.data;
  useEffect(() => {
    if (!source || initial?.purchase_order_id === source.id) return;
    setVendor(source.vendor_code);
    setPoLines(source.lines.filter((line) => Number(line.received_qty) - Number(line.invoiced_qty) > 0).map((line) => ({ po_line: line.id, description: line.description, expense_account: line.expense_code, quantity: Math.max(0, Number(line.received_qty) - Number(line.invoiced_qty)), unit_price: line.unit_price })));
  }, [source, initial?.purchase_order_id]);
  const [create, { isLoading: creating }] = useCreateVendorInvoiceMutation();
  const [update, { isLoading: updating }] = useUpdateVendorInvoiceMutation();
  const [submit, { isLoading: submitting }] = useSubmitVendorInvoiceMutation();
  const lines = mode === "po" ? poLines.map((line, index) => ({ ...line, line_no: index + 1 })) : toApiLines(directLines, "expense_account");
  const total = mode === "po" ? poLines.reduce((sum, line) => sum + Math.round(line.quantity * line.unit_price), 0) : directLines.reduce((sum, line) => sum + Math.round(Number(line.quantity || 0) * Number(line.unitPriceKobo || 0)), 0);
  const saving = creating || updating || submitting;
  const canSave = !!vendor && !!invoiceDate && !!reference.trim() && lines.length > 0 && (mode === "direct" || !!po) && total > 0;
  // Open-to-invoice position, straight off the PO's running received/invoiced
  // totals — so AP bills against one figure instead of hunting through receipts.
  const poLineById = source ? new Map(source.lines.map((l) => [l.id, l])) : null;
  const poPosition = source ? {
    received: source.lines.reduce((s, l) => s + Math.round(Number(l.received_qty) * l.unit_price), 0),
    invoiced: source.lines.reduce((s, l) => s + Math.round(Number(l.invoiced_qty) * l.unit_price), 0),
    open: source.lines.reduce((s, l) => s + Math.round(Math.max(0, Number(l.received_qty) - Number(l.invoiced_qty)) * l.unit_price), 0),
  } : null;
  const save = async (submitAfter: boolean) => {
    if (!canSave) return;
    const body = { vendor, purchase_order: mode === "po" ? Number(po) : null, invoice_date: invoiceDate, due_date: dueDate || undefined, vendor_reference: reference.trim(), narration: narration.trim(), lines };
    try {
      const result = initial ? await update({ id: initial.id, entity, ...body }).unwrap() : await create({ entity, ...body, purchase_order: body.purchase_order || undefined }).unwrap();
      if (submitAfter) await submit({ id: result.data.id, entity }).unwrap();
      toast.success(submitAfter ? "Vendor invoice created and submitted." : initial ? "Vendor invoice updated." : "Vendor invoice saved as draft.");
      onClose();
    } catch { /* central */ }
  };
  return <DetailDrawer open onOpenChange={(open) => !saving && !open && onClose()} title={initial ? "Edit Vendor Invoice" : "Record Invoice"} description={initial ? "Update this unsubmitted draft; its prior match will be cleared." : "Capture a supplier bill for matching and approval."} widthClass="sm:max-w-[720px]" footer={<><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button variant="outline" disabled={!canSave} loading={creating || updating} onClick={() => save(false)}>Save Draft</Button>{!initial && <Button disabled={!canSave} loading={saving} onClick={() => save(true)}>Create & Submit</Button>}</>}>
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-md bg-gray-100 p-1">{(["po", "direct"] as const).map((value) => <button key={value} onClick={() => { setMode(value); if (value === "direct") setPo(""); }} className={cn("rounded px-3 py-2 font-mont text-xs font-medium", mode === value ? "bg-white text-primary shadow-sm" : "text-gray-05")}>{value === "po" ? "PO-backed invoice" : "Direct invoice"}</button>)}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} disabled={mode === "po" && !!source} /></FormField>{mode === "po" && <FormField label="Purchase order" required><PurchaseOrderPicker entity={entity} value={po} onChange={setPo} placeholder="Select a received PO" /></FormField>}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><FormField label="Vendor invoice #" required><Input value={reference} onChange={(event) => setReference(event.target.value)} className="bg-white" /></FormField><FormField label="Invoice date" required><Input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="bg-white" /></FormField><FormField label="Due date"><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="bg-white" /></FormField></div>
      <FormField label="Narration"><Textarea value={narration} onChange={(event) => setNarration(event.target.value)} className="bg-white" /></FormField>
      {mode === "po" ? <div className="space-y-3">
        {poPosition && <div className="grid grid-cols-3 gap-2 rounded-md border border-primary/15 bg-primary/5 p-3">
          <OpenStat label="Received" value={formatMoney(poPosition.received, currency)} />
          <OpenStat label="Already invoiced" value={formatMoney(poPosition.invoiced, currency)} />
          <OpenStat label="Open to invoice" value={formatMoney(poPosition.open, currency)} highlight />
        </div>}
        <p className="font-mont text-xs font-semibold text-gray-05">Received quantities available to invoice</p>
        {poLines.length ? poLines.map((line, index) => {
          const src = poLineById?.get(line.po_line);
          const open = src ? Math.max(0, Number(src.received_qty) - Number(src.invoiced_qty)) : line.quantity;
          return <div key={line.po_line} className="grid grid-cols-1 gap-3 rounded-md border border-gray-03 p-3 sm:grid-cols-[minmax(0,1fr)_110px_150px]">
            <div className="min-w-0">
              <p className="font-mont text-sm font-semibold">{line.description}</p>
              <p className="mt-1 font-mont text-xs text-gray-05">{src && <>Received {formatQuantity(src.received_qty)} · Invoiced {formatQuantity(src.invoiced_qty)} · <span className="font-semibold text-primary">Open {formatQuantity(open)}</span> · </>}{formatMoney(line.unit_price, currency)} each</p>
            </div>
            <Input type="number" min="0" max={open || undefined} step="0.0001" value={line.quantity} onChange={(event) => setPoLines((rows) => rows.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row))} aria-label={`${line.description} quantity`} className="bg-white text-right tabular-nums" />
            <p className="self-center text-right font-mont text-sm font-semibold tabular-nums">{formatMoney(Math.round(line.quantity * line.unit_price), currency)}</p>
          </div>;
        }) : <EmptyPanel>Select a PO with posted, uninvoiced receipt quantities.</EmptyPanel>}
      </div> : <LineEditor entity={entity} lines={directLines} onChange={setDirectLines} accountLabel="Expense account" accountType="EXPENSE" currency={currency} showCostCenter={false} />}
      <PostingRecap title="Live posting preview" currency={currency} dr={[{ code: mode === "po" ? "GR/IR" : "Expense", name: mode === "po" ? "Goods received / invoice received" : "Direct purchase expense", amount: total }]} cr={[{ code: "AP", name: "Accounts payable", amount: total }]} helper="Tax, when selected on a direct line, is priced by the server and shown on the saved draft." />
    </div>
  </DetailDrawer>;
}
