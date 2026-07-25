import { useNavigate, useParams } from "react-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { useDashboardBack } from "@/components/layout/dashboard-header";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { useCreateBranchMutation } from "@/redux/services/dashboard/school-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { toast } from "sonner";

const schema = Yup.object({
  name: Yup.string().required("Branch name is required"),
  _type: Yup.string().required("Branch type is required"),
  address: Yup.string(),
  email: Yup.string().email("Enter a valid email"),
  country: Yup.string(),
  state: Yup.string(),
  is_main: Yup.boolean(),
  admin_first_name: Yup.string().required("Admin first name is required"),
  admin_last_name: Yup.string().required("Admin last name is required"),
  admin_email: Yup.string().email("Enter a valid email").required("Admin email is required"),
  admin_phone: Yup.string(),
});

const COUNTRIES = [
  { label: "Nigeria", value: "Nigeria" },
  { label: "Ghana", value: "Ghana" },
  { label: "Kenya", value: "Kenya" },
  { label: "South Africa", value: "South Africa" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "United States", value: "United States" },
];

export default function CreateBranch() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(P.ADD_BRANCH);

  const back = () => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? ""));
  // Destination closes over the :slug param, so it can't live in the handle.
  useDashboardBack(back);

  const [createBranch, { isLoading }] = useCreateBranchMutation();

  const formik = useFormik({
    initialValues: {
      name: "",
      _type: "",
      address: "",
      email: "",
      country: "Nigeria",
      state: "",
      is_main: false,
      admin_first_name: "",
      admin_last_name: "",
      admin_email: "",
      admin_phone: "",
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        const body = {
          name: values.name,
          _type: values._type,
          address: values.address,
          email: values.email,
          country: values.country,
          state: values.state,
          is_main: values.is_main,
          primary_admin_data: {
            full_name: `${values.admin_first_name.trim()} ${values.admin_last_name.trim()}`.trim(),
            email: values.admin_email,
            phone: values.admin_phone,
          },
        };
        await createBranch({ slug: slug ?? "", body }).unwrap();
        toast.success("Branch created successfully.");
        back();
      } catch { /* interceptor shows the toast */ }
    },
  });

  if (!canCreate) {
    return <PageAccessDenied onBack={back} />;
  }

  return (
    <>
      <main className="px-4.5 py-6">
        <div className="max-w-235 mt-5">
          <div className="mb-7 space-y-1.5">
            <h4 className="font-medium text-xl text-black-01">Add Branch</h4>
            <p className="text-gray-01 font-mont text-xs">
              Add a new branch to this school.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-10">
            {/* Branch details */}
            <div>
              <p className="text-gray-05 text-sm font-medium mb-5">Branch Information</p>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <CustomInput
                  id="name"
                  label="Branch Name"
                  placeholder="e.g. Main Campus"
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
                  placeholder="Enter address"
                  {...formik.getFieldProps("address")}
                  error={formik.touched.address ? formik.errors.address : ""}
                />
                <CustomInput
                  id="email"
                  type="email"
                  label="Branch Email"
                  placeholder="Enter email"
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email ? formik.errors.email : ""}
                />
                <CustomInput
                  id="state"
                  label="State"
                  placeholder="e.g. Lagos"
                  {...formik.getFieldProps("state")}
                  error={formik.touched.state ? formik.errors.state : ""}
                />
                <SearchSelect
                  id="country"
                  label="Country"
                  placeholder="Select country"
                  options={COUNTRIES}
                  value={formik.values.country}
                  onChange={(e) => formik.setFieldValue("country", e.target.value)}
                  error={formik.touched.country ? formik.errors.country : ""}
                />
                <div className="col-span-full flex items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-mont font-medium text-gray-06">Main Branch</p>
                    <p className="text-xs text-gray-01">Mark this as the school's main branch</p>
                  </div>
                  <Switch
                    checked={formik.values.is_main}
                    onCheckedChange={(v) => formik.setFieldValue("is_main", v)}
                  />
                </div>
              </div>
            </div>

            {/* Branch admin */}
            <div>
              <p className="text-gray-05 text-sm font-medium mb-5">Branch Admin</p>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <CustomInput
                  id="admin_first_name"
                  label="First Name"
                  placeholder="Enter first name"
                  isRequired
                  {...formik.getFieldProps("admin_first_name")}
                  error={formik.touched.admin_first_name ? formik.errors.admin_first_name : ""}
                />
                <CustomInput
                  id="admin_last_name"
                  label="Last Name"
                  placeholder="Enter last name"
                  isRequired
                  {...formik.getFieldProps("admin_last_name")}
                  error={formik.touched.admin_last_name ? formik.errors.admin_last_name : ""}
                />
                <CustomInput
                  id="admin_email"
                  type="email"
                  label="Admin Email"
                  placeholder="Enter email"
                  isRequired
                  {...formik.getFieldProps("admin_email")}
                  error={formik.touched.admin_email ? formik.errors.admin_email : ""}
                />
                <CustomInput
                  id="admin_phone"
                  label="Admin Phone"
                  placeholder="+2347033327493"
                  {...formik.getFieldProps("admin_phone")}
                  error={formik.touched.admin_phone ? formik.errors.admin_phone : ""}
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-4">
              <Button type="button" variant="outline-dest" className="w-37" onClick={back}>
                Cancel
              </Button>
              <Button type="submit" className="w-37" disabled={!formik.dirty || isLoading}>
                {isLoading ? "Creating..." : "Create Branch"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
