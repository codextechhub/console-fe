import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  useGetSchoolDetailQuery,
  useUpdateSchoolMutation,
} from "@/redux/services/dashboard/schoolMgtApi";
import { routesPath } from "@/routes/routesPath";
import { editSchoolSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

interface EditSchoolValues {
  ownership_type: string;
  address: string;
  website: string;
  motto: string;
  term_structure: string;
  currency: string;
  registration_id: string;
}

export default function EditSchool() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const [updateSchool, { isLoading: submitting }] = useUpdateSchoolMutation();

  const school = data?.data;

  const formik = useFormik<EditSchoolValues>({
    enableReinitialize: true,
    initialValues: {
      ownership_type: school?.ownership_type ?? "",
      address: school?.address ?? "",
      website: school?.website ?? "",
      motto: school?.motto ?? "",
      term_structure: school?.term_structure ?? "",
      currency: school?.currency ?? "",
      registration_id: school?.registration_id ?? "",
    },
    validationSchema: editSchoolSchema,
    onSubmit: (values) => {
      const body: Record<string, unknown> = {};
      if (values.ownership_type) body.ownership_type = values.ownership_type;
      if (values.address) body.address = values.address;
      if (values.website) body.website = values.website;
      if (values.motto) body.motto = values.motto;
      if (values.term_structure) body.term_structure = values.term_structure;
      if (values.currency) body.currency = values.currency;
      if (values.registration_id) body.registration_id = values.registration_id;

      updateSchool({ slug: slug ?? "", body })
        .unwrap()
        .then(() => {
          toast.success("School updated successfully!");
          navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? ""));
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

        {!isLoading && school && (
          <div className="max-w-235 mt-5">
            <div className="mb-7 space-y-1.5">
              <h4 className="font-medium text-xl text-black-01">Edit School</h4>
              <p className="text-gray-01 font-mont text-xs">
                Update the school's information below.
              </p>
            </div>

            <p className="inline-flex items-center text-gray-05 text-sm mb-4">
              School Information
              <figure className="size-fit ml-2">{svgIcons.infoIcon}</figure>
            </p>

            <form onSubmit={formik.handleSubmit}>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <CustomNativeSelect
                  id="ownership_type"
                  label="Ownership Type"
                  placeholder="Select ownership type"
                  isRequired
                  options={[
                    { label: "Private", value: "PRIVATE" },
                    { label: "Public", value: "PUBLIC" },
                    { label: "Faith-Based", value: "FAITH_BASED" },
                    { label: "NGO / Foundation", value: "NGO" },
                  ]}
                  value={formik.values.ownership_type}
                  onChange={(e) => formik.setFieldValue("ownership_type", e.target.value)}
                  error={formik.touched.ownership_type ? formik.errors.ownership_type : ""}
                />
                <CustomInput
                  id="address"
                  label="School Address"
                  placeholder="Enter school address"
                  isRequired
                  {...formik.getFieldProps("address")}
                  error={formik.touched.address ? formik.errors.address : ""}
                />
                <CustomNativeSelect
                  id="term_structure"
                  label="Term Structure"
                  placeholder="Select term structure"
                  isRequired
                  options={[
                    { label: "3 Terms", value: "3_TERMS" },
                    { label: "2 Semesters", value: "2_SEMESTERS" },
                  ]}
                  value={formik.values.term_structure}
                  onChange={(e) => formik.setFieldValue("term_structure", e.target.value)}
                  error={formik.touched.term_structure ? formik.errors.term_structure : ""}
                />
                <CustomNativeSelect
                  id="currency"
                  label="Currency"
                  placeholder="Select currency"
                  isRequired
                  options={[
                    { label: "NGN (Naira)", value: "NGN" },
                    { label: "USD (Dollar)", value: "USD" },
                  ]}
                  value={formik.values.currency}
                  onChange={(e) => formik.setFieldValue("currency", e.target.value)}
                  error={formik.touched.currency ? formik.errors.currency : ""}
                />
                <CustomInput
                  id="website"
                  type="url"
                  label="School Website"
                  placeholder="https://example.com"
                  {...formik.getFieldProps("website")}
                  error={formik.touched.website ? formik.errors.website : ""}
                />
                <CustomInput
                  id="motto"
                  label="School Motto"
                  placeholder="Enter school motto"
                  {...formik.getFieldProps("motto")}
                  error={formik.touched.motto ? formik.errors.motto : ""}
                />
                <CustomInput
                  id="registration_id"
                  label="Registration ID"
                  placeholder="Enter registration number"
                  {...formik.getFieldProps("registration_id")}
                  error={formik.touched.registration_id ? formik.errors.registration_id : ""}
                />
              </div>

              <div className="mt-10 inline-flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline-dest"
                  className="w-37"
                  onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? ""))}
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
