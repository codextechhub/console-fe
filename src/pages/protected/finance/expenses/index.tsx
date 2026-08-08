// Expenses & petty cash (§6.6) - one page per sub-section (route-driven).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity, InfoHint } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { ExpenseClaimsTab } from "./expense-claims-tab";
import { PettyCashTab } from "./petty-cash-tab";

export default function ExpensesPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "claims" } = useParams();
  const isPettyCash = section === "petty-cash";

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mont text-lg font-semibold text-gray-01">{isPettyCash ? "Petty Cash" : "Expense Claims"}</h1>
            {isPettyCash
              ? <InfoHint ariaLabel="About petty-cash floats">A petty-cash float is an imprest tin mapped to its own GL account. Establishing or replenishing moves cash from the bank into it (Dr petty cash, Cr bank); each voucher spends it (Dr expense, Cr petty cash). Replenish restores the float to its ceiling.</InfoHint>
              : <InfoHint ariaLabel="About expense claims">Expense claims book like a vendor invoice with the staff member as the "vendor". Approving posts Dr expense (+ recoverable input VAT) / Cr Accrued Reimbursement (a liability); paying it later credits the bank and clears the accrual.</InfoHint>}
          </div>
          <p className="mt-0.5 font-mont text-xs text-gray-05">{isPettyCash ? "Petty-cash floats and vouchers." : "Out-of-pocket spending by staff that needs reimbursement."}</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : isPettyCash ? (
          <PettyCashTab entity={entity} currency={currency} />
        ) : (
          <ExpenseClaimsTab entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
