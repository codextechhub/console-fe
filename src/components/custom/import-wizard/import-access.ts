import { P, type PermissionCode } from "@/permissions";
import type { DatasetType } from "@/redux/services/dashboard/import-types";

/**
 * Datasets whose own import key may also roll back a batch of that dataset.
 *
 * Mirrors `_DATASET_EXTRA_ENGINE_KEYS` on the server. Only bank statements are
 * here: finance refuses to edit a bulk-imported statement line by line and
 * sends the bursar to roll it back and import it again, so the bank-statement
 * key has to reach that rollback, and only on a statement batch.
 */
const DATASET_ROLLBACK_PERMISSION: Partial<Record<DatasetType, PermissionCode>> =
  {
    bank_statements: P.FIN_IMPORT_BANK,
  };

/**
 * Whether this reader may roll back a finished import of `dataset`.
 *
 * `import.rollbacks.run` rolls back any batch. Otherwise the dataset's own key
 * does, where `DATASET_ROLLBACK_PERMISSION` lists it, and never for another
 * dataset's batch.
 */
export function canRollBackImport(
  dataset: DatasetType | undefined,
  hasPermission: (code: PermissionCode) => boolean,
): boolean {
  if (hasPermission(P.RUN_IMPORT_ROLLBACK)) return true;
  const datasetKey = dataset ? DATASET_ROLLBACK_PERMISSION[dataset] : undefined;
  return datasetKey ? hasPermission(datasetKey) : false;
}
