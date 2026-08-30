import PermissionGate from "@/components/custom/permission-gate";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetBranchDetailQuery,
  useGetSchoolDetailQuery,
  useTransitionBranchMutation,
  useUpdateBranchMutation,
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
  Star,
  UserRound,
} from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/custom/custom-input";
import { PageShell } from "@/components/layout/page-shell";
import {
  OUT_OF_SERVICE,
  branchLeaveServiceBlock,
  branchNameConfirmationRequired,
  branchReasonRequired,
  branchTransitionEffect,
  branchTransitionLabel,
  branchTransitionsFrom,
  type BranchStatus,
} from "./branch-lifecycle";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

function DetailField({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="font-mont text-xs font-medium text-gray-01">{label}</p>
      <div className="break-words text-sm font-semibold text-black-01">{children ?? value ?? "-"}</div>
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

  const [confirmPromote, setConfirmPromote] = useState(false);
  // The move being confirmed, or null. Reason and typed name are cleared with
  // it, so a cancelled close cannot leave a name sitting in the next dialog.
  const [pendingMove, setPendingMove] = useState<BranchStatus | null>(null);
  const [moveReason, setMoveReason] = useState("");
  const [typedName, setTypedName] = useState("");

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

  const [updateBranch, { isLoading: promoting }] = useUpdateBranchMutation();
  const [transitionBranch, { isLoading: transitioning }] = useTransitionBranchMutation();

  const school = schoolData?.data;
  const branch = branchData?.data;
  const isLoading = schoolLoading || branchLoading;
  // The main branch cannot be taken out of service until a sibling takes over,
  // so the handover has to be reachable or that refusal is unfollowable. The
  // backend demotes the incumbent in the same transaction.
  const canPromote = !!branch && !branch.is_main && !OUT_OF_SERVICE.has(branch.status);

  const branchCount = school?.branches?.length ?? 0;
  const transitions = branch ? branchTransitionsFrom(branch.status) : [];
  // Shown but refused rather than hidden: an operator who cannot see the
  // control never learns that the main designation has to be handed over first.
  const blockedReason = (to: BranchStatus) =>
    branch ? branchLeaveServiceBlock(to, { isMain: branch.is_main, branchCount }) : null;
  const blockedReasons = [
    ...new Set(transitions.map(blockedReason).filter((reason): reason is string => !!reason)),
  ];

  const closeMove = () => {
    setPendingMove(null);
    setMoveReason("");
    setTypedName("");
  };

  const reasonMissing = !!pendingMove && branchReasonRequired(pendingMove) && !moveReason.trim();
  const nameMismatch =
    !!pendingMove
    && branchNameConfirmationRequired(pendingMove)
    && typedName.trim() !== (branch?.name ?? "").trim();
  const moveBlocked = reasonMissing || nameMismatch;

  const applyMove = () => {
    if (!pendingMove || moveBlocked) return;
    transitionBranch({
      slug: slug ?? "",
      code: parsedCode,
      to_state: pendingMove,
      reason: moveReason.trim(),
    })
      .unwrap()
      .then((res) => {
        const next = res?.data?.status ?? pendingMove;
        closeMove();
        toast.success(`${branch?.name ?? "This branch"} is now ${next.toLowerCase()}.`);
      })
      .catch(() => {
        // The interceptor surfaces the backend's own refusal - the main-branch
        // and last-branch guards answer 409 with the advice to follow - so the
        // dialog stays open with the reader's own words still in it.
      });
  };

  const promoteToMain = () => {
    updateBranch({ slug: slug ?? "", code: parsedCode, body: { is_main: true } })
      .unwrap()
      .then(() => {
        setConfirmPromote(false);
        toast.success(`${branch?.name ?? "This branch"} is now the main branch.`);
      })
      .catch(() => {
        // The interceptor surfaces the backend's own refusal; keep the dialog
        // open so the reader sees it against what they were trying to do.
      });
  };
  const isForbidden = isError && typeof error === "object" && error !== null && "status" in error && error.status === 403;

  return (
    <>
      <PageShell className="gap-5 text-black-01 sm:gap-6" grid>
        {isLoading && (
          <div className={cn(INFORMATION_CARD_SURFACE, "grid h-52 place-content-center rounded-xl")}><div className="loader" /></div>
        )}

        {!isLoading && isError && (
          <div className={cn(INFORMATION_CARD_SURFACE, "grid min-h-52 place-content-center rounded-xl p-6 text-center")}>
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
                <div className="flex flex-wrap items-center gap-3">
                  {canPromote && (
                    <Button variant="outline" onClick={() => setConfirmPromote(true)}>
                      <Star className="size-4" /> Make Main Branch
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(slug ?? "", parsedCode))}>
                    <Pencil className="size-4" /> Edit Branch
                  </Button>
                </div>
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
                      {branch.email ? <a href={`mailto:${branch.email}`} className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"><Mail className="size-3.5 shrink-0" /><span className="truncate">{branch.email}</span></a> : "-"}
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

                  <PermissionGate permission={P.MANAGE_BRANCH}>
                    <div className="mt-5 border-t border-gray-200/80 pt-4">
                      <p className="font-mont text-xs font-medium text-gray-01">Change status</p>
                      {transitions.length === 0 ? (
                        <p className="mt-2 text-xs text-gray-01">
                          A closed branch is final. To trade here again, create a new branch.
                        </p>
                      ) : (
                        <>
                          <div className="mt-3 flex flex-col gap-2.5">
                            {transitions.map((to) => (
                              <Button
                                key={to}
                                variant={to === "CLOSED" ? "outline-dest" : "outline"}
                                className="w-full justify-start"
                                disabled={!!blockedReason(to)}
                                onClick={() => { setMoveReason(""); setTypedName(""); setPendingMove(to); }}
                              >
                                {branchTransitionLabel(to, branch.status)}
                              </Button>
                            ))}
                          </div>
                          {/* Once, not under each disabled control: the same rule
                              blocks every way out of service, and repeating it
                              per button reads as several different problems. */}
                          {blockedReasons.map((reason) => (
                            <p key={reason} className="mt-2.5 font-mont text-[11px] leading-4 text-gray-01">
                              {reason}
                            </p>
                          ))}
                        </>
                      )}
                    </div>
                  </PermissionGate>
                </SectionCard>
              </div>
            </div>
          </>
        )}

        {!isLoading && !isError && !branch && (
          <div className={cn(INFORMATION_CARD_SURFACE, "rounded-xl p-8 text-center")}><p className="text-sm text-gray-01">Branch not found.</p></div>
        )}
      </PageShell>

      <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && closeMove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingMove ? `${branchTransitionLabel(pendingMove, branch?.status ?? "")}?` : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove ? branchTransitionEffect(pendingMove, branch?.name ?? "This branch") : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="transition-reason" className="text-sm text-black-01">
                Reason
                {pendingMove && branchReasonRequired(pendingMove) && (
                  <span className="pl-1.5 text-error">*</span>
                )}
              </label>
              <Textarea
                id="transition-reason"
                rows={3}
                placeholder="What changed, and on whose instruction"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              />
              <p className="font-mont text-[11px] leading-4 text-gray-01">
                Written into this branch&apos;s lifecycle history, which is what a reviewer reads
                later when they ask why this happened.
              </p>
            </div>

            {pendingMove && branchNameConfirmationRequired(pendingMove) && (
              <CustomInput
                id="transition-confirm-name"
                label={`Type ${branch?.name ?? "the branch name"} to confirm`}
                placeholder={branch?.name ?? ""}
                autoComplete="off"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={transitioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); applyMove(); }}
              disabled={transitioning || moveBlocked}
              className={pendingMove === "CLOSED" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {transitioning
                ? "Applying..."
                : pendingMove
                  ? branchTransitionLabel(pendingMove, branch?.status ?? "")
                  : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPromote} onOpenChange={(open) => !open && setConfirmPromote(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make this the main branch?</AlertDialogTitle>
            <AlertDialogDescription>
              {branch?.name} becomes the main branch of {school?.name ?? "this school"}
              {school?.main_branch?.name ? `, and ${school.main_branch.name} becomes an additional branch` : ""}.
              The main branch is the one the school is addressed by, and it cannot be
              taken out of service while it holds the designation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); promoteToMain(); }}
              disabled={promoting}
            >
              {promoting ? "Updating..." : "Make main branch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
