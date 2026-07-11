// Admin panels for the Notification administration page (./admin.tsx):
// delivery history, the effective settings matrix, template editing, and the
// event-type catalogue. Each panel maps to one communication.* key — the page
// decides which tabs to show.

import { useMemo, useState } from "react";
import { FileText, Loader2, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import CustomTable from "@/components/custom/custom-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useGetNotificationEventTypesQuery,
  useGetNotificationHistoryQuery,
  useGetNotificationSettingsQuery,
  useGetNotificationTemplatesQuery,
  usePreviewNotificationTemplateMutation,
  useUpdateNotificationSettingsMutation,
  useUpdateNotificationTemplateMutation,
  type NotificationEventType,
  type NotificationSetting,
  type NotificationTemplate,
} from "@/redux/services/notifications-api";

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
  const debouncedEmail = useDebounce(email, 400);
  const [createdAfter] = useState(() => new Date(Date.now() - 7 * 864e5).toISOString());

  // Filters combine. The backend refuses an unfiltered dump, so the last-7-days
  // window applies whenever no explicit filter is set.
  const params = useMemo<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    if (debouncedEmail) next.recipient_email = debouncedEmail;
    if (status) next.status = status;
    if (!debouncedEmail && !status) next.created_after = createdAfter;
    return next;
  }, [debouncedEmail, status, createdAfter]);

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
    <div className="space-y-5">
      {/* Filters float on the page background, house-style. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-[280px]">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-01" />
          <Input
            className="h-10 bg-white pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter recipient email"
          />
        </div>
        {/* NativeSelect's wrapper is w-full; size it from a parent div. */}
        <div className="w-full sm:w-60">
          <NativeSelect className="h-10" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses (last 7 days)</option>
            <option>PENDING</option>
            <option>SENT</option>
            <option>FAILED</option>
          </NativeSelect>
        </div>
      </div>

      <CustomTable
        tableHeaderList={["Recipient", "Event", "Channel", "Status", "Created"]}
        tableBodyList={tableData}
        loading={q.isLoading}
        emptyText="No deliveries match these filters."
        hidePagination
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
    <div className="divide-y divide-white-02 rounded-md bg-white">
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

export function TemplatesPanel() {
  const q = useGetNotificationTemplatesQuery();
  const [selected, setSelected] = useState<NotificationTemplate | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {q.isLoading ? (
        <Busy />
      ) : (
        (q.data?.data ?? []).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="rounded-md bg-white p-4 text-left hover:shadow-sm"
          >
            <div className="flex justify-between">
              <FileText className="size-5 text-primary" />
              <span className="rounded bg-white-05 px-2 py-1 font-mont text-xs uppercase">{t.channel}</span>
            </div>
            <p className="mt-4 font-mont font-semibold">{t.subject || "Untitled template"}</p>
            <p className="mt-1 text-xs text-gray-01">{t.event_type_key}</p>
          </button>
        ))
      )}
      {selected && <TemplateEditor value={selected} close={() => setSelected(null)} />}
    </div>
  );
}

function TemplateEditor({ value, close }: { value: NotificationTemplate; close: () => void }) {
  const [form, setForm] = useState(value);
  const [update, { isLoading }] = useUpdateNotificationTemplateMutation();
  const [preview, { data, isLoading: previewing }] = usePreviewNotificationTemplateMutation();

  const save = async () => {
    await update({
      id: value.id,
      body: { subject: form.subject, body: form.body, html_body: form.html_body, is_active: form.is_active },
    }).unwrap();
    toast.success("Template saved");
    close();
  };

  return (
    <Sheet open onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
        <SheetHeader className="p-0">
          <p className="text-xs text-gray-01">{value.event_type_key}</p>
          <SheetTitle>Edit notification template</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <label className="grid gap-1 text-sm font-medium">
            Subject
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Plain-text body
            <Textarea rows={9} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            HTML body
            <Textarea
              rows={7}
              className="font-mono text-xs"
              value={form.html_body}
              onChange={(e) => setForm({ ...form, html_body: e.target.value })}
            />
          </label>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => preview({ id: value.id, context: {} })}>
              {previewing ? "Rendering…" : "Preview"}
            </Button>
            <Button size="sm" className="ml-auto" onClick={save} disabled={isLoading}>
              <Save className="size-4" />
              Save
            </Button>
          </div>

          {data && (
            <div className="rounded-lg bg-white-05 p-4">
              <p className="font-semibold">{data.data.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.data.body}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Event-type catalogue ──────────────────────────────────────────────────────

export function EventsPanel() {
  const q = useGetNotificationEventTypesQuery();
  // Inactive event types are registered-but-not-yet-emitting — hide them so
  // the catalogue only documents notifications that can actually fire.
  const grouped = groupBy<NotificationEventType>(
    (q.data?.data ?? []).filter((x) => x.is_active),
    (x) => x.source_module,
  );

  if (q.isLoading) return <Busy />;

  return (
    <div className="divide-y divide-white-02 rounded-md bg-white">
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
