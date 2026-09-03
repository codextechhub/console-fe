import TableToolbar from "@/components/custom/table-toolbar";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { P } from "@/permissions";
import { useGetSchoolDetailQuery } from "@/redux/services/dashboard/school-mgt-api";
import { useReinstateSchoolMutation } from "@/redux/services/dashboard/onboarding-api";
import { useSetSchoolServiceStateMutation } from "@/redux/services/dashboard/school-mgt-api";
import { Textarea } from "@/components/ui/textarea";
import type { BranchDetail } from "@/redux/services/dashboard/school-types";
import { SchoolMark } from "@/components/custom/school-mark";
import { routesPath } from "@/routes/routes-path";
import { useLogRecentOpen } from "@/hooks/use-log-recent-open";
import { formatEnum, formatStartedTime, returnInitial } from "@/utils/helpers";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "react-haiku";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { SortBar, handleSortToggle } from "@/components/custom/sort-bar";
import BulkImportDrawer from "@/components/custom/bulk-import-drawer";
import { PageShell } from "@/components/layout/page-shell";

const BRANCH_TABLE_HEADERS = [
  "S/N",
  "Branch Name",
  "Type",
  "Location",
  "Branch Admin",
  "Opened",
  "Status",
  "Action",
];

function DetailField({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="font-mont text-xs font-medium text-gray-01">{label}</p>
      <div className="break-words text-sm font-semibold text-black-01">{children ?? value ?? "-"}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-9 shrink-0 place-content-center rounded-lg bg-pry-01 text-primary">{icon}</div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-black-01">{title}</h2>
            {description && <p className="mt-0.5 font-mont text-xs text-gray-01">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200/80 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mont text-xs font-medium text-gray-01">{label}</p>
          <div className="mt-2 break-words text-xl font-semibold text-black-01 sm:text-2xl">{value}</div>
          <p className="mt-1 font-mont text-[11px] leading-4 text-gray-05">{hint}</p>
        </div>
        <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-pry-01 text-primary">{icon}</div>
      </div>
    </div>
  );
}

export default function ViewSchool() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewBranches = hasPermission(P.BROWSE_BRANCHES);
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab === "branches" && canViewBranches ? "branches" : "overview";
  const [search, setSearch] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [confirmReinstate, setConfirmReinstate] = useState(false);
  // null when no service-state change is being confirmed.
  const [serviceMove, setServiceMove] = useState<"ACTIVE" | "INACTIVE" | null>(null);
  const [serviceReason, setServiceReason] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const { data, isLoading, isError, error, refetch } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const [reinstateSchool, { isLoading: reinstating }] = useReinstateSchoolMutation();
  const [setServiceState, { isLoading: changingService }] = useSetSchoolServiceStateMutation();

  // The backend refuses a blank reason on the way out, so the button does too
  // rather than sending a call that can only come back as an error. Coming back
  // needs none: somebody asks why a school went dark, not why it returned.
  const serviceReasonMissing = serviceMove === "INACTIVE" && !serviceReason.trim();

  const closeServiceMove = () => {
    setServiceMove(null);
    setServiceReason("");
  };

  const applyServiceMove = () => {
    if (!serviceMove || serviceReasonMissing) return;
    setServiceState({
      slug: slug ?? "",
      to_state: serviceMove,
      reason: serviceReason.trim(),
    })
      .unwrap()
      .then(() => {
        const wentDark = serviceMove === "INACTIVE";
        closeServiceMove();
        toast.success(
          wentDark
            ? `${data?.data?.name ?? "The school"} is out of service. Its users can no longer sign in.`
            : `${data?.data?.name ?? "The school"} is back in service.`,
        );
      })
      .catch(() => {
        // The interceptor shows the backend's own refusal; the dialog stays
        // open beneath it so the reader sees it against what they attempted.
      });
  };

  const reinstate = () => {
    reinstateSchool(slug ?? "")
      .unwrap()
      .then((res) => {
        setConfirmReinstate(false);
        const days = res?.data?.expires_in_days;
        toast.success(
          days
            ? `Returned to onboarding. The school has ${days} days to go live.`
            : "Returned to onboarding.",
        );
      })
      .catch(() => {
        // The interceptor surfaces the backend's own refusal (a school that is
        // not suspended answers 409), so the dialog stays open beneath it.
      });
  };
  const school = data?.data;
  useLogRecentOpen(
    school && slug
      ? { kind: "school", id: slug, label: school.name, to: routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug) }
      : null,
  );
  const status = isError && typeof error === "object" && error !== null && "status" in error
    ? error.status : null;
  const isForbidden = status === 403;
  // A slug that resolves to nothing is not a failure to load - it is an address
  // for a school that is not there, and "Try Again" would never succeed. The
  // endpoint used to 500 on this, so the difference was invisible until it was
  // fixed to 404 properly.
  const isMissing = status === 404;

  const setTab = (tab: "overview" | "branches") => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("tab", tab);
      return next;
    });
  };

  const filteredBranches = [...(school?.branches ?? [])]
    .filter((branch) => {
      if (!debouncedSearch) return true;
      const needle = debouncedSearch.toLowerCase();
      return [branch.name, branch.state, branch.country, branch.primary_admin?.contact.full_name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(needle));
    })
    .sort((a: BranchDetail, b: BranchDetail) => {
      if (!sort.sortColumn) return 0;
      const key = sort.sortColumn as keyof BranchDetail;
      const first = String(a[key] ?? "");
      const second = String(b[key] ?? "");
      const comparison = first.localeCompare(second);
      return sort.sortOrder === "desc" ? -comparison : comparison;
    });
  const totalBranchPages = Math.ceil(filteredBranches.length / PAGE_SIZE);
  const pagedBranches = filteredBranches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tableData = pagedBranches.map((branch, index) => ({
    sn: (page - 1) * PAGE_SIZE + index + 1,
    name: (
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(slug ?? "", branch.code)}
          onClick={(event) => event.stopPropagation()}
          className="truncate font-semibold capitalize underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {branch.name}
        </Link>
        {branch.is_main && <Badge className="bg-pry-01 text-xs text-primary">Main</Badge>}
      </div>
    ),
    type: formatEnum(branch._type),
    location: [branch.state, branch.country].filter(Boolean).join(", ") || "-",
    admin: branch.primary_admin?.contact.full_name ?? "Unassigned",
    opened: branch.opened_at ? formatStartedTime(branch.opened_at) : "-",
    status: (
      <Badge variant={branch.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>
        {formatEnum(branch.status)}
      </Badge>
    ),
    _id: `${slug ?? "school"}-${branch.code}`,
    _slug: slug ?? "",
    _code: branch.code,
  }));

  return (
    <>
      <PageShell className="gap-5 text-black-01 sm:gap-6" grid>
        {isLoading && (
          <div className={cn(INFORMATION_CARD_SURFACE, "grid h-52 place-content-center rounded-xl")}>
            <div className="loader" />
          </div>
        )}

        {!isLoading && isError && (
          <div className={cn(INFORMATION_CARD_SURFACE, "grid min-h-52 place-content-center rounded-xl p-6 text-center")}>
            <p className="text-sm font-medium text-red-500">
              {isForbidden
                ? "You do not have permission to view this school."
                : isMissing
                  ? "There is no school at this address. It may have been removed, or the link may be wrong."
                  : "Failed to load school details."}
            </p>
            {isMissing ? (
              <Button variant="outline" className="mt-4" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.INDEX)}>
                Back to schools
              </Button>
            ) : !isForbidden ? (
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>
            ) : null}
          </div>
        )}

        {!isLoading && !isError && school && (
          <>
            <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {/* Was a hand-rolled block with no onError, so a logo that
                    failed to load drew the browser's broken-image glyph rather
                    than the initials sitting right there in the else branch. */}
                <SchoolMark
                  name={school.name}
                  logo={school.branding?.logo}
                  className="size-14 sm:size-16"
                  textClassName="text-lg sm:text-xl"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold capitalize tracking-tight text-black-01 sm:text-2xl">{school.name}</h1>
                    <Badge variant={school.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>
                      {formatEnum(school.status)}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mont text-xs text-gray-01">
                    <span>Code: {school.code || "-"}</span>
                    <span>{formatEnum(school.ownership_type)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {[school.main_branch?.state, school.main_branch?.country].filter(Boolean).join(", ") || "Location not set"}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Only a school the onboarding sweep suspended can be returned to
                    it. Any other status has nothing to undo, and the endpoint
                    refuses with a 409 of its own. */}
                {school.status === "SUSPENDED" && (
                  <PermissionGate permission={P.REINSTATE_SCHOOL}>
                    <Button variant="outline" onClick={() => setConfirmReinstate(true)}>
                      <RotateCcw className="size-4" /> Return to Onboarding
                    </Button>
                  </PermissionGate>
                )}
                {/* ACTIVE and INACTIVE are the only two this endpoint owns. A
                    school still onboarding, or suspended by the sweep, is not
                    the console's to switch off here - the backend refuses both,
                    and Return to Onboarding above is the suspended case. */}
                {school.status === "ACTIVE" && (
                  <PermissionGate permission={P.MANAGE_SCHOOL}>
                    <Button variant="outline-dest" onClick={() => { setServiceReason(""); setServiceMove("INACTIVE"); }}>
                      <PauseCircle className="size-4" /> Take Out of Service
                    </Button>
                  </PermissionGate>
                )}
                {school.status === "INACTIVE" && (
                  <PermissionGate permission={P.MANAGE_SCHOOL}>
                    <Button variant="outline" onClick={() => { setServiceReason(""); setServiceMove("ACTIVE"); }}>
                      <PlayCircle className="size-4" /> Return to Service
                    </Button>
                  </PermissionGate>
                )}
                {/* Audit trails are keyed on the primary key, not the address, so
                    the trail survives a rename. The detail response carries the
                    id for exactly this. */}
                <PermissionGate permission={P.VIEW_AUDIT}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(routesPath.PROTECTED.AUDIT.ENTITY_TRAIL_DETAIL("School", String(school.id)))}
                  >
                    <ScrollText className="size-4" /> Audit Trail
                  </Button>
                </PermissionGate>
                <PermissionGate permission={P.MODIFY_SCHOOL}>
                  <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}>
                    <Pencil className="size-4" /> Edit School
                  </Button>
                </PermissionGate>
              </div>
            </section>

            <div className="max-w-full overflow-x-auto border-b border-gray-200" role="tablist" aria-label="School details">
              <div className="flex min-w-max items-center gap-6 px-1">
                {[
                  { value: "overview" as const, label: "Overview", count: null },
                  ...(canViewBranches ? [{ value: "branches" as const, label: "Branches", count: school.branches.length }] : []),
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.value}
                    onClick={() => setTab(tab.value)}
                    className={cn(
                      "flex h-11 items-center gap-2 whitespace-nowrap border-b-2 px-1 font-mont text-sm font-semibold transition-colors",
                      activeTab === tab.value ? "border-primary text-primary" : "border-transparent text-gray-01 hover:text-black-01",
                    )}
                  >
                    {tab.label}
                    {tab.count !== null && <span className="rounded-full bg-pry-01 px-2 py-0.5 text-xs text-primary">{tab.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "overview" && (
              <div role="tabpanel" className="grid min-w-0 grid-cols-1 gap-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SummaryCard icon={<Building2 className="size-5" />} label="Branches" value={school.branches.length} hint={school.main_branch?.name ? `Main: ${school.main_branch.name}` : "No main branch set"} />
                  <SummaryCard icon={<PackageCheck className="size-5" />} label="Package" value={school.package_setup?.package_plan.name ?? "Not set"} hint={school.package_setup?.package_plan.billing_cycle ? formatEnum(school.package_setup.package_plan.billing_cycle) : "No billing cycle"} />
                  <SummaryCard icon={<ShieldCheck className="size-5" />} label="Enabled modules" value={school.package_setup?.enabled_modules.length ?? 0} hint="Available capabilities" />
                  <SummaryCard icon={<CalendarDays className="size-5" />} label="Activated" value={school.activated_at ? formatStartedTime(school.activated_at) : "Pending"} hint={school.status === "ACTIVE" ? "School is operational" : `Status: ${formatEnum(school.status)}`} />
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                  <div className="grid min-w-0 grid-cols-1 gap-5">
                    <SectionCard title="School information" description="Identity, registration and academic setup" icon={<Building2 className="size-4.5" />}>
                      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailField label="School name" value={school.name} />
                        <DetailField label="Registration ID" value={school.registration_id} />
                        <DetailField label="Ownership" value={formatEnum(school.ownership_type)} />
                        <DetailField label="Term structure" value={formatEnum(school.term_structure)} />
                        <DetailField label="Currency" value={school.currency} />
                        <DetailField label="Motto" value={school.motto} />
                        <DetailField label="School address" value={school.address} />
                        <DetailField label="Website">
                          {school.website ? (
                            <a href={school.website} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary hover:underline">
                              <span className="truncate">{school.website}</span><ExternalLink className="size-3.5 shrink-0" />
                            </a>
                          ) : "-"}
                        </DetailField>
                        {/* The school's own workspace, as opposed to the
                            marketing site above it. Sits here because the pair
                            reads as one question - where is this school? - and
                            because until now nothing in the Console named this
                            address at all: reaching a school meant knowing the
                            domain and typing the slug by hand. */}
                        <DetailField label="XVS address">
                          {school.app_url ? (
                            <a href={school.app_url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary hover:underline">
                              <span className="truncate">{school.app_url.replace(/^https?:\/\//, "")}</span><ExternalLink className="size-3.5 shrink-0" />
                            </a>
                          ) : "-"}
                        </DetailField>
                        <DetailField label="School code" value={school.code} />
                      </div>
                    </SectionCard>

                    <SectionCard title="Package and access" description="Subscription and enabled modules" icon={<PackageCheck className="size-4.5" />}>
                      {school.package_setup ? (
                        <div className="grid min-w-0 grid-cols-1 gap-5">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                            <DetailField label="Plan" value={school.package_setup.package_plan.name} />
                            <DetailField label="Billing cycle" value={formatEnum(school.package_setup.package_plan.billing_cycle)} />
                            <DetailField label="Subscription expires" value={school.package_setup.subscription_expires_at ? formatStartedTime(school.package_setup.subscription_expires_at) : "No expiry set"} />
                          </div>
                          <div>
                            <p className="mb-2 font-mont text-xs font-medium text-gray-01">Enabled modules</p>
                            <div className="flex flex-wrap gap-2">
                              {school.package_setup.enabled_modules.length > 0 ? school.package_setup.enabled_modules.map((module) => (
                                <Badge key={module.id} className="bg-pry-01 text-primary">{module.label}</Badge>
                              )) : <span className="text-sm text-gray-01">No modules enabled.</span>}
                            </div>
                          </div>
                        </div>
                      ) : <p className="text-sm text-gray-01">No package has been configured for this school.</p>}
                    </SectionCard>
                  </div>

                  <div className="grid min-w-0 content-start grid-cols-1 gap-5">
                    <SectionCard title="Primary administrator" description="Main school contact" icon={<UserRound className="size-4.5" />}>
                      {school.primary_admin ? (
                        <div className="grid grid-cols-1 gap-5">
                          <div className="flex items-center gap-3 rounded-lg bg-gray-03 p-3">
                            <div className="grid size-10 shrink-0 place-content-center rounded-full bg-white font-semibold text-primary">
                              {returnInitial(school.primary_admin.contact.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{school.primary_admin.contact.full_name}</p>
                              <p className="truncate font-mont text-xs text-gray-01">{formatEnum(school.primary_admin.role_label)}</p>
                            </div>
                          </div>
                          <DetailField label="Email">
                            <a href={`mailto:${school.primary_admin.contact.email}`} className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"><Mail className="size-3.5 shrink-0" /><span className="truncate">{school.primary_admin.contact.email}</span></a>
                          </DetailField>
                          <DetailField label="Phone" value={school.primary_admin.contact.phone} />
                          <DetailField label="Invite status"><Badge variant={school.primary_admin.invite_status === "SENT" ? "active" : school.primary_admin.invite_status === "FAILED" ? "rejected" : "pending"}>{formatEnum(school.primary_admin.invite_status)}</Badge></DetailField>
                        </div>
                      ) : <p className="text-sm text-gray-01">No primary administrator has been assigned.</p>}
                    </SectionCard>

                    <SectionCard
                      title="Main branch"
                      description="The school's primary location"
                      icon={<ShieldCheck className="size-4.5" />}
                      action={school.main_branch && canViewBranches ? (
                        <Button variant="ghost" size="sm" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(slug ?? "", school.main_branch!.code))}>View <ArrowRight className="size-4" /></Button>
                      ) : undefined}
                    >
                      {school.main_branch ? (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold capitalize">{school.main_branch.name}</p>
                              <Badge className="bg-pry-01 text-xs text-primary">Main</Badge>
                            </div>
                            <p className="mt-1 font-mont text-xs text-gray-01">{formatEnum(school.main_branch._type)}</p>
                          </div>
                          <DetailField label="Location" value={[school.main_branch.state, school.main_branch.country].filter(Boolean).join(", ")} />
                          <DetailField label="Address" value={school.main_branch.address} />
                          <DetailField label="Status"><Badge variant={school.main_branch.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>{formatEnum(school.main_branch.status)}</Badge></DetailField>
                        </div>
                      ) : <p className="text-sm text-gray-01">No main branch has been designated.</p>}
                    </SectionCard>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "branches" && canViewBranches && (
              <div role="tabpanel" className="grid min-w-0 grid-cols-1 gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">School branches</h2>
                    <p className="mt-0.5 font-mont text-xs text-gray-01">Open a branch to view its location, administrator and operational context.</p>
                  </div>
                  <PermissionGate permission={P.ADD_BRANCH}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button><Plus className="size-4" /> Add Branch</Button></DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-sm border">
                        <DropdownMenuItem onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.CREATE_BRANCH(slug ?? ""))} className="cursor-pointer text-sm text-custom-gray-scale-400">Add Manual</DropdownMenuItem>
                        {hasPermission(P.UPLOAD_IMPORT_BATCH) ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setBulkImportOpen(true)}
                              className="cursor-pointer text-sm text-custom-gray-scale-400"
                            >
                              Bulk Upload
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PermissionGate>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <TableToolbar search={search} onSearchChange={(value) => { setPage(1); setSearch(value); }} placeholder="Search branches..." />
                  <SortBar
                    options={[{ column: "name", label: "Name" }, { column: "status", label: "Status" }, { column: "opened_at", label: "Opened" }]}
                    sortColumn={sort.sortColumn}
                    sortOrder={sort.sortOrder}
                    onSort={onSort}
                  />
                </div>

                <CustomTable
                  tableHeaderList={BRANCH_TABLE_HEADERS}
                  tableBodyList={tableData}
                  currentPage={page}
                  totalPage={totalBranchPages}
                  onPageChange={(nextPage) => setPage(nextPage as number)}
                  onRowClick={(row: { _slug: string; _code: number }) => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(row._slug, row._code))}
                  dropDown
                  dropDownList={(row: { _slug: string; _code: number }) => [
                    { label: "View Branch", onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(row._slug, row._code)) },
                    ...(hasPermission(P.MODIFY_BRANCH) ? [{ label: "Edit Branch", onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(row._slug, row._code)) }] : []),
                  ]}
                  emptyText={search ? "No branches match your search." : "No branches have been added yet."}
                />
              </div>
            )}
          </>
        )}

        {!isLoading && !isError && !school && (
          <div className={cn(INFORMATION_CARD_SURFACE, "rounded-xl p-8 text-center")}><p className="text-sm text-gray-01">School not found.</p></div>
        )}
      </PageShell>

      <BulkImportDrawer
        open={bulkImportOpen}
        datasetType="branches"
        title="Bulk upload school branches"
        description="Upload, validate and publish branches without leaving this school."
        returnLabel="School Branches"
        onClose={() => setBulkImportOpen(false)}
        onFinished={() => { void refetch(); }}
      />

      <AlertDialog open={!!serviceMove} onOpenChange={(open) => !open && closeServiceMove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {serviceMove === "INACTIVE"
                ? `Take ${data?.data?.name ?? "this school"} out of service?`
                : `Return ${data?.data?.name ?? "this school"} to service?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {serviceMove === "INACTIVE" ? (
                <>
                  Every account at this school stops being able to sign in, at
                  once. Nothing is deleted: its branches keep their own statuses,
                  so returning it to service restores exactly the arrangement it
                  has now, including which branch is main.
                </>
              ) : (
                <>
                  Its administrators and staff can sign in again, and the school
                  resumes with the branches it had when it went out of service.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {serviceMove === "INACTIVE" && (
            <div className="space-y-1.5">
              <label htmlFor="service-reason" className="text-sm text-black-01">
                Reason <span className="pl-1.5 text-error">*</span>
              </label>
              <Textarea
                id="service-reason"
                rows={3}
                placeholder="Why this school is being taken out of service"
                value={serviceReason}
                onChange={(e) => setServiceReason(e.target.value)}
              />
              <p className="font-mont text-[11px] leading-4 text-gray-01">
                Written into the school&apos;s audit trail. It is the first thing
                anybody asks after a school goes dark.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingService}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); applyServiceMove(); }}
              disabled={changingService || serviceReasonMissing}
              className={serviceMove === "INACTIVE" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {changingService
                ? "Saving..."
                : serviceMove === "INACTIVE"
                  ? "Take out of service"
                  : "Return to service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReinstate} onOpenChange={(open) => !open && setConfirmReinstate(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return this school to onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              {data?.data?.name ?? "This school"} was suspended because its onboarding
              was never finished. Returning it puts it back to Pending and lets its
              administrators sign in again, with a fresh window to go live before the
              sweep suspends it a second time. It does not make the school live.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reinstating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); reinstate(); }}
              disabled={reinstating}
            >
              {reinstating ? "Returning..." : "Return to onboarding"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
