import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import {
  useGetSchoolDetailQuery,
  useUpdateSchoolMutation,
} from "@/redux/services/dashboard/school-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { editSchoolSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { apiErrorMessage, apiFieldError, errorStatus } from "@/utils/api-errors";

interface EditSchoolValues {
  slug: string;
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
  // A school's address is editable right up to go-live and frozen for ever
  // after, because the slug is where its users sign in. This is the same test
  // the backend applies (School._has_been_live), read off the same two fields,
  // so the form and the API cannot disagree about which schools are frozen.
  const isLive = !!school?.activated_at || school?.status === "ACTIVE";
  const [slugError, setSlugError] = useState("");

  const formik = useFormik<EditSchoolValues>({
    enableReinitialize: true,
    initialValues: {
      slug: school?.slug ?? "",
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
      setSlugError("");
      const body: Record<string, unknown> = {};
      // Only when it actually moved: sending the current address is accepted
      // but pointless, and on a live school it is the one field that would turn
      // an ordinary edit into a refusal.
      const nextSlug = values.slug.trim();
      if (!isLive && nextSlug && nextSlug !== school?.slug) body.slug = nextSlug;
      if (values.ownership_type) body.ownership_type = values.ownership_type;
      if (values.address) body.address = values.address;
      if (values.website) body.website = values.website;
      if (values.motto) body.motto = values.motto;
      if (values.term_structure) body.term_structure = values.term_structure;
      if (values.currency) body.currency = values.currency;
      if (values.registration_id) body.registration_id = values.registration_id;

      updateSchool({ slug: slug ?? "", body })
        .unwrap()
        .then((res) => {
          toast.success("School updated successfully!");
          // The address is the route's own key, so a rename has to be followed
          // or the next screen reads a slug that no longer resolves.
          navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(res?.data?.slug || slug || ""));
        })
        .catch((err) => {
          // Reserved names and collisions come back keyed on the field, which
          // reads better under the input than as another toast. The endpoint
          // opts out of the global 400 toast for that reason, so anything
          // without a field of its own has to be said here instead.
          const fieldError = apiFieldError(err, "slug");
          setSlugError(fieldError ?? "");
          if (!fieldError && errorStatus(err) !== 409) {
            toast.error(apiErrorMessage(err, "The school could not be updated."));
          }
        });
    },
  });

  return (
    <>
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
                <div className="min-w-0">
                  <CustomInput
                    id="slug"
                    label="Sign-in Address"
                    placeholder="e.g. bright-star"
                    disabled={isLive}
                    {...formik.getFieldProps("slug")}
                    onChange={(e) => { setSlugError(""); formik.handleChange(e); }}
                    error={slugError || (formik.touched.slug ? formik.errors.slug : "")}
                  />
                  <p className="mt-1.5 font-mont text-xs text-gray-01">
                    {isLive
                      ? "This school is live, so its address is fixed. Changing it would break every link and sign-in its users already have."
                      : "Where this school's users sign in, as in bright-star.xvs.codexng.com. Editable until the school goes live, then fixed for good."}
                  </p>
                </div>
                <SearchSelect
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
                <SearchSelect
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
                <SearchSelect
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
    </>
  );
}
