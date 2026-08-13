import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import { schoolStepSchema } from "@/schema/dashboard/school-mgt";
import { useFormik } from "formik";
import { useRef } from "react";
import { useNavigate } from "react-router";
import type { PrefillData, SchoolStepData } from "../create-school";

interface Props {
  defaultValues: SchoolStepData;
  onNext: (data: SchoolStepData) => void;
  onPrefill: (data: PrefillData) => void;
  generateTestData: () => PrefillData;
}

const isDev = import.meta.env.VITE_SHOW_PREFILL === "true";

export default function AddSchool({ defaultValues, onNext, onPrefill, generateTestData }: Props) {
  const navigate = useNavigate();
  const slugEditedByUser = useRef(false);

  const formik = useFormik<SchoolStepData>({
    initialValues: defaultValues,
    validationSchema: schoolStepSchema,
    enableReinitialize: true,
    onSubmit: (values) => onNext(values),
  });

  const handleFillTestData = () => {
    slugEditedByUser.current = false;
    const data = generateTestData();
    formik.resetForm({ values: data.school });
    onPrefill(data);
  };

  return (
    <div className="max-w-235 mt-5">
      <div className="mb-7 space-y-1.5 flex items-start justify-between">
        <div className="space-y-1.5">
          <h4 className="font-medium text-xl text-black-01" data-guide="school-create.current-step">Add a New School</h4>
          <p className="text-gray-01 font-mont text-xs">
            To add a new school fill all the compulsory questions below.
          </p>
        </div>
        {isDev && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
            onClick={handleFillTestData}
          >
            Fill test data
          </Button>
        )}
      </div>

      <div className="inline-flex items-center text-gray-05 text-sm mb-4">
        School Information
        <span className="size-fit ml-2">{svgIcons.infoIcon}</span>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <CustomInput
            id="name"
            label="School Name"
            placeholder="e.g., St. Mary's College"
            isRequired
            {...formik.getFieldProps("name")}
            onChange={(e) => {
              const name = e.target.value;
              formik.setFieldValue("name", name);
              if (!slugEditedByUser.current) {
                formik.setFieldValue(
                  "slug",
                  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
                );
              }
            }}
            error={formik.touched.name ? formik.errors.name : ""}
          />
          <CustomInput
            id="slug"
            label="School Slug"
            placeholder="e.g., st-marys-college"
            {...formik.getFieldProps("slug")}
            onChange={(e) => {
              slugEditedByUser.current = true;
              formik.setFieldTouched("slug", true);
              formik.setFieldValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            error={formik.touched.slug ? formik.errors.slug : ""}
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
            id="registration_id"
            label="Registration ID"
            placeholder="Enter registration number"
            {...formik.getFieldProps("registration_id")}
            error={formik.touched.registration_id ? formik.errors.registration_id : ""}
          />
        </div>

        <div className="mt-10 inline-flex items-center gap-4">
          <Button type="button" variant="outline-dest" className="w-37" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="w-37">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
