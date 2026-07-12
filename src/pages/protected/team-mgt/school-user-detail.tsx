import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGetTeamMembersDetailsQuery } from "@/redux/services/dashboard/team-mgt-api";
import type { TeamMember } from "@/redux/services/dashboard/dashboard-types";
import { formatRelativeDate } from "@/utils/helpers";
import { Building2, CalendarDays, GitBranch, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

const USER_TYPE_LABELS: Record<string, string> = {
  SCHOOL_ADMIN: "School Admin",
  BRANCH_ADMIN: "Branch Admin",
  STAFF: "Staff",
  STUDENT: "Student",
  PARENT: "Parent / Guardian",
};

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-md border border-gray-03 bg-white p-3.5">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-gray-01">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="break-words text-sm font-medium text-black-01">{value || "—"}</p>
    </div>
  );
}

export function SchoolUserDetail({
  user,
  onClose,
}: {
  user: TeamMember | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetTeamMembersDetailsQuery(user?.id ?? "", {
    skip: !user?.id,
  });
  const detail = data?.data;

  return (
    <Sheet open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-gray-03 pb-4">
          <SheetTitle>School User Details</SheetTitle>
          <SheetDescription>Read-only identity, placement, access, and account activity.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-gray-06" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 p-4">
            <section className="flex items-start justify-between gap-4 rounded-md bg-primary/5 p-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-black-01">
                  {detail?.full_name || user?.full_name || "Unnamed user"}
                </p>
                <p className="mt-1 truncate text-xs text-gray-01">{detail?.email || user?.email}</p>
              </div>
              <Badge variant={(detail?.status || user?.status || "inactive").toLowerCase() as "active"}>
                {detail?.status || user?.status || "—"}
              </Badge>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-01">Identity</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField icon={UserRound} label="Full name" value={detail?.full_name || user?.full_name} />
                <DetailField icon={Mail} label="Email" value={detail?.email || user?.email} />
                <DetailField icon={Phone} label="Phone" value={detail?.phone} />
                <DetailField icon={UserRound} label="Gender" value={detail?.gender} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-01">School placement</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField icon={Building2} label="School" value={detail?.school_name || user?.school_name} />
                <DetailField icon={GitBranch} label="Branch" value={detail?.branch_name || user?.branch_name} />
                <DetailField icon={ShieldCheck} label="User type" value={USER_TYPE_LABELS[detail?.user_type || user?.user_type || ""] || detail?.user_type || user?.user_type} />
                <DetailField icon={KeyRound} label="Assigned role" value={detail?.role || user?.role} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-01">Account activity</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField icon={CalendarDays} label="Created" value={(detail?.created_at || user?.created_at) ? formatRelativeDate(detail?.created_at || user!.created_at) : "—"} />
                <DetailField icon={CalendarDays} label="Last login" value={detail?.last_login_at ? formatRelativeDate(detail.last_login_at) : "Never"} />
                <DetailField icon={UserRound} label="Invited by" value={detail?.invited_by_name || user?.invited_by_name} />
                <DetailField icon={CalendarDays} label="Last updated" value={detail?.updated_at ? formatRelativeDate(detail.updated_at) : "—"} />
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { USER_TYPE_LABELS };
