// Procurement console route shell. Every /procurement/* area route renders this
// with its own title; it mounts the Procurement sub-navigation + entity picker
// and a placeholder body. Slice 5+ replaces the body per area with the real
// vendors, P2P chain, sourcing, inventory, analytics and payout screens.

import { ConsoleShell } from "@/components/finance-ui/console-shell";
import { AreaPlaceholder } from "@/components/finance-ui/area-placeholder";
import { procurementNav } from "./procurement-nav";

export default function ProcurementConsolePage({
  title,
  description,
  slice,
}: {
  title: string;
  description?: string;
  slice?: string;
}) {
  return (
    <ConsoleShell title="Procurement" nav={procurementNav}>
      <AreaPlaceholder title={title} description={description} slice={slice} />
    </ConsoleShell>
  );
}
