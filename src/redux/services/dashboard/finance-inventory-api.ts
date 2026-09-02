import { baseApi } from "../base-api";
import type { FinanceInventoryRes } from "./finance-inventory-types";

export const financeInventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Every tenant on the platform, with the ledger entities it owns.
     *
     * An inventory, not a ledger. It answers "does this school have books, and
     * are they usable" and carries no figure at all. Reading a tenant's actual
     * numbers still goes through a proxy session, which swaps the asserted
     * tenant so the read stays attributable to somebody entitled to it.
     *
     * Tenants with no books are listed with `entities: []` rather than left
     * out. That row is the reason the screen exists: from the school's side,
     * "our books are broken" and "we were never provisioned" look identical.
     *
     * Backend gate: platform.schools.view.
     */
    getFinanceInventory: builder.query<FinanceInventoryRes, void>({
      query: () => ({ url: `/admin/finance/entities/`, method: "GET" }),
      // Creating a set of books from the tab above invalidates FinanceEntities,
      // and provisioning a school invalidates Schools. Either changes a row
      // here, so the roll-call re-fetches with both.
      providesTags: ["FinanceEntities", "Schools"],
    }),
  }),
});

export const { useGetFinanceInventoryQuery } = financeInventoryApi;
