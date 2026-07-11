// Platform settings console over /config/.
//
// Tabs (each gated by its config.* view key):
//   Configuration — the definitions catalogue with EFFECTIVE platform values
//                   (default overlaid by any explicit platform row) and a
//                   per-row type-aware "Set value" action.
//   Capabilities  — scope switchboard: pick Platform or a school and see each
//                   capability's effective on/off (GET /config/effective-
//                   capabilities/), with per-row entitlement/override actions.
//   Entitlements / Overrides — the physical grant/override registries at the
//                   picked scope (backend lists are scope-resolved).
//   Audit Trail   — immutable change log (last 30 days).
// Writes are gated per-action and enforced again server-side (creation
// endpoints are platform-only).

import { useState } from "react";
import { useSearchParams } from "react-router";
import { Download, Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
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
} from "@/redux/services/config-api";
import { ConfigDialog, type ConfigDialogInitial, type ConfigDialogMode } from "./config-dialog";

type Tab = "configuration" | "capabilities" | "entitlements" | "overrides" | "audit";

const TABS: Array<{ key: Tab; label: string; permissions: PermissionCode[] }> = [
  // The catalogue view joins definitions and values, so either read key works.
  { key: "configuration", label: "Configuration", permissions: [P.VIEW_CONFIG_DEFINITIONS, P.VIEW_CONFIG_VALUES] },
  { key: "capabilities", label: "Capabilities", permissions: [P.VIEW_CAPABILITIES] },
  { key: "entitlements", label: "Entitlements", permissions: [P.VIEW_ENTITLEMENTS] },
  { key: "overrides", label: "Overrides", permissions: [P.VIEW_CONFIG_OVERRIDES] },
  { key: "audit", label: "Audit Trail", permissions: [P.VIEW_CONFIG_AUDIT] },
];

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
              Control configuration, capabilities and scoped access from one place.
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

        {tab === "configuration" && <Configuration />}
        {tab === "capabilities" && <Capabilities />}
        {tab === "entitlements" && <Entitlements />}
        {tab === "overrides" && <Overrides />}
        {tab === "audit" && <Audit />}
      </main>
    </DashboardLayout>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

const ADD_PERMISSION: Record<ConfigDialogMode, PermissionCode> = {
  definition: P.CREATE_CONFIG_DEFINITION,
  value: P.UPDATE_CONFIG_VALUES,
  capability: P.MANAGE_CAPABILITIES,
  entitlement: P.MANAGE_ENTITLEMENTS,
  override: P.MANAGE_CONFIG_OVERRIDES,
};

function Header({
  title,
  description,
  add,
  mode,
  dialogInitial,
  children,
}: {
  title: string;
  description: string;
  /** Button label; omit for read-only panels (audit). */
  add?: string;
  mode?: ConfigDialogMode;
  /** Prefill for the dialog the add button opens (e.g. the picked school). */
  dialogInitial?: ConfigDialogInitial;
  /** Extra toolbar content (e.g. a search input) rendered left of the action. */
  children?: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);
  const allowed = add && mode && hasPermission(ADD_PERMISSION[mode]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont text-sm font-semibold">{title}</h2>
          <p className="text-xs text-gray-01 mt-0.5">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {children}
          {allowed && (
            <Button size="lg" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              {add}
            </Button>
          )}
        </div>
      </div>
      {open && mode && <ConfigDialog mode={mode} initial={dialogInitial} close={() => setOpen(false)} />}
    </>
  );
}

/** Platform-or-school scope picker shared by the scoped tabs ("" = platform). */
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

// Generic panel table (house CustomTable: loading, empty, phone cards, pager).
function Data({
  loading,
  heads,
  rows,
  totalPage,
  currentPage,
  onPageChange,
}: {
  loading: boolean;
  heads: string[];
  rows: React.ReactNode[][];
  totalPage?: number;
  currentPage?: number;
  onPageChange?: (page?: string | number) => void;
}) {
  const tableData = rows.map((r) => Object.fromEntries(r.map((cell, i) => [`c${i}`, cell])));
  return (
    <CustomTable
      tableHeaderList={heads}
      tableBodyList={tableData}
      loading={loading}
      emptyText="No records found."
      totalPage={totalPage}
      currentPage={currentPage}
      onPageChange={onPageChange}
      hidePagination={(totalPage ?? 0) <= 1}
    />
  );
}

// Destructive archive action behind the house confirm dialog (no browser confirm()).
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

// ── Configuration: catalogue + effective platform values ─────────────────────

function Configuration() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [setValueFor, setSetValueFor] = useState<string | null>(null);
  const [archive] = useArchiveConfigDefinitionMutation();
  const defs = useGetConfigDefinitionsQuery({ page: String(page) });
  // Explicit platform rows overlay the definition defaults. page_size=100 is
  // the backend max — plenty for the current catalogue size.
  const values = useGetConfigValuesQuery({ page_size: "100" });
  const canSet = hasPermission(P.UPDATE_CONFIG_VALUES);
  const canArchive = hasPermission(P.ARCHIVE_CONFIG_DEFINITION);

  const explicit = new Map((values.data?.data ?? []).map((v) => [v.key, v]));
  const rows = (defs.data?.data ?? []).filter(
    (d) =>
      !search ||
      `${d.label} ${d.key}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <Header
        title="Configuration"
        description="Every typed setting with its effective platform value."
        add="New definition"
        mode="definition"
      >
        <CustomInput
          id="config-search"
          canSearch
          placeholder="Filter by name or key"
          className="h-10"
          containerClass="w-full sm:w-[260px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Header>
      <Data
        loading={defs.isLoading || values.isLoading}
        heads={[
          "Setting",
          "Type",
          "Effective value",
          "Source",
          "Updated",
          ...(canSet || canArchive ? ["Action"] : []),
        ]}
        rows={rows.map((d) => {
          const row = explicit.get(d.key);
          const effective = row ? row.value : d.default_value;
          return [
            <div>
              <p className="font-medium">{d.label}</p>
              <code className="text-[11px] text-gray-01">{d.key}</code>
            </div>,
            d.value_type,
            <code className="max-w-60 truncate text-xs">{JSON.stringify(effective)}</code>,
            row ? (
              <Badge className="bg-primary/10 font-mont text-xs text-primary">Platform</Badge>
            ) : (
              <Badge variant="inactive" className="font-mont text-xs">Default</Badge>
            ),
            new Date((row ?? d).updated_at).toLocaleDateString(),
            ...(canSet || canArchive
              ? [
                  <div className="flex items-center gap-3">
                    {canSet && (
                      <button
                        className="text-xs font-medium text-primary"
                        onClick={() => setSetValueFor(d.key)}
                      >
                        Set value
                      </button>
                    )}
                    {canArchive && (
                      <ArchiveButton
                        label={d.label}
                        onConfirm={() => archive({ key: d.key, reason: "Archived from Settings console" })}
                      />
                    )}
                  </div>,
                ]
              : []),
          ];
        })}
        totalPage={defs.data?.pagination?.totalPages}
        currentPage={defs.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />
      {setValueFor && (
        <ConfigDialog mode="value" initial={{ key: setValueFor }} close={() => setSetValueFor(null)} />
      )}
    </div>
  );
}

// ── Capabilities: effective switchboard per scope ─────────────────────────────

function Capabilities() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const [dialog, setDialog] = useState<{ mode: ConfigDialogMode; capability: string } | null>(null);
  const catalogue = useGetCapabilitiesQuery({ page: String(page) });
  const effective = useGetEffectiveCapabilitiesQuery(school ? { school } : {});
  const [archiveCap] = useArchiveCapabilityMutation();
  const canManageCaps = hasPermission(P.MANAGE_CAPABILITIES);
  const canEntitle = hasPermission(P.MANAGE_ENTITLEMENTS);
  const canOverride = hasPermission(P.MANAGE_CONFIG_OVERRIDES);

  const enabled = new Map((effective.data?.data ?? []).map((e) => [e.key, e.enabled]));

  return (
    <div className="space-y-5">
      <Header
        title="Capabilities"
        description="What each feature resolves to at the picked scope, and the levers that change it."
        add="New capability"
        mode="capability"
      >
        <ScopePicker
          value={school}
          onChange={(s) => {
            setSchool(s);
            setPage(1);
          }}
        />
      </Header>
      <Data
        loading={catalogue.isLoading || effective.isLoading}
        heads={[
          "Capability",
          "Kind",
          "Effective",
          "Entitlement",
          ...(canEntitle || canOverride || canManageCaps ? ["Action"] : []),
        ]}
        rows={(catalogue.data?.data ?? []).map((x) => [
          <div>
            <p className="font-medium">{x.label}</p>
            <code className="text-[11px] text-gray-01">{x.key}</code>
          </div>,
          x.kind,
          enabled.get(x.key) ? (
            <Badge variant="success" className="font-mont text-xs">On</Badge>
          ) : (
            <Badge variant="inactive" className="font-mont text-xs">Off</Badge>
          ),
          x.requires_entitlement ? "Required" : "Not required",
          ...(canEntitle || canOverride || canManageCaps
            ? [
                <div className="flex items-center gap-3">
                  {canEntitle && (
                    <button
                      className="text-xs font-medium text-primary"
                      onClick={() => setDialog({ mode: "entitlement", capability: x.key })}
                    >
                      Set entitlement
                    </button>
                  )}
                  {canOverride && (
                    <button
                      className="text-xs font-medium text-primary"
                      onClick={() => setDialog({ mode: "override", capability: x.key })}
                    >
                      Add override
                    </button>
                  )}
                  {canManageCaps && (
                    <ArchiveButton
                      label={x.label}
                      onConfirm={() => archiveCap({ key: x.key, reason: "Archived from Settings console" })}
                    />
                  )}
                </div>,
              ]
            : []),
        ])}
        totalPage={catalogue.data?.pagination?.totalPages}
        currentPage={catalogue.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />
      {dialog && (
        <ConfigDialog
          mode={dialog.mode}
          initial={{ capability: dialog.capability, school }}
          close={() => setDialog(null)}
        />
      )}
    </div>
  );
}

// ── Entitlements / Overrides: physical rows at the picked scope ──────────────

function Entitlements() {
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const q = useGetEntitlementsQuery({ page: String(page), ...(school ? { school } : {}) });

  return (
    <div className="space-y-5">
      <Header
        title="Entitlements"
        description="Grants that unlock capabilities — platform-wide or per school."
        add="Set entitlement"
        mode="entitlement"
        dialogInitial={{ school }}
      >
        <ScopePicker
          value={school}
          onChange={(s) => {
            setSchool(s);
            setPage(1);
          }}
        />
      </Header>
      <Data
        loading={q.isLoading}
        heads={["Capability", "State", "Source", "Period", "Updated"]}
        rows={(q.data?.data ?? []).map((x) => [
          x.capability_key,
          x.state === "GRANTED" ? (
            <Badge variant="success" className="font-mont text-xs">Granted</Badge>
          ) : (
            <Badge variant="rejected" className="font-mont text-xs">{x.state}</Badge>
          ),
          x.source,
          x.starts_at ? new Date(x.starts_at).toLocaleDateString() : "Always",
          new Date(x.updated_at).toLocaleDateString(),
        ])}
        totalPage={q.data?.pagination?.totalPages}
        currentPage={q.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />
    </div>
  );
}

function Overrides() {
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const q = useGetOverridesQuery({ page: String(page), ...(school ? { school } : {}) });

  return (
    <div className="space-y-5">
      <Header
        title="Overrides"
        description="Explicit capability decisions stored at the picked scope."
        add="Add override"
        mode="override"
        dialogInitial={{ school }}
      >
        <ScopePicker
          value={school}
          onChange={(s) => {
            setSchool(s);
            setPage(1);
          }}
        />
      </Header>
      <Data
        loading={q.isLoading}
        heads={["Capability", "State", "Reason", "Updated"]}
        rows={(q.data?.data ?? []).map((x) => [
          x.capability_key,
          x.state,
          x.reason || "—",
          new Date(x.updated_at).toLocaleDateString(),
        ])}
        totalPage={q.data?.pagination?.totalPages}
        currentPage={q.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />
    </div>
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────────

function Audit() {
  const [page, setPage] = useState(1);
  const [createdAfter] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString());
  const q = useGetConfigAuditQuery({ page: String(page), created_after: createdAfter });

  return (
    <div className="space-y-5">
      <Header title="Configuration audit trail" description="Immutable changes from the last 30 days." />
      <Data
        loading={q.isLoading}
        heads={["Action", "Target", "Actor", "Reason", "Date"]}
        rows={(q.data?.data ?? []).map((x) => [
          x.action,
          `${x.target_type} · ${x.target_id}`,
          x.actor?.full_name ?? "System",
          x.reason || "—",
          new Date(x.created_at).toLocaleString(),
        ])}
        totalPage={q.data?.pagination?.totalPages}
        currentPage={q.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />
    </div>
  );
}
