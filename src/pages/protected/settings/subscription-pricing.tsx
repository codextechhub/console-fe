import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PolicyBadge,
  SettingsPanel,
  SettingsRow,
  SettingsSectionHeader,
} from "@/components/settings/settings-layout";
import { AccessField } from "@/components/finance-ui/access-field";
import { fieldWriteErrors, useFieldAccess, type FieldErrors } from "@/components/finance-ui/field-access";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetPackagePlansQuery,
  useUpdatePackagePlanPriceMutation,
} from "@/redux/services/dashboard/school-mgt-api";
import { apiErrorMessage } from "@/utils/api-errors";
import { SCHOOLS_FIELD_RESOURCE } from "../school-mgt/school-field-access";
import { Busy, SettingsLoadError } from "./panel-states";

/** The name the backend gives the catalogue rate in a plan row and in a save body. */
const PRICE = "price_per_student";

/**
 * The per-student catalogue rate of each subscription tier.
 *
 * The rate is the `price_per_student` Field Access field of `platform.schools`,
 * separate from the price agreed with any one school. A role that may not read
 * it gets plan rows without the key and sees no panel at all; a role that may
 * read but not change it sees the rates greyed, with no Save button. A plan row
 * that carries no `price_per_student` is a hidden rate, not a quoted tier, so
 * it never reads "Set during school creation" (a quoted tier sends null).
 *
 * A save the backend still refuses with 403 `field_write_denied` shows its
 * message under the input it concerns, never as a toast.
 */
export function SubscriptionPricing() {
  const { hasPermission } = usePermissions();
  const access = useFieldAccess(SCHOOLS_FIELD_RESOURCE);
  const query = useGetPackagePlansQuery();
  const [updatePrice, updateState] = useUpdatePackagePlanPriceMutation();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [refusal, setRefusal] = useState<{ code: string; errors: FieldErrors } | null>(null);
  const canSave = hasPermission(P.CONFIGURE_SCHOOL) && !access.isReadOnly(PRICE);

  if (query.isLoading) return <Busy />;
  if (query.isError || !query.data) return <SettingsLoadError retry={query.refetch} />;

  const plans = query.data.data.filter((plan) => PRICE in plan);
  // The reader's own edit, else the saved rate in naira.
  const shown = (code: string) => {
    if (code in edits) return edits[code];
    const saved = plans.find((plan) => plan.code === code)?.price_per_student;
    return saved == null ? "" : String(saved / 100);
  };
  const hidden = access.isHidden(PRICE) || plans.length === 0;

  const save = async (code: string) => {
    const naira = Number(shown(code));
    if (!Number.isFinite(naira) || naira <= 0) {
      toast.error("Enter a per-student rate greater than zero");
      return;
    }
    setRefusal(null);
    try {
      await updatePrice({ code, price_per_student: Math.round(naira * 100) }).unwrap();
      setEdits((current) => { const next = { ...current }; delete next[code]; return next; });
      toast.success("Subscription rate saved");
    } catch (error) {
      const refused = fieldWriteErrors(error);
      if (refused) {
        setRefusal({ code, errors: refused });
        return;
      }
      toast.error(apiErrorMessage(error, "Subscription rate could not be saved"));
    }
  };

  return (
    <div data-guide="platform-settings.subscription-pricing" className="space-y-5">
      <SettingsSectionHeader
        title="Subscription pricing"
        description="Each catalogue rate covers one student for one billing cycle at the depth included in that tier. Changes apply to future school agreements and never rewrite a saved agreement or invoice."
      />
      {hidden ? (
        <p className="font-mont text-sm text-gray-01">There is nothing to show here for your access.</p>
      ) : (
        <SettingsPanel
          title="Per-student tier rates"
          description="Rates are entered in naira. Enterprise stays quoted separately for each school."
        >
          {plans.map((plan) => {
            const quoted = plan.price_per_student == null;
            return (
              <SettingsRow
                key={plan.code}
                icon={CreditCard}
                label={plan.name}
                description={`${plan.default_depth_label} depth, billed ${plan.billing_cycle.toLowerCase()}.`}
                badge={quoted ? <PolicyBadge kind="enforced">Per-school quote</PolicyBadge> : undefined}
                value={quoted ? (
                  <p className="font-mont text-sm text-gray-01">Set during school creation</p>
                ) : (
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                    <AccessField
                      access={access}
                      name={PRICE}
                      errors={refusal?.code === plan.code ? refusal.errors : null}
                      className="min-w-0 flex-1 sm:w-48 sm:flex-none"
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-05">₦</span>
                        <Input
                          aria-label={`${plan.name} price per student`}
                          className="pl-7"
                          type="number"
                          min="1"
                          disabled={!canSave}
                          value={shown(plan.code)}
                          onChange={(event) => setEdits((current) => ({ ...current, [plan.code]: event.target.value }))}
                        />
                      </div>
                    </AccessField>
                    {canSave ? (
                      <Button
                        size="sm"
                        disabled={updateState.isLoading || Number(shown(plan.code)) * 100 === plan.price_per_student}
                        onClick={() => save(plan.code)}
                      >
                        Save
                      </Button>
                    ) : null}
                  </div>
                )}
              />
            );
          })}
        </SettingsPanel>
      )}
    </div>
  );
}
