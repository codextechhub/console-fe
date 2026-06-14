// Finance console route shell. Every /finance/* area route renders this with
// its own title; it mounts the Finance sub-navigation + entity picker and, for
// now, a placeholder body. Slice 2+ replaces the body per area with the real
// dashboard, GL, AR, collections, etc. screens.

import { ConsoleShell } from "@/components/finance-ui/console-shell";
import { AreaPlaceholder } from "@/components/finance-ui/area-placeholder";
import { financeNav } from "./finance-nav";

export default function FinanceConsolePage({
  title,
  description,
  slice,
}: {
  title: string;
  description?: string;
  slice?: string;
}) {
  return (
    <ConsoleShell title="Finance" nav={financeNav}>
      <AreaPlaceholder title={title} description={description} slice={slice} />
    </ConsoleShell>
  );
}
