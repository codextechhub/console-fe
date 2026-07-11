// Support centre — ticket dashboard KPIs, filterable list and create modal
// over /support/. Anyone authenticated may file a ticket; staff-side actions
// live on the detail page. Built on the house kit: KpiCard, CustomTable
// (phone cards + pagination), Dialog, Badge.

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import KpiCard from "@/components/custom/kpi-card";
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
import { Textarea } from "@/components/ui/textarea";
import { routesPath } from "@/routes/routes-path";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { TicketStatusBadge } from "./status-badge";
import {
  useCreateTicketMutation,
  useGetTicketDashboardQuery,
  useGetTicketsQuery,
  type Ticket,
  type TicketPriority,
} from "@/redux/services/tickets-api";

const TABLE_HEADERS = ["Ticket", "Requester", "Category", "Priority", "Status", "Assignee", "Updated"];

export default function Support() {
  const nav = useNavigate();
  const dash = useGetTicketDashboardQuery();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

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
    <DashboardLayout title="Support">
      <main className="px-4.5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-mont text-2xl font-semibold text-black-01">Support centre</h1>
              <p className="mt-1 text-sm text-gray-01">
                Track requests, collaborate with support and resolve issues faster.
              </p>
            </div>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Create ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total tickets" value={d?.total ?? "—"} />
            <KpiCard label="Open" value={d?.by_status.OPEN ?? "—"} />
            <KpiCard label="In progress" value={d?.by_status.IN_PROGRESS ?? "—"} />
            <KpiCard
              label="Urgent"
              value={d?.by_priority.URGENT ?? "—"}
              tone={d?.by_priority.URGENT ? "alert" : "default"}
            />
            <KpiCard label="Assigned to me" value={d?.assigned_to_me ?? "—"} />
            <KpiCard label="Resolved" value={d?.by_status.RESOLVED ?? "—"} />
          </div>

          <section className="rounded-md bg-white">
            <div className="flex flex-col gap-3 border-b border-white-02 p-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-01" />
                <Input
                  className="pl-9"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search number, title or description"
                />
              </div>
              {/* NativeSelect's wrapper is w-full; size it from a parent div. */}
              <div className="md:w-48">
                <NativeSelect
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
          </section>
        </div>

        {/* Mounted per-open so the form starts fresh each time. */}
        {creating && (
          <CreateTicket
            open
            close={() => setCreating(false)}
            done={(id) => nav(routesPath.PROTECTED.SUPPORT.DETAIL(id))}
          />
        )}
      </main>
    </DashboardLayout>
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
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "SUPPORT",
    priority: "MEDIUM" as TicketPriority,
  });
  const [create, { isLoading }] = useCreateTicketMutation();
  const canSubmit = form.title.trim() && form.description.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await create(form).unwrap();
    done(r.data.id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create support ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-gray-01">Tell the support team what you need help with.</p>
          <label className="grid gap-1 text-sm font-medium">
            Title
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Description
            <Textarea
              required
              rows={7}
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
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
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
            <Button type="submit" size="sm" disabled={isLoading || !canSubmit}>
              {isLoading ? "Creating…" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
