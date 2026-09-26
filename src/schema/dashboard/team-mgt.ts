import * as Yup from "yup";
import { firstNameSchema, lastNameSchema, phoneSchema } from ".";

export const createTeamMemberSchema = Yup.object({
   first_name: firstNameSchema,
  last_name: lastNameSchema,
  email: Yup.string().email("Invalid email address").required("Email is required"),
  gender: Yup.string().required("Gender is required"),
  role: Yup.string().required("Role is required"),
  phone: phoneSchema.required("Phone number is required"),
  // Seat is required - its title becomes the job title. Other HR fields optional.
  position: Yup.string().required("Position is required"),
  job_title: Yup.string().max(150, "Job title is too long"),
  employee_id: Yup.string().max(32, "Employee ID is too long"),
  employment_type: Yup.string().oneOf(
    ["", "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"],
    "Invalid employment type",
  ),
  date_joined: Yup.string(),
});

export const editTeamMemberSchema = Yup.object({
   first_name: firstNameSchema,
  last_name: lastNameSchema,
  gender: Yup.string().required("Gender is required"),
  phone: phoneSchema.required("Phone number is required"),
});
