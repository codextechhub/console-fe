/**
 * Admin panels for the Notification administration page (./admin.tsx):
 * delivery history, the effective settings matrix, template editing, and the
 * event-type catalogue. Each panel maps to one communication.* key - the page
 * decides which tabs to show.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, Loader2, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import CustomTable from "@/components/custom/custom-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";
import { routesPath } from "@/routes/routes-path";
import {
  useGetNotificationEventTypesQuery,
  useGetNotificationHistoryQuery,
  useGetNotificationSettingsQuery,
  useGetNotificationTemplatesQuery,
  useUpdateNotificationSettingsMutation,
  type NotificationEventType,
  type NotificationSetting,
} from "@/redux/services/notifications-api";
import {
  historyParams,
  historyWindowStart,
  PLATFORM_SCOPE,
  type HistoryScope,
} from "./history-params";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

/** "vs_finance" → "Finance", "task_completed" → "Task Completed". */
const label = (s: string) =>
  s.replace(/^vs_/, "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const groupBy = <T,>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, T[]>>((out, item) => {
    (out[key(item)] ??= []).push(item);
    return out;
  }, {});

// ── Delivery history ──────────────────────────────────────────────────────────

export function HistoryPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState<HistoryScope>("");
  const [page, setPage] = useState(1);
  const debouncedEmail = useDebounce(email, 400);
  const [createdAfter] = useState(historyWindowStart);

  // Filters combine. The backend refuses an unfiltered dump, so the last-7-days
  // window applies whenever no explicit row filter is set - see
  // ./history-params, which also says why a scope on its own does not lift it.
  const params = useMemo(
    () => historyParams({ page, email: debouncedEmail, status, scope, createdAfter }),
    [page, debouncedEmail, status, scope, createdAfter],
  );

  const q = useGetNotificationHistoryQuery(params);

  const tableData = (q.data?.data ?? []).map((r) => ({
    recipient: (
      <div>
        <p className="text-sm font-medium text-black-01">{r.recipient_name}</p>
        <p className="text-xs text-gray-01">{r.recipient_email}</p>
      </div>
    ),
    event: <span className="text-sm">{r.event_type_label}</span>,
    channel: <span className="text-sm capitalize">{r.channel.replace("_", "-")}</span>,
    status: (
      <Badge
        variant={r.status === "SENT" ? "success" : r.status === "FAILED" ? "rejected" : "pending"}
        className="font-mont text-xs"
      >
        {r.status}
      </Badge>
    ),
    created: <span className="text-xs text-gray-01">{new Date(r.created_at).toLocaleString()}</span>,
  }));

  return (
    <div data-guide="notifications-admin.history" className="space-y-5">
      {/* Filters float on the page background, house-style. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-[280px]">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-01" />
          <Input
            className="h-10 bg-white pl-9"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPage(1);
            }}
            placeholder="Filter recipient email"
          />
        </div>
        {/* NativeSelect's wrapper is w-full; size it from a parent div. */}
        <div className="w-full sm:w-60">
          <NativeSelect
            className="h-10"
            aria-label="Delivery status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses (last 7 days)</option>
            <option>PENDING</option>
            <option>SENT</option>
            <option>FAILED</option>
          </NativeSelect>
        </div>
        {/* Platform is the only scope the backend narrows on, so this stays a
            two-state choice rather than implying a list of scopes. Neither
            option crosses a tenant: the log is scoped to the rows the caller's
            OWN tenant owns, and "platform" narrows inside that by tenant kind.
            The labels must not promise otherwise - a delivery addressed to
            CodeX staff about a school's ticket is CodeX's row, and the school's
            own rows are not in this table at all. */}
        <div className="w-full sm:w-60">
          <NativeSelect
            className="h-10"
            aria-label="Notification scope"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as HistoryScope);
              setPage(1);
            }}
          >
            <option value="">All deliveries</option>
            <option value={PLATFORM_SCOPE}>Platform-owned only</option>
          </NativeSelect>
        </div>
      </div>

      <CustomTable
        tableHeaderList={["Recipient", "Event", "Channel", "Status", "Created"]}
        tableBodyList={tableData}
        loading={q.isLoading}
        emptyText="No deliveries match these filters."
        totalPage={q.data?.pagination?.totalPages}
        currentPage={q.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
        hidePagination={(q.data?.pagination?.totalPages ?? 0) <= 1}
      />
    </div>
  );
}

// ── Settings matrix ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const q = useGetNotificationSettingsQuery();
  const [update, { isLoading }] = useUpdateNotificationSettingsMutation();
  const grouped = useMemo(
    () => groupBy<NotificationSetting>(q.data?.data ?? [], (x) => x.source_module),
    [q.data],
  );

  if (q.isLoading) return <Busy />;

  return (
    <div data-guide="notifications-admin.settings" className={cn(INFORMATION_CARD_SURFACE, "divide-y divide-white-02 rounded-md")}>
      {Object.entries(grouped).map(([module, rows]) => (
        <div key={module} className="p-5">
          <h3 className="font-mont font-semibold">{label(module)}</h3>
          <div className="mt-3 divide-y divide-white-02 rounded-lg border border-white-02">
            {rows.map((r) => {
              // In-app rows are always-on by product policy; transactional
              // events bypass settings entirely. Both are read-only here.
              const locked = r.is_transactional || r.channel === "in_app";
              return (
                <div key={`${r.event_type_key}:${r.channel}`} className="flex items-center gap-4 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.event_type_label}</p>
                    <p className="text-xs text-gray-01">
                      {r.channel === "in_app" ? "In-app feed" : "Email delivery"} · inherited from {r.source}
                    </p>
                  </div>
                  <span
                    title={
                      r.is_transactional
                        ? "Transactional events always dispatch"
                        : r.channel === "in_app"
                          ? "The in-app feed is always on"
                          : undefined
                    }
                  >
                    <Switch
                      disabled={isLoading || locked}
                      checked={r.is_enabled}
                      onCheckedChange={async (v) => {
                        await update({
                          updates: [
                            { event_type_key: r.event_type_key, channel: r.channel, is_enabled: v },
                          ],
                        }).unwrap();
                        toast.success("Notification setting updated");
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Templates ─────────────────────────────────────────────────────────────────

// The list is a directory; editing happens on its own full page, because a
// message, its markup and a live preview do not fit in a drawer.
export function TemplatesPanel() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim(), 400);
  const q = useGetNotificationTemplatesQuery(debounced ? { search: debounced } : {});
  const rows = q.data?.data ?? [];

  return (
    <div data-guide="notifications-admin.templates" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="h-10 w-full bg-white sm:max-w-[280px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates"
        />
        <Button variant="white" size="lg" asChild>
          <Link to={routesPath.PROTECTED.NOTIFICATION_TEMPLATE_NEW}>
            <Plus className="size-4" />
            New template
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {q.isLoading ? (
          <Busy />
        ) : !rows.length ? (
          <p className="py-10 text-sm text-gray-01">No templates match that search.</p>
        ) : (
          rows.map((t) => (
            <Link
              key={t.id}
              to={routesPath.PROTECTED.NOTIFICATION_TEMPLATE(t.id)}
              className="rounded-md bg-white p-4 text-left hover:shadow-sm"
            >
              <div className="flex justify-between">
                <FileText className="size-5 text-primary" />
                <span className="rounded bg-white-05 px-2 py-1 font-mont text-xs uppercase">
                  {t.channel === "email" ? "Email" : "In-app"}
                </span>
              </div>
              <p className="mt-4 font-mont font-semibold">
                {t.subject || t.event_type_label || "Untitled template"}
              </p>
              <p className="mt-1 text-xs text-gray-01">{t.event_type_key}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.channel === "email" && (
                  <Badge
                    variant={t.html_is_custom ? "rejected" : "success"}
                    className="text-[10px]"
                  >
                    {t.html_is_custom ? "Hand-edited design" : "Standard design"}
                  </Badge>
                )}
                {!t.is_active && (
                  <Badge variant="pending" className="text-[10px]">
                    Paused
                  </Badge>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ── Event-type catalogue ──────────────────────────────────────────────────────

export function EventsPanel() {
  const q = useGetNotificationEventTypesQuery();
  // Inactive event types are registered-but-not-yet-emitting - hide them so
  // the catalogue only documents notifications that can actually fire.
  const grouped = groupBy<NotificationEventType>(
    (q.data?.data ?? []).filter((x) => x.is_active),
    (x) => x.source_module,
  );

  if (q.isLoading) return <Busy />;

  return (
    <div data-guide="notifications-admin.events" className={cn(INFORMATION_CARD_SURFACE, "divide-y divide-white-02 rounded-md")}>
      {Object.entries(grouped).map(([module, events]) => (
        <div className="p-5" key={module}>
          <h3 className="font-mont font-semibold">{label(module)}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-lg border border-white-02 p-4">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold">{e.label}</p>
                  {e.is_transactional && (
                    <Badge variant="pending" className="h-fit text-[10px]">
                      Transactional
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-01">{e.description}</p>
                <p className="mt-3 text-[11px] text-gray-01">{e.supported_channels.map(label).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function Busy() {
  return (
    <div className="grid h-48 place-content-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
