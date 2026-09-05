/**
 * The sentence a person reads beside a permission.
 *
 * Mirrors ``vs_rbac.views._permission_label`` rule for rule: the registry's
 * ``description`` where it has one, and otherwise English composed from the
 * key's own resource and action. The school app reads that same answer
 * server-side through the permission catalogue; this gives the console the
 * same words without a second vocabulary to keep in step with it.
 *
 * Composing rather than printing the key raw is the point.
 * "school.administrators.view" is not a label; "View administrators" is, and it
 * is built from the same two parts the key itself is built from, so it cannot
 * end up describing a different permission from the one it sits beside.
 *
 * Takes anything carrying a key and optionally a description, because the rows
 * that need labelling are not all the same shape: the registry returns
 * ``resource_key`` and ``action_key`` alongside, while a permission override
 * carries only the dotted key and its description. Where the parts are absent
 * they are read off the key, which is where they came from anyway.
 */
export interface LabellablePermission {
  key: string;
  description?: string | null;
  resource_key?: string;
  action_key?: string;
}

const humanise = (segment: string) => segment.replace(/_/g, " ").trim();

export function permissionLabel(permission: LabellablePermission): string {
  const described = (permission.description ?? "").trim();
  if (described) return described;

  const [, keyResource = "", ...keyActionParts] = permission.key.split(".");
  const resource = humanise(permission.resource_key ?? keyResource);
  const action = humanise(permission.action_key ?? keyActionParts.join(" "));
  if (!action && !resource) return permission.key;

  const sentence = `${action} ${resource}`.trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
