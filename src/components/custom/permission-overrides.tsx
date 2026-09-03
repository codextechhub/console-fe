/**
 * "Permission exceptions" - per-user overrides layered on top of role grants.
 *
 * One implementation, two mounts: the CX staff profile
 * (pages/protected/organogram/staff/staff-detail.tsx) and the school-user
 * detail drawer (pages/protected/team-mgt/school-user-detail.tsx).
 *
 * ── VISIBILITY (the security crux) ───────────────────────────────────────────
 * The whole section renders ONLY when the VIEWER holds
 * P.VIEW_PERMISSION_EXCEPTIONS or P.MANAGE_PERMISSION_EXCEPTIONS. A user
 * browsing their own profile without those keys must see no trace: no section,
 * no heading, no count, no empty state, no skeleton - and no request. That is
 * why the gate lives in the exported wrapper and the RTK Query hook lives in a
 * separate inner component: an ungated viewer never mounts the component that
 * owns the hook, so nothing can be fired even for a moment. Fail closed -
 * missing tenant/user also renders nothing.
 *
 * Gating uses the ACTOR's namespace (platform.team_overrides.*) on BOTH mounts;
 * the target's namespace is never unioned in. The backend enforces the same
 * key - this is UI gating on top of, not instead of, server authz.
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  Info,
  Plus,
  ShieldMinus,
  ShieldPlus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { SearchSelect } from "@/components/custom/search-select";
import {
  SkeletonCard,
  SkeletonLoadingLabel,
} from "@/components/custom/skeletons";
import { usePermissions } from "@/hooks/use-permissions";
import { useNow } from "@/hooks/use-now";
import { P, permissionLabel, permissionModule } from "@/permissions";
import { useGetPermissionsQuery } from "@/redux/services/dashboard/rbac-api";
import {
  useCreatePermissionOverrideMutation,
  useDeletePermissionOverrideMutation,
  useGetPermissionOverridesQuery,
  type OverrideMode,
  type PermissionOverride,
} from "@/redux/services/rbac/override-api";
import { formatRelativeDate } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  /** Target user's id. */
  userId?: string | number | null;
  /** Tenant slug that OWNS the target (the school's slug for a school user). */
  tenantSlug?: string | null;
  /** Shown in confirm/drawer copy so the operator knows who they are editing. */
  userName?: string | null;
  className?: string;
}

const MODE_LABEL: Record<OverrideMode, string> = {
  DENY: "Denied",
  ALLOW: "Extra grant",
};

/** Human countdown for an expiry timestamp, relative to `now`. */
export function expiryLabel(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "Expired";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `Expires in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Expires in ${hours} hr`;
  return `Expires in ${Math.round(hours / 24)} days`;
}

/**
 * The context line under a row - what the override is actually doing given the
 * user's roles. `granted_by_role` is the backend's computed flag.
 */
export function contextLine(row: Pick<PermissionOverride, "mode" | "granted_by_role">): string {
  if (row.mode === "DENY") {
    return row.granted_by_role
      ? "A role grants this - it is denied for this user."
      : "No role grants this anyway - the denial is pre-emptive.";
  }
  return row.granted_by_role
    ? "A role already grants this - the extra grant is redundant."
    : "No role grants this - access comes only from this exception.";
}

/**
 * The single source of truth for "may this viewer see permission exceptions?".
 * Mounts that must resolve extra context for the section (e.g. looking up a
 * school's tenant slug) gate that work on this too, so an ungated viewer causes
 * no requests at all - the gate lives in one place, not one per call site.
 */
export function useCanViewPermissionExceptions(): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(
    P.VIEW_PERMISSION_EXCEPTIONS,
    P.MANAGE_PERMISSION_EXCEPTIONS,
  );
}

/**
 * Public entry point - the permission gate. Renders nothing (and mounts no
 * query) unless the viewer may see exceptions.
 */
export default function PermissionOverrides({
  userId,
  tenantSlug,
  userName,
  className,
}: Props) {
  const { hasPermission } = usePermissions();
  const canView = useCanViewPermissionExceptions();
  if (!canView || !userId || !tenantSlug) return null;

  return (
    <OverridesSection
      userId={userId}
      tenantSlug={tenantSlug}
      userName={userName}
      canManage={hasPermission(P.MANAGE_PERMISSION_EXCEPTIONS)}
      className={className}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The section itself - only ever mounted behind the gate above.
// ─────────────────────────────────────────────────────────────────────────────
function OverridesSection({
  userId,
  tenantSlug,
  userName,
  canManage,
  className,
}: {
  userId: string | number;
  tenantSlug: string;
  userName?: string | null;
  canManage: boolean;
  className?: string;
}) {
  const now = useNow();
  const [addOpen, setAddOpen] = useState(false);
  const [pendingLift, setPendingLift] = useState<PermissionOverride | null>(null);

  const { data, isLoading, isError } = useGetPermissionOverridesQuery({
    tenantSlug,
    userId,
    page_size: 50,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];

  const [liftOverride, { isLoading: lifting }] = useDeletePermissionOverrideMutation();

  const confirmLift = () => {
    if (!pendingLift) return;
    liftOverride({ tenantSlug, userId, id: pendingLift.id })
      .unwrap()
      .then(() => {
        toast.success(
          pendingLift.mode === "DENY"
            ? "Exception lifted - role access restored on their next request."
            : "Extra grant removed - effective on their next request.",
        );
        setPendingLift(null);
      })
      .catch(() => {});
  };

  return (
    <section
      className={cn(
        "rounded-md border border-white-02 bg-white p-4 min-w-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold font-mont text-black-01">
            Permission exceptions
          </h3>
          <p className="mt-1 text-xs text-gray-01">
            Access granted or withheld for this user personally, on top of their
            roles.
          </p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-3.5" /> Add exception
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-md border border-white-02">
            <SkeletonLoadingLabel text="Loading permission exceptions…" />
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} lines={2} rowIndex={i} />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-md bg-gray-03 px-3 py-6 text-center text-sm text-gray-01">
            Could not load permission exceptions.
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-md bg-gray-03 px-3 py-6 text-center text-sm text-gray-01">
            No exceptions - access comes entirely from roles.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3">
            {rows.map((row) => (
              <OverrideRow
                key={row.id}
                row={row}
                now={now}
                canManage={canManage}
                onLift={() => setPendingLift(row)}
              />
            ))}
          </ul>
        )}
      </div>

      {canManage && (
        <AddExceptionDrawer
          open={addOpen}
          onOpenChange={setAddOpen}
          tenantSlug={tenantSlug}
          userId={userId}
          userName={userName}
          existing={rows}
        />
      )}

      <Dialog
        open={Boolean(pendingLift)}
        onOpenChange={(open) => !open && setPendingLift(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Lift this exception?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-01">
            <p className="break-words">
              <span className="font-medium text-black-01">
                {pendingLift ? permissionLabel(pendingLift.permission_key) : ""}
              </span>{" "}
              <span className="font-mono text-xs">
                {pendingLift?.permission_key}
              </span>
            </p>
            <p>
              {pendingLift?.mode === "DENY"
                ? "Lifting this restores whatever access their roles give them for this permission."
                : "Lifting this removes the extra grant - they keep only what their roles give them."}
            </p>
            <p className="text-xs">Effective on their next request.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="white"
              size="sm"
              onClick={() => setPendingLift(null)}
              disabled={lifting}
            >
              Cancel
            </Button>
            <Button size="sm" loading={lifting} onClick={confirmLift}>
              Lift exception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OverrideRow({
  row,
  now,
  canManage,
  onLift,
}: {
  row: PermissionOverride;
  now: number;
  canManage: boolean;
  onLift: () => void;
}) {
  const expiry = expiryLabel(row.expires_at, now);
  const spent = row.is_expired;

  return (
    <li
      className={cn(
        "rounded-md border border-white-02 p-3.5 min-w-0",
        spent && "border-dashed bg-gray-03/70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "break-words text-sm font-medium text-black-01",
              spent && "text-gray-01 line-through",
            )}
          >
            {permissionLabel(row.permission_key)}
          </p>
          <p className="mt-0.5 break-all font-mono text-[11px] text-gray-01">
            {row.permission_key}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant={row.mode === "DENY" ? "rejected" : "success"}>
            {row.mode === "DENY" ? (
              <ShieldMinus className="size-3" />
            ) : (
              <ShieldPlus className="size-3" />
            )}
            {MODE_LABEL[row.mode]}
          </Badge>
          {canManage && (
            <button
              type="button"
              onClick={onLift}
              aria-label={`Lift exception on ${row.permission_key}`}
              className="inline-flex items-center gap-1 rounded-md border border-white-02 px-1.5 py-1 text-[11px] font-semibold text-gray-01 transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="size-3" /> Lift
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-01">
        <Info className="mt-0.5 size-3 shrink-0" />
        <span className="min-w-0">{contextLine(row)}</span>
      </p>

      {row.reason && (
        <p className="mt-2 break-words rounded-md bg-gray-03 px-2.5 py-1.5 text-xs text-gray-01">
          “{row.reason}”
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-01">
        <span className="break-words">
          Set by {row.created_by_name || "-"} · {formatRelativeDate(row.created_at)}
        </span>
        {expiry && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              spent ? "text-gray-05" : "text-amber-600",
            )}
          >
            <CalendarClock className="size-3" /> {expiry}
          </span>
        )}
        {!row.expires_at && <span className="text-gray-05">No expiry</span>}
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add exception drawer (mounted only when the viewer holds `.manage`).
// ─────────────────────────────────────────────────────────────────────────────
function AddExceptionDrawer({
  open,
  onOpenChange,
  tenantSlug,
  userId,
  userName,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  userId: string | number;
  userName?: string | null;
  existing: PermissionOverride[];
}) {
  const { hasPermission } = usePermissions();
  const [permission, setPermission] = useState("");
  const [module, setModule] = useState("");
  // Deny is the default: the safe direction, and the common case.
  const [mode, setMode] = useState<OverrideMode>("DENY");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [touched, setTouched] = useState(false);

  // The permission catalogue is its own restricted surface. Ask for it only
  // when the viewer may read it, so an override manager without
  // platform.permissions.view gets a working screen instead of a 403 toast -
  // they fall back to the keys this console already knows.
  const canReadCatalogue = hasPermission(P.VIEW_PERMISSIONS);
  const { data: catalogue, isFetching: loadingCatalogue } = useGetPermissionsQuery(
    { page_size: 500, is_active: "true" },
    { skip: !open || !canReadCatalogue },
  );

  const catalogueRows = Array.isArray(catalogue?.data) ? catalogue.data : [];
  const modules = Array.from(
    new Set(catalogueRows.map((p) => p.module_key || permissionModule(p.key))),
  ).sort();

  const options = catalogueRows
    .filter((p) => !module || (p.module_key || permissionModule(p.key)) === module)
    .map((p) => ({
      value: p.key,
      label: `${permissionLabel(p.key)} - ${p.key}`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));

  const alreadyOverridden = existing.find((row) => row.permission_key === permission);

  const [createOverride, { isLoading: saving }] = useCreatePermissionOverrideMutation();

  const reasonError = touched && !reason.trim() ? "A reason is required." : undefined;
  const permissionError =
    touched && !permission ? "Choose a permission." : undefined;

  const reset = () => {
    setPermission("");
    setModule("");
    setMode("DENY");
    setReason("");
    setExpiresAt("");
    setTouched(false);
  };

  const submit = () => {
    setTouched(true);
    if (!permission || !reason.trim()) return;
    createOverride({
      tenantSlug,
      userId,
      body: {
        permission,
        mode,
        reason: reason.trim(),
        // The date input yields a plain date; send an ISO instant so the
        // backend's "must be in the future" check reads what the user meant.
        expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      },
    })
      .unwrap()
      .then(() => {
        toast.success(
          mode === "DENY"
            ? "Permission denied for this user - effective on their next request."
            : "Extra grant applied - effective on their next request.",
        );
        reset();
        onOpenChange(false);
      })
      .catch(() => {});
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex w-full flex-col sm:max-w-[480px]">
        <SheetHeader className="border-b border-white-02">
          <SheetTitle className="text-base font-semibold font-mont">
            Add permission exception
          </SheetTitle>
          <SheetDescription className="break-words">
            A personal exception for {userName || "this user"}. It applies
            immediately and takes effect on their next request.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-w-0 flex-1">
          <div className="space-y-5 px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchSelect
                id="override-module"
                label="Module"
                placeholder="All modules"
                options={modules.map((m) => ({ value: m, label: m }))}
                loading={loadingCatalogue}
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  setPermission("");
                }}
              />
              <SearchSelect
                id="override-permission"
                label="Permission"
                isRequired
                placeholder="Search permissions…"
                revealOnSearch
                options={options}
                loading={loadingCatalogue}
                value={permission}
                error={permissionError}
                onChange={(e) => setPermission(e.target.value)}
              />
            </div>

            {!canReadCatalogue && (
              <p className="rounded-md bg-gray-03 px-3 py-2 text-xs text-gray-01">
                The full permission catalogue needs the permission-registry view
                right. Ask an admin who has it if the key you need is missing.
              </p>
            )}

            {alreadyOverridden && (
              <p className="rounded-md bg-yellow-01/10 px-3 py-2 text-xs text-yellow-01">
                This user already has a{" "}
                <span className="font-semibold">
                  {MODE_LABEL[alreadyOverridden.mode]}
                </span>{" "}
                exception on this permission. Saving REPLACES it - the old one is
                removed and recorded in the audit trail.
              </p>
            )}

            <div>
              <p className="mb-1.5 text-sm text-black-01">Mode</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["DENY", "ALLOW"] as OverrideMode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => setMode(option)}
                    className={cn(
                      "min-w-0 rounded-md border p-3 text-left transition-colors",
                      mode === option
                        ? "border-primary bg-primary/5"
                        : "border-white-02 hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium text-black-01">
                      {option === "DENY" ? (
                        <ShieldMinus className="size-3.5" />
                      ) : (
                        <ShieldPlus className="size-3.5" />
                      )}
                      {MODE_LABEL[option]}
                    </span>
                    <span className="mt-1 block text-xs text-gray-01">
                      {option === "DENY"
                        ? "Withhold this permission even if a role grants it."
                        : "Grant this permission even though no role does."}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid w-full items-center gap-1">
              <label htmlFor="override-reason" className="text-sm text-black-01 after:pl-1.5 after:text-error after:content-['*']">
                Reason
              </label>
              <textarea
                id="override-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean(reasonError)}
                placeholder="Why this user needs this exception (kept in the audit trail)."
                className="w-full rounded-md border border-white-02 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {reasonError && (
                <p className="text-xs font-medium text-error">{reasonError}</p>
              )}
            </div>

            <CustomDateInput
              id="override-expiry"
              label="Expires on (optional)"
              placeholder="Never expires"
              value={expiresAt}
              onValueChange={setExpiresAt}
            />
        </div>
        </ScrollArea>

        <SheetFooter className="border-t border-white-02">
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="white"
              className="sm:flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button className="sm:flex-1" loading={saving} onClick={submit}>
              {alreadyOverridden ? "Replace exception" : "Apply exception"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
