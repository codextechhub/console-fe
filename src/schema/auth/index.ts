import * as Yup from "yup";
import { PASSWORD_POLICY_MESSAGE, passwordMeetsPolicy } from "@/lib/password-policy";

// Single reusable field enforcing the canonical policy (12 chars + upper +
// lower + digit + special) - the same rules the backend enforces and the
// PasswordRequirements checklist displays.
const passwordField = Yup.string()
  .required("Password is required")
  .test("password-policy", PASSWORD_POLICY_MESSAGE, (value) => passwordMeetsPolicy(value ?? ""));

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export const resetPasswordSchema = Yup.object({
  password: passwordField,
  confirm_password: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("password"), ""], "Passwords must match"),
});

export const signUpSchema = Yup.object({
  password: passwordField,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});
