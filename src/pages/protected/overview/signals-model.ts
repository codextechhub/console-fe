// Pure signal-card model - kept JSX-free so it isn't a react-refresh
// boundary (same split as workflow-format.ts).
import {
  BookDashed,
  CalendarClock,
  CalendarX,
  Coins,
  FileWarning,
  PackageOpen,
  ReceiptText,
  Send,
  ServerCrash,
  UsersRound,
  UserX,
  Webhook,
} from "lucide-react";
import { routesPath } from "@/routes/routes-path";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";

const R = routesPath.PROTECTED;

/**
 * Whose problem this is.
 *
 * `mine` means the reader is the one who clears it - their queue, their jobs,
 * their tickets. `watch` means a condition somewhere in the organisation that
 * they should see but may not personally own. The panel groups on this, so a
 * miscategorised row either buries someone's real work or claims work that
 * isn't theirs. When in doubt, it is `watch`.
 */
export type RowOwnership = "mine" | "watch";

export interface SignalCard {
  key: string;
  icon: typeof CalendarX;
  title: string;
  /** The headline figure, shown big (a count, or "12 days left"). */
  stat: string;
  message: string;
  to: string;
  severity: "red" | "amber";
  ownership: RowOwnership;
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
      stat: expired ? "Expired" : `${days_remaining} days left`,
      message: expired
        ? `${entity_name} can no longer post until the next fiscal year exists.`
        : `${entity_name}'s posting calendar runs out soon.`,
      to: R.FINANCE.SETUP,
      severity: expired ? "red" : "amber",
      ownership: "watch",
    });
  }
  if (signals.webhook_failures_24h) {
    cards.push({
      key: "webhooks",
      icon: Webhook,
      title: "Webhook failures",
      stat: String(signals.webhook_failures_24h.count),
      message: "Payment provider events failed in the last 24 hours.",
      to: R.HEALTH.PROVIDER_WEBHOOKS,
      severity: "red",
      ownership: "watch",
    });
  }
  if (signals.jobs_failed_24h) {
    cards.push({
      key: "jobs",
      icon: ServerCrash,
      title: "Failed background jobs",
      stat: String(signals.jobs_failed_24h.count),
      message: "Jobs you started failed in the last 24 hours.",
      to: R.EXPORT.QUEUES,
      severity: "red",
      // The backend scopes this to the caller's own jobs, so it is theirs to
      // rerun - unlike every other signal here, which is an org condition.
      ownership: "mine",
    });
  }
  if (signals.draft_journals) {
    cards.push({
      key: "journals",
      icon: BookDashed,
      title: "Draft journals",
      stat: String(signals.draft_journals.count),
      message: "Journal entries are still waiting to be posted.",
      to: R.FINANCE.LEDGER,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.pos_awaiting_receipt) {
    cards.push({
      key: "pos",
      icon: PackageOpen,
      title: "Deliveries outstanding",
      stat: String(signals.pos_awaiting_receipt.count),
      message: "Purchase orders are still awaiting goods receipt.",
      to: R.PROCUREMENT.PURCHASE_ORDERS,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.overdue_invoices) {
    cards.push({
      key: "overdue_invoices",
      icon: FileWarning,
      title: "Invoices past due",
      stat: String(signals.overdue_invoices.count),
      message: "Customer invoices are overdue and not fully settled.",
      to: R.FINANCE.RECEIVABLES,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.unallocated_credit) {
    cards.push({
      key: "unallocated_credit",
      icon: Coins,
      title: "Money not applied",
      stat: String(signals.unallocated_credit.count),
      message: "Receipts hold cash not yet applied to any invoice.",
      to: R.FINANCE.RECEIPTS_ALLOCATION,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.vendor_invoices_unpaid) {
    cards.push({
      key: "vendor_invoices",
      icon: ReceiptText,
      title: "Vendor bills unpaid",
      stat: String(signals.vendor_invoices_unpaid.count),
      message: "Posted vendor invoices are awaiting payment.",
      to: R.PROCUREMENT.VENDOR_INVOICES,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.rfqs_open) {
    cards.push({
      key: "rfqs",
      icon: Send,
      title: "RFQs awaiting award",
      stat: String(signals.rfqs_open.count),
      message: "Issued requests for quotation have not been awarded.",
      to: R.PROCUREMENT.SOURCING,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.contracts_expiring) {
    cards.push({
      key: "contracts",
      icon: CalendarClock,
      title: "Contracts expiring",
      stat: String(signals.contracts_expiring.count),
      message: "Active vendor contracts end within 30 days.",
      to: R.PROCUREMENT.CONTRACTS,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.users_without_roles) {
    cards.push({
      key: "roleless_users",
      icon: UserX,
      title: "People without roles",
      stat: String(signals.users_without_roles.count),
      message: "Active accounts hold no role, so they can do nothing.",
      to: R.ROLES.INDEX,
      severity: "amber",
      ownership: "watch",
    });
  }
  if (signals.team_overdue_tasks) {
    cards.push({
      key: "team_overdue",
      icon: UsersRound,
      title: "Team tasks overdue",
      stat: String(signals.team_overdue_tasks.count),
      message: "Tasks across your team are past their deadlines.",
      to: R.TODO.INDEX,
      severity: "amber",
      ownership: "watch",
    });
  }
  // Red (broken now) before amber (needs attention soon), payload order within.
  return cards.sort((a, b) => Number(b.severity === "red") - Number(a.severity === "red"));
}
