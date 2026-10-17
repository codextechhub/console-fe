import { useState, useMemo, type FormEvent } from "react";
import { CircleCheck, Key, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomInput } from "@/components/custom/custom-input";
import { PasswordRequirements } from "@/components/custom/password-requirements";
import { passwordMeetsPolicy } from "@/lib/password-policy";
import {
  useChangeMyPasswordMutation,
  useGetMyPasswordResetsQuery,
} from "@/redux/services/dashboard/security-api";
import { useAppSelector } from "@/redux/store";
import { useLogout } from "@/hooks/use-logout";
import { formatRelativeDate } from "@/utils/helpers";
import {
  humanizeAuthError,
  passwordFieldErrors,
  type PasswordFieldErrors,
} from "@/utils/auth-errors";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

// ── Utilities ─────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}*****@${domain}`;
}

function maskIp(ip: string | null | undefined): string {
  if (!ip) return "-";
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.•••.•••.${parts[3]}`;
}

const STRENGTH_LABELS = ["Weak", "Weak", "Okay", "Good", "Strong", "Very strong"];

function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "-" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return { score: s, label: STRENGTH_LABELS[s] };
}

export const MISMATCH_MESSAGE = "Passwords do not match.";

/**
 * What the server does on a successful change, said in plain words.
 *
 * `PasswordService.change` blacklists every refresh token the account holds,
 * this device's included, so no sign-in survives it. Each device keeps its
 * current access token, which lives for up to 15 minutes, and is then asked
 * to sign in again. Saying "other devices" alone would leave the reader
 * surprised when this one signs them out too. school-fe's change-password
 * form says the same.
 */
export const SIGNED_OUT_EVERYWHERE_MESSAGE =
  "Every device signed in to your account has been signed out, this one included. " +
  "Each will ask for your new password within 15 minutes. " +
  "Sign in again now so nothing you are doing here is cut off.";

const FALLBACK_REFUSAL = "Your password could not be changed. Try again.";

type PasswordField = keyof PasswordFieldErrors;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Password & sign-in: the signed-in person changes their own password,
 * reads their masked email and reviews their reset history.
 *
 * Every refusal of a change lands under the box it is about: a wrong current
 * password under Current password, a policy refusal under New password, a
 * mismatch under Confirm. The request is silent, so the interceptor raises no
 * toast, and anything that names no box (offline, throttled, a server fault)
 * shows in the form itself. After a change the page says that every device,
 * this one included, is signed out, and offers to sign in again at once.
 *
 * While proxying, the session acts as the person proxied, so a change here
 * would be to their password, not the operator's. The form is withheld and
 * the page says how to reach the operator's own; the email and reset history
 * stay, as reads of the proxied account like every other screen in proxy.
 */
export default function MyPassword() {
  const user = useAppSelector((s) => s.auth.user);
  const impersonation = useAppSelector((s) => s.auth.impersonation);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [changed, setChanged] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [changePassword, { isLoading: changingPw }] = useChangeMyPasswordMutation();
  const { handleLogout, isLoggingOut } = useLogout();
  const { data: resetsData } = useGetMyPasswordResetsQuery(undefined, {
    skip: !showHistory,
    refetchOnMountOrArgChange: true,
  });

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmitPw =
    oldPassword.length > 0 &&
    passwordMeetsPolicy(newPassword) &&
    newPassword === confirmPassword &&
    !changingPw;

  const edit = (field: PasswordField, set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
    setChanged(false);
  };

  const handleSubmitPw = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmitPw) return;
    setErrors({});
    setFormError("");
    try {
      await changePassword({
        current_password: oldPassword,
        password: newPassword,
        confirm_password: confirmPassword,
      }).unwrap();
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChanged(true);
    } catch (err) {
      const perField = passwordFieldErrors(err);
      if (Object.keys(perField).length > 0) setErrors(perField);
      else setFormError(humanizeAuthError(err, FALLBACK_REFUSAL));
    }
  };

  const resets = Array.isArray(resetsData?.data) ? resetsData.data : [];
  const passwordChangedAt = user?.password_changed_at || null;

  return (
    <>
      <PageShell className="space-y-4 text-black-01 max-w-2xl">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <Key className="size-6 text-blue-600" />
          <div>
            <p className="font-semibold font-mont text-gray-01">Password & sign-in</p>
            <p className="text-xs text-gray-01 mt-0.5">Choose a strong password you don't use anywhere else.</p>
          </div>
        </div>

        {/* ── Change password card ───────────────────────────────────────────── */}
        {impersonation ? (
          <div
            role="note"
            className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5 flex items-start gap-3")}
          >
            <UsersRound className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Exit proxy to change your password</p>
              <p className="text-xs text-gray-01 mt-0.5">
                You are proxying as {impersonation.target.full_name}, and only they can change
                their password. Exit proxy from the account menu, then come back here to change yours.
              </p>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmitPw}
            className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5 space-y-4")}
          >
            <div>
              <p className="text-sm font-semibold">Change password</p>
              {passwordChangedAt && (
                <p className="text-xs text-gray-01 mt-0.5">
                  Last changed {formatRelativeDate(passwordChangedAt)}
                </p>
              )}
            </div>

            {/* Current password - full width */}
            <CustomInput
              id="old_password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => edit("current_password", setOldPassword)(e.target.value)}
              error={errors.current_password}
            />

            {/* New + confirm - 2-column */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <CustomInput
                  id="new_password"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => edit("password", setNewPassword)(e.target.value)}
                  placeholder="At least 12 characters"
                  error={errors.password}
                />
                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-0.5 h-1 rounded overflow-hidden bg-gray-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 transition-colors ${
                            i <= strength.score
                              ? strength.score < 3
                                ? "bg-amber-400"
                                : "bg-green-500"
                              : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[11px] text-gray-01">Strength</span>
                      <span
                        className={`text-[11px] font-medium ${
                          strength.score < 3 ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <CustomInput
                  id="confirm_password"
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => edit("confirm_password", setConfirmPassword)(e.target.value)}
                  placeholder="Re-enter new password"
                  error={errors.confirm_password || (mismatch ? MISMATCH_MESSAGE : undefined)}
                />
              </div>
            </div>

            {/* Policy checklist */}
            <PasswordRequirements password={newPassword} />

            {formError && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {formError}
              </p>
            )}

            {changed && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900"
              >
                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 space-y-2">
                  <p>
                    <strong>Password changed.</strong> {SIGNED_OUT_EVERYWHERE_MESSAGE}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                  >
                    Sign in again now
                  </Button>
                </div>
              </div>
            )}

            {/* Footer row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-01">
                Updating signs you out on every device, this one included.
              </p>
              <Button type="submit" size="sm" disabled={!canSubmitPw} className="shrink-0">
                {changingPw ? "Saving…" : "Update password"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Email address card (read-only) ────────────────────────────────── */}
        <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5 flex items-center justify-between gap-4")}>
          <div>
            <p className="text-sm font-semibold">Email address</p>
            <p className="text-xs font-mont text-gray-01 mt-0.5 tracking-wide">
              {user?.email ? maskEmail(user.email) : "-"}
            </p>
          </div>
          <p className="text-xs text-gray-01 text-right shrink-0">
            To change your email,<br />contact your administrator.
          </p>
        </div>

        {/* ── Password reset history (collapsible) ──────────────────────────── */}
        <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md")}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium"
            onClick={() => setShowHistory((v) => !v)}
          >
            <span>Password reset history</span>
            <span className="text-xs text-gray-01">{showHistory ? "Hide ▲" : "Show ▼"}</span>
          </button>
          {showHistory && (
            <div className="border-t border-white-02 overflow-x-auto">
              {resets.length === 0 ? (
                <p className="px-5 py-4 text-xs text-gray-01">No password reset requests found.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white-02">
                      <th className="px-5 py-2.5 text-left font-medium text-gray-01">Requested</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-01">By</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-01">Status</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-01">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white-02">
                    {resets.map((r) => {
                      const isUsed = !!r.used_at;
                      const isExpired = !isUsed && new Date(r.expires_at) < new Date();
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-2.5 text-gray-01">
                            {formatRelativeDate(r.created_at)}
                          </td>
                          <td className="px-5 py-2.5">
                            {r.requested_by === "SELF" ? "You" : "Vision admin"}
                          </td>
                          <td className="px-5 py-2.5">
                            {isUsed ? (
                              <Badge variant="active" className="text-[10px]">
                                Used {formatRelativeDate(r.used_at!)}
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="text-[10px]">Expired</Badge>
                            ) : (
                              <Badge variant="pending" className="text-[10px]">Pending</Badge>
                            )}
                          </td>
                          <td className="px-5 py-2.5 font-mono text-gray-01">
                            {maskIp(r.requested_ip)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </PageShell>
    </>
  );
}
