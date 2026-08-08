// Shared staff-profile form used by My Profile (self) and admin create/edit.
// Builds a StaffProfileWritePayload and hands it to the parent's onSubmit.

import { useRef, useState, useMemo, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Lock } from "lucide-react";
import type { StaffProfile, StaffProfileWritePayload } from "@/redux/services/dashboard/organogram-types";
import { useUploadStaffProfilePhotoMutation } from "@/redux/services/dashboard/organogram-api";
import { useFetchAuthMediaQuery } from "@/redux/services/media-api";
import { avatarColor, initialsOf } from "../lib/org-helpers";
import { cn } from "@/lib/utils";

const MARITAL = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];
const EMP_TYPE = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];
const EMP_STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXITED", label: "Exited" },
];

export interface ProfileFormValues {
  user_id: string;
  position_id: string;
  date_of_birth: string;
  marital_status: string;
  nationality: string;
  state_of_origin: string;
  bio: string;
  personal_email: string;
  alternate_phone: string;
  residential_address: string;
  city: string;
  state: string;
  nok_name: string;
  nok_relationship: string;
  nok_phone: string;
  nok_address: string;
  employee_id: string;
  job_title: string;
  employment_type: string;
  employment_status: string;
  date_joined: string;
  date_exited: string;
  bank_name: string;
  account_name: string;
  account_number: string;
}

function toFormValues(p: StaffProfile | null | undefined): ProfileFormValues {
  return {
    user_id: p?.user.id ?? "",
    position_id: p?.position?.id ? String(p.position.id) : "",
    date_of_birth: p?.date_of_birth ?? "",
    marital_status: p?.marital_status ?? "",
    nationality: p?.nationality ?? "",
    state_of_origin: p?.state_of_origin ?? "",
    bio: p?.bio ?? "",
    personal_email: p?.personal_email ?? "",
    alternate_phone: p?.alternate_phone ?? "",
    residential_address: p?.residential_address ?? "",
    city: p?.city ?? "",
    state: p?.state ?? "",
    nok_name: p?.nok_name ?? "",
    nok_relationship: p?.nok_relationship ?? "",
    nok_phone: p?.nok_phone ?? "",
    nok_address: p?.nok_address ?? "",
    employee_id: p?.employee_id ?? "",
    job_title: p?.job_title ?? "",
    employment_type: p?.employment_type ?? "",
    employment_status: p?.employment_status ?? "ACTIVE",
    date_joined: p?.date_joined ?? "",
    date_exited: p?.date_exited ?? "",
    bank_name: p?.bank_name ?? "",
    account_name: p?.account_name ?? "",
    account_number: p?.account_number ?? "",
  };
}

const schema = Yup.object({
  personal_email: Yup.string().email("Enter a valid email").nullable(),
  nationality: Yup.string().max(80),
  job_title: Yup.string().max(150),
});

type Mode = "me" | "admin-edit" | "admin-create";

export function StaffProfileForm({
  mode,
  initial,
  users = [],
  positions = [],
  payrollEditable,
  submitting,
  onSubmit,
  onCancel,
}: {
  mode: Mode;
  initial: StaffProfile | null;
  users?: { value: string; label: string }[];
  positions?: { value: string; label: string }[];
  payrollEditable: boolean;
  submitting: boolean;
  // positionId is handed back separately so the parent can route seat changes
  // through the assignments service (effective-dated history), not a silent
  // overwrite of profile.position.
  onSubmit: (payload: StaffProfileWritePayload, positionId: string) => void;
  onCancel: () => void;
}) {
  const isAdmin = mode !== "me";
  const isCreate = mode === "admin-create";

  // Profile photo is STAGED (picked but not uploaded) and committed only when
  // the user clicks Save changes - so a mis-pick can be replaced or abandoned.
  // Create mode has no profile row yet, so photo editing is unavailable there.
  const [stagedPhoto, setStagedPhoto] = useState<File | null>(null);
  const [uploadPhoto, { isLoading: uploadingPhoto }] = useUploadStaffProfilePhotoMutation();
  const photoTargetId: number | string | null = isCreate ? null : mode === "me" ? "me" : initial?.id ?? null;

  return (
    <Formik
      initialValues={toFormValues(initial)}
      enableReinitialize
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        // Commit the staged photo first; abort the whole save if it fails so the
        // user can retry rather than silently losing the photo change.
        if (stagedPhoto && photoTargetId !== null) {
          try {
            await uploadPhoto({ id: photoTargetId, file: stagedPhoto }).unwrap();
            setStagedPhoto(null);
          } catch {
            setSubmitting(false);
            return;
          }
        }
        const payload: StaffProfileWritePayload = {
          date_of_birth: values.date_of_birth || null,
          marital_status: (values.marital_status as StaffProfileWritePayload["marital_status"]) || "",
          nationality: values.nationality,
          state_of_origin: values.state_of_origin,
          bio: values.bio,
          personal_email: values.personal_email,
          alternate_phone: values.alternate_phone,
          residential_address: values.residential_address,
          city: values.city,
          state: values.state,
          nok_name: values.nok_name,
          nok_relationship: values.nok_relationship,
          nok_phone: values.nok_phone,
          nok_address: values.nok_address,
        };
        if (isAdmin) {
          // NB: position is NOT sent on the profile payload - the parent routes
          // seat changes through the assignments endpoint so history is kept.
          payload.employee_id = values.employee_id || null;
          payload.job_title = values.job_title;
          payload.employment_type = (values.employment_type as StaffProfileWritePayload["employment_type"]) || "";
          payload.employment_status = (values.employment_status as StaffProfileWritePayload["employment_status"]) || "ACTIVE";
          payload.date_joined = values.date_joined || null;
          payload.date_exited = values.date_exited || null;
        }
        if (isCreate) payload.user_id = values.user_id;
        if (payrollEditable) {
          payload.bank_name = values.bank_name;
          payload.account_name = values.account_name;
          payload.account_number = values.account_number;
        }
        onSubmit(payload, isAdmin ? values.position_id : "");
        setSubmitting(false);
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, dirty }) => (
        <Form className="space-y-8">
          {/* Photo picker - stages the file; committed on Save changes. */}
          {!isCreate && (
            <PhotoPicker
              currentPhoto={initial?.profile_photo ?? null}
              userName={initial?.user.full_name ?? ""}
              userId={initial?.user.id ?? ""}
              stagedFile={stagedPhoto}
              onPick={setStagedPhoto}
              uploading={uploadingPhoto}
            />
          )}
          {/* Identity (admin) */}
          {isAdmin && (
            <Section title="Seat & identity">
              {isCreate && (
                <SearchSelect
                  label="Staff member"
                  name="user_id"
                  isRequired
                  options={users}
                  value={values.user_id}
                  onChange={handleChange}
                  placeholder="Select a CX staff user"
                />
              )}
              <SearchSelect
                label="Primary position"
                name="position_id"
                options={positions}
                value={values.position_id}
                onChange={handleChange}
                placeholder="Select a seat"
              />
              <CustomInput id="employee_id" name="employee_id" label="Employee ID" value={values.employee_id} onChange={handleChange} onBlur={handleBlur} placeholder="CX-0001" />
              <CustomInput id="job_title" name="job_title" label="Job title" value={values.job_title} onChange={handleChange} onBlur={handleBlur} error={touched.job_title ? errors.job_title : undefined} />
            </Section>
          )}

          {/* Personal */}
          <Section title="Personal">
            <CustomInput id="date_of_birth" name="date_of_birth" type="date" label="Date of birth" value={values.date_of_birth} onChange={handleChange} onBlur={handleBlur} />
            <SearchSelect label="Marital status" name="marital_status" options={MARITAL} value={values.marital_status} onChange={handleChange} placeholder="Select" clearable />
            <CustomInput id="nationality" name="nationality" label="Nationality" value={values.nationality} onChange={handleChange} onBlur={handleBlur} />
            <CustomInput id="state_of_origin" name="state_of_origin" label="State of origin" value={values.state_of_origin} onChange={handleChange} onBlur={handleBlur} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-black-01">Bio</label>
              <Textarea name="bio" value={values.bio} onChange={handleChange} onBlur={handleBlur} rows={3} placeholder="Short bio…" />
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact">
            <CustomInput id="personal_email" name="personal_email" type="email" label="Personal email" value={values.personal_email} onChange={handleChange} onBlur={handleBlur} error={touched.personal_email ? errors.personal_email : undefined} />
            <CustomInput id="alternate_phone" name="alternate_phone" label="Alternate phone" value={values.alternate_phone} onChange={handleChange} onBlur={handleBlur} />
            <CustomInput id="city" name="city" label="City" value={values.city} onChange={handleChange} onBlur={handleBlur} />
            <CustomInput id="state" name="state" label="State" value={values.state} onChange={handleChange} onBlur={handleBlur} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-black-01">Residential address</label>
              <Textarea name="residential_address" value={values.residential_address} onChange={handleChange} onBlur={handleBlur} rows={2} />
            </div>
          </Section>

          {/* Next of kin */}
          <Section title="Next of kin">
            <CustomInput id="nok_name" name="nok_name" label="Name" value={values.nok_name} onChange={handleChange} onBlur={handleBlur} />
            <CustomInput id="nok_relationship" name="nok_relationship" label="Relationship" value={values.nok_relationship} onChange={handleChange} onBlur={handleBlur} />
            <CustomInput id="nok_phone" name="nok_phone" label="Phone" value={values.nok_phone} onChange={handleChange} onBlur={handleBlur} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-black-01">Address</label>
              <Textarea name="nok_address" value={values.nok_address} onChange={handleChange} onBlur={handleBlur} rows={2} />
            </div>
          </Section>

          {/* Employment (admin only) */}
          {isAdmin && (
            <Section title="Employment">
              <SearchSelect label="Employment type" name="employment_type" options={EMP_TYPE} value={values.employment_type} onChange={handleChange} placeholder="Select" clearable />
              <SearchSelect label="Employment status" name="employment_status" options={EMP_STATUS} value={values.employment_status} onChange={handleChange} placeholder="Select" />
              <CustomInput id="date_joined" name="date_joined" type="date" label="Date joined" value={values.date_joined} onChange={handleChange} onBlur={handleBlur} />
              <CustomInput id="date_exited" name="date_exited" type="date" label="Date exited" value={values.date_exited} onChange={handleChange} onBlur={handleBlur} />
            </Section>
          )}

          {/* Payroll */}
          <Section
            title="Payroll"
            subtitle={payrollEditable ? "Sensitive - bank details." : undefined}
          >
            {payrollEditable ? (
              <>
                <CustomInput id="bank_name" name="bank_name" label="Bank name" value={values.bank_name} onChange={handleChange} onBlur={handleBlur} />
                <CustomInput id="account_name" name="account_name" label="Account name" value={values.account_name} onChange={handleChange} onBlur={handleBlur} />
                <CustomInput id="account_number" name="account_number" label="Account number" value={values.account_number} onChange={handleChange} onBlur={handleBlur} />
              </>
            ) : (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-gray-01 ring-1 ring-slate-200">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                Payroll details require <span className="font-mono font-semibold">platform.staff_payroll.manage</span> to edit.
              </div>
            )}
          </Section>

          <div className="flex items-center gap-3">
            {/* A staged photo counts as an unsaved change, so the button enables
                even when no text field is dirty. */}
            <Button
              type="submit"
              size="lg"
              loading={submitting || uploadingPhoto}
              disabled={(!dirty && !stagedPhoto) || submitting || uploadingPhoto}
            >
              {isCreate ? "Create profile" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Cancel</Button>
            {/* keep setFieldValue referenced for future field-level needs */}
            <span className="hidden" aria-hidden>{typeof setFieldValue}</span>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function PhotoPicker({
  currentPhoto, userName, userId, stagedFile, onPick, uploading,
}: {
  currentPhoto: string | null;
  userName: string;
  userId: string;
  stagedFile: File | null;
  onPick: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Local object URL for the staged (not-yet-saved) file - a blob: URL, no auth
  // needed. Revoked when the staged file changes or the picker unmounts.
  const stagedPreview = useMemo(
    () => (stagedFile ? URL.createObjectURL(stagedFile) : null),
    [stagedFile],
  );
  useEffect(
    () => () => { if (stagedPreview) URL.revokeObjectURL(stagedPreview); },
    [stagedPreview],
  );
  // The persisted /media/ photo is auth-gated, so fetch it through RTK Query
  // (which attaches the JWT) and render the returned blob URL - never the raw URL.
  const { data: serverBlob } = useFetchAuthMediaQuery(currentPhoto ?? skipToken);

  const shown = stagedPreview ?? serverBlob ?? null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4 pb-5 border-b">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative group shrink-0"
        aria-label="Change profile photo"
      >
        {shown ? (
          <img src={shown} alt={userName} className="w-16 h-16 rounded-full object-cover ring-2 ring-pry-01" />
        ) : (
          <span className={cn("inline-flex items-center justify-center rounded-full font-semibold text-xl w-16 h-16", userId ? avatarColor(userId) : "bg-slate-100 text-slate-400")}>
            {initialsOf(userName) || "-"}
          </span>
        )}
        <div className={cn("absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity", uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          {uploading ? <Loader2 className="size-5 text-white animate-spin" /> : <Camera className="size-5 text-white" />}
        </div>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      <div>
        <p className="text-sm font-semibold text-black-01">{userName || "-"}</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-indigo-600 hover:underline mt-0.5">
          {shown ? "Change photo" : "Upload photo"}
        </button>
        {stagedFile && (
          <p className="text-[11px] text-amber-600 mt-0.5">Pending - applied when you save changes.</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-semibold font-mont text-black-01">{title}</h3>
        {subtitle && <p className="text-xs text-gray-01 mt-0.5">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
