import { Lock } from "lucide-react";

/**
 * The notes shown beside a role form: what this save will send for approval,
 * and what already waits from an earlier save. See `restricted-approval.ts`.
 */
export function RestrictedApprovalNotes({
  labels,
  adding,
  waiting,
}: {
  labels: Map<string, string>;
  adding: string[];
  waiting: string[];
}) {
  const named = (keys: string[]) => keys.map((key) => labels.get(key) ?? key).join(", ");
  return (
    <>
      {adding.length > 0 && (
        <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lock className="size-4 shrink-0" />
          <span>
            {named(adding)} {adding.length === 1 ? "is a restricted permission" : "are restricted permissions"}.
            The role saves now and sends {adding.length === 1 ? "it" : "them"} for approval;{" "}
            {adding.length === 1 ? "it takes" : "they take"} effect once approved.
          </span>
        </p>
      )}
      {waiting.length > 0 && (
        <p className="flex gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-01">
          <Lock className="size-4 shrink-0" />
          <span>Waiting for approval: {named(waiting)}.</span>
        </p>
      )}
    </>
  );
}
