import { svgIcons } from "@/assets/svg";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { MultiSelectInput } from "@/components/custom/multiselect-input";
import { Button } from "@/components/ui/button";
import {
  useGetModulesQuery,
  useGetPackagePlansQuery,
} from "@/redux/services/dashboard/school-mgt-api";
import { packageStepSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useNavigate } from "react-router";
import type { PackageStepData } from "../create-school";

interface Props {
  defaultValues: PackageStepData;
  onSubmit: (data: PackageStepData) => void;
  isSubmitting: boolean;
}

export default function PackageSetup({ defaultValues, onSubmit, isSubmitting }: Props) {
  const navigate = useNavigate();

  const { data: plansRes, isLoading: plansLoading } = useGetPackagePlansQuery();
  const { data: modulesRes, isLoading: modulesLoading } = useGetModulesQuery();


  const planOptions = (plansRes?.data ?? []).map((p) => ({ label: p.name, value: p.code }));
  // /i/modules/ now serves the capability catalogue (vs_config), which names
  // things `label`; selecting a module grants its plan entitlement on create.
  const moduleOptions = (modulesRes?.data ?? []).map((m) => ({ label: m.label, value: m.key }));

  const formik = useFormik<PackageStepData>({
    initialValues: defaultValues,
    validationSchema: packageStepSchema,
    enableReinitialize: false,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  return (
    <>
      <div className="max-w-235 mt-5">
        <div className="mb-7 space-y-1.5">
          <h4 className="font-medium text-xl text-black-01">Package Setup</h4>
          <p className="text-gray-01 font-mont text-xs">
            Select a package plan and configure the school's module access and capacity limits.
          </p>
        </div>

        <p className="inline-flex items-center text-gray-05 text-sm mb-4">
          Package Information
          <figure className="size-fit ml-2">{svgIcons.infoIcon}</figure>
        </p>

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

            <MultiSelectInput
              id="enabled_modules"
              label="Enabled Modules"
              placeholder={modulesLoading ? "Loading..." : "Select modules"}
              options={moduleOptions}
              maxCount={3}
              isRequired
              defaultValue={formik.values.enabled_modules as string[]}
              onValueChange={(vals) => formik.setFieldValue("enabled_modules", vals)}
              error={
                formik.touched.enabled_modules
                  ? (formik.errors.enabled_modules as string)
                  : ""
              }
            />

            <CustomInput
              id="student_capacity"
              type="number"
              label="Number of Students"
              placeholder="Enter student capacity"
              isRequired
              {...formik.getFieldProps("student_capacity")}
              error={formik.touched.student_capacity ? (formik.errors.student_capacity as string) : ""}
            />
            <CustomInput
              id="teacher_capacity"
              type="number"
              label="Number of Teachers"
              placeholder="Enter teacher capacity"
              isRequired
              {...formik.getFieldProps("teacher_capacity")}
              error={formik.touched.teacher_capacity ? (formik.errors.teacher_capacity as string) : ""}
            />
            <CustomInput
              id="admin_capacity"
              type="number"
              label="Number of Admins"
              placeholder="Enter admin capacity"
              isRequired
              {...formik.getFieldProps("admin_capacity")}
              error={formik.touched.admin_capacity ? (formik.errors.admin_capacity as string) : ""}
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
