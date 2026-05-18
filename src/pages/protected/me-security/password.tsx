import { useState } from "react";
import { Key } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { useChangeMyPasswordMutation } from "@/redux/services/dashboard/securityApi";
import { toast } from "sonner";

export default function MyPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, { isLoading }] = useChangeMyPasswordMutation();

  const canSubmit =
    oldPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSubmit = () => {
    changePassword({ old_password: oldPassword, new_password: newPassword })
      .unwrap()
      .then(() => {
        toast.success("Password updated. You may be asked to sign in again on other devices.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Password & Sign-in">
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-xl">
        <div className="flex items-center gap-3">
          <Key className="size-6 text-blue-600" />
          <div>
            <p className="font-semibold font-mont text-gray-01">Password & sign-in</p>
            <p className="text-xs text-gray-01 mt-0.5">Choose a strong password you don't use anywhere else.</p>
          </div>
        </div>

        <div className="bg-white rounded-md p-5 space-y-4">
          <CustomInput
            id="old_password"
            label="Current password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <div>
            <CustomInput
              id="new_password"
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-amber-700 mt-1">Use at least 8 characters.</p>
            )}
          </div>
          <div>
            <CustomInput
              id="confirm_password"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-xs text-amber-700 mt-1">Passwords don't match.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading ? "Saving…" : "Update password"}
          </Button>
        </div>
      </main>
    </DashboardLayout>
  );
}
