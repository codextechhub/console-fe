// Admin panels for the Notification administration page (./admin.tsx):
// delivery history, the effective settings matrix, template editing, and the
// event-type catalogue. Each panel maps to one communication.* key — the page
// decides which tabs to show.

import { useMemo, useState } from "react";
import { FileText, Loader2, Mail, Save, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

  return (
    <div>
      <div className="flex flex-wrap gap-3 border-b p-4">
        <div className="relative min-w-60 flex-1">
          <Mail className="absolute left-3 top-2.5 size-4 text-gray-01" />
          <Input
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter recipient email"
          />
        </div>
        <select
          className="h-9 rounded-md border bg-white px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses (last 7 days)</option>
          <option>PENDING</option>
          <option>SENT</option>
          <option>FAILED</option>
        </select>
      </div>

      {q.isLoading ? (
        <Busy />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white-05 text-left text-xs text-gray-01">
              <tr>
                <th className="p-3">Recipient</th>
                <th className="p-3">Event</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(q.data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    <p className="font-medium">{r.recipient_name}</p>
                    <p className="text-xs text-gray-01">{r.recipient_email}</p>
                  </td>
                  <td className="p-3">{r.event_type_label}</td>
                  <td className="p-3 capitalize">{r.channel.replace("_", "-")}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        r.status === "SENT"
                          ? "bg-green-50 text-green-700"
                          : r.status === "FAILED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-01">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!q.data?.data.length && <Empty text="No deliveries match these filters." />}
        </div>
      )}
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
    <div className="divide-y">
      {Object.entries(grouped).map(([module, rows]) => (
        <div key={module} className="p-5">
          <h3 className="font-semibold">{label(module)}</h3>
          <div className="mt-3 divide-y rounded-lg border">
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
                  <button
                    disabled={isLoading || locked}
                    title={
                      r.is_transactional
                        ? "Transactional events always dispatch"
                        : r.channel === "in_app"
                          ? "The in-app feed is always on"
                          : undefined
                    }
                    onClick={async () => {
                      await update({
                        updates: [
                          { event_type_key: r.event_type_key, channel: r.channel, is_enabled: !r.is_enabled },
                        ],
                      }).unwrap();
                      toast.success("Notification setting updated");
                    }}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition",
                      r.is_enabled ? "bg-primary" : "bg-gray-200",
                      "disabled:opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 size-4 rounded-full bg-white transition",
                        r.is_enabled ? "left-6" : "left-1",
                      )}
                    />
                  </button>
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
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
      {q.isLoading ? (
        <Busy />
      ) : (
        (q.data?.data ?? []).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="rounded-lg border p-4 text-left hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex justify-between">
              <FileText className="size-5 text-primary" />
              <span className="rounded bg-white-05 px-2 py-1 text-xs uppercase">{t.channel}</span>
            </div>
            <p className="mt-4 font-semibold">{t.subject || "Untitled template"}</p>
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-01">{value.event_type_key}</p>
            <h2 className="text-xl font-semibold">Edit notification template</h2>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </div>

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
            <button
              onClick={() => preview({ id: value.id, context: {} })}
              className="rounded-md border px-4 py-2 text-sm"
            >
              {previewing ? "Rendering…" : "Preview"}
            </button>
            <button
              onClick={save}
              disabled={isLoading}
              className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              <Save className="size-4" />
              Save
            </button>
          </div>

          {data && (
            <div className="rounded-lg bg-white-05 p-4">
              <p className="font-semibold">{data.data.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.data.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="divide-y">
      {Object.entries(grouped).map(([module, events]) => (
        <div className="p-5" key={module}>
          <h3 className="font-semibold">{label(module)}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-lg border p-4">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold">{e.label}</p>
                  {e.is_transactional && (
                    <span className="h-fit rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
                      Transactional
                    </span>
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

function Empty({ text }: { text: string }) {
  return (
    <div className="py-14 text-center text-sm text-gray-01">
      <Settings2 className="mx-auto mb-2 size-6" />
      {text}
    </div>
  );
}
