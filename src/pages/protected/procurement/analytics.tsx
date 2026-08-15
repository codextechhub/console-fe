// Procurement Analytics (§6) - thin router/shell over the four read-only report
// screens (AP Aging, GR/IR & Control, Spend, Vendor Performance). Each section
// lives in its own file under ./analytics/; this picks one off the :section route.
// Every screen gates on procurement.report.view (the backend view enforces it too).
import { useParams } from "react-router";

import { EmptyState, ForbiddenState, useActiveEntity } from "@/components/finance-ui";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { ProcurementShell } from "./procurement-shell";
import type { SectionProps } from "./analytics/helpers";
import ApAgingScreen from "./analytics/ap-aging";
import GrirScreen from "./analytics/grir";
import SpendScreen from "./analytics/spend";
import PerformanceScreen from "./analytics/performance";

const SECTIONS: Record<string, (props: SectionProps) => React.ReactElement> = {
  "ap-aging": ApAgingScreen,
  grir: GrirScreen,
  spend: SpendScreen,
  performance: PerformanceScreen,
};

export default function AnalyticsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const canReports = can(P.PROC_VIEW_PROC_REPORTS);
  // `/procurement/analytics` with no section lands on the first report; a section
  // that does not exist says so rather than quietly serving a different report,
  // which is how the deleted stock reports kept appearing to "work" from an old
  // bookmark. Rendered in the console rather than through the app's full-page 404,
  // which is a top-level route carrying its own header and would stack a second
  // one inside this layout.
  const { section = "ap-aging" } = useParams();
  const Section = SECTIONS[section];

  return (
    <ProcurementShell>
      {!Section ? (
        <main className="px-4.5 py-6">
          <EmptyState
            title="Page not found"
            message="This report does not exist. Pick one from the Analytics menu, or find stock figures under Inventory - Stock Items, which carries reorder status and valuation with an optional store."
          />
        </main>
      ) : !entity ? (
        <main className="px-4.5 py-6">
          <EmptyState title="Select an entity" message="Choose a ledger entity to see its procurement reports." />
        </main>
      ) : !canReports ? (
        <main className="px-4.5 py-6">
          <ForbiddenState message="You don’t hold procurement.report.view for this console." />
        </main>
      ) : (
        <Section entity={entity} currency={currency} />
      )}
    </ProcurementShell>
  );
}
