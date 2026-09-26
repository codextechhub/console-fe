import * as Yup from "yup";
import { phoneSchema } from ".";

export const schoolStepSchema = Yup.object({
  name: Yup.string().required("School name is required"),
  slug: Yup.string().matches(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  ownership_type: Yup.string().required("Ownership type is required"),
  address: Yup.string().required("Address is required"),
  term_structure: Yup.string().required("Term structure is required"),
  currency: Yup.string().required("Currency is required"),
  website: Yup.string().url("Must be a valid URL").nullable(),
  motto: Yup.string(),
  registration_id: Yup.string(),
});

const branchAdminSchema = Yup.object({
  admin_first_name: Yup.string().required("Admin first name is required"),
  admin_last_name: Yup.string().required("Admin last name is required"),
  admin_email: Yup.string().email("Invalid email").required("Admin email is required"),
  admin_phone: phoneSchema,
});

export const branchItemSchema = Yup.object({
  name: Yup.string().required("Branch name is required"),
  address: Yup.string(),
  email: Yup.string().email("Invalid email"),
  country: Yup.string().required("Country is required"),
  state: Yup.string(),
  is_main: Yup.boolean(),
}).concat(branchAdminSchema);

export const adminStepSchema = Yup.object({
  first_name: Yup.string().required("First name is required"),
  last_name: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: phoneSchema,
});

export const packageStepSchema = Yup.object({
  package_plan: Yup.string().required("Package plan is required"),
  subscription_expires_at: Yup.string().nullable(),
});

export const editSchoolSchema = Yup.object({
  // Left loose on purpose: the backend normalises what is typed ("Bright Star"
  // becomes "bright-star"), so refusing spaces and capitals here would reject
  // input the API accepts. Reserved names and collisions are the server's
  // answer to give, and it gives them per field.
  slug: Yup.string(),
  ownership_type: Yup.string().required("Ownership type is required"),
  address: Yup.string().required("Address is required"),
  term_structure: Yup.string().required("Term structure is required"),
  currency: Yup.string().required("Currency is required"),
  website: Yup.string().url("Must be a valid URL").nullable(),
  motto: Yup.string(),
  registration_id: Yup.string(),
});
