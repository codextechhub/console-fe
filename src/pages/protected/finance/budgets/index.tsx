// Budgets, fixed assets & tax (§6.8) — one page per sub-section (route-driven).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { BudgetsTab } from "./budgets-tab";
import { AssetsTab } from "./assets-tab";
import { TaxTab } from "./tax-tab";

const LABELS: Record<string, string> = { budgets: "Budgets", assets: "Fixed Assets", tax: "Tax" };

export default function BudgetsAssetsTaxPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "budgets" } = useParams();

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Budgets, Assets & Tax"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Budgets and variance, the fixed-asset register, and tax filing/remittance.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "assets" ? (
          <AssetsTab entity={entity} currency={currency} />
        ) : section === "tax" ? (
          <TaxTab entity={entity} currency={currency} />
        ) : (
          <BudgetsTab entity={entity} />
        )}
      </main>
    </FinanceShell>
  );
}
