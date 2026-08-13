import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { adminStepSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useNavigate } from "react-router";
import type { AdminStepData } from "../create-school";

interface Props {
  defaultValues: AdminStepData;
  onNext: (data: AdminStepData) => void;
}

export default function AddSchoolAdmin({ defaultValues, onNext }: Props) {
  const navigate = useNavigate();

  const formik = useFormik<AdminStepData>({
    initialValues: defaultValues,
    validationSchema: adminStepSchema,
    enableReinitialize: false,
    onSubmit: (values) => onNext(values),
  });

  return (
    <div className="max-w-235 mt-5">
      <div className="mb-7 space-y-1.5">
        <h4 className="font-medium text-xl text-black-01" data-guide="school-create.current-step">Create School Admin</h4>
        <p className="text-gray-01 font-mont text-xs">
          Add the primary administrator for this school.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <CustomInput
            id="first_name"
            label="First Name"
            placeholder="Enter first name"
            isRequired
            {...formik.getFieldProps("first_name")}
            error={formik.touched.first_name ? formik.errors.first_name : ""}
          />
          <CustomInput
            id="last_name"
            label="Last Name"
            placeholder="Enter last name"
            isRequired
            {...formik.getFieldProps("last_name")}
            error={formik.touched.last_name ? formik.errors.last_name : ""}
          />
          <CustomInput
            id="email"
            type="email"
            label="Email Address"
            placeholder="Enter email address"
            isRequired
            {...formik.getFieldProps("email")}
            error={formik.touched.email ? formik.errors.email : ""}
          />
          <CustomInput
            id="phone"
            label="Phone Number"
            placeholder="+2347033327493"
            {...formik.getFieldProps("phone")}
            error={formik.touched.phone ? formik.errors.phone : ""}
          />
        </div>

        <div className="mt-10 inline-flex items-center gap-4">
          <Button
            type="button"
            variant="outline-dest"
            className="w-37"
            onClick={() => navigate({ search: "?step=branch" })}
          >
            Back
          </Button>
          <Button type="submit" className="w-37">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
