import * as Yup from "yup";

// individual schema for first name and last name
// You can reuse it
export const firstNameSchema = Yup.string()
  .required("First name is required")
  .trim()
  .min(2, "First name must be at least 2 characters")
  .max(50, "First name must not exceed 50 characters")
  .matches(
    /^[a-zA-Z\u00C0-\u017F\s'-]+$/,
    "First name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .test(
    "no-leading-trailing-spaces",
    "First name cannot start or end with spaces",
    (value) => value === value?.trim()
  )
  .test(
    "no-multiple-spaces",
    "First name cannot contain multiple consecutive spaces",
    (value) => !value?.includes("  ")
  )
  .test(
    "valid-characters",
    "First name contains invalid characters",
    (value) => !/[0-9!@#$%^&*()_+=[\]{};:"\\|,.<>/?`~]/.test(value || "")
  );

export const lastNameSchema = Yup.string()
  .required("Last name is required")
  .trim()
  .min(2, "Last name must be at least 2 characters")
  .max(50, "Last name must not exceed 50 characters")
  .matches(
    /^[a-zA-Z\u00C0-\u017F\s'-]+$/,
    "Last name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .test(
    "no-leading-trailing-spaces",
    "Last name cannot start or end with spaces",
    (value) => value === value?.trim()
  )
  .test(
    "no-multiple-spaces",
    "Last name cannot contain multiple consecutive spaces",
    (value) => !value?.includes("  ")
  )
  .test(
    "valid-characters",
    "Last name contains invalid characters",
    (value) => !/[0-9!@#$%^&*()_+=[\]{};:"\\|,.<>/?`~]/.test(value || "")
  );

/**
 * Phone number rule shared by every phone field in the console.
 *
 * Mirrors the backend's user-create validator (`^\+?[0-9 ()\-]{7,22}$`), so
 * a number the form accepts is one the API accepts too. Local numbers such as
 * `08012345678`, numbers with a country code such as `+2348012345678`, and
 * numbers written with spaces, hyphens or brackets such as `(0)1 234-5678` all
 * pass. No country code is required, and no country is assumed.
 */
export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,22}$/;

export const PHONE_ERROR = "Enter a valid phone number, e.g. 08012345678 or +2348012345678";

export const PHONE_PLACEHOLDER = "e.g. 08012345678 or +2348012345678";

/** True for an empty value (phone is optional unless a schema says so) or a valid number. */
export const isValidPhone = (value: string | undefined | null): boolean =>
  !value || PHONE_PATTERN.test(value);

/** Optional phone field; chain `.required(...)` where a number is mandatory. */
export const phoneSchema = Yup.string()
  .test("phone-format", PHONE_ERROR, (value) => isValidPhone(value));
