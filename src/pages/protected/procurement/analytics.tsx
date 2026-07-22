// Procurement Analytics (§6) — thin router/shell over the four read-only report
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
  const { section = "ap-aging" } = useParams();
  const Section = SECTIONS[section] ?? ApAgingScreen;

  return (
    <ProcurementShell>
      {!entity ? (
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
