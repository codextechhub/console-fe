import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccessField } from "@/components/finance-ui/access-field";
import { fieldWriteErrors, type FieldAccess, type FieldErrors } from "@/components/finance-ui/field-access";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useChangeSchoolPlanMutation,
  useGetPackagePlansQuery,
} from "@/redux/services/dashboard/school-mgt-api";
import type { PackageSetup } from "@/redux/services/dashboard/school-types";
import { apiErrorMessage } from "@/utils/api-errors";
import { packagePlanOptions } from "./package-plan-options";
import { placeRefusals } from "./package-setup-body";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  schoolName: string;
  setup: PackageSetup;
  /** Field Access on `platform.schools`, resolved against the school's package setup. */
  access: FieldAccess;
}

/**
 * Move a school onto another plan.
 *
 * Every module is re-granted at the new plan's depth in the same step, so the
 * reason is asked for: it is what somebody reads in the audit trail when a
 * school asks why its reach changed. A catalogue plan copies its own rate over
 * the agreed price, and a quoted plan (Enterprise) needs one typed, so the
 * price is drawn only for a quoted plan. Each term follows Field Access, and a
 * term the role may not change is never sent.
 */
export function ChangePlanDialog({
  open, onOpenChange, slug, schoolName, setup, access,
}: ChangePlanDialogProps) {
  const { data: plansData, isLoading: plansLoading } = useGetPackagePlansQuery(undefined, { skip: !open });
  const [changePlan, { isLoading: saving }] = useChangeSchoolPlanMutation();

  const [plan, setPlan] = useState("");
  const [price, setPrice] = useState("");
  const [expires, setExpires] = useState("");
  const [reason, setReason] = useState("");
  const [refusal, setRefusal] = useState("");
  const [refusals, setRefusals] = useState<FieldErrors | null>(null);

  const currentCode = setup.package_plan?.code ?? "";
  const plans = useMemo(
    () => (plansData?.data ?? []).filter((candidate) => candidate.is_active && candidate.code !== currentCode),
    [plansData, currentCode],
  );
  const chosen = plans.find((candidate) => candidate.code === plan);
  const quoted = !!chosen && chosen.price_per_student == null;
  // A refusal about a term the dialog does not draw (the price, on a catalogue plan) lands on the plan field.
  const drawn = [
    "package_plan",
    "subscription_expires_at",
    ...(quoted && !access.isHidden("agreed_price_per_student") ? ["agreed_price_per_student"] : []),
  ];
  const placed = placeRefusals(refusals, drawn);

  const missing = !plan
    ? "Choose the plan to move to."
    : quoted && !(Number(price) > 0)
      ? "Enter the agreed price per student for this quoted plan."
      : !reason.trim()
        ? "Say why the plan is changing."
        : "";

  const reset = () => {
    setPlan("");
    setPrice("");
    setExpires("");
    setReason("");
    setRefusal("");
    setRefusals(null);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    if (missing || saving) return;
    setRefusal("");
    setRefusals(null);
    const body = access.writableOnly({
      package_plan: plan,
      ...(expires ? { subscription_expires_at: expires } : {}),
      ...(quoted ? { agreed_price_per_student: Math.round(Number(price) * 100) } : {}),
    });
    changePlan({ slug, body: { ...body, reason: reason.trim() } })
      .unwrap()
      .then((res) => {
        toast.success(res.message || `${schoolName} is on its new plan.`);
        close(false);
      })
      .catch((error: unknown) => {
        const perField = fieldWriteErrors(error);
        if (perField && Object.keys(perField).length > 0) {
          setRefusals(perField);
          return;
        }
        setRefusal(apiErrorMessage(error, "The plan could not be changed."));
      });
  };

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent className="w-full sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Change {schoolName}&apos;s plan</AlertDialogTitle>
          <AlertDialogDescription>
            {setup.package_plan
              ? `It is on ${setup.package_plan.name}. `
              : ""}
            Every module moves to the new plan&apos;s depth straight away, and the change is recorded with your reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <AccessField access={access} name="package_plan" errors={placed}>
            <SearchSelect
              id="change-plan"
              label="New Plan"
              placeholder={plansLoading ? "Loading..." : "Select a plan"}
              isRequired
              options={packagePlanOptions(plans)}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            />
          </AccessField>

          {quoted && chosen ? (
            <AccessField access={access} name="agreed_price_per_student" errors={placed}>
              <CustomInput
                id="change-plan-price"
                type="number"
                min="1"
                label={`Agreed Price per Student (${chosen.currency})`}
                placeholder="Enter the quoted rate"
                isRequired
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </AccessField>
          ) : null}

          <AccessField access={access} name="subscription_expires_at" errors={placed}>
            <CustomDateInput
              id="change-plan-expires"
              label="Subscription Expires"
              placeholder="Leave as it is"
              value={expires}
              onValueChange={(date) => setExpires(date)}
            />
          </AccessField>

          <div className="space-y-1.5">
            <label htmlFor="change-plan-reason" className="text-sm text-black-01">
              Reason <span className="pl-1.5 text-error">*</span>
            </label>
            <Textarea
              id="change-plan-reason"
              rows={3}
              placeholder="What was agreed, and with whom"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {refusal ? (
            <p role="alert" className="font-mont text-xs text-destructive">{refusal}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button type="button" onClick={submit} disabled={!!missing || saving} title={missing || undefined}>
            {saving ? "Saving..." : "Change plan"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
