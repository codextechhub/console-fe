// Shared helpers for the Division → Department → Team cascade used by the
// org-node and position forms: tier-scoped child lookups, single-option
// auto-fill, code-searchable labels and a name→code suggestion.

import type { OrgNode, OrgNodeKind } from "@/redux/services/dashboard/organogram-types";

export const divisionsOf = (nodes: OrgNode[]) => nodes.filter((n) => n.kind === "DIVISION");

// Children of a parent node at a given tier ("" parent → empty list).
export const childNodes = (nodes: OrgNode[], parentId: string, kind: OrgNodeKind) =>
  parentId ? nodes.filter((n) => n.kind === kind && String(n.parent?.id ?? "") === parentId) : [];

// Auto-fill rule: exactly one candidate → its id, else no selection.
export const singleId = (list: OrgNode[]) => (list.length === 1 ? String(list[0].id) : "");

// Labels carry the code so SearchSelect's type-to-filter matches codes too,
// e.g. "Executive (EXEC)".
export const nodeOption = (n: OrgNode) => ({ value: String(n.id), label: `${n.name} (${n.code})` });

// "Customer Success" → "CS", "Engineering" → "ENG". Editable suggestion only.
export const suggestCode = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const raw = words.length === 1 ? words[0].slice(0, 3) : words.slice(0, 3).map((w) => w[0]).join("");
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
};
