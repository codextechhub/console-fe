// Setup & entity (§6.1) — entities, chart of accounts, periods; one page per
// sub-section (route-driven).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { EntitiesTab } from "./entities-tab";
import { AccountsTab } from "./accounts-tab";
import { PeriodsTab } from "../reports/periods-tab";

const LABELS: Record<string, string> = { entities: "Entities", accounts: "Chart of Accounts", periods: "Periods" };

export default function SetupPage() {
  const { code: entity } = useActiveEntity();
  const { section = "entities" } = useParams();

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Setup & Entity"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Ledger entities, the chart of accounts and fiscal periods.</p>
        </div>
        {section === "accounts" ? (
          entity ? <AccountsTab entity={entity} /> : <EmptyState title="Select an entity" />
        ) : section === "periods" ? (
          entity ? <PeriodsTab entity={entity} /> : <EmptyState title="Select an entity" />
        ) : (
          <EntitiesTab />
        )}
      </main>
    </FinanceShell>
  );
}
