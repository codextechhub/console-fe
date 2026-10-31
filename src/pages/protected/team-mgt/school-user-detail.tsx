import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Building2,
  CalendarClock,
  Clock3,
  GitBranch,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FieldAccessOverrides from "@/components/custom/field-access-overrides";
import PermissionOverrides, { useCanViewPermissionExceptions } from "@/components/custom/permission-overrides";
import { useFieldAccess } from "@/components/finance-ui/field-access";
import { PageShell } from "@/components/layout/page-shell";
import {
  ProfileCard,
  ProfileEmptyState,
  ProfileField,
  ProfileFields,
  ProfileHero,
  ProfilePanel,
  ProfileTabs,
  ProfileTimeline,
  type ProfileTab,
  type ProfileTabId,
} from "@/components/profile/profile-system";
import { UserAvatar } from "@/components/custom/user-avatar";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { useGetTeamMembersDetailsQuery } from "@/redux/services/dashboard/team-mgt-api";
import { formatRelativeDate } from "@/utils/helpers";
import { TEAM_FIELD_RESOURCE } from "./team-field-access";
import { getSchoolProfileName, getSchoolProfileTenantSlug } from "./school-user-profile";

const TENANT_KIND_LABELS: Record<string, string> = {
  PLATFORM: "CX Staff",
  SCHOOL: "School User",
};

const SCHOOL_PROFILE_TABS: ProfileTab[] = [
  { id: "overview", label: "Overview" },
  { id: "access", label: "Access" },
  { id: "activity", label: "Activity" },
  { id: "history", label: "History" },
];

/**
 * Full-page school-user profile.
 *
 * It uses the same identity, tab, card, and field components as CX staff
 * profiles, while keeping school placement and account access separate from
 * CX employment and payroll data. Account facts continue to follow Field
 * Access, and per-user access exceptions stay scoped to the owning school.
 */
export default function SchoolUserDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const { data, isLoading, isError, refetch } = useGetTeamMembersDetailsQuery(id, { skip: !id });
  const detail = data?.data;
  const access = useFieldAccess(TEAM_FIELD_RESOURCE, detail ?? {});

  const canSeeExceptions = useCanViewPermissionExceptions();
  const { data: schoolsRes } = useGetSchoolsQuery(
    { page_size: 100 },
    { skip: !detail?.school_id || Boolean(detail?.tenant_slug) || !canSeeExceptions },
  );
  const tenantSlug = detail
    ? getSchoolProfileTenantSlug(detail, schoolsRes?.data ?? [])
    : "";

  if (isLoading || (!detail && !isError)) {
    return (
      <PageShell className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </PageShell>
    );
  }

  if (isError || !detail) {
    return (
      <PageShell>
        <ProfileEmptyState>
          <p>This school-user profile could not be loaded.</p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>Try again</Button>
        </ProfileEmptyState>
      </PageShell>
    );
  }

  const tenantLabel = TENANT_KIND_LABELS[detail.tenant_kind] || detail.tenant_kind || "School User";
  const schoolName = getSchoolProfileName(detail);
  const status = detail.status || "Inactive";
  const activityItems = [
    !access.isHidden("last_login_at")
      ? {
          id: "last-login",
          title: detail.last_login_at ? "Signed in" : "No sign-in recorded",
          detail: detail.last_login_at ? formatRelativeDate(detail.last_login_at) : "This account has not signed in yet.",
          current: Boolean(detail.last_login_at),
        }
      : null,
    !access.isHidden("invitation_email_status") && detail.invitation_email_status
      ? {
          id: "invitation",
          title: `Invitation ${detail.invitation_email_status.toLowerCase()}`,
          detail: !access.isHidden("invited_by_name") && detail.invited_by_name
            ? `Invited by ${detail.invited_by_name}`
            : "Invitation delivery state",
        }
      : null,
    {
      id: "created",
      title: "Account created",
      detail: formatRelativeDate(detail.created_at),
    },
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const historyItems = [
    detail.updated_at
      ? { id: "updated", title: "Profile updated", detail: formatRelativeDate(detail.updated_at), current: true }
      : null,
    !access.isHidden("invitation_expires_at") && detail.invitation_expires_at
      ? { id: "invite-expiry", title: "Invitation expiry", detail: formatRelativeDate(detail.invitation_expires_at) }
      : null,
    { id: "created", title: "Account created", detail: formatRelativeDate(detail.created_at) },
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <PageShell className="space-y-5 text-black-01">
      <ProfileHero
        avatar={<UserAvatar userId={detail.id} name={detail.full_name} className="size-16 sm:size-18" fallbackClassName="text-lg" />}
        name={detail.full_name || "Unnamed user"}
        title={detail.role || "School user"}
        email={detail.email}
        badges={(
          <>
            <Badge variant={status.toLowerCase() as "active"}>{status}</Badge>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{tenantLabel}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {detail.branch_name || "School-wide"}
            </span>
          </>
        )}
        facts={[
          { label: "School", value: schoolName, icon: Building2 },
          ...(!access.isHidden("last_login_at")
            ? [{ label: "Last active", value: detail.last_login_at ? formatRelativeDate(detail.last_login_at) : "Never", icon: Clock3 }]
            : []),
        ]}
        actions={(
          <>
            {canSeeExceptions ? (
              <Button variant="outline" onClick={() => setActiveTab("access")}>
                <ShieldCheck className="size-4" /> Manage access
              </Button>
            ) : null}
            {hasPermission(P.MODIFY_TEAM_MEMBER) ? (
              <Button onClick={() => navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(detail.id, "schools"))}>
                <Pencil className="size-4" /> Edit profile
              </Button>
            ) : null}
          </>
        )}
      />

      <ProfileTabs tabs={SCHOOL_PROFILE_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <ProfilePanel id="overview" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ProfileCard title="School placement" icon={Building2}>
            <ProfileFields>
              <ProfileField label="School" value={schoolName} />
              <ProfileField label="Branch" value={detail.branch_name || "School-wide"} />
              <ProfileField label="Assigned role" value={detail.role} />
              <ProfileField label="Account type" value={tenantLabel} />
            </ProfileFields>
          </ProfileCard>

          <ProfileCard title="Contact" icon={Mail}>
            <ProfileFields>
              <ProfileField label="Email" value={detail.email} />
              {!access.isHidden("phone") && <ProfileField label="Phone" value={detail.phone} />}
              <ProfileField label="Gender" value={detail.gender} />
              <ProfileField label="Branch scope" value={detail.branch_name || "All branches"} />
            </ProfileFields>
          </ProfileCard>

          <ProfileCard title="Account summary" icon={UserRound}>
            <ProfileFields>
              <ProfileField label="Status" value={status} />
              <ProfileField label="Role" value={detail.role} />
              <ProfileField label="Created" value={formatRelativeDate(detail.created_at)} />
              <ProfileField label="Last updated" value={detail.updated_at ? formatRelativeDate(detail.updated_at) : "-"} />
            </ProfileFields>
          </ProfileCard>

          <ProfileCard title="Placement at a glance" icon={GitBranch}>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">{schoolName}</span>
              <span className="text-slate-300">/</span>
              <span className="rounded-lg bg-primary/5 px-3 py-2 text-primary ring-1 ring-primary/15">
                {detail.branch_name || "School-wide"}
              </span>
              <span className="text-slate-300">/</span>
              <span className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">{detail.role || "No role"}</span>
            </div>
          </ProfileCard>
        </ProfilePanel>
      ) : null}

      {activeTab === "access" ? (
        <ProfilePanel id="access" className="space-y-5">
          <ProfileCard title="Account access" icon={KeyRound}>
            <ProfileFields columns={3}>
              <ProfileField label="Assigned role" value={detail.role} />
              <ProfileField label="School scope" value={schoolName} />
              <ProfileField label="Branch scope" value={detail.branch_name || "School-wide"} />
            </ProfileFields>
          </ProfileCard>
          <PermissionOverrides userId={detail.id} tenantSlug={tenantSlug} userName={detail.full_name} className="rounded-2xl border-slate-200 p-5" />
          <FieldAccessOverrides userId={detail.id} tenantSlug={tenantSlug} userName={detail.full_name} className="rounded-2xl border-slate-200 p-5" />
        </ProfilePanel>
      ) : null}

      {activeTab === "activity" ? (
        <ProfilePanel id="activity" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ProfileCard title="Account activity" icon={Clock3}>
            {activityItems.length ? <ProfileTimeline items={activityItems} /> : <p className="text-sm text-gray-01">No account activity is available.</p>}
          </ProfileCard>
          <ProfileCard title="Invitation and security" icon={ShieldCheck}>
            <ProfileFields>
              {!access.isHidden("last_login_at") ? <ProfileField label="Last sign-in" value={detail.last_login_at ? formatRelativeDate(detail.last_login_at) : "Never"} /> : null}
              {!access.isHidden("password_changed_at") ? <ProfileField label="Password changed" value={detail.password_changed_at ? formatRelativeDate(detail.password_changed_at) : "No change recorded"} /> : null}
              {!access.isHidden("invited_by_name") ? <ProfileField label="Invited by" value={detail.invited_by_name} /> : null}
              {!access.isHidden("invitation_email_status") ? <ProfileField label="Invitation status" value={detail.invitation_email_status} /> : null}
            </ProfileFields>
          </ProfileCard>
        </ProfilePanel>
      ) : null}

      {activeTab === "history" ? (
        <ProfilePanel id="history">
          <ProfileCard title="Profile history" icon={CalendarClock} className="max-w-3xl">
            <ProfileTimeline items={historyItems} />
          </ProfileCard>
        </ProfilePanel>
      ) : null}
    </PageShell>
  );
}

export { TENANT_KIND_LABELS };
