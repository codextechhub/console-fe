import TableToolbar from "@/components/custom/table-toolbar";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
import { P } from "@/permissions";
import { useGetSchoolDetailQuery } from "@/redux/services/dashboard/school-mgt-api";
import type { BranchDetail } from "@/redux/services/dashboard/school-types";
import { routesPath } from "@/routes/routes-path";
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
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useDebounce } from "react-haiku";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { SortBar, handleSortToggle } from "@/components/custom/sort-bar";

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
      <div className="break-words text-sm font-semibold text-black-01">{children ?? value ?? "—"}</div>
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
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const { data, isLoading, isError, error, refetch } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const school = data?.data;
  const initials = returnInitial(school?.name ?? "");
  const isForbidden = isError && typeof error === "object" && error !== null && "status" in error && error.status === 403;

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
    location: [branch.state, branch.country].filter(Boolean).join(", ") || "—",
    admin: branch.primary_admin?.contact.full_name ?? "Unassigned",
    opened: branch.opened_at ? formatStartedTime(branch.opened_at) : "—",
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
    <DashboardLayout title="School Management" hasBack>
      <main className="grid min-w-0 grid-cols-1 gap-5 px-4.5 py-6 text-black-01 sm:gap-6">
        {isLoading && (
          <div className="grid h-52 place-content-center rounded-xl bg-white">
            <div className="loader" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="grid min-h-52 place-content-center rounded-xl bg-white p-6 text-center">
            <p className="text-sm font-medium text-red-500">{isForbidden ? "You do not have permission to view this school." : "Failed to load school details."}</p>
            {!isForbidden && <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>}
          </div>
        )}

        {!isLoading && !isError && school && (
          <>
            <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="grid size-14 shrink-0 place-content-center overflow-hidden rounded-full border border-primary/15 bg-pry-01 sm:size-16">
                  {school.branding?.logo ? (
                    <img src={school.branding.logo} alt={`${school.name} logo`} className="size-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary sm:text-xl">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold capitalize tracking-tight text-black-01 sm:text-2xl">{school.name}</h1>
                    <Badge variant={school.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>
                      {formatEnum(school.status)}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mont text-xs text-gray-01">
                    <span>Code: {school.code || "—"}</span>
                    <span>{formatEnum(school.ownership_type)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {[school.main_branch?.state, school.main_branch?.country].filter(Boolean).join(", ") || "Location not set"}</span>
                  </div>
                </div>
              </div>
              <PermissionGate permission={P.MODIFY_SCHOOL}>
                <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}>
                  <Pencil className="size-4" /> Edit School
                </Button>
              </PermissionGate>
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
                          ) : "—"}
                        </DetailField>
                        <DetailField label="School code" value={school.code} />
                      </div>
                    </SectionCard>

                    <SectionCard title="Package and access" description="Subscription capacity and enabled modules" icon={<PackageCheck className="size-4.5" />}>
                      {school.package_setup ? (
                        <div className="grid min-w-0 grid-cols-1 gap-5">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                            <DetailField label="Plan" value={school.package_setup.package_plan.name} />
                            <DetailField label="Billing cycle" value={formatEnum(school.package_setup.package_plan.billing_cycle)} />
                            <DetailField label="Subscription expires" value={school.package_setup.subscription_expires_at ? formatStartedTime(school.package_setup.subscription_expires_at) : "No expiry set"} />
                            <DetailField label="Student capacity" value={school.package_setup.student_capacity.toLocaleString()} />
                            <DetailField label="Teacher capacity" value={school.package_setup.teacher_capacity.toLocaleString()} />
                            <DetailField label="Admin capacity" value={school.package_setup.admin_capacity.toLocaleString()} />
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate(`${routesPath.PROTECTED.DATA_IMPORTS.BATCHES.NEW}?dataset_type=branches&lock_template=true&return_to=${encodeURIComponent(`${routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? "")}?tab=branches`)}&return_label=${encodeURIComponent("School Branches")}`)}
                          className="cursor-pointer text-sm text-custom-gray-scale-400"
                        >Bulk Upload</DropdownMenuItem>
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
          <div className="rounded-xl bg-white p-8 text-center"><p className="text-sm text-gray-01">School not found.</p></div>
        )}
      </main>
    </DashboardLayout>
  );
}
