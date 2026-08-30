// Full-page notification template editor.
//
// Two panes: what the message says on the left, what the recipient will see on
// the right. The preview is not a button you press - it re-renders from the
// unsaved draft as you type, through the backend's own render path, so it is
// the email itself rather than an impression of it.
//
// The long fields (message text, email HTML) stay COLLAPSED. Most visits are to
// read a template or change one line, and two big code boxes make that harder,
// not easier. Each one opens in place, or full-screen for real editing.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Braces,
  ChevronDown,
  Loader2,
  Maximize2,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { hasUnsavedChanges, toForm } from "./template-dirty";
import { PageShell } from "@/components/layout/page-shell";
import {
  useCreateNotificationTemplateMutation,
  useGetAvailableTemplateEventsQuery,
  useGetNotificationTemplateQuery,
  useGetNotificationTemplatesQuery,
  usePreviewNotificationTemplateQuery,
  useUpdateNotificationTemplateMutation,
  type NotificationTemplate,
} from "@/redux/services/notifications-api";

type Mode = "edit" | "create";

export default function NotificationTemplateEditor({ mode = "edit" }: { mode?: Mode }) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(P.CONFIGURE_NOTIFICATION_TEMPLATES)) return <PageAccessDenied />;
  return mode === "create" ? <CreateTemplate /> : <EditTemplate />;
}

// ── Edit an existing template ────────────────────────────────────────────────

function EditTemplate() {
  const { id = "" } = useParams();
  const { data, isLoading, isError } = useGetNotificationTemplateQuery(id);
  const template = data?.data;

  if (isLoading) return <PageBusy />;
  if (isError || !template) {
    return (
      <PageShell>
        <p className="font-mont text-sm font-medium">That template could not be loaded.</p>
        <BackLink />
      </PageShell>
    );
  }
  return <Editor key={template.id} template={template} />;
}

// ── Create a new one ─────────────────────────────────────────────────────────

function CreateTemplate() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetAvailableTemplateEventsQuery();
  const [create, { isLoading: creating }] = useCreateNotificationTemplateMutation();
  const [eventType, setEventType] = useState("");
  const [channel, setChannel] = useState<"" | "in_app" | "email">("");

  const events = data?.data ?? [];
  const chosen = events.find((e) => e.event_type === eventType);

  const start = async () => {
    if (!eventType || !channel) return;
    const created = await create({
      event_type: eventType,
      channel,
      subject: "",
      // A blank message would render an empty email; give the author the shape
      // of one to edit rather than an empty box.
      body: "Hello,\n\nWrite your message here.\n",
    }).unwrap();
    toast.success("Template created");
    navigate(routesPath.PROTECTED.NOTIFICATION_TEMPLATE(created.data.id), { replace: true });
  };

  if (isLoading) return <PageBusy />;

  return (
    <PageShell className="text-black-01" data-guide="notifications-admin.template-new">
      <BackLink />
      <h1 className="mt-3 font-mont text-lg font-semibold">New notification template</h1>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-01">
        Pick the event this message belongs to. Only events with no template yet are listed - an
        event exists when something in the platform fires it, so this is everything you can write
        for right now.
      </p>

      {!events.length ? (
        <p className={cn(INFORMATION_CARD_SURFACE, "mt-8 rounded-md p-6 text-sm text-gray-01")}>
          Every event already has a template for each of its channels. Nothing to create.
        </p>
      ) : (
        <div className={cn(INFORMATION_CARD_SURFACE, "mt-6 max-w-xl space-y-4 rounded-md p-5")}>
          <label className="grid gap-1 text-sm font-medium">
            Event
            <NativeSelect
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setChannel("");
              }}
            >
              <option value="">Choose an event…</option>
              {events.map((e) => (
                <option key={e.event_type} value={e.event_type}>
                  {e.event_type_label} ({e.event_type_key})
                </option>
              ))}
            </NativeSelect>
          </label>

          {chosen && (
            <>
              <p className="text-xs leading-5 text-gray-01">{chosen.description}</p>
              <label className="grid gap-1 text-sm font-medium">
                Channel
                <NativeSelect
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as "in_app" | "email")}
                >
                  <option value="">Choose a channel…</option>
                  {chosen.channels.map((c) => (
                    <option key={c} value={c}>
                      {c === "email" ? "Email" : "In-app"}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            </>
          )}

          <Button disabled={!eventType || !channel || creating} onClick={start}>
            {creating ? "Creating…" : "Create and edit"}
          </Button>
        </div>
      )}
    </PageShell>
  );
}

// ── The editor ───────────────────────────────────────────────────────────────

function Editor({ template }: { template: NotificationTemplate }) {
  const isEmail = template.channel === "email";
  // `saved` is what is in the database right now. Everything about whether
  // there is anything to save is decided by comparing against it, so undoing an
  // edit by hand puts the page back to "no changes" without a reload.
  const [saved, setSaved] = useState(() => toForm(template));
  const [form, setForm] = useState(() => toForm(template));
  const [open, setOpen] = useState<"message" | "html" | null>(null);
  const [fullScreen, setFullScreen] = useState<"message" | "html" | null>(null);
  const [update, { isLoading: saving }] = useUpdateNotificationTemplateMutation();

  // Every sibling channel for this event, so the in-app and email versions of
  // the same notification are one click apart.
  const siblings = useGetNotificationTemplatesQuery({
    event_type_key: template.event_type_key,
  }).data?.data ?? [];

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // The draft is what the preview renders. Debounced so typing stays smooth.
  const draft = useDebounce(form, 500);
  const { data: previewData, isFetching } = usePreviewNotificationTemplateQuery({
    id: template.id,
    draft,
  });
  const preview = previewData?.data;

  const isCustom = form.html_is_custom;

  // Save is lit only by a real difference from what is stored - see
  // template-dirty.ts for why regenerated markup does not count.
  const isDirty = hasUnsavedChanges(form, saved, isEmail);

  // A standard template's markup follows its message, so the HTML box tracks
  // the regenerated SOURCE (placeholders intact) - never the rendered preview,
  // which has sample values in it and would be saved as the template.
  useEffect(() => {
    if (preview && !preview.html_is_custom) {
      setForm((f) => (f.html_is_custom ? f : { ...f, html_body: preview.html_source }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.html_source]);

  const save = async () => {
    const result = await update({
      id: template.id,
      body: {
        subject: form.subject,
        body: form.body,
        cta_label: form.cta_label,
        cta_url: form.cta_url,
        // Only claim the markup when it is genuinely hand-maintained; sending
        // it back for a standard template would freeze it on today's design.
        ...(isCustom ? { html_body: form.html_body, html_is_custom: true } : {}),
      },
    }).unwrap();
    const stored = toForm(result.data);
    setSaved(stored);
    setForm(stored);
    toast.success("Template saved");
  };

  const resetDesign = async () => {
    const restored = await update({
      id: template.id,
      body: { html_is_custom: false },
    }).unwrap();
    const stored = toForm(restored.data);
    setSaved(stored);
    setForm((f) => ({ ...f, html_body: stored.html_body, html_is_custom: false }));
    toast.success("Standard design restored");
  };

  return (
    <PageShell data-guide="notifications-admin.template-editor" className="py-5 text-black-01">
      {/* Header: identity, state, save. Deliberately tight - the work is below. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <BackLink />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="font-mont text-lg font-semibold">{template.event_type_label}</h1>
            <Badge variant="pending" className="text-[10px] uppercase">
              {template.channel === "email" ? "Email" : "In-app"}
            </Badge>
            {isEmail && (
              <Badge variant={isCustom ? "rejected" : "success"} className="text-[10px]">
                {isCustom ? "Hand-edited design" : "Standard design"}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-gray-01">{template.event_type_key}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Say which state the page is in, rather than leaving a greyed-out
              button to be interpreted. */}
          <span
            className={cn(
              "text-xs font-medium",
              isDirty ? "text-amber-600" : "text-gray-01",
            )}
          >
            {isDirty ? "Unsaved changes" : "No changes"}
          </span>
          <TagsButton variables={template.variables} />
          <Button
            size="lg"
            onClick={save}
            disabled={saving || !isDirty}
            title={isDirty ? undefined : "Nothing has changed since the last save"}
          >
            <Save className="size-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Sibling channels for the same event. */}
      {siblings.length > 1 && (
        <div className="mt-4 flex w-fit items-center gap-1 rounded-sm bg-white p-1">
          {siblings.map((s) => (
            <Link
              key={s.id}
              to={routesPath.PROTECTED.NOTIFICATION_TEMPLATE(s.id)}
              className={cn(
                "rounded px-3 py-1.5 font-mont text-sm font-medium",
                s.id === template.id && "bg-pry-01",
              )}
            >
              {s.channel === "email" ? "Email" : "In-app"}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* ── Left: the content ── */}
        <div className="space-y-4">
          <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5 space-y-4")}>
            <label className="grid gap-1 text-sm font-medium">
              {isEmail ? "Subject line" : "Headline"}
              <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
            </label>

            <Section
              title="Message"
              hint="The words. Plain text - the layout is built from it."
              isOpen={open === "message"}
              toggle={() => setOpen(open === "message" ? null : "message")}
              expand={() => setFullScreen("message")}
              summary={form.body.split("\n").find(Boolean) ?? "Empty"}
            >
              <Textarea
                rows={14}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
              <p className="mt-2 text-xs leading-5 text-gray-01">
                A run of “Label: value” lines becomes a table, a line in CAPITALS becomes a
                heading, and lines starting with “-” become bullets.
              </p>
            </Section>

            {isEmail && (
              <Section
                title="Email HTML"
                hint="Exactly what is sent. Edit it and this template keeps your version."
                isOpen={open === "html"}
                toggle={() => setOpen(open === "html" ? null : "html")}
                expand={() => setFullScreen("html")}
                summary={isCustom ? "Your own markup" : "Built from the message above"}
                action={
                  isCustom ? (
                    <button
                      type="button"
                      onClick={resetDesign}
                      className="flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      <RotateCcw className="size-3.5" />
                      Restore standard design
                    </button>
                  ) : null
                }
              >
                <Textarea
                  rows={16}
                  className="font-mono text-xs"
                  value={form.html_body}
                  onChange={(e) => {
                    set("html_body", e.target.value);
                    set("html_is_custom", true);
                  }}
                />
                <p className="mt-2 text-xs leading-5 text-gray-01">
                  {isCustom
                    ? "This template no longer follows the standard design. Restore it above to go back."
                    : "Regenerated from the message while you leave it alone. The moment you edit it, this template keeps your version instead."}
                </p>
              </Section>
            )}
          </div>

          {isEmail && (
            <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
              <p className="text-sm font-medium">Action button</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-01">
                The big blue button in the email. Leave both boxes empty for no button. The link
                is normally a tag, for example{" "}
                <code className="font-mono text-primary">{"{{ invitation_url }}"}</code>, which is
                filled in per recipient when the email is sent.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-medium">
                  Button text
                  <Input
                    value={form.cta_label}
                    placeholder="Pay online"
                    onChange={(e) => set("cta_label", e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Button link
                  <Input
                    value={form.cta_url}
                    placeholder="{{ payment_link }}"
                    onChange={(e) => set("cta_url", e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          <label className={cn(INFORMATION_CARD_SURFACE, "flex items-center gap-3 rounded-md p-5")}>
            <Switch
              checked={template.is_active}
              onCheckedChange={async (v) => {
                await update({ id: template.id, body: { is_active: v } }).unwrap();
                toast.success(v ? "Template is live" : "Template paused");
              }}
            />
            <span className="text-sm">
              <span className="font-medium">Active</span>
              <span className="ml-2 text-xs text-gray-01">
                Paused templates stop this channel firing for this event.
              </span>
            </span>
          </label>
        </div>

        {/* ── Right: what the recipient gets ── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {isEmail ? "The email" : "The notification card"}
                </p>
                <p className="text-xs text-gray-01">
                  Rendered with sample values, updating as you type.
                </p>
              </div>
              {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
            </div>

            {!preview ? (
              <div className="mt-4 grid h-64 place-content-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : isEmail ? (
              <div className="mt-4">
                <p className="mb-2 truncate font-mont text-sm font-semibold">{preview.subject}</p>
                {/* sandbox="": the preview can render but never run, and never
                    reaches the console's own origin. */}
                <iframe
                  sandbox=""
                  title="Email preview"
                  srcDoc={preview.html_body}
                  className="h-[70vh] w-full rounded-md border border-white-02 bg-white"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-white-02 p-4">
                <p className="font-mont text-sm font-semibold">
                  {preview.subject || template.event_type_label}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-01">
                  {preview.body}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {fullScreen && (
        <FullScreenEditor
          title={fullScreen === "message" ? "Message" : "Email HTML"}
          mono={fullScreen === "html"}
          value={fullScreen === "message" ? form.body : form.html_body}
          onChange={(v) => {
            if (fullScreen === "message") set("body", v);
            else {
              set("html_body", v);
              set("html_is_custom", true);
            }
          }}
          close={() => setFullScreen(null)}
        />
      )}
    </PageShell>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

/** A collapsed field: one line of summary until it is wanted. */
function Section({
  title,
  hint,
  summary,
  isOpen,
  toggle,
  expand,
  action,
  children,
}: {
  title: string;
  hint: string;
  summary: string;
  isOpen: boolean;
  toggle: () => void;
  expand: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white-02">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            <span className="block truncate text-xs text-gray-01">{isOpen ? hint : summary}</span>
          </span>
        </button>
        {action}
        <button
          type="button"
          onClick={expand}
          title={`Open ${title.toLowerCase()} full screen`}
          className="rounded p-1.5 text-gray-01 hover:bg-white-05"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
      {isOpen && <div className="border-t border-white-02 p-4">{children}</div>}
    </div>
  );
}

/** The template's tags, behind one icon. */
function TagsButton({ variables }: { variables: string[] }) {
  const [copied, setCopied] = useState("");
  if (!variables.length) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="white" size="lg">
          <Braces className="size-4" />
          Tags ({variables.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-medium">Tags in this template</p>
        <p className="mt-0.5 text-xs leading-5 text-gray-01">
          Each one is replaced with real data when the notification is sent. Click to copy.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`{{ ${v} }}`);
                setCopied(v);
              }}
              className="rounded bg-white-05 px-2 py-1 font-mono text-[11px] text-primary hover:bg-pry-01"
            >
              {copied === v ? "copied" : `{{ ${v} }}`}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Room to actually write in, for the two fields that need it. */
function FullScreenEditor({
  title,
  value,
  mono,
  onChange,
  close,
}: {
  title: string;
  value: string;
  mono: boolean;
  onChange: (value: string) => void;
  close: () => void;
}) {
  // Escape closes, because a full-screen box with no way out is a trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-4 sm:p-8">
      <div className={cn(INFORMATION_CARD_SURFACE, "flex min-h-0 flex-1 flex-col rounded-lg")}>
        <div className="flex items-center justify-between border-b border-white-02 px-5 py-3">
          <p className="font-mont font-semibold">{title}</p>
          <button type="button" onClick={close} className="rounded p-1.5 hover:bg-white-05">
            <X className="size-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-0 flex-1 resize-none rounded-b-lg p-5 text-sm outline-none",
            mono && "font-mono text-xs",
          )}
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={`${routesPath.PROTECTED.NOTIFICATIONS_ADMIN}?panel=templates`}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-01 hover:text-primary"
    >
      <ArrowLeft className="size-3.5" />
      Templates
    </Link>
  );
}

function PageBusy() {
  return (
    <main className="grid h-[60vh] place-content-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </main>
  );
}
