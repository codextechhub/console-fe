import { Lock } from "lucide-react";

/**
 * The notes shown beside a role form: what this save will send for approval,
 * and what already waits from an earlier save. See `restricted-approval.ts`.
 *
 * `adding` names keys from the catalogue the form is built from, so `labels`
 * always has them. `waiting` comes from the role itself and carries the
 * backend's own wording, because a waiting permission may since have left the
 * catalogue. A key with no wording at all is counted, never printed.
 */
export function RestrictedApprovalNotes({
  labels,
  adding,
  waiting,
}: {
  labels: Map<string, string>;
  adding: string[];
  waiting: Array<{ permission_key: string; permission_label?: string }>;
}) {
  const named = (entries: Array<{ key: string; label?: string }>) => {
    const known = entries.map((entry) => entry.label).filter((label): label is string => Boolean(label));
    const unnamed = entries.length - known.length;
    if (unnamed) known.push(unnamed === 1 ? "1 other permission" : `${unnamed} other permissions`);
    return known.join(", ");
  };
  const addingNamed = named(adding.map((key) => ({ key, label: labels.get(key) })));
  const waitingNamed = named(
    waiting.map((entry) => ({
      key: entry.permission_key,
      label: entry.permission_label || labels.get(entry.permission_key),
    })),
  );
  return (
    <>
      {adding.length > 0 && (
        <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lock className="size-4 shrink-0" />
          <span>
            {addingNamed} {adding.length === 1 ? "is a restricted permission" : "are restricted permissions"}.
            The role saves now and sends {adding.length === 1 ? "it" : "them"} for approval;{" "}
            {adding.length === 1 ? "it takes" : "they take"} effect once approved.
          </span>
        </p>
      )}
      {waiting.length > 0 && (
        <p className="flex gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-01">
          <Lock className="size-4 shrink-0" />
          <span>Waiting for approval: {waitingNamed}.</span>
        </p>
      )}
    </>
  );
}
