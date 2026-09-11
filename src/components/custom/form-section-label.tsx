import { svgIcons } from "@/assets/svg";

interface FormSectionLabelProps {
  children: string;
}

/**
 * Compact label for a group of related form fields.
 *
 * The decorative icon stays inline so the label remains valid when rendered as
 * a paragraph and browsers do not need to repair the form's DOM structure.
 */
export function FormSectionLabel({ children }: FormSectionLabelProps) {
  return (
    <p className="inline-flex items-center text-gray-05 text-sm mb-4">
      {children}
      <span aria-hidden="true" className="size-fit ml-2">
        {svgIcons.infoIcon}
      </span>
    </p>
  );
}
