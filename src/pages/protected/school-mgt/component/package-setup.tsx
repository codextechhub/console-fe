import { svgIcons } from "@/assets/svg";
import { AccessField } from "@/components/finance-ui/access-field";
import { useFieldAccess, type FieldErrors } from "@/components/finance-ui/field-access";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import { useGetPackagePlansQuery } from "@/redux/services/dashboard/school-mgt-api";
import { packageStepSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { PackageStepData } from "../create-school";
import { packagePlanOptions } from "./package-plan-options";
import { placeRefusals } from "./package-setup-body";
import { SCHOOLS_FIELD_RESOURCE, canGivePackage } from "../school-field-access";

interface Props {
  defaultValues: PackageStepData;
  onSubmit: (data: PackageStepData) => void;
  onChange: (data: PackageStepData) => void;
  isSubmitting: boolean;
  /** Per-field messages from a creation the backend refused with `field_write_denied`. */
  fieldErrors?: FieldErrors | null;
}

/**
 * The package step of the school wizard: plan, subscription dates, the agreed
 * rate for a quoted tier and the minimum billable students.
 *
 * Every control is a `platform.schools` Field Access field. A hidden one is not
 * drawn, a read-only one is greyed and left out of the body. A role that may not
 * give a school a plan, a start date and an agreed price cannot register one
 * with a package at all, so the step says so and submits the school without it.
 */
export default function PackageSetup({ defaultValues, onSubmit, onChange, isSubmitting, fieldErrors }: Props) {
  const navigate = useNavigate();
  const access = useFieldAccess(SCHOOLS_FIELD_RESOURCE);
  const packageAllowed = canGivePackage(access);

  const { data: plansRes, isLoading: plansLoading } = useGetPackagePlansQuery();

  const plans = plansRes?.data ?? [];
  const planOptions = packagePlanOptions(plans);
  const formik = useFormik<PackageStepData>({
    initialValues: defaultValues,
    validationSchema: packageStepSchema,
    enableReinitialize: false,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });
  const selectedPlan = plans.find((plan) => plan.code === formik.values.package_plan);
  const quoted = selectedPlan?.price_per_student == null && !!selectedPlan;
  const drawn = [
    "package_plan",
    "subscription_starts_at",
    ...(access.isHidden("subscription_expires_at") ? [] : ["subscription_expires_at"]),
    ...(quoted && !access.isHidden("agreed_price_per_student") ? ["agreed_price_per_student"] : []),
    ...(access.isHidden("minimum_billable_students") ? [] : ["minimum_billable_students"]),
  ];
  const refusals = placeRefusals(fieldErrors, drawn);

  useEffect(() => {
    onChange(formik.values);
  }, [formik.values, onChange]);

  return (
    <>
      <div className="max-w-235 mt-5">
        <div className="mb-7 space-y-1.5">
          <h4 className="font-medium text-xl text-black-01" data-guide="school-create.package">Package Setup</h4>
          <p className="text-gray-01 font-mont text-xs">
            Choose the plan this school is on. The plan decides how far into every module it reaches.
          </p>
        </div>

        <div className="inline-flex items-center text-gray-05 text-sm mb-4">
          Package Information
          <figure className="size-fit ml-2">{svgIcons.infoIcon}</figure>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {packageAllowed ? (
            <>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <AccessField access={access} name="package_plan" errors={refusals}>
                  <SearchSelect
                    id="package_plan"
                    label="Package Plan"
                    placeholder={plansLoading ? "Loading..." : "Select package plan"}
                    isRequired
                    options={planOptions}
                    value={formik.values.package_plan}
                    onChange={(e) => formik.setFieldValue("package_plan", e.target.value)}
                    error={formik.touched.package_plan ? formik.errors.package_plan : ""}
                  />
                </AccessField>

                <AccessField access={access} name="subscription_starts_at" errors={refusals}>
                  <CustomDateInput
                    id="subscription_starts_at"
                    label="Subscription Start Date"
                    placeholder="Select start date"
                    isRequired
                    value={formik.values.subscription_starts_at}
                    onValueChange={(date) => formik.setFieldValue("subscription_starts_at", date)}
                  />
                </AccessField>

                <AccessField access={access} name="subscription_expires_at" errors={refusals}>
                  <CustomDateInput
                    id="subscription_expires_at"
                    label="Subscription Expires"
                    placeholder="Select expiry date"
                    value={formik.values.subscription_expires_at}
                    onValueChange={(date) => formik.setFieldValue("subscription_expires_at", date)}
                  />
                </AccessField>

                {quoted && selectedPlan ? (
                  <AccessField access={access} name="agreed_price_per_student" errors={refusals}>
                    <CustomInput
                      id="agreed_price_per_student"
                      type="number"
                      min="1"
                      label={`Agreed Price per Student (${selectedPlan.currency})`}
                      placeholder="Enter the quoted rate"
                      isRequired
                      {...formik.getFieldProps("agreed_price_per_student")}
                      error={formik.touched.agreed_price_per_student ? formik.errors.agreed_price_per_student : ""}
                    />
                  </AccessField>
                ) : null}

                <AccessField access={access} name="minimum_billable_students" errors={refusals}>
                  <CustomInput
                    id="minimum_billable_students"
                    type="number"
                    min="0"
                    label="Minimum Billable Students"
                    placeholder="0"
                    {...formik.getFieldProps("minimum_billable_students")}
                    error={formik.touched.minimum_billable_students ? formik.errors.minimum_billable_students : ""}
                  />
                </AccessField>
              </div>

              <p className="mt-4 max-w-2xl font-mont text-xs text-gray-01">
                Students with Active status are counted on each billing date. Leave the minimum at zero to wait until students are imported before the first invoice.
              </p>
            </>
          ) : (
            <p
              data-testid="package-not-allowed"
              className="max-w-2xl rounded-md border border-gray-200/80 bg-white p-4 font-mont text-sm text-gray-01"
            >
              Your access does not cover giving a school its package, so this school is registered without one.
            </p>
          )}

          <div className="mt-10 inline-flex items-center gap-4">
            <Button
              type="button"
              variant="outline-dest"
              className="w-37"
              onClick={() => navigate({ search: "?step=admin" })}
            >
              Back
            </Button>
            {packageAllowed ? (
              <Button type="submit" className="w-37" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button type="button" className="w-37" disabled={isSubmitting} onClick={() => onSubmit(defaultValues)}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </form>
      </div>

    </>
  );
}
