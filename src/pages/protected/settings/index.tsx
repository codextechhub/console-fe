// Platform settings console over /config/: definitions catalogue, scoped
// values, capabilities, entitlements, overrides and the audit trail. Each tab
// is gated by its config.* view key; writes are gated per-action and enforced
// again server-side (creation endpoints are platform-only).

import { useState } from "react";
import { useSearchParams } from "react-router";
import { Download, Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import PageAccessDenied from "@/components/custom/page-access-denied";
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
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";
import {
  useArchiveCapabilityMutation,
  useArchiveConfigDefinitionMutation,
  useGetCapabilitiesQuery,
  useGetConfigAuditQuery,
  useGetConfigDefinitionsQuery,
  useGetConfigValuesQuery,
  useGetEntitlementsQuery,
  useGetOverridesQuery,
  useLazyExportConfigQuery,
} from "@/redux/services/config-api";
import { ConfigDialog, type ConfigDialogMode } from "./config-dialog";

type Tab = "values" | "definitions" | "capabilities" | "entitlements" | "overrides" | "audit";

const TABS: Array<{ key: Tab; label: string; permission: PermissionCode }> = [
  { key: "values", label: "Values", permission: P.VIEW_CONFIG_VALUES },
  { key: "definitions", label: "Definitions", permission: P.VIEW_CONFIG_DEFINITIONS },
  { key: "capabilities", label: "Capabilities", permission: P.VIEW_CAPABILITIES },
  { key: "entitlements", label: "Entitlements", permission: P.VIEW_ENTITLEMENTS },
  { key: "overrides", label: "Overrides", permission: P.VIEW_CONFIG_OVERRIDES },
  { key: "audit", label: "Audit Trail", permission: P.VIEW_CONFIG_AUDIT },
];

export default function Settings() {
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();
  const visible = TABS.filter((t) => hasPermission(t.permission));
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

        {tab === "definitions" && <Definitions />}
        {tab === "values" && <Values />}
        {tab === "capabilities" && <Capabilities />}
        {tab === "entitlements" && <Entitlements />}
        {tab === "overrides" && <Overrides />}
        {tab === "audit" && <Audit />}
      </main>
    </DashboardLayout>
  );
}

// ── Shared panel header with the gated "add" action ──────────────────────────

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
  children,
}: {
  title: string;
  description: string;
  /** Button label; omit for read-only panels (audit). */
  add?: string;
  mode?: ConfigDialogMode;
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
      {open && mode && <ConfigDialog mode={mode} close={() => setOpen(false)} />}
    </>
  );
}

// ── Panels ────────────────────────────────────────────────────────────────────

function Definitions() {
  const q = useGetConfigDefinitionsQuery();
  const { hasPermission } = usePermissions();
  const [archive] = useArchiveConfigDefinitionMutation();
  const canArchive = hasPermission(P.ARCHIVE_CONFIG_DEFINITION);

  return (
    <div className="space-y-5">
      <Header
        title="Configuration definitions"
        description="The catalogue of typed settings and their validation rules."
        add="New definition"
        mode="definition"
      />
      <Data
        loading={q.isLoading}
        heads={["Setting", "Type", "Scopes", "Sensitivity", "Updated", ...(canArchive ? ["Action"] : [])]}
        rows={(q.data?.data ?? []).map((x) => [
          <div>
            <p className="font-medium">{x.label}</p>
            <code className="text-[11px] text-gray-01">{x.key}</code>
          </div>,
          x.value_type,
          x.allowed_scopes.join(", "),
          x.sensitivity,
          new Date(x.updated_at).toLocaleDateString(),
          ...(canArchive
            ? [
                <ArchiveButton
                  label={x.label}
                  onConfirm={() => archive({ key: x.key, reason: "Archived from Settings console" })}
                />,
              ]
            : []),
        ])}
      />
    </div>
  );
}

function Values() {
  const q = useGetConfigValuesQuery({});
  const [search, setSearch] = useState("");
  // Client-side filter over the loaded rows (no server-side text search yet).
  const rows = (q.data?.data ?? []).filter(
    (x) => !search || x.key.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <Header
        title="Configuration values"
        description="Explicit values at platform, school and branch scope."
        add="Set value"
        mode="value"
      >
        <CustomInput
          id="config-values-search"
          canSearch
          placeholder="Filter loaded values by key"
          className="h-10"
          containerClass="w-full sm:w-[260px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Header>
      <Data
        loading={q.isLoading}
        heads={["Key", "Value", "Scope", "Updated by", "Updated"]}
        rows={rows.map((x) => [
          <code className="text-xs">{x.key}</code>,
          <code className="max-w-60 truncate text-xs">{JSON.stringify(x.value)}</code>,
          x.branch ? "Branch" : x.school ? "School" : "Platform",
          x.updated_by?.full_name ?? "System",
          new Date(x.updated_at).toLocaleDateString(),
        ])}
      />
    </div>
  );
}

function Capabilities() {
  const q = useGetCapabilitiesQuery();
  const { hasPermission } = usePermissions();
  const [archive] = useArchiveCapabilityMutation();
  const canManage = hasPermission(P.MANAGE_CAPABILITIES);

  return (
    <div className="space-y-5">
      <Header
        title="Capabilities"
        description="Feature availability, limits and dependency rules."
        add="New capability"
        mode="capability"
      />
      <Data
        loading={q.isLoading}
        heads={["Capability", "Kind", "Default", "Entitlement", "Dependencies", ...(canManage ? ["Action"] : [])]}
        rows={(q.data?.data ?? []).map((x) => [
          <div>
            <p className="font-medium">{x.label}</p>
            <code className="text-[11px] text-gray-01">{x.key}</code>
          </div>,
          x.kind,
          x.default_enabled ? "Enabled" : "Disabled",
          x.requires_entitlement ? "Required" : "No",
          x.dependencies.length || "—",
          ...(canManage
            ? [
                <ArchiveButton
                  label={x.label}
                  onConfirm={() => archive({ key: x.key, reason: "Archived from Settings console" })}
                />,
              ]
            : []),
        ])}
      />
    </div>
  );
}

function Entitlements() {
  const q = useGetEntitlementsQuery({});
  return (
    <div className="space-y-5">
      <Header
        title="Entitlements"
        description="Platform and school grants that unlock capabilities."
        add="Set entitlement"
        mode="entitlement"
      />
      <Data
        loading={q.isLoading}
        heads={["Capability", "School", "State", "Source", "Period"]}
        rows={(q.data?.data ?? []).map((x) => [
          x.capability_key,
          x.school ?? "Platform",
          x.state,
          x.source,
          x.starts_at ? new Date(x.starts_at).toLocaleDateString() : "Always",
        ])}
      />
    </div>
  );
}

function Overrides() {
  const q = useGetOverridesQuery({});
  return (
    <div className="space-y-5">
      <Header
        title="Overrides"
        description="Explicit school and branch capability decisions."
        add="Add override"
        mode="override"
      />
      <Data
        loading={q.isLoading}
        heads={["Capability", "Scope", "State", "Reason", "Updated"]}
        rows={(q.data?.data ?? []).map((x) => [
          x.capability_key,
          x.branch ? "Branch" : x.school ? "School" : "Platform",
          x.state,
          x.reason || "—",
          new Date(x.updated_at).toLocaleDateString(),
        ])}
      />
    </div>
  );
}

function Audit() {
  const [createdAfter] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString());
  const q = useGetConfigAuditQuery({ created_after: createdAfter });

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
      />
    </div>
  );
}

// ── Generic panel table (house CustomTable: loading, empty and phone cards) ──

function Data({ loading, heads, rows }: { loading: boolean; heads: string[]; rows: React.ReactNode[][] }) {
  const tableData = rows.map((r) => Object.fromEntries(r.map((cell, i) => [`c${i}`, cell])));
  return (
    <CustomTable
      tableHeaderList={heads}
      tableBodyList={tableData}
      loading={loading}
      emptyText="No records found."
      hidePagination
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
