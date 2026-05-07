import * as Yup from "yup";
import { firstNameSchema, lastNameSchema } from ".";

export const createTeamMemberSchema = Yup.object({
   first_name: firstNameSchema,
  last_name: lastNameSchema,
  email: Yup.string().email("Invalid email address").required("Email is required"),
  gender: Yup.string().required("Gender is required"),
  role: Yup.string().required("Role is required"),
  phone: Yup
    .string()
    .required("Phone number is required")
    .matches(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in international format (e.g. +2347033327493)"
    ),
});

export const editTeamMemberSchema = Yup.object({
   first_name: firstNameSchema,
  last_name: lastNameSchema,
  gender: Yup.string().required("Gender is required"),
  phone: Yup
    .string()
    .required("Phone number is required")
    .matches(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in international format (e.g. +2347033327493)"
    ),
});