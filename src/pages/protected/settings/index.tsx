// Platform settings console over /config/, in plain language:
//
//   System Settings — GitHub-style rows: every typed setting grouped by
//                     module, with its description and an inline control
//                     (toggle / number / text; JSON behind an Edit dialog).
//                     Shows the EFFECTIVE platform value (default overlaid
//                     by any explicit platform row).
//   Features        — per-scope switchboard over capabilities. Pick Platform
//                     or a school; each feature shows its live On/Off plus
//                     the two levers in plain words: "In plan" (entitlement)
//                     and "Status: Follow plan / Force on / Force off"
//                     (override). A row click opens the record drawer.
//   Audit Trail     — the immutable change log.
//
// Reads/writes are gated by the config.* keys and enforced again server-side
// (definition/capability creation is platform-only).

import { useState } from "react";
import { useSearchParams } from "react-router";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { CustomInput } from "@/components/custom/custom-input";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { SearchSelect } from "@/components/custom/search-select";
import Tabs from "@/components/custom/tab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import {
  useArchiveCapabilityMutation,
  useArchiveConfigDefinitionMutation,
  useGetCapabilitiesQuery,
  useGetConfigAuditQuery,
  useGetConfigDefinitionsQuery,
  useGetConfigValuesQuery,
  useGetEffectiveCapabilitiesQuery,
  useGetEntitlementsQuery,
  useGetOverridesQuery,
  useLazyExportConfigQuery,
  useSetConfigValuesMutation,
  useSetEntitlementMutation,
  useSetOverrideMutation,
  type Capability,
  type ConfigDefinition,
  type ConfigValue,
  type Entitlement,
  type Override,
} from "@/redux/services/config-api";
import CustomTable from "@/components/custom/custom-table";
import { UserAvatar } from "@/components/custom/user-avatar";
import { ConfigDialog } from "./config-dialog";

type Tab = "system" | "features" | "audit";

const TABS: Array<{ key: Tab; label: string; permissions: PermissionCode[] }> = [
  { key: "system", label: "System Settings", permissions: [P.VIEW_CONFIG_DEFINITIONS, P.VIEW_CONFIG_VALUES] },
  { key: "features", label: "Features", permissions: [P.VIEW_CAPABILITIES] },
  { key: "audit", label: "Audit Trail", permissions: [P.VIEW_CONFIG_AUDIT] },
];

/** "notifications" → "Notifications", "parent_portal" → "Parent Portal". */
const pretty = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Settings() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [searchParams] = useSearchParams();
  const visible = TABS.filter((t) => hasAnyPermission(...t.permissions));
  const [exportConfig, { isFetching }] = useLazyExportConfigQuery();

  // No config.* view key at all → the sidebar hides this page, but guard the
  // direct-URL case too instead of rendering an empty shell.
  if (!visible.length) return <PageAccessDenied layoutTitle="Settings" />;

  // A pasted ?tab= the user can't read falls back to their first tab.
  const requested = searchParams.get("tab") as Tab | null;
  const tab = requested && visible.some((t) => t.key === requested) ? requested : visible[0].key;

  const download = async () => {
    const result = await exportConfig().unwrap();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `configuration-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Settings">
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        {/* Intro row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">Platform Settings</p>
            <p className="text-xs text-gray-01 mt-0.5">
              System settings and per-school feature access, in one place.
            </p>
          </div>
          {hasPermission(P.EXPORT_CONFIG) && (
            <Button variant="white" size="lg" disabled={isFetching} onClick={download}>
              <Download className="size-4" />
              {isFetching ? "Exporting…" : "Export snapshot"}
            </Button>
          )}
        </div>

        <Tabs tabKey="tab" tabs={visible.map((t) => ({ label: t.label, value: t.key }))} />

        {tab === "system" && <SystemSettings />}
        {tab === "features" && <Features />}
        {tab === "audit" && <Audit />}
      </main>
    </DashboardLayout>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

/** Platform-or-school scope picker ("" = platform). */
function ScopePicker({ value, onChange }: { value: string; onChange: (schoolId: string) => void }) {
  const schools = useGetSchoolsQuery({ page_size: 100 });
  return (
    <div className="w-full sm:w-[260px]">
      <SearchSelect
        placeholder="Platform (all schools)"
        loading={schools.isLoading}
        options={(schools.data?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Busy() {
  return (
    <div className="grid h-48 place-content-center rounded-md bg-white">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

// Destructive archive action behind the house confirm dialog.
function ArchiveButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-xs font-medium text-destructive">Archive</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The record is deactivated and disappears from these lists. The audit trail keeps the change.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── System Settings ───────────────────────────────────────────────────────────

function SystemSettings() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const defs = useGetConfigDefinitionsQuery({ page_size: "100" });
  const values = useGetConfigValuesQuery({ page_size: "100" });
  const canSet = hasPermission(P.UPDATE_CONFIG_VALUES);
  const canCreate = hasPermission(P.CREATE_CONFIG_DEFINITION);
  const canArchive = hasPermission(P.ARCHIVE_CONFIG_DEFINITION);
  const [creating, setCreating] = useState(false);

  if (defs.isLoading || values.isLoading) return <Busy />;

  const explicit = new Map((values.data?.data ?? []).map((v) => [v.key, v]));
  const rows = (defs.data?.data ?? []).filter(
    (d) => !search || `${d.label} ${d.key} ${d.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  // Group by the key's module prefix ("notifications.email_max_retries" → Notifications).
  const groups = new Map<string, ConfigDefinition[]>();
  for (const d of rows) {
    const g = pretty(d.key.includes(".") ? d.key.split(".")[0] : "general");
    groups.set(g, [...(groups.get(g) ?? []), d]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont text-sm font-semibold">System Settings</h2>
          <p className="text-xs text-gray-01 mt-0.5">
            Platform-wide behaviour. Changes apply immediately and are recorded in the audit trail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CustomInput
            id="system-settings-search"
            canSearch
            placeholder="Search settings"
            className="h-10"
            containerClass="w-full sm:w-[260px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {canCreate && (
            <Button size="lg" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New setting
            </Button>
          )}
        </div>
      </div>

      {!rows.length ? (
        <div className="grid h-40 place-content-center rounded-md bg-white text-sm text-gray-01">
          No settings match your search.
        </div>
      ) : (
        <div className="divide-y divide-white-02 rounded-md bg-white">
          {[...groups.entries()].map(([group, defsInGroup]) => (
            <div key={group} className="p-5">
              <h3 className="font-mont font-semibold">{group}</h3>
              <div className="mt-3 divide-y divide-white-02 rounded-lg border border-white-02">
                {defsInGroup.map((d) => (
                  <SettingRow
                    key={d.key}
                    def={d}
                    row={explicit.get(d.key)}
                    canSet={canSet}
                    canArchive={canArchive}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ConfigDialog mode="definition" close={() => setCreating(false)} />}
    </div>
  );
}

/** One setting: name + description on the left, its control on the right. */
function SettingRow({
  def,
  row,
  canSet,
  canArchive,
}: {
  def: ConfigDefinition;
  row?: ConfigValue;
  canSet: boolean;
  canArchive: boolean;
}) {
  const [save, { isLoading }] = useSetConfigValuesMutation();
  const [archive] = useArchiveConfigDefinitionMutation();
  const effective = row ? row.value : def.default_value;
  const [draft, setDraft] = useState<string>(effective == null ? "" : String(effective));
  const [editingJson, setEditingJson] = useState(false);

  const write = async (value: unknown) => {
    await save({
      values: [{ key: def.key, value, reason: "Updated from System Settings" }],
    }).unwrap();
    toast.success(`${def.label} updated`);
  };

  const isDirty = draft !== (effective == null ? "" : String(effective));
  const inline =
    def.value_type === "BOOLEAN"
      ? "toggle"
      : ["INTEGER", "DECIMAL"].includes(def.value_type)
        ? "number"
        : ["STRING", "CHOICE"].includes(def.value_type)
          ? "text"
          : "dialog"; // JSON / SECRET_REFERENCE

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {def.label}
          {row ? (
            <Badge className="bg-primary/10 px-1.5 font-mont text-[10px] text-primary">Customised</Badge>
          ) : (
            <Badge variant="inactive" className="px-1.5 font-mont text-[10px]">Default</Badge>
          )}
        </p>
        {def.description && <p className="text-xs leading-5 text-gray-01">{def.description}</p>}
        {canArchive && (
          <p className="mt-1 text-[11px]">
            <ArchiveButton
              label={def.label}
              onConfirm={() => archive({ key: def.key, reason: "Archived from Settings console" })}
            />
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {inline === "toggle" && (
          <Switch
            disabled={!canSet || isLoading}
            checked={effective === true}
            onCheckedChange={(v) => write(v)}
          />
        )}
        {(inline === "number" || inline === "text") && (
          <>
            <Input
              type={inline === "number" ? "number" : "text"}
              step={def.value_type === "DECIMAL" ? "any" : undefined}
              disabled={!canSet || isLoading}
              className="h-9 w-36 sm:w-44"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {isDirty && canSet && (
              <Button
                size="sm"
                disabled={isLoading || (inline === "number" && draft.trim() === "")}
                onClick={() => write(inline === "number" ? Number(draft) : draft)}
              >
                {isLoading ? "Saving…" : "Save"}
              </Button>
            )}
          </>
        )}
        {inline === "dialog" && (
          <>
            <code className="max-w-40 truncate text-xs text-gray-01">{JSON.stringify(effective)}</code>
            {canSet && (
              <Button variant="white" size="sm" onClick={() => setEditingJson(true)}>
                Edit
              </Button>
            )}
          </>
        )}
      </div>

      {editingJson && (
        <ConfigDialog mode="value" initial={{ key: def.key }} close={() => setEditingJson(false)} />
      )}
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const KIND_GROUP: Record<string, string> = { MODULE: "Modules", FEATURE: "Features" };

function Features() {
  const { hasPermission } = usePermissions();
  const [school, setSchool] = useState("");
  const [detail, setDetail] = useState<Capability | null>(null);
  const [creating, setCreating] = useState(false);
  const scope = school ? { school } : {};
  const catalogue = useGetCapabilitiesQuery({ page_size: "100" });
  const effective = useGetEffectiveCapabilitiesQuery(scope);
  // The scoped lists back the two plain controls ("In plan" / "Status").
  const entitlements = useGetEntitlementsQuery({ page_size: "100", ...scope });
  const overrides = useGetOverridesQuery({ page_size: "100", ...scope });
  const canCreate = hasPermission(P.MANAGE_CAPABILITIES);

  if (catalogue.isLoading || effective.isLoading) return <Busy />;

  const enabled = new Map((effective.data?.data ?? []).map((e) => [e.key, e.enabled]));
  const entByKey = new Map((entitlements.data?.data ?? []).map((e) => [e.capability_key, e]));
  const overrideByKey = new Map((overrides.data?.data ?? []).map((o) => [o.capability_key, o]));
  const labelByKey = new Map((catalogue.data?.data ?? []).map((c) => [c.key, c.label]));
  // A feature with any dependency off at this scope resolves Off no matter
  // what its own levers say — the rows must explain that.
  const depsStatus = (c: Capability) =>
    (c.dependencies ?? []).map((key) => ({
      label: labelByKey.get(key) ?? pretty(key),
      on: enabled.get(key) ?? false,
    }));

  const groups = new Map<string, Capability[]>();
  for (const c of catalogue.data?.data ?? []) {
    const g = KIND_GROUP[c.kind] ?? pretty(c.kind.toLowerCase());
    groups.set(g, [...(groups.get(g) ?? []), c]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont text-sm font-semibold">Features</h2>
          <p className="text-xs text-gray-01 mt-0.5">
            What's switched on — platform-wide or for one school. “In plan” is the commercial grant;
            “Status” can force a feature on or off regardless.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ScopePicker value={school} onChange={setSchool} />
          {canCreate && (
            <Button size="lg" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New feature
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-white-02 rounded-md bg-white">
        {[...groups.entries()].map(([group, caps]) => (
          <div key={group} className="p-5">
            <h3 className="font-mont font-semibold">{group}</h3>
            <div className="mt-3 divide-y divide-white-02 rounded-lg border border-white-02">
              {caps.map((c) => (
                <FeatureRow
                  key={c.key}
                  cap={c}
                  school={school}
                  on={enabled.get(c.key) ?? false}
                  deps={depsStatus(c)}
                  entitlement={entByKey.get(c.key)}
                  override={overrideByKey.get(c.key)}
                  openDetail={() => setDetail(c)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <FeatureDetail
          cap={detail}
          school={school}
          deps={depsStatus(detail)}
          entitlement={entByKey.get(detail.key)}
          override={overrideByKey.get(detail.key)}
          close={() => setDetail(null)}
        />
      )}
      {creating && <ConfigDialog mode="capability" close={() => setCreating(false)} />}
    </div>
  );
}

type DepStatus = { label: string; on: boolean };

function FeatureRow({
  cap,
  school,
  on,
  deps,
  entitlement,
  override,
  openDetail,
}: {
  cap: Capability;
  school: string;
  on: boolean;
  deps: DepStatus[];
  entitlement?: Entitlement;
  override?: Override;
  openDetail: () => void;
}) {
  const { hasPermission } = usePermissions();
  const [setEnt, entState] = useSetEntitlementMutation();
  const [setOver, overState] = useSetOverrideMutation();
  const canEntitle = hasPermission(P.MANAGE_ENTITLEMENTS);
  const canOverride = hasPermission(P.MANAGE_CONFIG_OVERRIDES);
  const scopeBody = school ? { school } : {};

  const inPlan = entitlement?.state === "GRANTED";
  const status = override?.state && override.state !== "INHERIT" ? override.state : "INHERIT";
  const unmet = deps.filter((d) => !d.on);

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <button onClick={openDetail} className="min-w-0 flex-1 text-left">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {cap.label}
          {on ? (
            <Badge variant="success" className="font-mont text-xs">On</Badge>
          ) : (
            <Badge variant="inactive" className="font-mont text-xs">Off</Badge>
          )}
          {/* An unmet dependency keeps the feature off regardless of its own levers. */}
          {!on && unmet.length > 0 && (
            <Badge variant="pending" className="font-mont text-xs">
              Needs {unmet.map((d) => d.label).join(", ")}
            </Badge>
          )}
        </p>
        {cap.description && <p className="text-xs leading-5 text-gray-01">{cap.description}</p>}
      </button>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        {cap.requires_entitlement ? (
          <label className="flex items-center gap-2 text-xs text-gray-01">
            In plan
            <Switch
              disabled={!canEntitle || entState.isLoading}
              checked={inPlan}
              onCheckedChange={async (v) => {
                await setEnt({
                  capability: cap.key,
                  state: v ? "GRANTED" : "DENIED",
                  source: "MANUAL",
                  reason: "Changed from the Features switchboard",
                  ...scopeBody,
                }).unwrap();
                toast.success(`${cap.label}: ${v ? "included in" : "removed from"} plan`);
              }}
            />
          </label>
        ) : (
          <span className="text-xs text-gray-01">No plan needed</span>
        )}

        <label className="flex items-center gap-2 text-xs text-gray-01">
          Status
          <div className="w-36">
            <NativeSelect
              size="sm"
              disabled={!canOverride || overState.isLoading}
              value={status}
              onChange={async (e) => {
                await setOver({
                  capability: cap.key,
                  state: e.target.value,
                  reason: "Changed from the Features switchboard",
                  ...scopeBody,
                }).unwrap();
                toast.success(`${cap.label} status updated`);
              }}
            >
              <option value="INHERIT">Follow plan</option>
              <option value="ENABLED">Force on</option>
              <option value="DISABLED">Force off</option>
            </NativeSelect>
          </div>
        </label>
      </div>
    </div>
  );
}

/** Record drawer: why is this feature on/off at this scope? */
function FeatureDetail({
  cap,
  school,
  deps,
  entitlement,
  override,
  close,
}: {
  cap: Capability;
  school: string;
  deps: DepStatus[];
  entitlement?: Entitlement;
  override?: Override;
  close: () => void;
}) {
  const { hasPermission } = usePermissions();
  const [archiveCap] = useArchiveCapabilityMutation();

  return (
    <Sheet open onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
        <SheetHeader className="p-0">
          <SheetTitle>{cap.label}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 text-sm">
          {cap.description && <p className="text-gray-600">{cap.description}</p>}

          <div className="rounded-lg border border-white-02 p-4">
            <p className="font-mont text-xs font-semibold text-gray-01">HOW THIS RESOLVES</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-gray-600">
              {deps.length > 0 && (
                <li>0. Needs {deps.map((d) => d.label).join(" and ")} switched on first — without that it stays off no matter what.</li>
              )}
              {cap.requires_entitlement ? (
                <>
                  <li>1. In the plan → on. Not in the plan → off.</li>
                  <li>2. A forced status (on/off) wins over the plan.</li>
                </>
              ) : (
                <>
                  <li>1. No plan needed — ships {cap.default_enabled ? "ON" : "OFF"} by default.</li>
                  <li>2. A forced status (on/off) wins over the default.</li>
                </>
              )}
            </ul>
          </div>

          {deps.length > 0 && (
            <div className="rounded-lg border border-white-02 p-4">
              <p className="font-mont text-xs font-semibold text-gray-01">
                REQUIRES — {school ? "AT THIS SCHOOL" : "AT PLATFORM"}
              </p>
              <ul className="mt-2 space-y-2">
                {deps.map((d) => (
                  <li key={d.label} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{d.label}</span>
                    {d.on ? (
                      <Badge variant="success" className="font-mont text-xs">On</Badge>
                    ) : (
                      <Badge variant="rejected" className="font-mont text-xs">Off — blocking</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-white-02 p-4">
            <p className="font-mont text-xs font-semibold text-gray-01">
              CURRENT RECORDS — {school ? "THIS SCHOOL" : "PLATFORM"}
            </p>
            <dl className="mt-2 space-y-3 text-xs">
              <div>
                <dt className="text-gray-01">Plan grant (entitlement)</dt>
                <dd className="mt-0.5 font-medium">
                  {entitlement
                    ? `${entitlement.state} · via ${entitlement.source} · updated ${new Date(entitlement.updated_at).toLocaleDateString()}`
                    : "None recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-01">Forced status (override)</dt>
                <dd className="mt-0.5 font-medium">
                  {override && override.state !== "INHERIT"
                    ? `${override.state === "ENABLED" ? "Forced on" : "Forced off"}${override.reason ? ` — “${override.reason}”` : ""} · updated ${new Date(override.updated_at).toLocaleDateString()}`
                    : "None — follows the plan"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-gray-01">
              Full history lives in the Audit Trail tab.
            </p>
          </div>

          {hasPermission(P.MANAGE_CAPABILITIES) && (
            <ArchiveButton
              label={cap.label}
              onConfirm={() => {
                archiveCap({ key: cap.key, reason: "Archived from Settings console" });
                close();
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────────

// Plain wording per audit action code; tone follows the change's weight.
const AUDIT_ACTIONS: Record<string, { label: string; className: string }> = {
  "config.value.updated": { label: "Setting changed", className: "bg-primary/10 text-primary" },
  "config.definition.created": { label: "Setting created", className: "bg-green-01/10 text-green-01" },
  "config.definition.updated": { label: "Setting updated", className: "bg-primary/10 text-primary" },
  "config.definition.archived": { label: "Setting archived", className: "bg-gray-05/10 text-gray-05" },
  "config.capability.created": { label: "Feature created", className: "bg-green-01/10 text-green-01" },
  "config.capability.updated": { label: "Feature updated", className: "bg-primary/10 text-primary" },
  "config.capability.archived": { label: "Feature archived", className: "bg-gray-05/10 text-gray-05" },
  "config.entitlement.updated": { label: "Plan grant changed", className: "bg-primary/10 text-primary" },
  "config.override.updated": { label: "Forced status changed", className: "bg-yellow-01/10 text-yellow-01" },
};

function Audit() {
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const [createdAfter] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString());
  // The backend list is scope-resolved: platform rows by default, one
  // school's rows with ?school= — same picker as the Features tab.
  const q = useGetConfigAuditQuery({
    page: String(page),
    created_after: createdAfter,
    ...(school ? { school } : {}),
  });

  const tableData = (q.data?.data ?? []).map((x) => {
    const action = AUDIT_ACTIONS[x.action] ?? {
      label: x.action.replace("config.", "").replaceAll(".", " "),
      className: "bg-gray-05/10 text-gray-05",
    };
    return {
      action: (
        <Badge className={`font-mont text-xs ${action.className}`}>{action.label}</Badge>
      ),
      target: <span className="text-sm font-medium">{x.target_label || "—"}</span>,
      actor: x.actor ? (
        <div className="flex items-center gap-2.5">
          <UserAvatar
            userId={x.actor.id}
            name={x.actor.full_name}
            className="size-8 shrink-0"
            fallbackClassName="text-xs font-semibold bg-pry-01 text-primary"
          />
          <span className="text-sm">{x.actor.full_name}</span>
        </div>
      ) : (
        <span className="text-sm text-gray-01">System</span>
      ),
      reason: (
        <span className="block max-w-[220px] truncate text-sm text-gray-01" title={x.reason}>
          {x.reason || "—"}
        </span>
      ),
      date: <span className="text-xs text-gray-01">{new Date(x.created_at).toLocaleString()}</span>,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont text-sm font-semibold">Configuration audit trail</h2>
          <p className="text-xs text-gray-01 mt-0.5">
            Immutable record of every settings and feature change — last 30 days.
          </p>
        </div>
        <ScopePicker
          value={school}
          onChange={(s) => {
            setSchool(s);
            setPage(1);
          }}
        />
      </div>
      <CustomTable
        tableHeaderList={["Action", "Target", "Actor", "Reason", "Date"]}
        tableBodyList={tableData}
        loading={q.isLoading}
        emptyText="No changes recorded in this window."
        totalPage={q.data?.pagination?.totalPages}
        currentPage={q.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
        hidePagination={(q.data?.pagination?.totalPages ?? 0) <= 1}
      />
    </div>
  );
}
