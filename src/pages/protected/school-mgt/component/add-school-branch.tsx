import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import type { BranchStepItem } from "../create-school";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { BRANCH_PHONE_HINT, MAIN_BRANCH_PHONE_HINT, PHONE_PLACEHOLDER } from "@/schema/dashboard";
import { branchItemSchema } from "@/schema/dashboard/school-mgt";

interface Props {
  defaultValues: BranchStepItem[];
  onNext: (data: BranchStepItem[]) => void;
  onChange: (data: BranchStepItem[]) => void;
}

const emptyBranch = (): BranchStepItem => ({
  name: "", address: "", email: "", phone: "", country: "Nigeria",
  state: "", is_main: false, admin_first_name: "", admin_last_name: "",
  admin_email: "", admin_phone: "",
});

export default function AddSchoolBranch({ defaultValues, onNext, onChange }: Props) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchStepItem[]>(
    defaultValues.length > 0 ? defaultValues : [{ ...emptyBranch(), is_main: true }],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onChange(branches);
  }, [branches, onChange]);

  const update = (idx: number, field: keyof BranchStepItem, value: unknown) => {
    setBranches((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  };

  const setMain = (idx: number) => {
    setBranches((prev) => prev.map((b, i) => ({ ...b, is_main: i === idx })));
  };

  const addBranch = () => setBranches((prev) => [...prev, emptyBranch()]);

  const removeBranch = (idx: number) => {
    if (branches.length === 1) return;
    const next = branches.filter((_, i) => i !== idx);
    if (!next.some((b) => b.is_main)) next[0].is_main = true;
    setBranches(next);
  };

  /**
   * Each branch against `branchItemSchema`, the one statement of a branch's
   * rules, then the two rules that need every branch at once.
   */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    branches.forEach((b, i) => {
      try {
        branchItemSchema.validateSync(b, { abortEarly: false });
      } catch (error) {
        if (!(error instanceof Yup.ValidationError)) throw error;
        for (const issue of error.inner) {
          const key = `${i}.${issue.path}`;
          if (issue.path && !errs[key]) errs[key] = issue.message;
        }
      }
    });
    // The server refuses two branches of the same name in one school, so say so before Submit.
    const seen = new Set<string>();
    branches.forEach((b, i) => {
      const name = b.name.trim().toLowerCase();
      if (!name) return;
      if (seen.has(name)) errs[`${i}.name`] = "Another branch already has this name.";
      seen.add(name);
    });
    if (!branches.some((b) => b.is_main)) errs["main"] = "One branch must be marked as main";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (validate()) onNext(branches);
  };

  return (
    <div className="max-w-235 mt-5">
      <div className="mb-7 space-y-1.5">
        <h4 className="font-medium text-xl text-black-01" data-guide="school-create.branches">Add Branch</h4>
        <p className="text-gray-01 font-mont text-xs">
          Add at least one branch for the school. Exactly one must be set as the main branch.
        </p>
      </div>

      {errors["main"] && (
        <p className="text-destructive text-sm mb-4">{errors["main"]}</p>
      )}

      <div className="space-y-12 mb-4">
        {branches.map((branch, idx) => (
          <div key={idx} className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-full flex items-center justify-between">
              <p className="text-gray-05 text-sm font-medium">Branch {idx + 1}</p>
              {branches.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive px-2"
                  onClick={() => removeBranch(idx)}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              )}
            </div>

            <CustomInput
              id={`name-${idx}`}
              label="Branch Name"
              placeholder="e.g., Main Branch"
              isRequired
              value={branch.name}
              onChange={(e) => update(idx, "name", e.target.value)}
              error={errors[`${idx}.name`]}
            />
            <CustomInput
              id={`address-${idx}`}
              label="Branch Address"
              placeholder="Enter address"
              value={branch.address}
              onChange={(e) => update(idx, "address", e.target.value)}
            />
            <CustomInput
              id={`email-${idx}`}
              type="email"
              label="Branch Email"
              placeholder="Enter email"
              value={branch.email}
              onChange={(e) => update(idx, "email", e.target.value)}
              error={errors[`${idx}.email`]}
            />
            <CustomInput
              id={`phone-${idx}`}
              label="Branch Phone"
              placeholder={PHONE_PLACEHOLDER}
              hint={branch.is_main ? MAIN_BRANCH_PHONE_HINT : BRANCH_PHONE_HINT}
              value={branch.phone}
              onChange={(e) => update(idx, "phone", e.target.value)}
              error={errors[`${idx}.phone`]}
            />
            <CustomInput
              id={`country-${idx}`}
              label="Country"
              placeholder="e.g., Nigeria"
              isRequired
              value={branch.country}
              onChange={(e) => update(idx, "country", e.target.value)}
              error={errors[`${idx}.country`]}
            />
            <CustomInput
              id={`state-${idx}`}
              label="State"
              placeholder="e.g., Lagos"
              value={branch.state}
              onChange={(e) => update(idx, "state", e.target.value)}
            />

            <p className="col-span-full text-gray-05 text-sm font-medium mt-2">Branch Admin</p>
            <CustomInput
              id={`afname-${idx}`}
              label="Admin First Name"
              placeholder="Enter first name"
              isRequired
              value={branch.admin_first_name}
              onChange={(e) => update(idx, "admin_first_name", e.target.value)}
              error={errors[`${idx}.admin_first_name`]}
            />
            <CustomInput
              id={`alname-${idx}`}
              label="Admin Last Name"
              placeholder="Enter last name"
              isRequired
              value={branch.admin_last_name}
              onChange={(e) => update(idx, "admin_last_name", e.target.value)}
              error={errors[`${idx}.admin_last_name`]}
            />
            <CustomInput
              id={`aemail-${idx}`}
              type="email"
              label="Admin Email"
              placeholder="Enter email"
              isRequired
              value={branch.admin_email}
              onChange={(e) => update(idx, "admin_email", e.target.value)}
              error={errors[`${idx}.admin_email`]}
            />
            <CustomInput
              id={`aphone-${idx}`}
              label="Admin Phone"
              placeholder={PHONE_PLACEHOLDER}
              value={branch.admin_phone}
              onChange={(e) => update(idx, "admin_phone", e.target.value)}
              error={errors[`${idx}.admin_phone`]}
            />

            <div className="inline-flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-sm font-mont font-medium text-gray-06">Main Branch</p>
                <p className="text-xs font-light text-gray-02">Toggle on if this is the main branch</p>
              </div>
              <Switch
                checked={branch.is_main}
                onCheckedChange={(checked) => { if (checked) setMain(idx); }}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="ghost" className="px-0 text-primary" onClick={addBranch}>
        <Plus /> Add Another Branch
      </Button>

      <div className="mt-10 inline-flex items-center gap-4">
        <Button type="button" variant="outline-dest" className="w-37" onClick={() => navigate({ search: "?step=school" })}>
          Back
        </Button>
        <Button type="button" className="w-37" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
