import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  BookOpenCheck,
  Building2,
  CalendarDays,
  CalendarClock,
  CreditCard,
  Download,
  FileCog,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  Network,
  Plus,
  PlugZap,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  Workflow,
  CircleAlert,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/utils/api-errors";
import { CustomInput } from "@/components/custom/custom-input";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { SearchSelect } from "@/components/custom/search-select";
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
import {
  ConsoleSettingsLayout,
  PolicyBadge,
  SettingsOverviewCard,
  SettingsPanel,
  SettingsRow,
  SettingsSectionHeader,
  type ConsoleSettingsSection,
} from "@/components/settings/settings-layout";
import { usePermissions } from "@/hooks/use-permissions";
import { DEFAULT_SETTINGS_SECTION, type SettingsSection } from "./sections";
import { P, type PermissionCode } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useGetBranchesQuery, useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import {
  useArchiveCapabilityMutation,
  useArchiveConfigDefinitionMutation,
  useGetCapabilitiesQuery,
  useGetConfigAuditQuery,
  useGetConfigAuditDetailQuery,
  useGetConfigAuditFacetsQuery,
  useGetConfigDefinitionsQuery,
  useGetConfigValuesQuery,
  useGetEffectiveConfigQuery,
  useGetEffectiveCapabilitiesQuery,
  useGetEntitlementsQuery,
  useGetEntitlementCalendarQuery,
  useBulkScheduleEntitlementsMutation,
  useGetOverridesQuery,
  useGetPlatformSettingsQuery,
  useGetSecuritySettingsQuery,
  useGetIntegrationSettingsQuery,
  useLazyExportConfigQuery,
  useLazyExportConfigAuditQuery,
  useGetConfigAuditSavedViewsQuery,
  useSaveConfigAuditViewMutation,
  useDeleteConfigAuditViewMutation,
  useGetConfigAuditExportJobsQuery,
  useQueueConfigAuditExportMutation,
  useLazyDownloadConfigAuditExportQuery,
  useSetConfigValuesMutation,
  useResetConfigValueMutation,
  useSetEntitlementMutation,
  useResetEntitlementMutation,
  useSetOverrideMutation,
  useUpdatePlatformSettingsMutation,
  useUpdateSecuritySettingsMutation,
  useUpdateIntegrationSettingsMutation,
  useTestIntegrationConnectionMutation,
  type Capability,
  type ConfigAudit,
  type ConfigDefinition,
  type ConfigValue,
  type Entitlement,
  type EntitlementCalendarData,
  type EntitlementCalendarEntry,
  type ConfigAuditSavedView,
  type ConfigAuditExportJob,
  type Override,
  type PlatformSettingsProfile,
  type SchoolOnboardingDefaults,
  type SecuritySettingsData,
  type IntegrationSettingsData,
} from "@/redux/services/config-api";
import CustomTable from "@/components/custom/custom-table";
import { UserAvatar } from "@/components/custom/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfigDialog } from "./config-dialog";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

const S = routesPath.PROTECTED.SETTINGS.INDEX;

const ALL_SECTIONS: Array<ConsoleSettingsSection & { permissions?: PermissionCode[]; requireAll?: boolean }> = [
  { key: "overview", title: "Overview", description: "Configuration health", icon: Settings2 },
  { key: "platform-profile", title: "Platform profile", description: "Issuer identity", icon: Building2, permissions: [P.VIEW_CONFIG_VALUES] },
  { key: "school-onboarding", title: "School onboarding", description: "New tenant defaults", icon: Sparkles, permissions: [P.VIEW_CONFIG_VALUES] },
  { key: "payroll", title: "Payroll", description: "Central or per branch", icon: Landmark, permissions: [P.VIEW_CONFIG_VALUES] },
  { key: "security", title: "Security", description: "Runtime protection", icon: ShieldCheck, permissions: [P.VIEW_SECURITY_SETTINGS] },
  { key: "integrations", title: "Integrations", description: "Connections and delivery", icon: Network, permissions: [P.VIEW_INTEGRATION_SETTINGS] },
  { key: "features", title: "Features and access", description: "Plans and overrides", icon: SlidersHorizontal, permissions: [P.VIEW_CAPABILITIES] },
  { key: "administration", title: "Administration", description: "Specialist consoles", icon: Users },
  { key: "audit", title: "Audit and compliance", description: "Immutable history", icon: History, permissions: [P.VIEW_CONFIG_AUDIT] },
  { key: "advanced", title: "Advanced catalogue", description: "Typed configuration", icon: FileCog, permissions: [P.VIEW_CONFIG_DEFINITIONS, P.VIEW_CONFIG_VALUES], requireAll: true },
];

/** "notifications" → "Notifications", "parent_portal" → "Parent Portal". */
const pretty = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** `section` comes from the route table; see sections.ts. */
export default function Settings({ section = DEFAULT_SETTINGS_SECTION }: {
  section?: SettingsSection;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const visible = ALL_SECTIONS.filter(
    (item) => !item.permissions || (
      item.requireAll
        ? hasAllPermissions(...item.permissions)
        : hasAnyPermission(...item.permissions)
    ),
  );
  const [exportConfig, { isFetching }] = useLazyExportConfigQuery();

  if (!hasAnyPermission(
    P.VIEW_CONFIG_DEFINITIONS,
    P.VIEW_CONFIG_VALUES,
    P.VIEW_CAPABILITIES,
    P.VIEW_CONFIG_AUDIT,
    P.VIEW_SECURITY_SETTINGS,
    P.VIEW_INTEGRATION_SETTINGS,
  )) return <PageAccessDenied />;

  // Only sections that exist reach this component, so this fallback is now purely
  // about permission: a section the reader cannot see resolves to the overview
  // rather than 404-ing, because "not yours" is not "not found".
  const activeSection = visible.some((item) => item.key === section) ? section : "overview";

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
    <ConsoleSettingsLayout
      title="Platform Settings"
      description="Manage the defaults, identity and controls that apply across the CodeX platform. School records and daily operations stay in their specialist consoles."
      basePath={S}
      activeSection={activeSection}
      sections={visible}
      scopeLabel="Platform-wide"
      guideTargetPrefix="platform-settings"
    >
      {activeSection === "overview" ? (
        <PlatformOverview
          canExport={hasPermission(P.EXPORT_CONFIG)}
          exporting={isFetching}
          onExport={download}
        />
      ) : null}
      {activeSection === "platform-profile" ? <PlatformProfile /> : null}
      {activeSection === "school-onboarding" ? <SchoolOnboarding /> : null}
      {activeSection === "payroll" ? <PayrollScope /> : null}
      {activeSection === "security" ? <SecuritySettings /> : null}
      {activeSection === "integrations" ? <IntegrationSettings /> : null}
      {activeSection === "features" ? <Features /> : null}
      {activeSection === "administration" ? <Administration /> : null}
      {activeSection === "audit" ? <Audit /> : null}
      {activeSection === "advanced" ? <SystemSettings /> : null}
    </ConsoleSettingsLayout>
  );
}

function PlatformOverview({
  canExport,
  exporting,
  onExport,
}: {
  canExport: boolean;
  exporting: boolean;
  onExport: () => void;
}) {
  const { hasPermission, hasAllPermissions } = usePermissions();
  const canViewValues = hasPermission(P.VIEW_CONFIG_VALUES);
  const settings = useGetPlatformSettingsQuery(undefined, { skip: !canViewValues });
  const profileSources = settings.data?.data.sources.profile;
  const configuredProfileFields = profileSources
    ? Object.values(profileSources).filter((source) => source === "database").length
    : 0;

  return (
    <div data-guide="platform-settings.overview" className="space-y-5">
      <SettingsSectionHeader
        title="Configuration overview"
        description="Start with the platform identity and school onboarding defaults, then review access, audit and the low-level catalogue."
        action={canExport ? (
          <Button variant="outline" disabled={exporting} onClick={onExport}>
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Export snapshot"}
          </Button>
        ) : undefined}
      />

      <SettingsPanel title="Protected platform boundaries" description="These safeguards are visible for clarity, but are enforced in backend services and are not editable here.">
        <SettingsRow icon={LockKeyhole} label="Tenant and branch isolation" description="A request cannot cross into another school or branch by changing an identifier." badge={<PolicyBadge kind="enforced" />} />
        <SettingsRow icon={ShieldCheck} label="Backend permission checks" description="Viewing and saving are separately controlled by config.value.view and config.value.update." badge={<PolicyBadge kind="enforced" />} />
        <SettingsRow icon={History} label="Immutable settings audit" description="Every successful value change records the actor, reason and before-and-after values." badge={<PolicyBadge kind="enforced" />} />
      </SettingsPanel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {canViewValues ? <SettingsOverviewCard icon={Building2} title="Platform profile" description="Set the identity printed when CodeX issues Finance documents." to={`${S}/platform-profile`} status={`${configuredProfileFields} of 7 saved`} tone={configuredProfileFields > 0 ? "ready" : "attention"} /> : null}
        {canViewValues ? <SettingsOverviewCard icon={Sparkles} title="School onboarding" description="Choose the defaults applied only when a new school or branch omits a value." to={`${S}/school-onboarding`} status="New records only" tone="ready" /> : null}
        {hasPermission(P.VIEW_SECURITY_SETTINGS) ? <SettingsOverviewCard icon={ShieldCheck} title="Security" description="Control live lockout, recovery, invitation and proxy-session safeguards." to={`${S}/security`} status="Special permission" tone="attention" /> : null}
        {hasPermission(P.VIEW_INTEGRATION_SETTINGS) ? <SettingsOverviewCard icon={Network} title="Integrations" description="Manage email delivery defaults and review deployment-owned connection readiness." to={`${S}/integrations`} status="Special permission" /> : null}
        {hasPermission(P.VIEW_CAPABILITIES) ? <SettingsOverviewCard icon={SlidersHorizontal} title="Features and access" description="Manage product entitlements, dependencies and scoped feature overrides." to={`${S}/features`} status="Live controls" /> : null}
        <SettingsOverviewCard icon={Users} title="Administration" description="Open the dedicated consoles for people, roles, workflows, security and communications." to={`${S}/administration`} status="Linked consoles" />
        {hasPermission(P.VIEW_CONFIG_AUDIT) ? <SettingsOverviewCard icon={History} title="Audit and compliance" description="Review the immutable history for configuration and capability changes." to={`${S}/audit`} status="Recorded" tone="ready" /> : null}
        {hasAllPermissions(P.VIEW_CONFIG_DEFINITIONS, P.VIEW_CONFIG_VALUES) ? <SettingsOverviewCard icon={FileCog} title="Advanced catalogue" description="Maintain typed keys that have a verified runtime consumer." to={`${S}/advanced`} status="Expert use" tone="attention" /> : null}
      </div>
    </div>
  );
}

const PROFILE_FIELDS: Array<{
  key: keyof PlatformSettingsProfile;
  label: string;
  description: string;
  placeholder: string;
  type?: string;
}> = [
  { key: "name", label: "Platform name", description: "Primary issuer name on platform invoices and receipts.", placeholder: "CodeX" },
  { key: "tagline", label: "Tagline", description: "Short line displayed below the platform name.", placeholder: "Technology for better schools" },
  { key: "address", label: "Contact address", description: "Postal or office address printed on documents.", placeholder: "12 Marina, Lagos" },
  { key: "email", label: "Contact email", description: "Public billing or support email printed on documents.", placeholder: "billing@example.com", type: "email" },
  { key: "phone", label: "Contact phone", description: "Public phone number printed on documents.", placeholder: "+234..." },
  { key: "website", label: "Website", description: "Public website printed on documents.", placeholder: "https://example.com", type: "url" },
  { key: "logo_url", label: "Logo URL", description: "Public image URL used on platform-issued documents.", placeholder: "https://example.com/logo.png", type: "url" },
];

function SourceBadge({ source }: { source?: "database" | "environment" | "default" }) {
  if (source === "database") return <PolicyBadge kind="configured">Saved</PolicyBadge>;
  if (source === "environment") return <PolicyBadge kind="default">Environment fallback</PolicyBadge>;
  return <PolicyBadge kind="default">Product default</PolicyBadge>;
}

function PlatformProfile() {
  const { hasPermission } = usePermissions();
  const query = useGetPlatformSettingsQuery();
  const [save, saveState] = useUpdatePlatformSettingsMutation();
  const [draft, setDraft] = useState<PlatformSettingsProfile | null>(null);
  const canSave = hasPermission(P.UPDATE_CONFIG_VALUES);
  const values = draft ?? query.data?.data.profile;

  if (query.isLoading) return <Busy />;
  if (query.isError || !values) return <SettingsLoadError retry={query.refetch} />;
  const original = query.data?.data.profile;
  const dirty = draft !== null && JSON.stringify(values) !== JSON.stringify(original);

  const submit = async () => {
    try {
      await save({ profile: values, reason: "Updated platform issuer identity" }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("Platform profile saved");
    } catch {
      toast.error("Platform profile could not be saved");
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Platform profile"
        description="This identity is used when the platform itself issues a Finance invoice or receipt. Saved values override deployment fallbacks."
        action={canSave ? (
          <Button disabled={!dirty || saveState.isLoading || !values.name.trim()} onClick={submit}>
            <Save className="size-4" />
            {saveState.isLoading ? "Saving..." : "Save profile"}
          </Button>
        ) : <PolicyBadge kind="enforced">Read only</PolicyBadge>}
      />
      <SettingsPanel title="Issuer identity" description="Clear an optional field and save to return that field to its deployment fallback.">
        {PROFILE_FIELDS.map((field) => (
          <div key={field.key} className="grid grid-cols-1 gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor={`platform-${field.key}`} className="font-mont text-sm font-medium text-gray-01">{field.label}</label>
                <SourceBadge source={query.data?.data.sources.profile[field.key]} />
              </div>
              <p className="mt-0.5 font-mont text-xs leading-5 text-gray-05">{field.description}</p>
            </div>
            <Input
              id={`platform-${field.key}`}
              type={field.type ?? "text"}
              disabled={!canSave}
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => setDraft({ ...values, [field.key]: event.target.value })}
            />
          </div>
        ))}
      </SettingsPanel>
    </div>
  );
}

function SchoolOnboarding() {
  const { hasPermission } = usePermissions();
  const query = useGetPlatformSettingsQuery();
  const [save, saveState] = useUpdatePlatformSettingsMutation();
  const [draft, setDraft] = useState<SchoolOnboardingDefaults | null>(null);
  const canSave = hasPermission(P.UPDATE_CONFIG_VALUES);
  const values = draft ?? query.data?.data.onboarding;

  if (query.isLoading) return <Busy />;
  if (query.isError || !values) return <SettingsLoadError retry={query.refetch} />;
  const original = query.data?.data.onboarding;
  const dirty = draft !== null && JSON.stringify(values) !== JSON.stringify(original);
  const options = query.data?.data.options;

  const submit = async () => {
    try {
      await save({ onboarding: values, reason: "Updated school onboarding defaults" }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("School onboarding defaults saved");
    } catch {
      toast.error("School onboarding defaults could not be saved");
    }
  };

  const selectField = (
    key: keyof SchoolOnboardingDefaults,
    choices: Array<{ value: string; label: string }>,
  ) => (
    <NativeSelect
      disabled={!canSave}
      value={values[key]}
      onChange={(event) => setDraft({ ...values, [key]: event.target.value })}
    >
      {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </NativeSelect>
  );

  return (
    <div data-guide="platform-settings.school-onboarding" className="space-y-5">
      <SettingsSectionHeader
        title="School onboarding defaults"
        description="These values fill omitted fields when a new school or branch is created. They never rewrite an existing tenant, and an explicit onboarding value always wins."
        action={canSave ? (
          <Button disabled={!dirty || saveState.isLoading || !values.branch_country.trim()} onClick={submit}>
            <Save className="size-4" />
            {saveState.isLoading ? "Saving..." : "Save defaults"}
          </Button>
        ) : <PolicyBadge kind="enforced">Read only</PolicyBadge>}
      />
      <SettingsPanel title="New school defaults" description="Defaults are platform-wide and apply at creation time only.">
        <SettingsRow icon={Building2} label="Ownership type" description="Classification used when ownership is omitted." value={selectField("ownership_type", options?.ownership_types ?? [])} badge={<SourceBadge source={query.data?.data.sources.onboarding.ownership_type} />} />
        <SettingsRow icon={BookOpenCheck} label="Academic structure" description="Term or semester structure used when omitted." value={selectField("term_structure", options?.term_structures ?? [])} badge={<SourceBadge source={query.data?.data.sources.onboarding.term_structure} />} />
        <SettingsRow icon={Settings2} label="Billing currency" description="School billing currency used when omitted." value={selectField("currency", options?.currencies ?? [])} badge={<SourceBadge source={query.data?.data.sources.onboarding.currency} />} />
        <SettingsRow
          icon={Building2}
          label="Branch country"
          description="Country used for new inline and standalone branches when omitted."
          value={<Input className="w-full sm:w-64" disabled={!canSave} value={values.branch_country} onChange={(event) => setDraft({ ...values, branch_country: event.target.value })} />}
          badge={<SourceBadge source={query.data?.data.sources.onboarding.branch_country} />}
        />
      </SettingsPanel>
    </div>
  );
}

const SECURITY_SETTING_FIELDS: Array<{
  key: keyof SecuritySettingsData["settings"];
  label: string;
  description: string;
  suffix: string;
  min: number;
  max: number;
}> = [
  { key: "failed_login_threshold", label: "Failed login threshold", description: "Failed password attempts allowed before an account is locked.", suffix: "attempts", min: 3, max: 20 },
  { key: "account_lock_minutes", label: "Account lock duration", description: "How long a threshold-triggered account lock remains active.", suffix: "minutes", min: 5, max: 1440 },
  { key: "self_reset_expiry_hours", label: "Self-service reset lifetime", description: "Validity window for password reset links requested by the user.", suffix: "hours", min: 1, max: 24 },
  { key: "admin_reset_expiry_hours", label: "Admin reset lifetime", description: "Validity window for password reset links triggered by an administrator.", suffix: "hours", min: 1, max: 168 },
  { key: "invitation_expiry_days", label: "Invitation lifetime", description: "Validity window for new-user invitations, including a resent invitation.", suffix: "days", min: 1, max: 30 },
  { key: "proxy_idle_timeout_minutes", label: "Proxy session idle timeout", description: "Idle time allowed before an open-ended proxy session is expired.", suffix: "minutes", min: 5, max: 120 },
];

function securityFieldDescription(
  description: string,
  compliance?: SecuritySettingsData["compliance"][string],
) {
  if (!compliance) return description;
  const direction = compliance.direction === "maximum" ? "or lower" : "or higher";
  return `${description} This scope must stay at ${compliance.boundary} ${direction}, based on its ${compliance.parent_scope} baseline.`;
}

// The backend key, and the two values it takes. CENTRAL is the default, so a
// school that has never been touched runs exactly as it always did.
const PAYROLL_SCOPE_KEY = "payroll.scope";

const PAYROLL_SCOPE_OPTIONS = [
  {
    value: "CENTRAL",
    label: "One central run",
    description:
      "Payroll covers every active employee in a single run, whatever branch they are on. This is what a school does until somebody changes it.",
    icon: Landmark,
  },
  {
    value: "PER_BRANCH",
    label: "One run per branch",
    description:
      "Each branch runs its own payroll, covering exactly its own people. Every active employee must be on a branch first, or a branch run would miss them.",
    icon: Network,
  },
];

/**
 * How a school runs payroll: one central run, or one run per branch.
 *
 * The switch is trivial. The refusal is the feature.
 *
 * Turning PER_BRANCH on is refused while any active employee has no branch,
 * because a branch run reads its branch EXCLUSIVELY - an unassigned person is
 * on nobody's run and simply does not get paid, and the first anybody hears of
 * it is them asking where the month went. The backend names those people in
 * the refusal rather than counting them, and this panel keeps them on screen
 * instead of in a toast that vanishes: a bursar told "4 staff are unassigned"
 * has to search a roster of 109, while one told the four names can go and fix
 * them.
 */
function PayrollScope() {
  const { hasPermission } = usePermissions();
  const [school, setSchool] = useState("");
  const [refusal, setRefusal] = useState("");
  const canSave = hasPermission(P.UPDATE_CONFIG_VALUES);

  const scope: Record<string, string> = school ? { tenant: school } : {};
  const effective = useGetEffectiveConfigQuery(
    { ...scope, keys: PAYROLL_SCOPE_KEY },
    { skip: !school },
  );
  const [save, saveState] = useSetConfigValuesMutation();

  const current = String(
    (effective.data?.data as Record<string, unknown> | undefined)?.[PAYROLL_SCOPE_KEY] ?? "CENTRAL",
  );

  const choose = async (next: string) => {
    if (!school || next === current) return;
    setRefusal("");
    try {
      await save({
        values: [{ key: PAYROLL_SCOPE_KEY, value: next, reason: "Changed payroll scope" }],
        ...scope,
      }).unwrap();
      toast.success(
        next === "PER_BRANCH"
          ? "Payroll now runs per branch."
          : "Payroll now runs centrally.",
      );
    } catch (error) {
      // Held on screen rather than toasted: it names the people who still need
      // a branch, and that list is the thing the reader has to act on.
      setRefusal(apiErrorMessage(error, "The payroll scope could not be changed."));
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Payroll scope"
        description="Whether a school pays everybody in one run, or runs payroll separately for each branch. New schools run centrally until somebody changes this."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white-02 bg-white p-4">
        <ScopePicker value={school} onChange={(value) => { setSchool(value); setRefusal(""); }} />
        {!school ? (
          <p className="font-mont text-xs text-gray-05">
            Choose a school. Payroll scope is set per school, not platform-wide.
          </p>
        ) : null}
      </div>

      {school ? (
        <>
          {refusal ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <p className="flex items-start gap-2 font-mont text-sm font-semibold text-amber-800">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                Per-branch payroll is not possible yet
              </p>
              <p className="mt-1.5 pl-6 font-mont text-xs leading-5 text-amber-900">{refusal}</p>
              <p className="mt-2 pl-6 font-mont text-[11px] leading-4 text-amber-800">
                Give each of them a branch on the school&apos;s employee roster, then come back.
              </p>
            </div>
          ) : null}

          <SettingsPanel
            title="How this school runs payroll"
            description="Switching to per branch is refused while anybody active has no branch, because a branch run covers exactly its own people and would leave them unpaid."
          >
            {PAYROLL_SCOPE_OPTIONS.map((option) => (
              <SettingsRow
                key={option.value}
                icon={option.icon}
                label={option.label}
                description={option.description}
                value={
                  current === option.value ? (
                    <Badge variant="active" className="font-mont text-xs">In use</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canSave || saveState.isLoading || effective.isFetching}
                      onClick={() => choose(option.value)}
                    >
                      {saveState.isLoading ? "Saving..." : "Use this"}
                    </Button>
                  )
                }
              />
            ))}
          </SettingsPanel>
        </>
      ) : null}
    </div>
  );
}

function SecuritySettings() {
  const { hasPermission } = usePermissions();
  const [school, setSchool] = useState("");
  const [branch, setBranch] = useState("");
  const scope = { ...(school ? { tenant: school } : {}), ...(branch ? { branch } : {}) };
  const query = useGetSecuritySettingsQuery(scope);
  const [save, saveState] = useUpdateSecuritySettingsMutation();
  const [draft, setDraft] = useState<SecuritySettingsData["settings"] | null>(null);
  const canSave = hasPermission(P.MANAGE_SECURITY_SETTINGS);
  const values = draft ?? query.data?.data.settings;

  if (query.isLoading) return <Busy />;
  if (query.isError || !values) return <SettingsLoadError retry={query.refetch} />;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(query.data?.data.settings);
  const valid = SECURITY_SETTING_FIELDS.every((field) => {
    const compliance = query.data?.data.compliance[field.key];
    const minimum = compliance?.direction === "minimum" ? compliance.boundary : field.min;
    const maximum = compliance?.direction === "maximum" ? compliance.boundary : field.max;
    return Number.isFinite(values[field.key])
      && values[field.key] >= minimum
      && values[field.key] <= maximum;
  });

  const submit = async () => {
    try {
      await save({ ...values, ...scope, reason: "Updated runtime security settings" }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("Security settings saved");
    } catch {
      toast.error("Security settings could not be saved");
    }
  };

  const reset = async (key: keyof SecuritySettingsData["settings"]) => {
    try {
      await save({ [key]: null, ...scope, reason: `Reset ${key} to inherited security baseline` }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("Security setting reset");
    } catch {
      toast.error("Security setting could not be reset");
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Runtime security"
        description="These values are read by live authentication and proxy-session services. School and branch overrides may tighten a parent baseline, but can never weaken it."
        action={canSave ? (
          <Button disabled={!dirty || !valid || saveState.isLoading} onClick={submit}>
            <Save className="size-4" />
            {saveState.isLoading ? "Saving..." : "Save security"}
          </Button>
        ) : <PolicyBadge kind="enforced">Read only</PolicyBadge>}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white-02 bg-white p-4">
        <ScopePicker value={school} onChange={(value) => { setSchool(value); setBranch(""); setDraft(null); }} />
        <SecurityBranchPicker school={school} value={branch} onChange={(value) => { setBranch(value); setDraft(null); }} />
        <PolicyBadge kind="enforced">
          {branch ? "Branch override" : school ? "School override" : "Platform baseline"}
        </PolicyBadge>
      </div>
      <SettingsPanel title="Authentication and access recovery" description="Tighter values reduce exposure but can increase support requests. Every save and reset is audited.">
        {SECURITY_SETTING_FIELDS.map((field) => (
          <SettingsRow
            key={field.key}
            icon={ShieldCheck}
            label={field.label}
            description={securityFieldDescription(field.description, query.data?.data.compliance[field.key])}
            badge={<SecuritySourceBadge source={query.data?.data.source_scopes[field.key]} />}
            value={(
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={field.label}
                    type="number"
                    min={query.data?.data.compliance[field.key]?.direction === "minimum" ? query.data.data.compliance[field.key].boundary : field.min}
                    max={query.data?.data.compliance[field.key]?.direction === "maximum" ? query.data.data.compliance[field.key].boundary : field.max}
                    disabled={!canSave}
                    className="w-24"
                    value={values[field.key]}
                    onChange={(event) => setDraft({ ...values, [field.key]: Number(event.target.value) })}
                  />
                  <span className="w-16 text-left font-mont text-xs text-gray-05">{field.suffix}</span>
                </div>
                {canSave && query.data?.data.overrides[field.key] ? (
                  <Button variant="white" size="sm" disabled={saveState.isLoading} onClick={() => reset(field.key)}>
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                ) : null}
              </div>
            )}
          />
        ))}
      </SettingsPanel>
    </div>
  );
}

function SecuritySourceBadge({ source }: { source?: "default" | "platform" | "school" | "branch" }) {
  if (source === "branch") return <PolicyBadge kind="configured">Branch override</PolicyBadge>;
  if (source === "school") return <PolicyBadge kind="configured">School baseline</PolicyBadge>;
  if (source === "platform") return <PolicyBadge kind="enforced">Platform baseline</PolicyBadge>;
  return <PolicyBadge kind="default">Product default</PolicyBadge>;
}

function SecurityBranchPicker({ school, value, onChange }: { school: string; value: string; onChange: (value: string) => void }) {
  const branches = useGetBranchesQuery(
    { slug: school, params: { page_size: 100 } },
    { skip: !school },
  );
  if (!school) return null;
  return (
    <div className="w-full sm:w-[240px]">
      <NativeSelect value={value} disabled={branches.isLoading} onChange={(event) => onChange(event.target.value)}>
        <option value="">Whole school</option>
        {(branches.data?.data ?? []).map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
      </NativeSelect>
    </div>
  );
}

const INTEGRATION_NUMBER_FIELDS: Array<{
  key: "email_max_retries" | "email_retry_backoff_seconds";
  label: string;
  description: string;
  suffix: string;
  min: number;
  max: number;
}> = [
  { key: "email_max_retries", label: "Email retry budget", description: "Additional delivery attempts after an email send fails.", suffix: "retries", min: 0, max: 10 },
  { key: "email_retry_backoff_seconds", label: "Email retry delay", description: "Fixed wait between queued email delivery attempts.", suffix: "seconds", min: 1, max: 3600 },
];

function IntegrationSettings() {
  const { hasPermission } = usePermissions();
  const query = useGetIntegrationSettingsQuery();
  const [save, saveState] = useUpdateIntegrationSettingsMutation();
  const [testConnection, testState] = useTestIntegrationConnectionMutation();
  const [testResult, setTestResult] = useState<Partial<Record<"email" | "payments", boolean>>>({});
  const [draft, setDraft] = useState<IntegrationSettingsData["settings"] | null>(null);
  const canSave = hasPermission(P.MANAGE_INTEGRATION_SETTINGS);
  const values = draft ?? query.data?.data.settings;

  if (query.isLoading) return <Busy />;
  if (query.isError || !values) return <SettingsLoadError retry={query.refetch} />;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(query.data?.data.settings);
  const valid = INTEGRATION_NUMBER_FIELDS.every(
    (field) => Number.isFinite(values[field.key])
      && values[field.key] >= field.min
      && values[field.key] <= field.max,
  );

  const submit = async () => {
    try {
      await save({ ...values, reason: "Updated integration delivery settings" }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("Integration settings saved");
    } catch {
      toast.error("Integration settings could not be saved");
    }
  };

  const reset = async (key: keyof IntegrationSettingsData["settings"]) => {
    try {
      await save({ [key]: null, reason: `Reset ${key} to its fallback` }).unwrap();
      await query.refetch();
      setDraft(null);
      toast.success("Integration setting reset");
    } catch {
      toast.error("Integration setting could not be reset");
    }
  };

  const runConnectionTest = async (connection: "email" | "payments") => {
    try {
      const result = await testConnection({ connection }).unwrap();
      setTestResult((current) => ({ ...current, [connection]: result.data.connected }));
      if (result.data.connected) toast.success(`${pretty(connection)} connection succeeded`);
      else toast.error(result.data.message);
    } catch {
      toast.error(`${pretty(connection)} connection test could not run`);
    }
  };

  const status = query.data?.data.status;
  return (
    <div data-guide="platform-settings.integrations" className="space-y-5">
      <SettingsSectionHeader
        title="Integrations and delivery"
        description="Permitted operators can change safe runtime delivery defaults directly. Hosts, API keys, callback URLs and credentials stay deployment-owned."
        action={canSave ? (
          <Button disabled={!dirty || !valid || saveState.isLoading || !values.email_sender_name.trim() || !values.email_sender_address.includes("@")} onClick={submit}>
            <Save className="size-4" />
            {saveState.isLoading ? "Saving..." : "Save integrations"}
          </Button>
        ) : <PolicyBadge kind="enforced">Read only</PolicyBadge>}
      />
      <div data-guide="platform-settings.integration-email">
      <SettingsPanel title="Outbound email defaults" description="These values affect new sends immediately. Per-message sender names still take precedence.">
        <SettingsRow
          icon={Mail}
          label="Default sender name"
          description="Display name used when a message does not supply its own sender."
          badge={<SourceBadge source={query.data?.data.sources.email_sender_name} />}
          value={<IntegrationTextControl field="email_sender_name" label="Default sender name" values={values} canSave={canSave} busy={saveState.isLoading} onChange={setDraft} onReset={reset} source={query.data?.data.sources.email_sender_name} />}
        />
        <SettingsRow
          icon={Mail}
          label="Default sender address"
          description="From address used for platform email. It does not change SMTP credentials."
          badge={<SourceBadge source={query.data?.data.sources.email_sender_address} />}
          value={<IntegrationTextControl field="email_sender_address" label="Default sender address" type="email" values={values} canSave={canSave} busy={saveState.isLoading} onChange={setDraft} onReset={reset} source={query.data?.data.sources.email_sender_address} />}
        />
        {INTEGRATION_NUMBER_FIELDS.map((field) => (
          <SettingsRow
            key={field.key}
            icon={Mail}
            label={field.label}
            description={field.description}
            badge={<SourceBadge source={query.data?.data.sources[field.key]} />}
            value={(
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Input type="number" aria-label={field.label} min={field.min} max={field.max} disabled={!canSave} className="w-24" value={values[field.key]} onChange={(event) => setDraft({ ...values, [field.key]: Number(event.target.value) })} />
                  <span className="w-16 text-left font-mont text-xs text-gray-05">{field.suffix}</span>
                </div>
                {canSave && query.data?.data.sources[field.key] === "database" ? <Button variant="white" size="sm" disabled={saveState.isLoading} onClick={() => reset(field.key)}><RotateCcw className="size-3.5" />Reset</Button> : null}
              </div>
            )}
          />
        ))}
      </SettingsPanel>
      </div>
      <div data-guide="platform-settings.integration-connections">
      <SettingsPanel title="Deployment-owned connections" description="Readiness is safe to display. Secret values and infrastructure endpoints cannot be changed from the dashboard.">
        <SettingsRow
          icon={Mail}
          label="Email transport"
          description={status?.email.host || "No SMTP host reported"}
          badge={<PolicyBadge kind={testResult.email === false ? "default" : status?.email.configured ? "configured" : "default"}>{testResult.email === true ? "Test passed" : testResult.email === false ? "Test failed" : status?.email.configured ? "Configured" : "Needs deployment setup"}</PolicyBadge>}
          value={canSave ? <Button variant="outline" size="sm" disabled={testState.isLoading || !status?.email.configured} onClick={() => runConnectionTest("email")}><PlugZap className="size-3.5" />Test SMTP</Button> : <span className="font-mont text-xs text-gray-05">Credentials in deployment</span>}
        />
        <SettingsRow
          icon={CreditCard}
          label={`${status?.payments.provider || "Payment"} payments`}
          description="Runs a read-only provider credential check. It never creates a charge, transfer, or customer."
          badge={<PolicyBadge kind={testResult.payments === false ? "default" : status?.payments.configured ? "configured" : "default"}>{testResult.payments === true ? "Test passed" : testResult.payments === false ? "Test failed" : status?.payments.configured ? "Configured" : "Needs deployment setup"}</PolicyBadge>}
          value={canSave ? <Button variant="outline" size="sm" disabled={testState.isLoading || !status?.payments.configured} onClick={() => runConnectionTest("payments")}><PlugZap className="size-3.5" />Test payment</Button> : <span className="font-mont text-xs text-gray-05">Keys in deployment</span>}
        />
        <SettingsRow icon={Network} label="Public application URL" description={status?.public_application.base_url || "Not configured"} badge={<PolicyBadge kind="enforced">Deployment-owned</PolicyBadge>} />
      </SettingsPanel>
      </div>
    </div>
  );
}

function IntegrationTextControl({
  field,
  label,
  type = "text",
  values,
  canSave,
  busy,
  onChange,
  onReset,
  source,
}: {
  field: "email_sender_name" | "email_sender_address";
  label: string;
  type?: string;
  values: IntegrationSettingsData["settings"];
  canSave: boolean;
  busy: boolean;
  onChange: (value: IntegrationSettingsData["settings"]) => void;
  onReset: (field: keyof IntegrationSettingsData["settings"]) => void;
  source?: string;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <Input className="w-full sm:w-64" aria-label={label} type={type} disabled={!canSave} value={values[field]} onChange={(event) => onChange({ ...values, [field]: event.target.value })} />
      {canSave && source === "database" ? <Button variant="white" size="sm" disabled={busy} onClick={() => onReset(field)}><RotateCcw className="size-3.5" />Reset</Button> : null}
    </div>
  );
}

function Administration() {
  const { hasPermission } = usePermissions();
  const links = [
    { show: hasPermission(P.ACCESS_TEAM_PANEL), icon: Users, label: "Platform team", description: "Invite staff and maintain platform team records.", to: routesPath.PROTECTED.TEAM_MGT.CX },
    { show: hasPermission(P.VIEW_ROLES), icon: ShieldCheck, label: "Roles and assignments", description: "Define roles and assign platform permissions.", to: routesPath.PROTECTED.ROLES.INDEX },
    { show: hasPermission(P.VIEW_WORKFLOW_TEMPLATES), icon: Workflow, label: "Workflow templates", description: "Design approval routes used by operational modules.", to: routesPath.PROTECTED.WORKFLOW.TEMPLATES },
    { show: hasPermission(P.CONFIGURE_NOTIFICATION_TEMPLATES), icon: Mail, label: "Communication templates", description: "Manage notification templates in the communications console.", to: routesPath.PROTECTED.NOTIFICATIONS_ADMIN },
    { show: hasPermission(P.VIEW_SECURITY), icon: LockKeyhole, label: "Security operations", description: "Review sessions, attempts, lockouts and impersonation activity.", to: routesPath.PROTECTED.AUDIT.SESSIONS },
  ].filter((item) => item.show);

  return (
    <div className="space-y-5">
      <SettingsSectionHeader title="Administration" description="Platform Settings explains ownership and defaults. Detailed records stay in the consoles built for those jobs." />
      <SettingsPanel title="Specialist consoles" description="Your permissions determine which destinations are available.">
        {links.length ? links.map((item) => (
          <SettingsRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            description={item.description}
            value={<Button asChild variant="outline" size="sm"><Link to={item.to}>Open console</Link></Button>}
          />
        )) : <SettingsRow icon={LockKeyhole} label="No administration consoles available" description="Your role can view Platform Settings but does not include specialist administration access." />}
      </SettingsPanel>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

/** Platform-or-school scope picker ("" = platform). */
function ScopePicker({ value, onChange }: { value: string; onChange: (schoolId: string) => void }) {
  const { hasPermission } = usePermissions();
  const canBrowseSchools = hasPermission(P.BROWSE_SCHOOLS);
  const schools = useGetSchoolsQuery({ page_size: 100 }, { skip: !canBrowseSchools });
  if (!canBrowseSchools) {
    return <Badge variant="outline" className="font-mont text-xs">Platform scope</Badge>;
  }
  return (
    <div className="w-full sm:w-[260px]">
      <SearchSelect
        placeholder="Platform (all schools)"
        loading={schools.isLoading}
        options={(schools.data?.data ?? []).map((s) => ({ value: s.slug, label: s.name }))}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Busy() {
  return (
    <div className={cn(INFORMATION_CARD_SURFACE, "grid h-48 place-content-center rounded-md")}>
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

function SettingsLoadError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-48 place-content-center rounded-xl border border-white-02 bg-white p-6 text-center">
      <p className="font-mont text-sm font-semibold text-gray-01">Settings could not be loaded</p>
      <p className="mt-1 font-mont text-xs text-gray-05">Check your access or try the request again.</p>
      <Button className="mx-auto mt-4" variant="outline" size="sm" onClick={retry}>Try again</Button>
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
          <h2 className="font-mont text-base font-semibold">Advanced configuration catalogue</h2>
          <p className="mt-1 max-w-2xl font-mont text-xs leading-5 text-gray-05">
            Low-level typed keys for settings with a verified product consumer. Changes apply immediately and are audited.
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
        <div className={cn(INFORMATION_CARD_SURFACE, "grid h-40 place-content-center rounded-md text-sm text-gray-01")}>
          No settings match your search.
        </div>
      ) : (
        <div className="divide-y divide-white-02 rounded-xl border border-white-02 bg-white">
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
  const [resetValue, resetState] = useResetConfigValueMutation();
  const [archive] = useArchiveConfigDefinitionMutation();
  const effective = row ? row.value : def.default_value;
  const [draft, setDraft] = useState<string>(effective == null ? "" : String(effective));
  const [editingJson, setEditingJson] = useState(false);
  const productOwned = def.key.startsWith("platform.profile.")
    || def.key.startsWith("platform.onboarding.")
    || def.key.startsWith("security.")
    || def.key.startsWith("integrations.")
    || def.key.startsWith("notifications.");
  const specialManaged = def.key.startsWith("security.")
    || def.key.startsWith("integrations.")
    || def.key.startsWith("notifications.");
  const canSetHere = canSet && !specialManaged;

  const write = async (value: unknown) => {
    try {
      await save({
        values: [{ key: def.key, value, reason: "Updated from System Settings" }],
      }).unwrap();
      toast.success(`${def.label} updated`);
    } catch (error) {
      // The endpoint opts out of the global 400 toast, because the payroll
      // panel shows its refusal on screen instead. This row has no such place,
      // so it says it here rather than failing silently.
      toast.error(apiErrorMessage(error, `${def.label} could not be updated`));
      throw error;
    }
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
    <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {def.label}
          {row ? (
            <Badge className="bg-primary/10 px-1.5 font-mont text-[10px] text-primary">Customised</Badge>
          ) : (
            <Badge variant="inactive" className="px-1.5 font-mont text-[10px]">Default</Badge>
          )}
          {productOwned ? <PolicyBadge kind="enforced">Product-owned schema</PolicyBadge> : null}
          {specialManaged ? <PolicyBadge kind="default">Use dedicated section</PolicyBadge> : null}
        </p>
        {def.description && <p className="text-xs leading-5 text-gray-01">{def.description}</p>}
        {def.consumer ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-05">
            <PolicyBadge kind="configured">Used by {def.consumer.service}</PolicyBadge>
            <code title={def.consumer.consumer} className="max-w-full truncate rounded bg-gray-02 px-1.5 py-0.5">{def.consumer.consumer}</code>
            <span className="basis-full leading-4">{def.consumer.impact}</span>
          </div>
        ) : (
          <div className="mt-2"><PolicyBadge kind="default">Consumer not registered</PolicyBadge></div>
        )}
        {canArchive && !productOwned && (
          <p className="mt-1 text-[11px]">
            <ArchiveButton
              label={def.label}
              onConfirm={() => archive({ key: def.key, reason: "Archived from Settings console" })}
            />
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {row && canSetHere ? (
          <Button
            variant="white"
            size="sm"
            disabled={resetState.isLoading}
            onClick={async () => {
              try {
                const result = await resetValue({ key: def.key, reason: "Reset from Advanced Settings" }).unwrap();
                setDraft(result.data.effective_value == null ? "" : String(result.data.effective_value));
                toast.success(`${def.label} reset to ${result.data.source}`);
              } catch {
                toast.error(`${def.label} could not be reset`);
              }
            }}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        ) : null}
        {inline === "toggle" && (
          <Switch
            disabled={!canSetHere || isLoading}
            checked={effective === true}
            onCheckedChange={(v) => write(v)}
          />
        )}
        {(inline === "number" || inline === "text") && (
          <>
            <Input
              type={inline === "number" ? "number" : "text"}
              step={def.value_type === "DECIMAL" ? "any" : undefined}
              disabled={!canSetHere || isLoading}
              className="h-9 w-36 sm:w-44"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {isDirty && canSetHere && (
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
            {canSetHere && (
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
  const scope: Record<string, string> = school ? { tenant: school } : {};
  const catalogue = useGetCapabilitiesQuery({ page_size: "100" });
  const effective = useGetEffectiveCapabilitiesQuery(scope);
  const canViewEntitlements = hasPermission(P.VIEW_ENTITLEMENTS);
  const canViewOverrides = hasPermission(P.VIEW_CONFIG_OVERRIDES);
  // The scoped lists back the two plain controls ("In plan" / "Status").
  const entitlements = useGetEntitlementsQuery(
    { page_size: "100", ...scope },
    { skip: !canViewEntitlements },
  );
  const entitlementCalendar = useGetEntitlementCalendarQuery(
    {
      window_days: "90",
      ...(school ? { tenant: school } : { all_tenants: "true" }),
    },
    { skip: !canViewEntitlements },
  );
  const overrides = useGetOverridesQuery(
    { page_size: "100", ...scope },
    { skip: !canViewOverrides },
  );
  const canCreate = hasPermission(P.MANAGE_CAPABILITIES);

  if (catalogue.isLoading || effective.isLoading) return <Busy />;

  const enabled = new Map((effective.data?.data ?? []).map((e) => [e.key, e.enabled]));
  const entByKey = new Map((entitlements.data?.data ?? []).map((e) => [e.capability_key, e]));
  const overrideByKey = new Map((overrides.data?.data ?? []).map((o) => [o.capability_key, o]));
  const labelByKey = new Map((catalogue.data?.data ?? []).map((c) => [c.key, c.label]));
  // A feature with any dependency off at this scope resolves Off no matter
  // what its own levers say - the rows must explain that.
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
          <h2 className="font-mont text-base font-semibold">Features and access</h2>
          <p className="mt-1 max-w-2xl font-mont text-xs leading-5 text-gray-05">
            What's switched on - platform-wide or for one school. “In plan” is the commercial grant;
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

      {canViewEntitlements ? (
        <EntitlementRenewalCalendar
          data={entitlementCalendar.data?.data}
          loading={entitlementCalendar.isLoading}
          scopeLabel={school || "All schools and platform"}
          canManage={hasPermission(P.MANAGE_ENTITLEMENTS)}
        />
      ) : null}

      <div className="divide-y divide-white-02 rounded-xl border border-white-02 bg-white">
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

function EntitlementRenewalCalendar({
  data,
  loading,
  scopeLabel,
  canManage,
}: {
  data?: EntitlementCalendarData;
  loading: boolean;
  scopeLabel: string;
  canManage: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [minimumScheduleDate] = useState(() => toLocalDateTimeValue(new Date().toISOString()));
  const [bulkSchedule, bulkState] = useBulkScheduleEntitlementsMutation();
  const entries = data?.entries ?? [];
  const visibleEntries = entries.slice(0, 30);
  const selectedEntries = entries.filter((entry) => selected.has(entry.id));
  const invalidRange = Boolean(startsAt && endsAt && new Date(startsAt).getTime() >= new Date(endsAt).getTime());
  const expiredEnd = Boolean(endsAt && new Date(endsAt).getTime() <= new Date(minimumScheduleDate).getTime());

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const schedule = async () => {
    if (selectedEntries.length === 0 || (!startsAt && !endsAt) || invalidRange || expiredEnd) return;
    try {
      await bulkSchedule({
        items: selectedEntries.map((entry) => ({
          capability: entry.capability,
          ...(entry.tenant_slug ? { tenant: entry.tenant_slug } : {}),
        })),
        ...(startsAt ? { starts_at: new Date(startsAt).toISOString() } : {}),
        ...(endsAt ? { ends_at: new Date(endsAt).toISOString() } : {}),
        reason: `Bulk renewal schedule for ${selectedEntries.length} entitlement${selectedEntries.length === 1 ? "" : "s"}`,
      }).unwrap();
      setSelected(new Set());
      setStartsAt("");
      setEndsAt("");
      toast.success(`${selectedEntries.length} entitlement schedule${selectedEntries.length === 1 ? "" : "s"} updated`);
    } catch {
      toast.error("The selected entitlement schedules could not be updated");
    }
  };

  return (
    <SettingsPanel
      title="Renewal calendar"
      description={`Expiry warnings and scheduled activations for ${scopeLabel}. The calendar covers the next 90 days.`}
    >
      {loading ? <div className="p-5"><Busy /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3 border-b border-white-02 p-4 sm:p-5 lg:grid-cols-5">
            <RenewalMetric label="Expired" value={data?.summary.expired ?? 0} tone="danger" />
            <RenewalMetric label="Next 7 days" value={data?.summary.expiring_7_days ?? 0} tone="danger" />
            <RenewalMetric label="Next 30 days" value={data?.summary.expiring_30_days ?? 0} tone="warning" />
            <RenewalMetric label="Next 90 days" value={data?.summary.expiring_90_days ?? 0} />
            <RenewalMetric label="Scheduled" value={data?.summary.scheduled ?? 0} />
          </div>

          {(data?.summary.expired ?? 0) + (data?.summary.expiring_7_days ?? 0) > 0 ? (
            <div className="mx-4 mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 font-mont text-xs leading-5 text-error-text sm:mx-5">
              Immediate attention: renew expired grants and grants ending within seven days, or affected schools may lose access automatically.
            </div>
          ) : null}

          {visibleEntries.length === 0 ? (
            <div className="p-5 font-mont text-sm text-gray-05">No scheduled activation or expiry falls in this window.</div>
          ) : (
            <div className="divide-y divide-white-02">
              {visibleEntries.map((entry) => (
                <EntitlementCalendarRow
                  key={entry.id}
                  entry={entry}
                  selected={selected.has(entry.id)}
                  selectable={canManage}
                  onToggle={() => toggle(entry.id)}
                />
              ))}
              {entries.length > visibleEntries.length || data?.truncated ? (
                <p className="px-4 py-3 font-mont text-xs text-gray-05 sm:px-5">
                  Showing the first {visibleEntries.length} calendar entries. Narrow the school scope to schedule a specific renewal.
                </p>
              ) : null}
            </div>
          )}

          {canManage ? (
            <div className="grid grid-cols-1 gap-3 border-t border-white-02 p-4 sm:p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="space-y-1 font-mont text-xs text-gray-01">New activation (optional)<Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
              <label className="space-y-1 font-mont text-xs text-gray-01">New expiry (optional)<Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
              <Button disabled={selectedEntries.length === 0 || (!startsAt && !endsAt) || invalidRange || expiredEnd || bulkState.isLoading} onClick={schedule}>
                <CalendarClock className="size-4" />
                {bulkState.isLoading ? "Scheduling..." : `Schedule ${selectedEntries.length || "selected"}`}
              </Button>
              {invalidRange || expiredEnd ? <p className="font-mont text-xs text-destructive lg:col-span-3">Expiry must be in the future and after activation.</p> : null}
            </div>
          ) : null}
        </>
      )}
    </SettingsPanel>
  );
}

function RenewalMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" | "danger" }) {
  const valueClass = tone === "danger" ? "text-error-text" : tone === "warning" ? "text-yellow-01-text" : "text-gray-01";
  return <div className="min-w-0 rounded-lg bg-gray-02 p-3"><p className={`font-mont text-xl font-semibold ${valueClass}`}>{value}</p><p className="mt-1 font-mont text-xs text-gray-05">{label}</p></div>;
}

function EntitlementCalendarRow({ entry, selected, selectable, onToggle }: { entry: EntitlementCalendarEntry; selected: boolean; selectable: boolean; onToggle: () => void }) {
  const date = entry.status === "scheduled" ? entry.starts_at : entry.ends_at;
  const warningVariant = entry.warning === "expired" || entry.warning === "critical"
    ? "rejected"
    : entry.warning === "warning" || entry.warning === "notice"
    ? "pending"
    : entry.warning === "scheduled"
    ? "default"
    : "inactive";
  const warningLabel = entry.warning === "expired"
    ? "Expired"
    : entry.warning === "critical"
    ? "Within 7 days"
    : entry.warning === "warning"
    ? "Within 30 days"
    : entry.warning === "notice"
    ? "Within 90 days"
    : entry.warning === "scheduled"
    ? "Activation"
    : pretty(entry.status);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      {selectable ? <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected} onChange={onToggle} aria-label={`Select ${entry.capability_label} for bulk scheduling`} /> : null}
      <CalendarDays className="hidden size-4 shrink-0 text-gray-05 sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mont text-sm font-medium text-gray-01">{entry.capability_label}</p>
        <p className="mt-0.5 truncate font-mont text-xs text-gray-05">{entry.scope === "platform" ? "Platform" : entry.tenant_name || entry.tenant_slug}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="font-mont text-xs text-gray-05">{date ? new Date(date).toLocaleString() : "No date"}</span>
        <Badge variant={warningVariant} className="font-mont text-xs">{warningLabel}</Badge>
      </div>
    </div>
  );
}

type DepStatus = { label: string; on: boolean };

function entitlementTiming(entitlement?: Entitlement) {
  if (!entitlement || entitlement.state !== "GRANTED") return "Not granted";
  const now = Date.now();
  if (entitlement.starts_at && new Date(entitlement.starts_at).getTime() > now) {
    return `Starts ${new Date(entitlement.starts_at).toLocaleString()}`;
  }
  if (entitlement.ends_at && new Date(entitlement.ends_at).getTime() <= now) return "Expired";
  if (entitlement.ends_at) return `Expires ${new Date(entitlement.ends_at).toLocaleString()}`;
  return "Active now";
}

function toLocalDateTimeValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

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
  const [resetEntitlement, resetState] = useResetEntitlementMutation();
  const [setOver, overState] = useSetOverrideMutation();
  const canViewEntitlements = hasPermission(P.VIEW_ENTITLEMENTS);
  const canViewOverrides = hasPermission(P.VIEW_CONFIG_OVERRIDES);
  const canEntitle = canViewEntitlements && hasPermission(P.MANAGE_ENTITLEMENTS);
  const canOverride = canViewOverrides && hasPermission(P.MANAGE_CONFIG_OVERRIDES);
  const scopeBody: Record<string, string> = school ? { tenant: school } : {};

  const inPlan = entitlement?.state === "GRANTED";
  const status = override?.state && override.state !== "INHERIT" ? override.state : "INHERIT";
  const unmet = deps.filter((d) => !d.on);

  return (
    <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
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

      <div className="flex w-full flex-wrap items-center gap-4 xl:w-auto xl:shrink-0">
        {!canViewEntitlements && cap.requires_entitlement ? (
          <span className="text-xs text-gray-05">Plan protected</span>
        ) : cap.requires_entitlement ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-01">
            <span>In plan</span>
            <Switch
              disabled={!canEntitle || entState.isLoading}
              checked={inPlan}
              onCheckedChange={async (v) => {
                await setEnt({
                  capability: cap.key,
                  state: v ? "GRANTED" : "DENIED",
                  source: "MANUAL",
                  starts_at: null,
                  ends_at: null,
                  reason: "Changed from the Features switchboard",
                  ...scopeBody,
                }).unwrap();
                toast.success(`${cap.label}: ${v ? "included in" : "removed from"} plan`);
              }}
            />
            {entitlement ? (
              <Button
                variant="white"
                size="sm"
                disabled={!canEntitle || resetState.isLoading}
                onClick={async () => {
                  try {
                    await resetEntitlement({
                      capability: cap.key,
                      reason: "Reset entitlement to inherited plan",
                      ...(school ? { tenant: school } : {}),
                    }).unwrap();
                    toast.success(
                      school
                        ? `${cap.label} now follows the inherited plan`
                        : `${cap.label} platform grant was reset`,
                    );
                  } catch {
                    toast.error(`${cap.label} entitlement could not be reset`);
                  }
                }}
              >
                <RotateCcw className="size-3.5" />
                {school ? "Inherit" : "Reset"}
              </Button>
            ) : null}
            {entitlement?.state === "GRANTED" ? <span className="text-[11px] text-gray-05">{entitlementTiming(entitlement)}</span> : null}
          </div>
        ) : (
          <span className="text-xs text-gray-01">No plan needed</span>
        )}

        {canViewOverrides ? (
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
        ) : <span className="text-xs text-gray-05">Status protected</span>}
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
  const canViewEntitlements = hasPermission(P.VIEW_ENTITLEMENTS);
  const canViewOverrides = hasPermission(P.VIEW_CONFIG_OVERRIDES);
  const [archiveCap] = useArchiveCapabilityMutation();

  return (
    <Sheet open onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full p-6 sm:max-w-lg">
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4">
            <SheetHeader className="p-0">
              <SheetTitle>{cap.label}</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4 text-sm">
              {cap.description && <p className="text-gray-600">{cap.description}</p>}

              <div className="rounded-lg border border-white-02 p-4">
                <p className="font-mont text-xs font-semibold text-gray-01">HOW THIS RESOLVES</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-gray-600">
                  {deps.length > 0 && (
                    <li>0. Needs {deps.map((d) => d.label).join(" and ")} switched on first - without that it stays off no matter what.</li>
                  )}
                  {cap.requires_entitlement ? (
                    <>
                      <li>1. In the plan → on. Not in the plan → off.</li>
                      <li>2. A forced status (on/off) wins over the plan.</li>
                    </>
                  ) : (
                    <>
                      <li>1. No plan needed - ships {cap.default_enabled ? "ON" : "OFF"} by default.</li>
                      <li>2. A forced status (on/off) wins over the default.</li>
                    </>
                  )}
                </ul>
              </div>

              {cap.requires_entitlement && canViewEntitlements ? (
                <EntitlementScheduleEditor cap={cap} school={school} entitlement={entitlement} />
              ) : null}

              {deps.length > 0 && (
                <div className="rounded-lg border border-white-02 p-4">
                  <p className="font-mont text-xs font-semibold text-gray-01">
                    REQUIRES - {school ? "AT THIS SCHOOL" : "AT PLATFORM"}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {deps.map((d) => (
                      <li key={d.label} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{d.label}</span>
                        {d.on ? (
                          <Badge variant="success" className="font-mont text-xs">On</Badge>
                        ) : (
                          <Badge variant="rejected" className="font-mont text-xs">Off - blocking</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-white-02 p-4">
                <p className="font-mont text-xs font-semibold text-gray-01">
                  CURRENT RECORDS - {school ? "THIS SCHOOL" : "PLATFORM"}
                </p>
                <dl className="mt-2 space-y-3 text-xs">
                  <div>
                    <dt className="text-gray-01">Plan grant (entitlement)</dt>
                    <dd className="mt-0.5 font-medium">
                      {!canViewEntitlements
                        ? "Protected by entitlement-view permission"
                        : entitlement
                        ? `${entitlement.state} · via ${entitlement.source} · updated ${new Date(entitlement.updated_at).toLocaleDateString()}`
                        : "None recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-01">Forced status (override)</dt>
                    <dd className="mt-0.5 font-medium">
                      {!canViewOverrides
                        ? "Protected by override-view permission"
                        : override && override.state !== "INHERIT"
                        ? `${override.state === "ENABLED" ? "Forced on" : "Forced off"}${override.reason ? ` - “${override.reason}”` : ""} · updated ${new Date(override.updated_at).toLocaleDateString()}`
                        : "None - follows the plan"}
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

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function EntitlementScheduleEditor({ cap, school, entitlement }: { cap: Capability; school: string; entitlement?: Entitlement }) {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(P.MANAGE_ENTITLEMENTS);
  const [startsAt, setStartsAt] = useState(() => toLocalDateTimeValue(entitlement?.starts_at));
  const [endsAt, setEndsAt] = useState(() => toLocalDateTimeValue(entitlement?.ends_at));
  const [minimumScheduleDate] = useState(() => toLocalDateTimeValue(new Date().toISOString()));
  const [save, saveState] = useSetEntitlementMutation();
  const invalid = Boolean(startsAt && endsAt && new Date(startsAt).getTime() >= new Date(endsAt).getTime());

  const submit = async () => {
    try {
      await save({
        capability: cap.key,
        state: "GRANTED",
        source: "MANUAL",
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        reason: "Updated entitlement activation schedule",
        ...(school ? { tenant: school } : {}),
      }).unwrap();
      toast.success(`${cap.label} schedule saved`);
    } catch {
      toast.error(`${cap.label} schedule could not be saved`);
    }
  };

  return (
    <div className="rounded-lg border border-white-02 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-mont text-xs font-semibold text-gray-01"><CalendarClock className="size-4" />ENTITLEMENT SCHEDULE</p>
          <p className="mt-1 text-xs leading-5 text-gray-05">Activation and expiry are checked whenever access is evaluated. No background job or manual switch is required.</p>
        </div>
        <PolicyBadge kind={entitlement?.state === "GRANTED" ? "configured" : "default"}>{entitlementTiming(entitlement)}</PolicyBadge>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1 font-mont text-xs text-gray-01">Starts at (optional)<Input type="datetime-local" disabled={!canManage} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
        <label className="space-y-1 font-mont text-xs text-gray-01">Expires at (optional)<Input type="datetime-local" min={minimumScheduleDate} disabled={!canManage} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
      </div>
      {invalid ? <p className="mt-2 font-mont text-xs text-destructive">Expiry must be after activation.</p> : null}
      {canManage ? <Button className="mt-4" size="sm" disabled={invalid || saveState.isLoading || Boolean(endsAt && endsAt < minimumScheduleDate)} onClick={submit}><Save className="size-3.5" />{saveState.isLoading ? "Saving..." : "Save schedule"}</Button> : null}
    </div>
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────────

// Plain wording per audit action code; tone follows the change's weight.
const AUDIT_ACTIONS: Record<string, { label: string; className: string }> = {
  "config.value.updated": { label: "Setting changed", className: "bg-primary/10 text-primary" },
  "config.value.cleared": { label: "Setting reset", className: "bg-gray-05/10 text-gray-05" },
  "config.definition.created": { label: "Setting created", className: "bg-green-01/10 text-green-01" },
  "config.definition.updated": { label: "Setting updated", className: "bg-primary/10 text-primary" },
  "config.definition.archived": { label: "Setting archived", className: "bg-gray-05/10 text-gray-05" },
  "config.capability.created": { label: "Feature created", className: "bg-green-01/10 text-green-01" },
  "config.capability.updated": { label: "Feature updated", className: "bg-primary/10 text-primary" },
  "config.capability.archived": { label: "Feature archived", className: "bg-gray-05/10 text-gray-05" },
  "config.entitlement.updated": { label: "Plan grant changed", className: "bg-primary/10 text-primary" },
  "config.entitlement.cleared": { label: "Plan grant reset", className: "bg-gray-05/10 text-gray-05" },
  "config.override.updated": { label: "Forced status changed", className: "bg-yellow-01/10 text-yellow-01" },
  "config.integration.connection_tested": { label: "Connection tested", className: "bg-primary/10 text-primary" },
  "config.audit.export_queued": { label: "Audit export queued", className: "bg-yellow-01/10 text-yellow-01" },
  "config.audit.export_completed": { label: "Audit export completed", className: "bg-green-01/10 text-green-01" },
  "config.audit.export_downloaded": { label: "Audit export downloaded", className: "bg-primary/10 text-primary" },
};

function Audit() {
  const { hasPermission } = usePermissions();
  const canExport = hasPermission(P.EXPORT_CONFIG_AUDIT);
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const [days, setDays] = useState("30");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSavedView, setSelectedSavedView] = useState("");
  const [showSaveView, setShowSaveView] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");
  const [auditWindowAnchor] = useState(() => Date.now());
  const createdAfter = days === "all"
    ? undefined
    : new Date(auditWindowAnchor - Number(days) * 864e5).toISOString();
  // The backend list is scope-resolved: platform rows by default, one
  // school's rows with ?school= - same picker as the Features tab.
  const facetParams = {
    ...(createdAfter ? { created_after: createdAfter } : {}),
    ...(school ? { tenant: school } : {}),
  };
  const facets = useGetConfigAuditFacetsQuery(facetParams);
  const target = facets.data?.data.targets.find((item) => `${item.type}:${item.id}` === targetFilter);
  const auditFilters = {
    ...(createdAfter ? { created_after: createdAfter } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(actorFilter ? { actor: actorFilter } : {}),
    ...(target ? { target_type: target.type, target_id: target.id } : {}),
  };
  const filters = {
    ...auditFilters,
    ...(school ? { tenant: school } : {}),
  };
  const q = useGetConfigAuditQuery({
    page: String(page),
    ...filters,
  });
  const [exportAudit, exportState] = useLazyExportConfigAuditQuery();
  const savedViews = useGetConfigAuditSavedViewsQuery();
  const [saveAuditView, saveViewState] = useSaveConfigAuditViewMutation();
  const [deleteAuditView, deleteViewState] = useDeleteConfigAuditViewMutation();
  const exportJobs = useGetConfigAuditExportJobsQuery(undefined, { skip: !canExport });
  const exportJobData = exportJobs.data;
  const refetchExportJobs = exportJobs.refetch;
  const [queueAuditExport, queueState] = useQueueConfigAuditExportMutation();
  const [downloadAuditExport, downloadState] = useLazyDownloadConfigAuditExportQuery();
  const detail = useGetConfigAuditDetailQuery(
    { id: selected ?? "", ...(school ? { tenant: school } : {}) },
    { skip: !selected },
  );
  const activeExportJobs = (exportJobData?.data ?? []).some((job) => job.status === "QUEUED" || job.status === "RUNNING");

  useEffect(() => {
    if (!activeExportJobs) return;
    const timer = window.setTimeout(() => refetchExportJobs(), 5_000);
    return () => window.clearTimeout(timer);
  }, [activeExportJobs, exportJobData, refetchExportJobs]);

  const tableData = (q.data?.data ?? []).map((x) => {
    const action = AUDIT_ACTIONS[x.action] ?? {
      label: x.action.replace("config.", "").replaceAll(".", " "),
      className: "bg-gray-05/10 text-gray-05",
    };
    return {
      _id: x.id,
      _event: x,
      action: (
        <Badge className={`font-mont text-xs ${action.className}`}>{action.label}</Badge>
      ),
      target: <span className="text-sm font-medium">{x.target_label || "-"}</span>,
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
          {x.reason || "-"}
        </span>
      ),
      date: <span className="text-xs text-gray-01">{new Date(x.created_at).toLocaleString()}</span>,
    };
  });

  const downloadAudit = async () => {
    try {
      if ((q.data?.pagination?.totalItems ?? 0) > 5_000) {
        await queueAuditExport({
          filters: auditFilters,
          client_key: crypto.randomUUID(),
          ...(school ? { tenant: school } : {}),
        }).unwrap();
        toast.success("The full export was queued. It will appear below when ready.");
        return;
      }
      const csv = await exportAudit(filters).unwrap();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `configuration-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Filtered audit history could not be exported");
    }
  };

  const savedFilters = (): ConfigAuditSavedView["filters"] => ({
    window_days: days === "all" ? "all" : Number(days) as 7 | 30 | 90,
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(actorFilter ? { actor: actorFilter } : {}),
    ...(target ? { target_type: target.type, target_id: target.id } : {}),
  });

  const saveCurrentView = async () => {
    const name = savedViewName.trim();
    if (!name) return;
    try {
      const response = await saveAuditView({
        name,
        filters: savedFilters(),
        ...(school ? { tenant: school } : {}),
      }).unwrap();
      setSelectedSavedView(response.data.id);
      setSavedViewName("");
      setShowSaveView(false);
      toast.success("Personal audit view saved");
    } catch {
      toast.error("The audit view could not be saved. Use a unique name.");
    }
  };

  const applySavedView = (id: string) => {
    setSelectedSavedView(id);
    const view = (savedViews.data?.data ?? []).find((item) => item.id === id);
    if (!view) return;
    setDays(String(view.filters.window_days));
    setActionFilter(view.filters.action ?? "");
    setActorFilter(view.filters.actor ?? "");
    setTargetFilter(view.filters.target_type && view.filters.target_id ? `${view.filters.target_type}:${view.filters.target_id}` : "");
    setSchool(view.tenant_slug ?? "");
    setSelected(null);
    setPage(1);
  };

  const removeSavedView = async () => {
    if (!selectedSavedView) return;
    try {
      await deleteAuditView(selectedSavedView).unwrap();
      setSelectedSavedView("");
      toast.success("Personal audit view deleted");
    } catch {
      toast.error("The saved audit view could not be deleted");
    }
  };

  const downloadQueuedExport = async (job: ConfigAuditExportJob) => {
    try {
      const blob = await downloadAuditExport(job.id).unwrap();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = job.file_name || `configuration-audit-${job.id}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("This export is unavailable or has expired");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont text-base font-semibold">Configuration audit trail</h2>
          <p className="mt-1 max-w-2xl font-mont text-xs leading-5 text-gray-05">
            Immutable record of every settings and feature change. Select a row to inspect its complete redacted snapshots.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <div className="w-full sm:w-52">
            <NativeSelect value={selectedSavedView} onChange={(event) => applySavedView(event.target.value)}>
              <option value="">Personal saved views</option>
              {(savedViews.data?.data ?? []).map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
            </NativeSelect>
          </div>
          <Button variant="outline" onClick={() => setShowSaveView(true)}><Save className="size-4" />Save view</Button>
          {selectedSavedView ? (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" size="icon" aria-label="Delete selected saved view"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete this saved view?</AlertDialogTitle><AlertDialogDescription>This removes only your personal shortcut. It does not delete audit records.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleteViewState.isLoading} onClick={removeSavedView}>Delete view</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          {canExport ? <Button variant="outline" disabled={exportState.isFetching || queueState.isLoading} onClick={downloadAudit}><Download className="size-4" />{queueState.isLoading ? "Queueing..." : exportState.isFetching ? "Exporting..." : (q.data?.pagination?.totalItems ?? 0) > 5_000 ? "Queue full export" : "Export filtered"}</Button> : null}
          <div className="w-full sm:w-44">
            <NativeSelect value={days} onChange={(event) => { setDays(event.target.value); setPage(1); }}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All history</option>
            </NativeSelect>
          </div>
          <div className="w-full sm:w-52">
            <NativeSelect value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setPage(1); }}>
              <option value="">All change types</option>
              {(facets.data?.data.actions ?? Object.keys(AUDIT_ACTIONS)).map((value) => <option key={value} value={value}>{AUDIT_ACTIONS[value]?.label ?? pretty(value.replace("config.", ""))}</option>)}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-52">
            <NativeSelect value={actorFilter} onChange={(event) => { setActorFilter(event.target.value); setPage(1); }}>
              <option value="">All actors</option>
              {(facets.data?.data.actors ?? []).map((actor) => <option key={actor.id} value={actor.id}>{actor.full_name || actor.email}</option>)}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-52">
            <NativeSelect value={targetFilter} onChange={(event) => { setTargetFilter(event.target.value); setPage(1); }}>
              <option value="">All targets</option>
              {(facets.data?.data.targets ?? []).map((item) => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>)}
            </NativeSelect>
          </div>
          <ScopePicker
            value={school}
            onChange={(s) => {
              setSchool(s);
              setPage(1);
              setSelected(null);
              setActorFilter("");
              setTargetFilter("");
            }}
          />
        </div>
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
        onRowClick={(row: { _event: ConfigAudit }) => setSelected(row._event.id)}
      />
      {canExport && (exportJobs.data?.data ?? []).length > 0 ? (
        <SettingsPanel title="Queued audit exports" description="Large exports run in the background. Completed files remain available for seven days and can only be downloaded by the person who requested them.">
          <div className="divide-y divide-white-02">
            {(exportJobs.data?.data ?? []).map((job) => (
              <div key={job.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mont text-sm font-medium text-gray-01">{job.file_name || "Configuration audit export"}</p>
                  <p className="mt-0.5 font-mont text-xs text-gray-05">
                    Requested {new Date(job.requested_at).toLocaleString()}{job.row_count ? ` · ${job.row_count.toLocaleString()} rows` : ""}
                  </p>
                  {job.status === "FAILED" && job.failure_message ? <p className="mt-1 font-mont text-xs text-error-text">{job.failure_message}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AuditExportStatus job={job} />
                  {job.download_available ? <Button size="sm" variant="outline" disabled={downloadState.isFetching} onClick={() => downloadQueuedExport(job)}><Download className="size-3.5" />Download</Button> : null}
                </div>
              </div>
            ))}
          </div>
        </SettingsPanel>
      ) : null}
      <Sheet open={showSaveView} onOpenChange={setShowSaveView}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-white-02"><SheetTitle>Save personal audit view</SheetTitle></SheetHeader>
          <div className="space-y-4 p-5">
            <p className="font-mont text-sm leading-6 text-gray-05">Save the current window, change type, actor, target and school filters as a shortcut visible only to you.</p>
            <label className="space-y-1 font-mont text-xs font-semibold text-gray-01">View name<Input value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} maxLength={80} placeholder="For example, School entitlement changes" /></label>
            <Button className="w-full" disabled={!savedViewName.trim() || saveViewState.isLoading} onClick={saveCurrentView}><Save className="size-4" />{saveViewState.isLoading ? "Saving..." : "Save view"}</Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-xl">
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4">
              <SheetHeader className="border-b border-white-02">
                <SheetTitle>Configuration change detail</SheetTitle>
              </SheetHeader>
              {detail.isFetching ? <Busy /> : detail.data?.data ? <AuditDetail event={detail.data.data} /> : (
                <div className="p-5 font-mont text-sm text-gray-05">This audit event could not be loaded.</div>
              )}

            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AuditExportStatus({ job }: { job: ConfigAuditExportJob }) {
  const variant = job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "rejected" : "pending";
  return <Badge variant={variant} className="font-mont text-xs">{pretty(job.status.toLowerCase())}</Badge>;
}

function AuditDetail({ event }: { event: ConfigAudit }) {
  const action = AUDIT_ACTIONS[event.action]?.label ?? event.action;
  const keys = Array.from(new Set([
    ...Object.keys((event.before_data as Record<string, unknown>) || {}),
    ...Object.keys((event.after_data as Record<string, unknown>) || {}),
  ]));
  const before = (event.before_data as Record<string, unknown>) || {};
  const after = (event.after_data as Record<string, unknown>) || {};

  return (
    <div className="space-y-5 p-5">
      <div>
        <Badge className="bg-primary/10 font-mont text-xs text-primary">{action}</Badge>
        <h3 className="mt-3 font-mont text-base font-semibold text-gray-01">{event.target_label || event.target_type}</h3>
        <p className="mt-1 font-mont text-xs text-gray-05">{new Date(event.created_at).toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AuditFact label="Changed by" value={event.actor?.full_name || "System"} />
        <AuditFact label="Actor email" value={event.actor?.email || "Not applicable"} />
        <AuditFact label="Target type" value={event.target_type} />
        <AuditFact label="Reason" value={event.reason || "No reason supplied"} />
      </div>
      <SettingsPanel title="Before and after" description="Secret-reference values are redacted before audit records are stored.">
        {keys.length ? keys.map((key) => (
          <div key={key} className="grid grid-cols-1 gap-3 px-4 py-4 sm:px-5 md:grid-cols-[150px_1fr_1fr]">
            <p className="font-mont text-xs font-semibold text-gray-01">{pretty(key)}</p>
            <AuditSnapshot label="Before" value={before[key]} />
            <AuditSnapshot label="After" value={after[key]} />
          </div>
        )) : <SettingsRow icon={History} label="No value snapshot" description="This event records lifecycle or metadata without a field-level value snapshot." />}
      </SettingsPanel>
    </div>
  );
}

function AuditFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-02/70 p-3"><p className="font-mont text-[11px] font-medium uppercase tracking-wide text-gray-05">{label}</p><p className="mt-1 break-words font-mont text-sm font-medium text-gray-01">{value}</p></div>;
}

function AuditSnapshot({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0"><p className="font-mont text-[11px] font-medium text-gray-05">{label}</p><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-02/70 p-2 font-mono text-xs text-gray-01">{value === undefined ? "Not set" : JSON.stringify(value, null, 2)}</pre></div>;
}
