import PromptModal from "@/components/modal/prompt-modal";
import { useCreateSchoolMutation } from "@/redux/services/dashboard/school-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AddSchool from "./component/add-school";
import AddSchoolAdmin from "./component/add-school-admin";
import AddSchoolBranch from "./component/add-school-branch";
import PackageSetup from "./component/package-setup";

export interface SchoolStepData {
  name: string;
  slug: string;
  ownership_type: string;
  address: string;
  website: string;
  motto: string;
  term_structure: string;
  currency: string;
  registration_id: string;
}

export interface BranchStepItem {
  name: string;
  _type: string;
  address: string;
  email: string;
  country: string;
  state: string;
  is_main: boolean;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_phone: string;
}

export interface AdminStepData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface PackageStepData {
  package_plan: string;
  enabled_modules: string[];
  subscription_expires_at: string;
}

const initialSchool: SchoolStepData = {
  name: "", slug: "", ownership_type: "", address: "",
  website: "", motto: "", term_structure: "", currency: "", registration_id: "",
};

const initialBranch: BranchStepItem = {
  name: "", _type: "", address: "", email: "", country: "Nigeria",
  state: "", is_main: true, admin_first_name: "", admin_last_name: "",
  admin_email: "", admin_phone: "",
};

const initialAdmin: AdminStepData = {
  first_name: "", last_name: "", email: "", phone: "",
};

const initialPackage: PackageStepData = {
  package_plan: "", enabled_modules: [], subscription_expires_at: "",
};

export interface PrefillData {
  school: SchoolStepData;
  branches: BranchStepItem[];
  admin: AdminStepData;
  pkg: PackageStepData;
}

function generateTestData(): PrefillData {
  const n = Math.floor(Math.random() * 900) + 100;
  const slug = `test-school-${n}`;
  return {
    school: {
      name: `Test School ${n}`,
      slug,
      ownership_type: "PRIVATE",
      address: `${n} Test Avenue, Victoria Island`,
      website: `https://${slug}.ng`,
      motto: "Excellence in Learning",
      term_structure: "3_TERMS",
      currency: "NGN",
      registration_id: `REG-${n}`,
    },
    branches: [
      {
        name: "Main Campus",
        _type: "Secondary",
        address: `${n} Test Avenue, Victoria Island`,
        email: `branch@${slug}.ng`,
        country: "Nigeria",
        state: "Lagos",
        is_main: true,
        admin_first_name: "Branch",
        admin_last_name: `Admin${n}`,
        admin_email: `branchadmin${n}@${slug}.ng`,
        admin_phone: `+23480${n}0000`,
      },
    ],
    admin: {
      first_name: "School",
      last_name: `Admin${n}`,
      email: `admin${n}@${slug}.ng`,
      phone: `+23470${n}0000`,
    },
    pkg: {
      package_plan: "",
      enabled_modules: [],
      subscription_expires_at: "2027-12-31",
    },
  };
}

function buildPayload(
  school: SchoolStepData,
  branches: BranchStepItem[],
  admin: AdminStepData,
  pkg: PackageStepData,
) {
  const payload: Record<string, unknown> = {
    name: school.name,
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
      _type: b._type,
      address: b.address || "",
      email: b.email || "",
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

  if (pkg.package_plan) {
    payload.package_setup_data = {
      package_plan: pkg.package_plan,
      enabled_modules: pkg.enabled_modules,
      ...(pkg.subscription_expires_at ? { subscription_expires_at: pkg.subscription_expires_at } : {}),
    };
  }

  return payload;
}

export default function CreateSchool() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const step = searchParams.get("step") ?? "school";

  const [schoolData, setSchoolData] = useState<SchoolStepData>(initialSchool);
  const [branches, setBranches] = useState<BranchStepItem[]>([{ ...initialBranch }]);
  const [adminData, setAdminData] = useState<AdminStepData>(initialAdmin);
  const [packageData, setPackageData] = useState<PackageStepData>(initialPackage);

  const [createSchool, { isLoading: submitting }] = useCreateSchoolMutation();


  // Fills the LATER steps from the school step's own test data, so one press
  // in the step header carries through the whole wizard. The step header owns
  // that control; there is no second, wizard-level one above the form.
  const handlePrefill = (data: PrefillData) => {
    setBranches(data.branches);
    setAdminData(data.admin);
    setPackageData(data.pkg);
  };

  const handleSchoolNext = (data: SchoolStepData) => {
    setSchoolData(data);
    navigate({ search: "?step=branch" });
  };

  const handleBranchNext = (data: BranchStepItem[]) => {
    setBranches(data);
    navigate({ search: "?step=admin" });
  };

  const handleAdminNext = (data: AdminStepData) => {
    setAdminData(data);
    navigate({ search: "?step=plan" });
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (data: PackageStepData) => {
    setPackageData(data);
    const payload = buildPayload(schoolData, branches, adminData, data);
    createSchool(payload)
      .unwrap()
      .then(() => setShowSuccess(true))
      .catch(() => {}); // errors are shown by the global baseQueryInterceptor
  };

  const renderStep = () => {
    switch (step) {
      case "branch":
        return <AddSchoolBranch defaultValues={branches} onNext={handleBranchNext} onChange={setBranches} />;
      case "admin":
        return <AddSchoolAdmin defaultValues={adminData} onNext={handleAdminNext} onChange={setAdminData} />;
      case "plan":
        return <PackageSetup defaultValues={packageData} onSubmit={handleSubmit} onChange={setPackageData} isSubmitting={submitting} />;
      default:
        return <AddSchool defaultValues={schoolData} onNext={handleSchoolNext} onChange={setSchoolData} onPrefill={handlePrefill} generateTestData={generateTestData} />;
    }
  };

  return (
    <>
      {/* No top padding: every step opens with its own mt-5, and the two used
          to be separated by the "Fill test data" bar that sat here. With the
          bar gone they stacked into a 44px gap above the heading. */}
      <section className="px-4.5 pb-6">{renderStep()}</section>
      <PromptModal
        isOpen={showSuccess}
        onConfirm={() => {
          setShowSuccess(false);
          navigate(routesPath.PROTECTED.SCHOOL_MGT.INDEX + "?status=pending", { replace: true });
        }}
        title="School created successfully"
        description="The school has been set up and invitations have been sent to the administrators. You can continue to the dashboard."
      />
    </>
  );
}
