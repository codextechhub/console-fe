/**
 * Shapes for the platform's ledger-entity roll-call (`/admin/finance/entities/`).
 *
 * Deliberately narrow: the endpoint carries no figure of any kind, and these
 * types are the second place that is enforced. A balance appearing here would
 * be the first sign that the reporting route has been bypassed.
 */

/** The owning organisation. `kind` separates the platform's own tenant from a
 *  customer's; `status` is the tenant lifecycle, not the books'. */
export interface InventoryTenant {
  id: number;
  slug: string;
  name: string;
  kind: string;
  status: string;
}

/** One set of books. Enough to tell whether it is usable, and nothing more. */
export interface InventoryEntity {
  id: number;
  code: string;
  name: string;
  kind: string;
  base_currency: string | null;
  is_active: boolean;
}

/** One tenant and its books. `entities` is empty for a tenant that has none,
 *  which is the row the screen exists for. */
export interface FinanceInventoryRow {
  tenant: InventoryTenant;
  entities: InventoryEntity[];
  /** Hoisted by the backend so the table can sort and filter on it. */
  has_books: boolean;
}

export interface FinanceInventoryRes {
  success: boolean;
  message: string;
  data: FinanceInventoryRow[];
}
