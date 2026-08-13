// Support centre - ticket dashboard KPIs, filterable list and create modal
// over /support/. Anyone authenticated may file a ticket; staff-side actions
// live on the detail page. Built on the house kit: KpiCard, CustomTable
// (phone cards + pagination), Dialog, Badge.

import { useState } from "react";
import { BookOpenText, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import KpiCard from "@/components/custom/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { routesPath } from "@/routes/routes-path";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useFilterParam } from "@/hooks/use-filter-param";
import { TicketStatusBadge } from "./status-badge";
import {
  CreateTicketForm,
  EMPTY_TICKET_DRAFT,
  type TicketDraft,
} from "@/components/support-ticket-composer";
import {
  useGetTicketDashboardQuery,
  useGetTicketsQuery,
  type Ticket,
} from "@/redux/services/tickets-api";

const TABLE_HEADERS = ["Ticket", "Requester", "Category", "Priority", "Status", "Assignee", "Updated"];

export default function Support() {
  const nav = useNavigate();
  const dash = useGetTicketDashboardQuery();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  // Dashboard deep-link: the tickets card lands here as ?status=OPEN.
  useFilterParam("status", ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const, setStatus);
  // /support/tickets/new is this same page with the composer open on arrival -
  // a deep-linkable "new ticket" URL (also reachable via the page button).
  const isNewRoute = useLocation().pathname === routesPath.PROTECTED.SUPPORT.NEW;
  const [creating, setCreating] = useState(isNewRoute);
  const closeCreate = () => {
    setCreating(false);
    // Leaving the composer must also leave the /new URL, or refresh would reopen it.
    if (isNewRoute) nav(routesPath.PROTECTED.SUPPORT.TICKETS, { replace: true });
  };

  const debouncedQ = useDebounce(q, 400);
  const list = useGetTicketsQuery({ page, q: debouncedQ, ...(status ? { status } : {}) });

  const d = dash.data?.data;
  const tableData = (list.data?.data ?? []).map((t) => ({
    ticket: (
      <div>
        <p className="text-sm font-medium text-black-01">{t.title}</p>
        <p className="text-xs text-gray-01">{t.ticket_number}</p>
      </div>
    ),
    requester: <span className="text-sm">{t.requester.name}</span>,
    category: <span className="text-sm capitalize">{t.category.toLowerCase()}</span>,
    priority: (
      <span
        className={cn(
          "text-sm font-medium",
          t.priority === "URGENT" && "text-destructive",
          t.priority === "HIGH" && "text-yellow-01",
        )}
      >
        {t.priority}
      </span>
    ),
    status: <TicketStatusBadge status={t.status} />,
    assignee: <span className="text-sm">{t.assignee?.name ?? "Unassigned"}</span>,
    updated: <span className="text-xs text-gray-01">{new Date(t.updated_at).toLocaleDateString()}</span>,
    _raw: t,
  }));

  return (
    <>
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        {/* Intro row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">Support Centre</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Track requests, collaborate with support and resolve issues faster.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button asChild size="lg" variant="outline" className="flex-1 sm:flex-none">
              <Link to={routesPath.PROTECTED.SUPPORT.GUIDES}><BookOpenText /> How-to guides</Link>
            </Button>
            <Button size="lg" onClick={() => setCreating(true)} className="flex-1 sm:flex-none">
              <Plus /> Create Ticket
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total tickets" value={d?.total ?? "-"} />
          <KpiCard label="Open" value={d?.by_status.OPEN ?? "-"} />
          <KpiCard label="In progress" value={d?.by_status.IN_PROGRESS ?? "-"} />
          <KpiCard
            label="Urgent"
            value={d?.by_priority.URGENT ?? "-"}
            tone={d?.by_priority.URGENT ? "alert" : "default"}
          />
          <KpiCard label="Assigned to me" value={d?.assigned_to_me ?? "-"} />
          <KpiCard label="Resolved" value={d?.by_status.RESOLVED ?? "-"} />
        </div>

        {/* Filters float on the page background, house-style. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CustomInput
            id="tickets-search"
            canSearch
            placeholder="Search number, title or description"
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          {/* NativeSelect's wrapper is w-full; size it from a parent div. */}
          <div className="w-full sm:w-48">
            <NativeSelect
              className="h-10"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData}
          loading={list.isLoading}
          emptyText="No tickets match these filters."
          onRowClick={(row) =>
            nav(routesPath.PROTECTED.SUPPORT.DETAIL((row as { _raw: Ticket })._raw.id))
          }
          totalPage={list.data?.pagination.totalPages}
          currentPage={list.data?.pagination.currentPage}
          onPageChange={(p) => setPage(p as number)}
          hidePagination={(list.data?.pagination.totalPages ?? 0) <= 1}
        />

        {/* Mounted per-open so the form starts fresh each time. */}
        {creating && (
          <CreateTicket
            open
            close={closeCreate}
            done={(id) => nav(routesPath.PROTECTED.SUPPORT.DETAIL(id))}
          />
        )}
      </main>
    </>
  );
}

function CreateTicket({
  open,
  close,
  done,
}: {
  open: boolean;
  close: () => void;
  done: (id: string) => void;
}) {
  const [draft, setDraft] = useState<TicketDraft>(EMPTY_TICKET_DRAFT);
  const [files, setFiles] = useState<File[]>([]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create support ticket</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-01">Tell the support team what you need help with.</p>
        <CreateTicketForm
          draft={draft}
          setDraft={setDraft}
          files={files}
          setFiles={setFiles}
          onCancel={close}
          onCreated={(ticket, failedFiles) => {
            if (failedFiles.length) {
              toast.warning(`Ticket created, but ${failedFiles.length} attachment${failedFiles.length === 1 ? "" : "s"} failed to upload.`);
            }
            done(ticket.id);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
