import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, ChevronRight, Clock3, FilePenLine, FileText, Info, Mail, PackageCheck,
  Plus, Printer, ReceiptText, Search, Send, ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ProcurementShell } from "./procurement-shell";
import { RequisitionPicker, VendorPicker } from "./pickers";
import { useUserDirectory } from "../workflow/components/use-user-directory";
import {
  Can, DataTable, DetailDrawer, EmptyState, ErrorState,
  FormField, InfoHint, LoadingState, StatusPill, toArray, useActiveEntity, type Column,
} from "@/components/finance-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import {
  useCreatePurchaseOrderMutation, useGetPurchaseOrderQuery,
  useGetPurchaseOrderSummaryQuery, useGetRequisitionQuery,
  useGetPurchaseOrdersQuery, useSubmitPurchaseOrderMutation, useUpdatePurchaseOrderMutation,
} from "@/redux/services/procurement/procurement-api";
import type { PurchaseOrder } from "@/redux/services/procurement/procurement-types";
import { useGetWorkflowInstanceQuery } from "@/redux/services/dashboard/workflow-api";
import { formatMoney } from "@/utils/money";
import { formatQuantity } from "@/utils/quantity";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Partially Received", value: "PARTIAL" },
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
  { label: "Draft", value: "DRAFT" },
];

const DETAIL_TABS = [
  { value: "overview", label: "Overview", icon: Info },
  { value: "lines", label: "Line Items", icon: FileText },
  { value: "receipts", label: "Goods Receipts", icon: PackageCheck },
  { value: "invoices", label: "Invoices", icon: ReceiptText },
  { value: "approval", label: "Approval Trail", icon: CheckCircle2 },
] as const;

type DetailTab = typeof DETAIL_TABS[number]["value"];

function shortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function percent(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return `${Number.isFinite(number) ? Math.round(number) : 0}%`;
}

function POKpi({ label, value, sub, icon: Icon, tone = "primary" }: {
  label: string; value: React.ReactNode; sub: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "green" | "amber" | "gray";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-01/10 text-green-01",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-05",
  }[tone];
  return (
    <section className="flex min-w-0 items-start justify-between gap-3 rounded-md bg-white p-4">
      <div className="min-w-0">
        <p className="font-mont text-xs font-medium text-gray-05">{label}</p>
        <p className="mt-2 font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
        <p className="mt-1 min-h-4 font-mont text-[11px] text-gray-05">{sub}</p>
      </div>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", toneClass)}>
        <Icon className="size-4" />
      </span>
    </section>
  );
}

export default function PurchaseOrdersPage() {
  const { code: entity, currency } = useActiveEntity();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const normalized = search.trim();
    if (!normalized) {
      // Clearing search must drop the previous server filter immediately instead of retaining stale rows.
      setDebouncedSearch("");
      return;
    }
    const timer = window.setTimeout(() => setDebouncedSearch(normalized), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    entity: entity!, page, ...(status ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }), [entity, page, status, debouncedSearch]);
  const { currentData: data, isLoading, isFetching, isError, refetch } = useGetPurchaseOrdersQuery(
    params, { skip: !entity },
  );
  const { data: summaryData, isLoading: summaryLoading } = useGetPurchaseOrderSummaryQuery(
    { entity: entity! }, { skip: !entity },
  );
  const rows = toArray(data?.data);
  const summary = summaryData?.data;
  const pg = data?.pagination;
  const money = (value: number) => formatMoney(value, currency);

  const columns: Column<PurchaseOrder>[] = [
    {
      header: "PO Number",
      cell: (po) => <div className="min-w-32"><p className="font-mont text-sm font-semibold text-primary">{po.document_number}</p><p className="mt-1 max-w-56 truncate font-mont text-[11px] text-gray-05">{po.requisition_number || po.quotation_number || "Direct purchase order"}</p></div>,
    },
    { header: "Vendor", cell: (po) => <div className="min-w-36"><p className="font-mont text-sm font-semibold">{po.vendor_name || po.vendor_code}</p><p className="mt-0.5 font-mont text-[11px] text-gray-05">{po.vendor_code}</p></div> },
    { header: "Issue date", cell: (po) => shortDate(po.order_date) },
    { header: "Delivery", cell: (po) => shortDate(po.expected_date) },
    { header: "Total", align: "right", cell: (po) => <span className="tabular-nums">{money(po.total)}</span> },
    { header: "Received", cell: (po) => <span className="tabular-nums">{percent(po.received_pct)}</span> },
    { header: "Status", cell: (po) => <StatusPill status={po.display_status} /> },
    { header: "", align: "right", cell: () => <ChevronRight className="ml-auto size-4 text-gray-04" /> },
  ];

  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" message="Choose an entity to view its purchase orders." /></main></ProcurementShell>;

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5"><h1 className="font-mont text-lg font-semibold text-gray-01">Purchase Orders</h1><InfoHint>Approved orders issued to vendors. Receipt and invoice progress are calculated from the real linked documents.</InfoHint></div>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Track supplier commitments, delivery progress, and approval status.</p>
          </div>
          <Can permission={P.PROC_CREATE_PURCHASE_ORDER}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New Purchase Order</Button></Can>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryLoading || !summary ? <div className="col-span-full rounded-md bg-white"><LoadingState rows={2} /></div> : <>
            <POKpi label="Open POs" value={summary.open.count} sub={money(summary.open.amount)} icon={ShoppingCart} />
            <POKpi label="Partially Received" value={summary.partially_received.count} sub={summary.partially_received.count ? "Receipt work in progress" : "No partial receipts"} icon={PackageCheck} tone="amber" />
            <POKpi label="Awaiting Receipt" value={summary.awaiting_receipt.count} sub={summary.awaiting_receipt.count ? "No accepted quantity yet" : "All open orders have receipts"} icon={Clock3} tone="gray" />
            <POKpi label="PO Value (MTD)" value={money(summary.po_value_mtd.amount)} sub={summary.po_value_mtd.change_pct == null ? "No prior MTD comparison" : `${summary.po_value_mtd.change_pct >= 0 ? "+" : ""}${summary.po_value_mtd.change_pct}% vs prior MTD`} icon={FileText} tone="green" />
          </>}
        </div>

        <section className="min-w-0 rounded-md bg-white">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-03 px-4">
            <div className="max-w-full overflow-x-auto"><div className="flex min-w-max gap-5">
              {STATUS_TABS.map((tab) => <button key={tab.value || "all"} type="button" onClick={() => { setStatus(tab.value); setPage(1); }} className={cn("border-b-2 px-0.5 py-3 font-mont text-xs font-medium whitespace-nowrap", status === tab.value ? "border-primary text-primary" : "border-transparent text-gray-05 hover:text-black-01")}>{tab.label}</button>)}
            </div></div>
            <div className="flex w-full items-center py-2 sm:ml-auto sm:w-auto"><label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-05" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search purchase orders" className="h-9 bg-white pl-9" /></label></div>
          </div>
          <DataTable columns={columns} rows={rows} rowKey={(po) => po.id} loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(po) => setSelectedId(po.id)} page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} emptyTitle={status ? `No ${STATUS_TABS.find((tab) => tab.value === status)?.label.toLowerCase()} purchase orders` : "No purchase orders yet"} emptyMessage={debouncedSearch ? "Try a different search term or status." : "Create an order from an approved requisition to begin."} />
        </section>
      </main>

      <PurchaseOrderDrawer key={selectedId ?? "closed"} id={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      {creating && <CreatePurchaseOrderDrawer open entity={entity} currency={currency} onClose={() => setCreating(false)} />}
    </ProcurementShell>
  );
}

function PurchaseOrderDrawer({ id, entity, currency, onClose }: { id: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { name } = useUserDirectory();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [editing, setEditing] = useState(false);
  const { data, isLoading, isError, refetch } = useGetPurchaseOrderQuery({ id: id!, entity }, { skip: id == null });
  const po = data?.data;
  const workflowId = po?.workflow_instance_id ?? "";
  const { data: workflow } = useGetWorkflowInstanceQuery(workflowId, { skip: !workflowId });
  const [submit, { isLoading: submitting }] = useSubmitPurchaseOrderMutation();
  const money = (value: number) => formatMoney(value, currency);
  const approvalPending = po?.status === "PENDING_APPROVAL" || po?.approval_state === "PENDING";
  const draftEditable = po?.status === "DRAFT" && !approvalPending;

  const submitForApproval = async () => {
    if (!po) return;
    try {
      await submit({ id: po.id, entity }).unwrap();
      toast.success("Purchase order submitted for approval.");
      // The mutation invalidates ProcPurchaseOrders, so this drawer, the list and
      // the summary all refetch automatically — no manual refetch needed.
    } catch { /* Central API handling presents the server validation message. */ }
  };
  const openRoute = (route: string) => { onClose(); navigate(route); };

  return <DetailDrawer open={id != null} onOpenChange={(open) => !open && onClose()} widthClass="sm:max-w-[720px]" title={po?.document_number || "Purchase order"} description={po ? `${po.vendor_name || po.vendor_code} · ${shortDate(po.order_date)}` : "Loading purchase order"} footer={po && <>
    <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
    <span title="Email delivery is not connected yet."><Button variant="outline" disabled><Mail className="size-4" /> Email vendor</Button></span>
    {draftEditable && <Can permission={P.PROC_UPDATE_PURCHASE_ORDER}><Button variant="outline" onClick={() => setEditing(true)}><FilePenLine className="size-4" /> Edit</Button></Can>}
    {approvalPending && <span className="font-mont text-xs text-gray-05">Locked while approval is pending</span>}
    {draftEditable && <Can permission={P.PROC_SUBMIT_PURCHASE_ORDER}><Button loading={submitting} onClick={submitForApproval}><Send className="size-4" /> Submit for Approval</Button></Can>}
  </>}>
    {isLoading ? <LoadingState rows={7} /> : isError || !po ? <ErrorState onRetry={refetch} /> : <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><StatusPill status={po.display_status} /><p className="font-mont text-lg font-semibold tabular-nums text-black-01">{money(po.total)}</p></div>
      <div className="max-w-full overflow-x-auto border-b border-gray-03"><div className="flex min-w-max gap-5">{DETAIL_TABS.map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={() => setTab(value)} className={cn("flex items-center gap-1.5 border-b-2 py-2.5 font-mont text-xs font-medium whitespace-nowrap", tab === value ? "border-primary text-primary" : "border-transparent text-gray-05")}><Icon className="size-3.5" />{label}</button>)}</div></div>

      {tab === "overview" && <div className="space-y-5">
        <dl className="grid grid-cols-1 gap-4 rounded-md border border-gray-03 p-4 sm:grid-cols-2"><Field label="Vendor" value={po.vendor_name || po.vendor_code} /><Field label="Order date" value={shortDate(po.order_date)} /><Field label="Expected delivery" value={shortDate(po.expected_date)} /><Field label="Payment terms" value={po.payment_terms || "Not specified"} /><Field label="Delivery address" value={po.delivery_address || "Not specified"} /><Field label="Invoice progress" value={percent(po.invoiced_pct)} /></dl>
        <section className="rounded-md border border-gray-03 p-4"><p className="font-mont text-sm font-semibold">Document Flow</p><div className="mt-3 grid gap-2 sm:grid-cols-2">
          <DocumentLink label="Source requisition" value={po.requisition_number || "Not linked"} disabled={!po.requisition_id} onClick={() => openRoute(routesPath.PROTECTED.PROCUREMENT.REQUISITIONS)} />
          <DocumentLink label="Awarded quotation" value={po.quotation_number || "Not linked"} disabled={!po.quotation_number} onClick={() => openRoute(`${routesPath.PROTECTED.PROCUREMENT.SOURCING}/quotations`)} />
          <DocumentLink label="Goods receipts" value={`${po.receipt_documents.length} linked`} onClick={() => setTab("receipts")} />
          <DocumentLink label="Vendor invoices" value={`${po.invoice_documents.length} linked`} onClick={() => setTab("invoices")} />
        </div></section>
        {po.narration && <section><p className="font-mont text-xs font-semibold text-gray-05">Narration</p><p className="mt-2 font-mont text-sm leading-6 text-black-01">{po.narration}</p></section>}
      </div>}

      {tab === "lines" && (po.lines.length ? <div className="overflow-x-auto rounded-md border border-gray-03"><div className="grid min-w-[460px] grid-cols-[minmax(200px,1fr)_110px_150px] font-mont text-xs">
        <div className="contents bg-[#F1F1F1] font-semibold text-gray-01">
          <span className="bg-[#F1F1F1] px-3 py-2 text-[11px]">Item</span>
          <span className="bg-[#F1F1F1] px-3 py-2 text-right text-[11px]">Received</span>
          <span className="bg-[#F1F1F1] px-3 py-2 text-right text-[11px]">Total</span>
        </div>
        {po.lines.map((line) => <div key={line.id} className="contents">
          <div className="min-w-0 border-t border-gray-03 px-3 py-3"><p className="truncate font-semibold text-black-01">{line.description}</p><p className="mt-1 text-gray-05">{formatQuantity(line.quantity)} × {money(line.unit_price)}</p></div>
          <div className="border-t border-gray-03 px-3 py-3 text-right tabular-nums text-gray-05">{formatQuantity(line.received_qty)} / {formatQuantity(line.quantity)}</div>
          <div className="border-t border-gray-03 px-3 py-3 text-right font-semibold tabular-nums">{money(line.net_amount + line.tax_amount)}</div>
        </div>)}
      </div></div> : <EmptyBlock text="No line items were added." />)}
      {tab === "receipts" && (po.receipt_documents.length ? <div className="overflow-hidden rounded-md border border-gray-03"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-[#F1F1F1] px-3 py-2 font-mont text-[11px] font-semibold text-gray-01"><span>Receipt</span><span>Date</span><span>Status</span></div>{po.receipt_documents.map((receipt) => <button type="button" key={receipt.id} onClick={() => openRoute(routesPath.PROTECTED.PROCUREMENT.GOODS_RECEIPTS)} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-gray-03 px-3 py-3 text-left font-mont text-xs hover:bg-gray-50"><span className="font-semibold text-primary">{receipt.document_number}<span className="ml-2 font-normal text-gray-05">{receipt.item_count} item{receipt.item_count === 1 ? "" : "s"}</span></span><span>{shortDate(receipt.received_date)}</span><StatusPill status={receipt.status} /></button>)}</div> : <EmptyBlock text="No goods receipts have been posted against this purchase order." />)}
      {tab === "invoices" && (po.invoice_documents.length ? <div className="overflow-hidden rounded-md border border-gray-03"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-[#F1F1F1] px-3 py-2 font-mont text-[11px] font-semibold text-gray-01"><span>Invoice</span><span>Amount</span><span>Status</span></div>{po.invoice_documents.map((invoice) => <button type="button" key={invoice.id} onClick={() => openRoute(routesPath.PROTECTED.PROCUREMENT.VENDOR_INVOICES)} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-gray-03 px-3 py-3 text-left font-mont text-xs hover:bg-gray-50"><span className="font-semibold text-primary">{invoice.document_number}<span className="ml-2 font-normal text-gray-05">{shortDate(invoice.invoice_date)}</span></span><span className="font-semibold tabular-nums">{money(invoice.total)}</span><StatusPill status={invoice.status} /></button>)}</div> : <EmptyBlock text="No vendor invoices are linked to this purchase order." />)}
      {tab === "approval" && (workflow?.stage_instances.length ? <div className="space-y-3">{workflow.stage_instances.map((stage) => <section key={stage.id} className="rounded-md border border-gray-03 p-3"><div className="flex items-center justify-between gap-3"><p className="font-mont text-sm font-semibold">{stage.stage_label}</p><StatusPill status={stage.status} /></div>{stage.actions.length ? <div className="mt-3 space-y-2">{stage.actions.filter((action) => !action.is_reversal_of).map((action) => <div key={action.id} className="border-t border-gray-03 pt-2 font-mont text-xs"><p><span className="font-semibold">{name(action.actor)}</span> · {action.action.toLowerCase()}</p><p className="mt-0.5 text-gray-05">{action.comment || "No comment"}</p></div>)}</div> : <p className="mt-2 font-mont text-xs text-gray-05">No decision recorded for this stage.</p>}</section>)}</div> : <EmptyBlock text={po.status === "DRAFT" ? "Submit this draft to begin its approval trail." : "No approval trail is available."} />)}
    </div>}
    {po && editing && <EditPurchaseOrderDrawer po={po} entity={entity} currency={currency} onClose={() => setEditing(false)} />}
  </DetailDrawer>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mont text-xs text-gray-05">{label}</dt><dd className="mt-1 font-mont text-sm font-semibold text-black-01">{value}</dd></div>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-gray-03 px-4 text-center font-mont text-xs text-gray-05">{text}</div>;
}

function DocumentLink({ label, value, disabled, onClick }: { label: string; value: string; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-gray-03 px-3 py-2 text-left enabled:hover:bg-gray-50 disabled:cursor-default disabled:opacity-60"><span className="min-w-0"><span className="block font-mont text-[11px] text-gray-05">{label}</span><span className="mt-1 block truncate font-mont text-sm font-semibold text-black-01">{value}</span></span>{!disabled && <ChevronRight className="size-4 shrink-0 text-gray-04" />}</button>;
}

function EditPurchaseOrderDrawer({ po, entity, currency, onClose }: { po: PurchaseOrder; entity: string; currency?: string | null; onClose: () => void }) {
  const [vendor, setVendor] = useState(po.vendor_code);
  const [orderDate, setOrderDate] = useState(po.order_date);
  const [expectedDate, setExpectedDate] = useState(po.expected_date || "");
  const [deliveryAddress, setDeliveryAddress] = useState(po.delivery_address || "");
  const [paymentTerms, setPaymentTerms] = useState(po.payment_terms || "");
  const [update, { isLoading }] = useUpdatePurchaseOrderMutation();
  const canSave = !!vendor && !!orderDate;

  const save = async () => {
    if (!canSave) return;
    try {
      await update({ id: po.id, entity, vendor, order_date: orderDate, expected_date: expectedDate, delivery_address: deliveryAddress.trim(), payment_terms: paymentTerms.trim() }).unwrap();
      toast.success("Purchase order draft updated.");
      onClose();
    } catch { /* Central API handling presents the server validation message. */ }
  };

  return <DetailDrawer open onOpenChange={(open) => !isLoading && !open && onClose()} title={`Edit ${po.document_number}`} description="Update this draft purchase order" widthClass="sm:max-w-[720px]" footer={<><Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button><Button disabled={!canSave} loading={isLoading} onClick={save}>Save Changes</Button></>}>
    <div className="space-y-5">
      <section className="space-y-3"><p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Order</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><FormField label="Source requisition"><Input value={po.requisition_number || "Not linked"} disabled /></FormField><FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} purchaseEligible /></FormField><FormField label="Order date" required><Input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} /></FormField><FormField label="Expected delivery"><Input type="date" min={orderDate} value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} /></FormField><FormField label="Payment terms"><Input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} /></FormField><FormField label="Delivery address"><Textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="min-h-20" /></FormField></div></section>
      <section className="rounded-md border border-gray-03 bg-gray-50 p-4"><p className="font-mont text-sm font-semibold">Copied Line Items</p><p className="mt-1 font-mont text-xs text-gray-05">These remain the approved requisition snapshot.</p><div className="mt-3 space-y-2">{po.lines.map((line) => <div key={line.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 font-mont text-xs"><span className="min-w-0 truncate">{line.description}<span className="ml-2 text-gray-05">×{formatQuantity(line.quantity)}</span></span><span className="shrink-0 font-semibold tabular-nums">{formatMoney(line.net_amount + line.tax_amount, currency)}</span></div>)}</div></section>
    </div>
  </DetailDrawer>;
}

function CreatePurchaseOrderDrawer({ open, entity, currency, onClose }: { open: boolean; entity: string; currency?: string | null; onClose: () => void }) {
  const [requisition, setRequisition] = useState("");
  const [vendor, setVendor] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const { data: requisitionData, isLoading: requisitionLoading } = useGetRequisitionQuery({ id: Number(requisition), entity }, { skip: !requisition });
  const [create, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  const [submit, { isLoading: submitting }] = useSubmitPurchaseOrderMutation();
  const source = requisitionData?.data;
  const money = (value: number) => formatMoney(value, currency);
  const canSubmit = !!requisition && !!vendor && !!orderDate;

  const saving = creating || submitting;
  const save = async (submitAfter: boolean) => {
    if (!canSubmit) return;
    try {
      const response = await create({ entity, requisition: Number(requisition), vendor, order_date: orderDate, expected_date: expectedDate || undefined, delivery_address: deliveryAddress.trim() || undefined, payment_terms: paymentTerms.trim() || undefined }).unwrap();
      if (submitAfter) await submit({ id: response.data.id, entity }).unwrap();
      toast.success(submitAfter ? "Purchase order created and submitted." : "Purchase order draft created.");
      onClose();
    } catch { /* Central API handling presents the server validation message. */ }
  };

  return <DetailDrawer open={open} onOpenChange={(value) => !saving && !value && onClose()} title="New Purchase Order" description="Create an order from an approved requisition" widthClass="sm:max-w-[720px]" footer={<><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button variant="outline" disabled={!canSubmit} loading={creating} onClick={() => save(false)}>Save Draft</Button><Can permission={P.PROC_SUBMIT_PURCHASE_ORDER}><Button disabled={!canSubmit} loading={saving} onClick={() => save(true)}>Create & Submit</Button></Can></>}>
    <div className="space-y-5">
    <section className="space-y-3"><p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Order</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><FormField label="Approved requisition" required><RequisitionPicker entity={entity} value={requisition} onChange={setRequisition} status="APPROVED" placeholder="Select approved requisition" /></FormField><FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} purchaseEligible /></FormField><FormField label="Order date" required><Input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} /></FormField><FormField label="Expected delivery"><Input type="date" min={orderDate} value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} /></FormField><FormField label="Payment terms"><Input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} placeholder="Defaults from vendor" /></FormField><FormField label="Delivery address"><Textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Where should the vendor deliver?" className="min-h-20" /></FormField></div></section>
    <section className="rounded-md border border-gray-03 bg-gray-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mont text-sm font-semibold">Copied Line Items</p>{source && <p className="font-mont text-sm font-semibold tabular-nums">{money(source.estimated_total)}</p>}</div>{!requisition ? <p className="mt-2 font-mont text-xs text-gray-05">Choose an approved requisition to review the lines that will be copied.</p> : requisitionLoading ? <p className="mt-2 font-mont text-xs text-gray-05">Loading requisition lines…</p> : source?.lines.length ? <div className="mt-3 space-y-2">{source.lines.map((line) => <div key={line.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 font-mont text-xs"><span className="min-w-0 truncate">{line.description}<span className="ml-2 text-gray-05">×{formatQuantity(line.quantity)}</span></span><span className="shrink-0 font-semibold tabular-nums">{money(line.estimated_line_total)}</span></div>)}</div> : <p className="mt-2 font-mont text-xs text-gray-05">This requisition has no available lines.</p>}</section>
    </div>
  </DetailDrawer>;
}
