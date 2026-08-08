// Hooks for the globally-selected ledger entity. Almost every finance/
// procurement query is entity-scoped, so pages read the active entity's CODE
// from here and thread it into requests; <Money> reads its base currency.

import { useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import { selectEntityCode } from "@/redux/features/finance/entity-slice";
import { useGetEntitiesQuery } from "@/redux/services/finance/entity-api";
import type { LedgerEntity } from "@/redux/services/finance/entity-types";

interface ActiveEntity {
  /** The selected entity code, or null until one is chosen. */
  code: string | null;
  /** The resolved entity record (once the list has loaded). */
  entity: LedgerEntity | null;
  /** base_currency of the active entity (for <Money currency=…/>). */
  currency: string | null;
  isLoading: boolean;
}

/**
 * The active entity, resolved against the loaded entity list. Use `code` to
 * scope queries (skip them while it's null) and `currency` for money display.
 */
export function useActiveEntity(): ActiveEntity {
  const code = useAppSelector(selectEntityCode);
  const { data, isLoading } = useGetEntitiesQuery({ is_active: true });

  const entity = useMemo(
    () => data?.data.find((e) => e.code === code) ?? null,
    [data, code],
  );

  return {
    code,
    entity,
    currency: entity?.base_currency ?? null,
    isLoading,
  };
}

/** Bare selected code - for components that only need to scope a request. */
export function useEntityCode(): string | null {
  return useAppSelector(selectEntityCode);
}
