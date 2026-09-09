import { svgIcons } from "@/assets/svg";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import { useGetPackagePlansQuery } from "@/redux/services/dashboard/school-mgt-api";
import { packageStepSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { PackageStepData } from "../create-school";

interface Props {
  defaultValues: PackageStepData;
  onSubmit: (data: PackageStepData) => void;
  onChange: (data: PackageStepData) => void;
  isSubmitting: boolean;
}

export default function PackageSetup({ defaultValues, onSubmit, onChange, isSubmitting }: Props) {
  const navigate = useNavigate();

  const { data: plansRes, isLoading: plansLoading } = useGetPackagePlansQuery();

  const planOptions = (plansRes?.data ?? []).map((p) => ({ label: p.name, value: p.code }));

  const formik = useFormik<PackageStepData>({
    initialValues: defaultValues,
    validationSchema: packageStepSchema,
    enableReinitialize: false,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

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
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
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

            <CustomDateInput
              id="subscription_expires_at"
              label="Subscription Expires"
              placeholder="Select expiry date"
              value={formik.values.subscription_expires_at}
              onValueChange={(date) => formik.setFieldValue("subscription_expires_at", date)}
            />
          </div>

          <div className="mt-10 inline-flex items-center gap-4">
            <Button
              type="button"
              variant="outline-dest"
              className="w-37"
              onClick={() => navigate({ search: "?step=admin" })}
            >
              Back
            </Button>
            <Button type="submit" className="w-37" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>

    </>
  );
}
