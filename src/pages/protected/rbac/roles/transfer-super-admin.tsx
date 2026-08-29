import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/custom/user-avatar";
import { formatRelativeDate } from "@/utils/helpers";
import { toast } from "sonner";
import { selectUser } from "@/redux/features/auth/auth-slice";
import {
  useGetUserAssignmentsQuery,
  useTransferSuperAdminMutation,
} from "@/redux/services/dashboard/rbac-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { PageShell } from "@/components/layout/page-shell";

const SUPER_ADMIN_ROLE_ID = "xvs_super_admin";

export default function TransferSuperAdmin() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser) as { id?: string; email?: string } | null;

  const [selectedUserId, setSelectedUserId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");

  // Active super admin assignment(s). There should be exactly one.
  const { data: assignmentsData, isLoading: assignmentsLoading } = useGetUserAssignmentsQuery({
    role: SUPER_ADMIN_ROLE_ID,
    assignment_status: "ACTIVE",
    page: 1,
    page_size: 5,
  });

  const activeSuperAdmin = assignmentsData?.data?.[0];

  // Platform-tenant candidates only. This picker decides who holds platform
  // super-admin, so offering a school account is not a cosmetic slip: the
  // transfer endpoint refuses one, and the list must not suggest it either.
  // The current super admin is removed below.
  const { data: membersData, isLoading: membersLoading } = useGetTeamMembersQuery({
    scope: "platform",
    status: "ACTIVE",
    page: 1,
    page_size: 200,
  });

  const candidates = useMemo(() => {
    const members = membersData?.data ?? [];
    return members.filter((m) => m.id !== activeSuperAdmin?.user_id);
  }, [membersData?.data, activeSuperAdmin?.user_id]);

  const selectedUser = candidates.find((m) => m.id === selectedUserId);

  const isCurrentUserSuperAdmin =
    !!activeSuperAdmin && !!currentUser?.id && String(activeSuperAdmin.user_id) === String(currentUser.id);

  const [transferSuperAdmin, { isLoading: isTransferring }] = useTransferSuperAdminMutation();

  const handleOpenConfirm = () => {
    if (!selectedUserId) {
      toast.error("Select a team member to transfer the role to.");
      return;
    }
    setTypedEmail("");
    setConfirmOpen(true);
  };

  const emailMatches =
    !!selectedUser && typedEmail.trim().toLowerCase() === selectedUser.email.toLowerCase();

  const handleConfirm = () => {
    if (!emailMatches || !selectedUserId) return;
    transferSuperAdmin({ new_super_admin_id: selectedUserId })
      .unwrap()
      .then((res) => {
        toast.success(res?.message || "Super admin role transferred.");
        setConfirmOpen(false);
        setSelectedUserId("");
        setTypedEmail("");
        // The current user's role just changed - bounce them back to the roles
        // index so a stale super-admin-only menu doesn't linger.
        navigate(routesPath.PROTECTED.ROLES.INDEX);
      })
      .catch(() => {});
  };

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold font-mont text-gray-01">Transfer Super Admin Role</p>
            <p className="text-xs text-gray-01 mt-0.5 max-w-2xl">
              Hand over the Vision Super Admin role to another CX staff member. The
              current super admin is automatically demoted to Platform Admin. There is
              always exactly one super admin.
            </p>
          </div>
        </div>

        {/* ── Warning callout ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3.5" data-guide="super-admin-transfer.warning">
          <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-destructive">
            <p className="font-semibold">This is a one-way action.</p>
            <p>
              Once transferred, the new super admin must initiate any future transfer.
              Your current super-admin-only capabilities (including this transfer flow)
              will be revoked immediately.
            </p>
          </div>
        </div>

        {/* ── Current super admin ─────────────────────────────────────────── */}
        <section className="rounded-md bg-white border border-white-02 p-5" data-guide="super-admin-transfer.current-owner">
          <p className="text-xs uppercase tracking-wide text-gray-01 font-mont mb-3">
            Current super admin
          </p>
          {assignmentsLoading ? (
            <p className="text-sm text-gray-01">Loading…</p>
          ) : activeSuperAdmin ? (
            <div className="flex items-center gap-4">
              <UserAvatar
                userId={activeSuperAdmin.user_id}
                name={activeSuperAdmin.user_name}
                className="size-12 shrink-0"
                fallbackClassName="text-sm font-semibold bg-pry-01 text-primary"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black-01">
                  {activeSuperAdmin.user_name}
                  {isCurrentUserSuperAdmin && (
                    <Badge variant="active" className="ml-2 align-middle">You</Badge>
                  )}
                </p>
                <p className="text-xs text-gray-01 truncate">{activeSuperAdmin.user_email}</p>
                <p className="text-xs text-gray-01 mt-1">
                  Active since {formatRelativeDate(activeSuperAdmin.assigned_at)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              No active super admin found. Contact engineering - the platform should always
              have exactly one.
            </p>
          )}
        </section>

        {/* ── Transfer form ───────────────────────────────────────────────── */}
        <section className="rounded-md bg-white border border-white-02 p-5 space-y-4" data-guide="super-admin-transfer.successor">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-01 font-mont">
              Choose new super admin
            </p>
            <p className="text-xs text-gray-01 mt-1">
              Only active CX staff are eligible. The current super admin is excluded.
            </p>
          </div>

          <Combobox
            value={selectedUserId || null}
            onValueChange={(v) => setSelectedUserId(v ?? "")}
            disabled={membersLoading || candidates.length === 0 || !isCurrentUserSuperAdmin}
          >
            <ComboboxInput
              placeholder={
                membersLoading
                  ? "Loading staff…"
                  : candidates.length === 0
                    ? "No eligible CX staff available"
                    : "Select a CX staff member…"
              }
              showTrigger
              showClear={!!selectedUserId}
              className="w-full h-10.5"
              disabled={membersLoading || candidates.length === 0 || !isCurrentUserSuperAdmin}
            />
            <ComboboxContent>
              <ComboboxList>
                {candidates.map((m) => (
                  <ComboboxItem key={m.id} value={m.id}>
                    <span className="font-medium">{m.full_name}</span>
                    <span className="text-gray-01 text-xs ml-1">- {m.email}</span>
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No matching staff found</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {!isCurrentUserSuperAdmin && !assignmentsLoading && activeSuperAdmin && (
            <div className="flex items-start gap-2 rounded-md bg-gray-50 border border-white-02 px-3 py-2.5 text-xs text-gray-01">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p>
                Only the current super admin ({activeSuperAdmin.user_email}) can perform a
                transfer. The button below is disabled for everyone else.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleOpenConfirm}
              disabled={!selectedUserId || !isCurrentUserSuperAdmin || isTransferring}
            >
              Transfer Super Admin
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </PageShell>

      {/* ── Confirmation dialog ───────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={(v) => !v && setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Super Admin Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-xs text-destructive space-y-1">
              <p className="font-semibold">You are about to permanently transfer the role.</p>
              <p>
                You will be demoted to Platform Admin and lose super-admin capabilities
                immediately. This dialog is your last opportunity to cancel.
              </p>
            </div>

            {activeSuperAdmin && selectedUser && (
              <div className="rounded-md bg-gray-50 border border-white-02 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-01">From</span>
                  <span className="font-medium text-black-01">{activeSuperAdmin.user_email}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-01">To</span>
                  <span className="font-medium text-black-01">{selectedUser.email}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Type the new super admin&apos;s email to confirm{" "}
                <span className="text-destructive">*</span>
              </label>
              <CustomInput
                id="confirm-email"
                placeholder={selectedUser?.email ?? ""}
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setConfirmOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleConfirm}
              disabled={!emailMatches || isTransferring}
            >
              {isTransferring ? "Transferring…" : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
