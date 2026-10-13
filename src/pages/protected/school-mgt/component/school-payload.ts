import type { AdminStepData, BranchStepItem, SchoolStepData } from "../create-school";

/**
 * The body of the school-creation request.
 *
 * Each branch carries its own phone, the number its payment terminal's
 * WhatsApp alerts go to. A blank phone on the main branch is sent as blank on
 * purpose: the server then gives the main branch the school's own number.
 */
export function buildPayload(
  school: SchoolStepData,
  branches: BranchStepItem[],
  admin: AdminStepData,
  packageSetup: Record<string, unknown> | undefined,
) {
  const payload: Record<string, unknown> = {
    name: school.name,
    email: school.email,
    phone: school.phone,
    ownership_type: school.ownership_type,
    address: school.address,
    term_structure: school.term_structure,
    currency: school.currency,
  };
  if (school.slug) payload.slug = school.slug;
  if (school.website) payload.website = school.website;
  if (school.motto) payload.motto = school.motto;
  if (school.registration_id) payload.registration_id = school.registration_id;

  if (admin.first_name && admin.email) {
    payload.primary_admin_data = {
      full_name: `${admin.first_name} ${admin.last_name}`.trim(),
      email: admin.email,
      phone: admin.phone || "",
      role_label: "SCHOOL_ADMIN",
    };
  }

  if (branches.length > 0) {
    payload.branches = branches.map((b) => ({
      name: b.name,
      address: b.address || "",
      email: b.email || "",
      phone: b.phone.trim(),
      country: b.country || "Nigeria",
      state: b.state || "",
      is_main: b.is_main,
      primary_admin_data: {
        full_name: `${b.admin_first_name} ${b.admin_last_name}`.trim(),
        email: b.admin_email,
        phone: b.admin_phone || "",
        role_label: "BRANCH_ADMIN",
      },
    }));
  }

  if (packageSetup) payload.package_setup_data = packageSetup;

  return payload;
}
