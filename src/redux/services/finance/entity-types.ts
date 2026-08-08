// Ledger-entity types - mirror vs_finance LedgerEntitySerializer /
// LedgerEntityCreateSerializer exactly (read, then write shapes).

/** GET /finance/entities/ - read shape (LedgerEntitySerializer). */
export interface LedgerEntity {
  id: number;
  code: string;
  number_code: string; // 2–3 char code embedded in document numbers (e.g. COD)
  name: string;
  kind: string;
  base_currency: string; // 3-letter ISO code (its PK on the backend)
  is_active: boolean;
  source_school_id: number | null;
}

/** GET /finance/entities/ query params. */
export interface EntityListParams {
  kind?: string;
  is_active?: boolean;
}

/**
 * POST /finance/entities/ - provisioning a new set of books. One call seeds the
 * chart of accounts + twelve open periods. fiscal_year / fiscal_start_month are
 * optional (a school can open e.g. a Sept–Aug year).
 */
export interface CreateEntityPayload {
  code: string;
  number_code?: string; // optional; backend auto-derives a unique code when blank
  name: string;
  kind?: string;
  base_currency?: string;
  source_school?: number | null;
  fiscal_year?: number;
  fiscal_start_month?: number;
}
