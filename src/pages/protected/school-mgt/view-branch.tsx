import PermissionGate from "@/components/custom/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetBranchDetailQuery,
  useGetSchoolDetailQuery,
} from "@/redux/services/dashboard/school-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { formatEnum, formatStartedTime, returnInitial } from "@/utils/helpers";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";

function DetailField({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="font-mont text-xs font-medium text-gray-01">{label}</p>
      <div className="break-words text-sm font-semibold text-black-01">{children ?? value ?? "—"}</div>
    </div>
  );
}

function SectionCard({ title, description, icon, children }: { title: string; description?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5">
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <div className="grid size-9 shrink-0 place-content-center rounded-lg bg-pry-01 text-primary">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-black-01">{title}</h2>
          {description && <p className="mt-0.5 font-mont text-xs text-gray-01">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ViewBranch() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const parsedCode = Number(code);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewSchool = hasPermission(P.BROWSE_SCHOOLS);

  const { data: schoolData, isLoading: schoolLoading } = useGetSchoolDetailQuery(slug ?? "", {
    skip: !slug || !canViewSchool,
  });
  const {
    data: branchData,
    isLoading: branchLoading,
    isError,
    error,
    refetch,
  } = useGetBranchDetailQuery(
    { slug: slug ?? "", code: parsedCode },
    { skip: !slug || !code || Number.isNaN(parsedCode) },
  );

  const school = schoolData?.data;
  const branch = branchData?.data;
  const isLoading = schoolLoading || branchLoading;
  const isForbidden = isError && typeof error === "object" && error !== null && "status" in error && error.status === 403;

  return (
    <>
      <main className="grid min-w-0 grid-cols-1 gap-5 px-4.5 py-6 text-black-01 sm:gap-6">
        {isLoading && (
          <div className="grid h-52 place-content-center rounded-xl bg-white"><div className="loader" /></div>
        )}

        {!isLoading && isError && (
          <div className="grid min-h-52 place-content-center rounded-xl bg-white p-6 text-center">
            <p className="text-sm font-medium text-red-500">{isForbidden ? "You do not have permission to view this branch." : "Failed to load branch details."}</p>
            {!isForbidden && <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>}
          </div>
        )}

        {!isLoading && !isError && branch && (
          <>
            <Link
              to={`${routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? "")}?tab=branches`}
              className="inline-flex w-fit items-center gap-1.5 font-mont text-sm font-medium text-gray-01 hover:text-primary"
            >
              <ArrowLeft className="size-4" /> Back to {school?.name ?? "school branches"}
            </Link>

            <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold capitalize tracking-tight sm:text-2xl">{branch.name}</h1>
                  {branch.is_main && <Badge className="bg-pry-01 text-primary">Main branch</Badge>}
                  <Badge variant={branch.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>{formatEnum(branch.status)}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mont text-xs text-gray-01">
                  <Link to={routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? "")} className="inline-flex items-center gap-1 hover:text-primary hover:underline"><School className="size-3.5" /> {school?.name ?? "School"}</Link>
                  <span>Branch code: {branch.code}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {[branch.state, branch.country].filter(Boolean).join(", ") || "Location not set"}</span>
                </div>
              </div>
              <PermissionGate permission={P.MODIFY_BRANCH}>
                <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(slug ?? "", parsedCode))}>
                  <Pencil className="size-4" /> Edit Branch
                </Button>
              </PermissionGate>
            </section>

            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="grid min-w-0 content-start grid-cols-1 gap-5">
                <SectionCard title="Branch overview" description="Location, contact and lifecycle information" icon={<Building2 className="size-4.5" />}>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField label="Branch name" value={branch.name} />
                    <DetailField label="Branch type" value={formatEnum(branch._type)} />
                    <DetailField label="Branch code" value={branch.code} />
                    <DetailField label="Country" value={branch.country} />
                    <DetailField label="State" value={branch.state} />
                    <DetailField label="Address" value={branch.address} />
                    <DetailField label="Email">
                      {branch.email ? <a href={`mailto:${branch.email}`} className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"><Mail className="size-3.5 shrink-0" /><span className="truncate">{branch.email}</span></a> : "—"}
                    </DetailField>
                    <DetailField label="Opened" value={branch.opened_at ? formatStartedTime(branch.opened_at) : "Not recorded"} />
                    <DetailField label="Activated" value={branch.activated_at ? formatStartedTime(branch.activated_at) : "Not activated"} />
                  </div>
                </SectionCard>

                <SectionCard title="Academic operations" description="Students, classes and teaching staff" icon={<GraduationCap className="size-4.5" />}>
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-03/60 p-5 text-center sm:p-7">
                    <div className="mx-auto grid size-10 place-content-center rounded-full bg-white text-primary"><GraduationCap className="size-5" /></div>
                    <p className="mt-3 text-sm font-semibold">Operational records are not connected yet</p>
                    <p className="mx-auto mt-1 max-w-md font-mont text-xs leading-5 text-gray-01">Student, class and teacher data will appear here when the branch summary endpoints are available. No placeholder totals are shown.</p>
                  </div>
                </SectionCard>
              </div>

              <div className="grid min-w-0 content-start grid-cols-1 gap-5">
                <SectionCard title="Branch administrator" description="Primary contact for this location" icon={<UserRound className="size-4.5" />}>
                  {branch.primary_admin ? (
                    <div className="grid grid-cols-1 gap-5">
                      <div className="flex items-center gap-3 rounded-lg bg-gray-03 p-3">
                        <div className="grid size-10 shrink-0 place-content-center rounded-full bg-white font-semibold text-primary">{returnInitial(branch.primary_admin.contact.full_name)}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{branch.primary_admin.contact.full_name}</p>
                          <p className="truncate font-mont text-xs text-gray-01">{formatEnum(branch.primary_admin.role_label || branch.primary_admin.branch_role)}</p>
                        </div>
                      </div>
                      <DetailField label="Email"><a href={`mailto:${branch.primary_admin.contact.email}`} className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"><Mail className="size-3.5 shrink-0" /><span className="truncate">{branch.primary_admin.contact.email}</span></a></DetailField>
                      <DetailField label="Phone" value={branch.primary_admin.contact.phone} />
                      <DetailField label="Invite status"><Badge variant={branch.primary_admin.invite_status === "SENT" ? "active" : branch.primary_admin.invite_status === "FAILED" ? "rejected" : "pending"}>{formatEnum(branch.primary_admin.invite_status)}</Badge></DetailField>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-03 p-4">
                      <p className="text-sm font-medium">No administrator assigned</p>
                      <p className="mt-1 font-mont text-xs text-gray-01">Edit the branch to add its primary administrator.</p>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Lifecycle" description="Branch status at a glance" icon={<ShieldCheck className="size-4.5" />}>
                  <div className="grid grid-cols-1 gap-4">
                    <DetailField label="Current status"><Badge variant={branch.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>{formatEnum(branch.status)}</Badge></DetailField>
                    <DetailField label="Opened date"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 text-gray-01" />{branch.opened_at ? formatStartedTime(branch.opened_at) : "Not recorded"}</span></DetailField>
                    <DetailField label="Branch designation" value={branch.is_main ? "Main branch" : "Additional branch"} />
                  </div>
                </SectionCard>
              </div>
            </div>
          </>
        )}

        {!isLoading && !isError && !branch && (
          <div className="rounded-xl bg-white p-8 text-center"><p className="text-sm text-gray-01">Branch not found.</p></div>
        )}
      </main>
    </>
  );
}
