import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { routesPath } from "@/routes/routesPath";
import { useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/auth/authSlice";
import {
  useGetTeamMembersDetailsQuery,
  useSuspendTeamMemberMutation,
  useReactivateTeamMemberMutation,
  useUnlockTeamMemberMutation,
  useAdminPasswordResetMutation,
  useResendInviteMutation,
} from "@/redux/services/dashboard/teamMgtApi";
import { returnInitial, formatRelativeDate } from "@/utils/helpers";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  KeyRound,
  Pencil,
  ShieldOff,
  ShieldCheck,
  LockOpen,
  Mail,
  CalendarDays,
  Clock,
  User,
  Building2,
  Phone,
  UserCheck,
} from "lucide-react";

const TABS = ["Overview", "Actions"] as const;
type Tab = (typeof TABS)[number];

const STATUS_VARIANT = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  LOCKED: "locked",
  PENDING: "pending",
  DEACTIVATED: "deactivated",
  INACTIVE: "inactive",
} as const;

type BadgeVariant = (typeof STATUS_VARIANT)[keyof typeof STATUS_VARIANT] | "default";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-03 last:border-0">
      <span className="mt-0.5 text-primary shrink-0">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-01 font-mont uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-black-01 mt-0.5 break-all">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  buttonVariant = "default",
  onClick,
  loading,
  disabled,
  destructive,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  buttonVariant?: "default" | "outline";
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-03 rounded-lg p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 shrink-0",
            destructive ? "text-destructive" : "text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-black-01">{title}</p>
          <p className="text-xs text-gray-01 font-mont mt-0.5 max-w-sm">
            {description}
          </p>
        </div>
      </div>
      <Button
        variant={buttonVariant}
        className={cn(
          "shrink-0 h-9 text-sm",
          destructive &&
            "border-destructive text-destructive hover:bg-destructive/10",
        )}
        onClick={onClick}
        loading={loading}
        disabled={disabled}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export default function ViewAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const currentUser = useSelector(selectUser);

  const { data: res, isLoading } = useGetTeamMembersDetailsQuery(id || "", {
    skip: !id,
  });
  const member = res?.data;

  const [suspend, { isLoading: suspending }] = useSuspendTeamMemberMutation();
  const [reactivate, { isLoading: reactivating }] =
    useReactivateTeamMemberMutation();
  const [unlock, { isLoading: unlocking }] = useUnlockTeamMemberMutation();
  const [resetPassword, { isLoading: resetting }] =
    useAdminPasswordResetMutation();
  const [resendInvite, { isLoading: resending }] = useResendInviteMutation();


  const handleAction = (
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    action()
      .then(() => toast.success(successMsg))
      .catch(() => {});
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Team Management" hasBack>
        <section className="grid h-[80vh] place-content-center">
          <div className="loader" />
        </section>
      </DashboardLayout>
    );
  }

  if (!member) {
    return (
      <DashboardLayout title="Team Management" hasBack>
        <section className="grid h-[80vh] place-content-center text-center space-y-2">
          <p className="text-sm text-gray-01 font-mont">Member not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </section>
      </DashboardLayout>
    );
  }

  const statusActions = () => {
    if (member.status === "ACTIVE")
      return (
        <ActionCard
          icon={ShieldOff}
          title="Suspend Account"
          description="Prevent this user from accessing the platform. Their data is preserved and can be restored."
          buttonLabel="Suspend"
          buttonVariant="outline"
          destructive
          loading={suspending}
          disabled={String(currentUser?.id) === String(member.id)}
          onClick={() =>
            handleAction(
              () => suspend(member.id).unwrap(),
              "User suspended successfully.",
            )
          }
        />
      );
    if (member.status === "SUSPENDED")
      return (
        <ActionCard
          icon={ShieldCheck}
          title="Reactivate Account"
          description="Restore full access for this user. They will be able to log in immediately."
          buttonLabel="Reactivate"
          loading={reactivating}
          onClick={() =>
            handleAction(
              () => reactivate(member.id).unwrap(),
              "User reactivated successfully.",
            )
          }
        />
      );
    if (member.status === "LOCKED")
      return (
        <ActionCard
          icon={LockOpen}
          title="Unlock Account"
          description="This account has been locked due to too many failed login attempts. Unlock to restore access."
          buttonLabel="Unlock"
          loading={unlocking}
          onClick={() =>
            handleAction(
              () => unlock(member.id).unwrap(),
              "User unlocked successfully.",
            )
          }
        />
      );
    return null;
  };

  return (
    <DashboardLayout title="Team Management" hasBack>
      <section className="px-4.5 py-6 max-w-235 space-y-6">
        {/* ── Profile header ── */}
        <div className="bg-white border border-gray-03 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="bg-pry-01 text-primary text-xl font-semibold">
              {returnInitial(member.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-black-01 capitalize">
                {member.full_name}
              </h2>
              <Badge variant={(STATUS_VARIANT[member.status as keyof typeof STATUS_VARIANT] ?? "default") as BadgeVariant}>
                {member.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-01 font-mont mt-0.5">
              {member.email}
            </p>
            <p className="text-xs text-gray-01 font-mont mt-1">
              {member.role || "—"}
            </p>
          </div>

          <Button
            variant="outline"
            className="shrink-0 h-9 gap-1.5"
            onClick={() =>
              navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(member.id))
            }
          >
            <Pencil className="size-3.5" />
            Edit Profile
          </Button>
        </div>

        {/* ── Tabs ── */}
        <div className="h-11 w-fit bg-white rounded-sm py-1 px-1.5 flex items-center gap-x-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "min-w-26.75 h-full cursor-pointer px-2 rounded font-medium font-mont text-base text-black-01 transition-colors",
                activeTab === tab ? "bg-pry-01" : "hover:bg-gray-03",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === "Overview" && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Personal info */}
            <div className="bg-white border border-gray-03 rounded-lg p-5">
              <p className="text-xs font-semibold text-gray-01 font-mont uppercase tracking-widest mb-1">
                Personal Information
              </p>
              <Separator className="mb-2 bg-gray-03" />
              <InfoRow icon={User} label="First Name" value={member.first_name} />
              <InfoRow icon={User} label="Last Name" value={member.last_name} />
              <InfoRow icon={Phone} label="Phone" value={member.phone} />
              <InfoRow
                icon={User}
                label="Gender"
                value={
                  member.gender
                    ? member.gender.charAt(0) +
                      member.gender.slice(1).toLowerCase()
                    : undefined
                }
              />
            </div>

            {/* Account info */}
            <div className="bg-white border border-gray-03 rounded-lg p-5">
              <p className="text-xs font-semibold text-gray-01 font-mont uppercase tracking-widest mb-1">
                Account Information
              </p>
              <Separator className="mb-2 bg-gray-03" />
              <InfoRow icon={Mail} label="Email" value={member.email} />
              <InfoRow
                icon={Building2}
                label="School"
                value={member.school_name}
              />
              <InfoRow
                icon={Building2}
                label="Branch"
                value={member.branch_name}
              />
              <InfoRow
                icon={UserCheck}
                label="Invited By"
                value={member.invited_by_name}
              />
            </div>

            {/* Timeline info */}
            <div className="bg-white border border-gray-03 rounded-lg p-5 md:col-span-2">
              <p className="text-xs font-semibold text-gray-01 font-mont uppercase tracking-widest mb-1">
                Timeline
              </p>
              <Separator className="mb-2 bg-gray-03" />
              <div className="grid sm:grid-cols-3 gap-x-8">
                <InfoRow
                  icon={CalendarDays}
                  label="Date Created"
                  value={
                    member.created_at
                      ? formatRelativeDate(member.created_at)
                      : undefined
                  }
                />
                <InfoRow
                  icon={Clock}
                  label="Last Login"
                  value={
                    member.last_login_at
                      ? formatRelativeDate(member.last_login_at)
                      : "Never"
                  }
                />
                <InfoRow
                  icon={KeyRound}
                  label="Password Last Changed"
                  value={
                    member.password_changed_at
                      ? formatRelativeDate(member.password_changed_at)
                      : "Never"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Actions tab ── */}
        {activeTab === "Actions" && (
          <div className="space-y-3">
            <ActionCard
              icon={Pencil}
              title="Edit Profile"
              description="Update this user's first name, last name, phone number, and gender."
              buttonLabel="Go to Edit"
              buttonVariant="outline"
              onClick={() =>
                navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(member.id))
              }
            />

            <ActionCard
              icon={KeyRound}
              title="Reset Password"
              description="Send a password reset email to this user. The link is valid for 24 hours."
              buttonLabel="Send Reset Email"
              loading={resetting}
              onClick={() =>
                handleAction(
                  () => resetPassword(member.id).unwrap(),
                  "Password reset email sent.",
                )
              }
            />

            {member.status === "PENDING" && (
              <ActionCard
                icon={Mail}
                title="Resend Invite"
                description="Resend the activation email to this user. The invite link will be valid for 7 days."
                buttonLabel="Resend Invite"
                loading={resending}
                onClick={() =>
                  handleAction(
                    () => resendInvite(member.id).unwrap(),
                    "Invite resent successfully.",
                  )
                }
              />
            )}

            {statusActions()}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
