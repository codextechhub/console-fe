// Pure signal-card model - kept JSX-free so it isn't a react-refresh
// boundary (same split as workflow-format.ts).
import {
  BookDashed,
  CalendarX,
  PackageOpen,
  ServerCrash,
  Webhook,
} from "lucide-react";
import { routesPath } from "@/routes/routes-path";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";

const R = routesPath.PROTECTED;

export interface SignalCard {
  key: string;
  icon: typeof CalendarX;
  title: string;
  message: string;
  to: string;
  severity: "red" | "amber";
}

/**
 * Flatten the payload's signals object into renderable cards. A key the
 * backend omitted (no permission, or nothing to act on) simply produces no
 * card - the row never shows a healthy/zero state.
 */
export function buildSignalCards(signals: ConsoleOverview["signals"]): SignalCard[] {
  if (!signals) return [];
  const cards: SignalCard[] = [];

  if (signals.fiscal_runway) {
    const { entity_name, status, days_remaining } = signals.fiscal_runway;
    const expired = status === "EXPIRED";
    cards.push({
      key: "fiscal_runway",
      icon: CalendarX,
      title: expired ? "Fiscal calendar expired" : "Fiscal calendar ending",
      message: expired
        ? `${entity_name} can no longer post - create the next fiscal year`
        : `${entity_name} has ${days_remaining} days of calendar left`,
      to: R.FINANCE.SETUP,
      severity: expired ? "red" : "amber",
    });
  }
  if (signals.webhook_failures_24h) {
    cards.push({
      key: "webhooks",
      icon: Webhook,
      title: "Webhook failures",
      message: `${signals.webhook_failures_24h.count} provider events failed in the last 24h`,
      to: R.HEALTH.PROVIDER_WEBHOOKS,
      severity: "red",
    });
  }
  if (signals.jobs_failed_24h) {
    cards.push({
      key: "jobs",
      icon: ServerCrash,
      title: "Failed background jobs",
      message: `${signals.jobs_failed_24h.count} of your jobs failed in the last 24h`,
      to: R.EXPORT.QUEUES,
      severity: "red",
    });
  }
  if (signals.draft_journals) {
    cards.push({
      key: "journals",
      icon: BookDashed,
      title: "Draft journals",
      message: `${signals.draft_journals.count} journal entries waiting to be posted`,
      to: R.FINANCE.LEDGER,
      severity: "amber",
    });
  }
  if (signals.pos_awaiting_receipt) {
    cards.push({
      key: "pos",
      icon: PackageOpen,
      title: "Deliveries outstanding",
      message: `${signals.pos_awaiting_receipt.count} purchase orders awaiting receipt`,
      to: R.PROCUREMENT.PURCHASE_ORDERS,
      severity: "amber",
    });
  }
  // Red (broken now) before amber (needs attention soon), payload order within.
  return cards.sort((a, b) => Number(b.severity === "red") - Number(a.severity === "red"));
}
