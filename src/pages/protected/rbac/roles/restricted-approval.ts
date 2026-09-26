import type {
  AccessCatalogueModule,
  PlatformRoleDetail,
} from "@/redux/services/dashboard/rbac-types";

/**
 * How the role screens describe restricted permissions that wait for approval.
 *
 * A save never grants a restricted permission the role does not already hold,
 * whoever holds the role. The server saves everything else and raises one role
 * change request for the restricted ones, so the create and edit screens say
 * before saving which ticked boxes will wait, list the ones already waiting,
 * and say afterwards how many were sent.
 */

/** Catalogue labels by permission key, so notes never show a raw key. */
export function catalogueLabels(modules: AccessCatalogueModule[]) {
  return new Map(
    modules
      .flatMap((module) => module.resources)
      .flatMap((resource) => resource.permissions)
      .map((permission) => [permission.key, permission.label]),
  );
}

/** The ticked restricted keys this save will send for approval rather than grant. */
export function restrictedAdditions(
  modules: AccessCatalogueModule[],
  ticked: string[],
  role?: PlatformRoleDetail,
) {
  const restricted = new Set(
    modules
      .flatMap((module) => module.resources)
      .flatMap((resource) => resource.permissions)
      .filter((permission) => permission.is_restricted)
      .map((permission) => permission.key),
  );
  const held = new Set(
    (role?.role_permissions ?? []).filter((row) => row.granted).map((row) => row.permission_key),
  );
  const waiting = new Set((role?.pending_additions ?? []).map((entry) => entry.permission_key));
  return ticked.filter((key) => restricted.has(key) && !held.has(key) && !waiting.has(key));
}

/** The toast's second sentence when a save sent permissions for approval. */
export function sentForApproval(count: number) {
  if (count === 0) return "";
  return count === 1
    ? " 1 restricted permission was sent for approval."
    : ` ${count} restricted permissions were sent for approval.`;
}
