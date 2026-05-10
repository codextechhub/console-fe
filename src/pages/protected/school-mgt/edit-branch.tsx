import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  useGetBranchDetailQuery,
  useUpdateBranchMutation,
} from "@/redux/services/dashboard/schoolMgtApi";
import { routesPath } from "@/routes/routesPath";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import * as Yup from "yup";

const editBranchSchema = Yup.object({
  name: Yup.string().required("Branch name is required"),
  _type: Yup.string().required("Branch type is required"),
  address: Yup.string(),
  email: Yup.string().email("Enter a valid email"),
  country: Yup.string(),
  state: Yup.string(),
});

interface EditBranchValues {
  name: string;
  _type: string;
  address: string;
  email: string;
  country: string;
  state: string;
}

export default function EditBranch() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useGetBranchDetailQuery(
    { slug: slug ?? "", code: Number(code) },
    { skip: !slug || !code }
  );
  const [updateBranch, { isLoading: submitting }] = useUpdateBranchMutation();

  const branch = data?.data;

  const formik = useFormik<EditBranchValues>({
    enableReinitialize: true,
    initialValues: {
      name: branch?.name ?? "",
      _type: branch?._type ?? "",
      address: branch?.address ?? "",
      email: branch?.email ?? "",
      country: branch?.country ?? "",
      state: branch?.state ?? "",
    },
    validationSchema: editBranchSchema,
    onSubmit: (values) => {
      const body: Record<string, unknown> = {};
      if (values.name)    body.name    = values.name;
      if (values._type)   body._type   = values._type;
      if (values.address) body.address = values.address;
      if (values.email)   body.email   = values.email;
      if (values.country) body.country = values.country;
      if (values.state)   body.state   = values.state;

      updateBranch({ slug: slug ?? "", code: Number(code), body })
        .unwrap()
        .then(() => {
          toast.success("Branch updated successfully!");
          navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(slug ?? "", Number(code)));
        })
        .catch(() => {});
    },
  });

  return (
    <DashboardLayout title="School Management" hasBack>
      <main className="px-4.5 py-6">
        {isLoading && (
          <div className="grid h-40 place-content-center">
            <div className="loader" />
          </div>
        )}

        {!isLoading && branch && (
          <div className="max-w-235 mt-5">
            <div className="mb-7 space-y-1.5">
              <h4 className="font-medium text-xl text-black-01">Edit Branch</h4>
              <p className="text-gray-01 font-mont text-xs">
                Update the branch information below.
              </p>
            </div>

            <p className="inline-flex items-center text-gray-05 text-sm mb-4">
              Branch Information
              <figure className="size-fit ml-2">{svgIcons.infoIcon}</figure>
            </p>

            <form onSubmit={formik.handleSubmit}>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <CustomInput
                  id="name"
                  label="Branch Name"
                  placeholder="Enter branch name"
                  isRequired
                  {...formik.getFieldProps("name")}
                  error={formik.touched.name ? formik.errors.name : ""}
                />
                <CustomInput
                  id="_type"
                  label="Branch Type"
                  placeholder="e.g. Primary, Secondary"
                  isRequired
                  {...formik.getFieldProps("_type")}
                  error={formik.touched._type ? formik.errors._type : ""}
                />
                <CustomInput
                  id="address"
                  label="Branch Address"
                  placeholder="Enter branch address"
                  {...formik.getFieldProps("address")}
                  error={formik.touched.address ? formik.errors.address : ""}
                />
                <CustomInput
                  id="email"
                  type="email"
                  label="Branch Email"
                  placeholder="Enter branch email"
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email ? formik.errors.email : ""}
                />
                <CustomInput
                  id="state"
                  label="State"
                  placeholder="Enter state"
                  {...formik.getFieldProps("state")}
                  error={formik.touched.state ? formik.errors.state : ""}
                />
                <CustomNativeSelect
                  id="country"
                  label="Country"
                  placeholder="Select country"
                  options={[
                    { label: "Nigeria", value: "Nigeria" },
                    { label: "Ghana", value: "Ghana" },
                    { label: "Kenya", value: "Kenya" },
                    { label: "South Africa", value: "South Africa" },
                    { label: "United Kingdom", value: "United Kingdom" },
                    { label: "United States", value: "United States" },
                  ]}
                  value={formik.values.country}
                  onChange={(e) => formik.setFieldValue("country", e.target.value)}
                  error={formik.touched.country ? formik.errors.country : ""}
                />
              </div>

              <div className="mt-10 inline-flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline-dest"
                  className="w-37"
                  onClick={() =>
                    navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(slug ?? "", Number(code)))
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-37" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
